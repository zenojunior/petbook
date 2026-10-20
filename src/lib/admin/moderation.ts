import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, moderationRuns, reviews, user } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const knownBookCost = sql<string>`coalesce((select sum(m.estimated_cost_usd) from moderation_runs m where m.book_id = ${books.id}), 0)`;
export const knownOwnerCost = sql<string>`coalesce((select sum(m.estimated_cost_usd) from moderation_runs m where m.owner_id = ${user.id}), 0)`;
export const bookUnpriced = sql<number>`(
  (select count(*) from moderation_runs m where m.book_id = ${books.id} and m.sent_at is not null and m.estimated_cost_usd is null) +
  (select count(*) from reviews r where r.book_id = ${books.id} and r.source = 'ai' and not exists (select 1 from moderation_runs m where m.review_id = r.id))
)`.mapWith(Number);

export async function getModerationUsage(filter: { bookId?: string; ownerId?: string } = {}) {
  await requireAdmin();
  const [usage] = await db.select({
    runs: count(),
    requests: sql<number>`count(${moderationRuns.sentAt})`.mapWith(Number),
    inputTokens: sql<number>`coalesce(sum(${moderationRuns.inputTokens}), 0)`.mapWith(Number),
    estimatedCostUsd: sql<string>`coalesce(sum(${moderationRuns.estimatedCostUsd}), 0)`,
    unpriced: sql<number>`count(*) filter (where ${moderationRuns.sentAt} is not null and ${moderationRuns.estimatedCostUsd} is null)`.mapWith(Number),
  }).from(moderationRuns).where(and(
    filter.bookId ? eq(moderationRuns.bookId, filter.bookId) : undefined,
    filter.ownerId ? eq(moderationRuns.ownerId, filter.ownerId) : undefined,
  ));
  const [legacy] = await db.select({ n: count() }).from(reviews).innerJoin(books, eq(reviews.bookId, books.id)).where(and(
    eq(reviews.source, "ai"),
    sql`not exists (select 1 from ${moderationRuns} where ${moderationRuns.reviewId} = ${reviews.id})`,
    filter.bookId ? eq(reviews.bookId, filter.bookId) : undefined,
    filter.ownerId ? eq(books.ownerId, filter.ownerId) : undefined,
  ));
  return { ...usage, legacyReviews: legacy.n };
}

export type ModerationUsage = Awaited<ReturnType<typeof getModerationUsage>>;
export const RUN_PAGE_SIZE = 10;

export async function getModerationHistory(bookId: string, page: number) {
  await requireAdmin();
  const [runs, [total], usage] = await Promise.all([
    db.select().from(moderationRuns).where(eq(moderationRuns.bookId, bookId))
      .orderBy(desc(moderationRuns.startedAt), desc(moderationRuns.id)).limit(RUN_PAGE_SIZE).offset((page - 1) * RUN_PAGE_SIZE),
    db.select({ n: count() }).from(moderationRuns).where(eq(moderationRuns.bookId, bookId)),
    getModerationUsage({ bookId }),
  ]);
  return { runs, total: total.n, usage };
}
