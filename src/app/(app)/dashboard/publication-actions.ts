"use server";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { books, moderationRuns, pages, pets, reviews } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth";
import { canPublish } from "@/lib/domain/can-publish";
import { transition } from "@/lib/domain/transition";
import { moderateBook } from "@/lib/moderation/decisions";
import { ruleCheck } from "@/lib/moderation/rule-check";
import type { ActionResult } from "./actions";

export async function submitForReview(bookId: string): Promise<ActionResult> {
  const user = await requireUser(`/dashboard/books/${bookId}`);
  if (!z.uuid().safeParse(bookId).success) return { ok: false, error: "Invalid book." };
  const submission = await db.transaction(async (tx) => {
    const [book] = await tx.select().from(books).where(and(eq(books.id, bookId), eq(books.ownerId, user.id), isNull(books.deletedAt))).for("update");
    if (!book || book.status !== "draft") return { ok: false as const, error: "Only your own drafts can be submitted." };
    const [pet] = await tx.select().from(pets).where(eq(pets.id, book.petId));
    const bookPages = await tx.select().from(pages).where(eq(pages.bookId, book.id)).orderBy(asc(pages.position));
    const data = { ...book, pet, pages: bookPages };
    const check = canPublish(data);
    if (!check.ok) return { ok: false as const, error: `Before submitting, add or fix: ${check.missing.join(", ")}.` };
    const rules = ruleCheck(data);
    const reviewing = transition(book.status, "submit");
    await tx.update(books).set({ status: rules.decision === "reject" ? transition(reviewing, "reject") : reviewing }).where(eq(books.id, book.id));
    await tx.insert(reviews).values({ bookId, source: "rules", ...rules });
    return { ok: true as const, data, rejected: rules.decision === "reject" };
  });
  if (!submission.ok) return submission;
  if (!submission.rejected) {
    const result = await moderateBook(submission.data);
    await db.transaction(async (tx) => {
      // A human may have already resolved the book while the API was running.
      const [updated] = await tx.update(books).set({
        status: transition("in_review", result.decision),
        publishedAt: result.decision === "approve" ? new Date() : null,
      }).where(and(eq(books.id, bookId), eq(books.status, "in_review"), isNull(books.deletedAt))).returning({ id: books.id });
      if (updated) {
        const [review] = await tx.insert(reviews).values({ bookId, source: "ai", decision: result.decision, reasons: result.reasons }).returning({ id: reviews.id });
        await tx.update(moderationRuns).set({ reviewId: review.id }).where(eq(moderationRuns.id, result.runId));
      }
    });
  }
  invalidateBook(bookId, submission.data.slug);
  return { ok: true };
}

export async function returnToDraft(bookId: string): Promise<ActionResult> {
  const user = await requireUser(`/dashboard/books/${bookId}`);
  if (!z.uuid().safeParse(bookId).success) return { ok: false, error: "Invalid book." };
  const result = await db.transaction(async (tx) => {
    const [book] = await tx.select().from(books).where(and(eq(books.id, bookId), eq(books.ownerId, user.id), isNull(books.deletedAt))).for("update");
    if (!book || (book.status !== "published" && book.status !== "rejected")) return null;
    await tx.update(books).set({ status: transition(book.status, book.status === "published" ? "unpublish" : "revise"), publishedAt: null, shareToken: null }).where(eq(books.id, book.id));
    return book;
  });
  if (!result) return { ok: false, error: "This book cannot return to a draft right now." };
  invalidateBook(bookId, result.slug);
  return { ok: true };
}

export async function reviewBook(bookId: string, input: { decision: "approve" | "reject"; reason: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = z.object({ bookId: z.uuid(), decision: z.enum(["approve", "reject"]), reason: z.string().trim().min(1, "Explain your decision.").max(2000) }).safeParse({ bookId, ...input });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const result = await db.transaction(async (tx) => {
    const [book] = await tx.select().from(books).where(and(eq(books.id, bookId), inArray(books.status, ["in_review", "needs_human"]), isNull(books.deletedAt))).for("update");
    if (!book) return { ok: false as const, error: "This book is no longer waiting for review." };
    if (parsed.data.decision === "approve") {
      const [pet] = await tx.select().from(pets).where(eq(pets.id, book.petId));
      const bookPages = await tx.select().from(pages).where(eq(pages.bookId, book.id));
      const rules = ruleCheck({ ...book, pet, pages: bookPages });
      if (rules.decision === "reject") return { ok: false as const, error: rules.reasons.join(" ") };
    }
    await tx.update(books).set({ status: transition(book.status, parsed.data.decision), publishedAt: parsed.data.decision === "approve" ? new Date() : null }).where(eq(books.id, book.id));
    await tx.insert(reviews).values({ bookId, source: "admin", decision: parsed.data.decision, reasons: [parsed.data.reason], reviewerId: admin.id });
    return { ok: true as const, slug: book.slug };
  });
  if (!result.ok) return result;
  invalidateBook(bookId, result.slug);
  return { ok: true };
}

function invalidateBook(id: string, slug: string) {
  for (const path of ["/", "/explore", "/dashboard", `/dashboard/books/${id}`, "/admin", "/admin/books", `/admin/books/${id}`, "/admin/reviews", "/admin/users", `/b/${slug}`]) revalidatePath(path);
  revalidatePath("/s/[token]", "page");
  revalidatePath("/admin/users/[id]", "page");
}


export async function deleteBook(bookId: string): Promise<ActionResult> {
  const user = await requireUser("/dashboard");
  if (!z.uuid().safeParse(bookId).success) return { ok: false, error: "Invalid book." };
  const book = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(books)
      .where(and(eq(books.id, bookId), eq(books.ownerId, user.id))).for("update");
    if (!row) return null;
    if (!row.deletedAt) await tx.update(books).set({ deletedAt: new Date(), shareToken: null }).where(eq(books.id, row.id));
    return row;
  });
  if (!book) return { ok: false, error: "Book not found." };
  invalidateBook(book.id, book.slug);
  return { ok: true };
}
