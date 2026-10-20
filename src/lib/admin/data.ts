// Data reads for the admin panel. Each one calls requireAdmin() itself, so a page that forgets
// the check, or a future caller outside /admin, still cannot read this data as a non-admin.
// Admins see everything, drafts included: that is the point of the panel.
import { and, count, desc, eq, gte, ilike, max, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { account, books, pages, pets, reviews, session, user } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const PAGE_SIZE = 50;

export type BookStatus = (typeof books.status.enumValues)[number];
export const BOOK_STATUSES = books.status.enumValues;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getOverview() {
  await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);

  const [[users], [newUsers], [admins], [petCount], booksByStatus, recentUsers, recentBooks] =
    await Promise.all([
      db.select({ n: count() }).from(user),
      db.select({ n: count() }).from(user).where(gte(user.createdAt, weekAgo)),
      db.select({ n: count() }).from(user).where(eq(user.role, "admin")),
      db.select({ n: count() }).from(pets),
      db.select({ status: books.status, n: count() }).from(books).groupBy(books.status),
      db
        .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(5),
      db
        .select({
          id: books.id,
          title: books.title,
          status: books.status,
          updatedAt: books.updatedAt,
          ownerName: user.name,
        })
        .from(books)
        .innerJoin(user, eq(books.ownerId, user.id))
        .orderBy(desc(books.updatedAt))
        .limit(5),
    ]);

  const statusCounts = Object.fromEntries(BOOK_STATUSES.map((s) => [s, 0])) as Record<
    BookStatus,
    number
  >;
  for (const row of booksByStatus) statusCounts[row.status] = row.n;

  return {
    users: users.n,
    newUsersThisWeek: newUsers.n,
    admins: admins.n,
    pets: petCount.n,
    books: booksByStatus.reduce((sum, row) => sum + row.n, 0),
    statusCounts,
    recentUsers,
    recentBooks,
  };
}

export async function listUsers({ q, page }: { q?: string; page: number }) {
  await requireAdmin();
  const where = q ? or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`)) : undefined;

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
        bookCount: count(books.id),
      })
      .from(user)
      .leftJoin(books, eq(books.ownerId, user.id))
      .where(where)
      .groupBy(user.id)
      .orderBy(desc(user.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(user).where(where),
  ]);

  return { rows, total: total.n };
}

export async function getUser(id: string) {
  await requireAdmin();

  const [[profile], providers, [sessions], userPets] = await Promise.all([
    db.select().from(user).where(eq(user.id, id)),
    db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, id)),
    db
      .select({ lastSeenAt: max(session.updatedAt), total: count() })
      .from(session)
      .where(eq(session.userId, id)),
    db
      .select({
        id: pets.id,
        name: pets.name,
        species: pets.species,
        city: pets.city,
        createdAt: pets.createdAt,
        bookId: books.id,
        bookTitle: books.title,
        bookStatus: books.status,
      })
      .from(pets)
      .leftJoin(books, eq(books.petId, pets.id))
      .where(eq(pets.ownerId, id))
      .orderBy(desc(pets.createdAt)),
  ]);
  if (!profile) return null;

  return {
    profile,
    providers: providers.map((p) => p.providerId),
    sessionCount: sessions?.total ?? 0,
    lastSeenAt: sessions?.lastSeenAt ?? null,
    pets: userPets,
  };
}

export async function listBooks({
  q,
  status,
  page,
}: {
  q?: string;
  status?: BookStatus;
  page: number;
}) {
  await requireAdmin();
  const filters: SQL[] = [];
  if (status) filters.push(eq(books.status, status));
  if (q) filters.push(ilike(books.title, `%${q}%`));
  const where = filters.length ? and(...filters) : undefined;

  const pageCount = db
    .select({ n: count() })
    .from(pages)
    .where(eq(pages.bookId, books.id));

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        status: books.status,
        updatedAt: books.updatedAt,
        petName: pets.name,
        species: pets.species,
        city: pets.city,
        ownerId: user.id,
        ownerName: user.name,
        pageCount: sql<number>`(${pageCount})`.mapWith(Number),
      })
      .from(books)
      .innerJoin(pets, eq(books.petId, pets.id))
      .innerJoin(user, eq(books.ownerId, user.id))
      .where(where)
      .orderBy(desc(books.updatedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(books).where(where),
  ]);

  return { rows, total: total.n };
}

export async function getBook(id: string) {
  await requireAdmin();

  const [[row], bookPages, bookReviews] = await Promise.all([
    db
      .select({ book: books, pet: pets, owner: { id: user.id, name: user.name, email: user.email } })
      .from(books)
      .innerJoin(pets, eq(books.petId, pets.id))
      .innerJoin(user, eq(books.ownerId, user.id))
      .where(eq(books.id, id)),
    db.select().from(pages).where(eq(pages.bookId, id)).orderBy(pages.position),
    listReviewsWhere(eq(reviews.bookId, id), 200),
  ]);
  if (!row) return null;

  return { ...row, pages: bookPages, reviews: bookReviews };
}

export async function getReviewQueue() {
  await requireAdmin();

  const [queue, recent] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        updatedAt: books.updatedAt,
        petName: pets.name,
        ownerName: user.name,
        // Reasons from the latest review, usually the AI's, so the admin sees why it is here.
        reasons: sql<string[] | null>`(
          select ${reviews.reasons} from ${reviews}
          where ${reviews.bookId} = ${books.id}
          order by ${reviews.createdAt} desc
          limit 1
        )`,
      })
      .from(books)
      .innerJoin(pets, eq(books.petId, pets.id))
      .innerJoin(user, eq(books.ownerId, user.id))
      .where(eq(books.status, "needs_human"))
      // Oldest first: whoever has waited longest is reviewed first.
      .orderBy(books.updatedAt),
    listReviewsWhere(undefined, 50),
  ]);

  return { queue, recent };
}

function listReviewsWhere(where: SQL | undefined, limit: number) {
  return db
    .select({
      id: reviews.id,
      bookId: reviews.bookId,
      bookTitle: books.title,
      source: reviews.source,
      decision: reviews.decision,
      reasons: reviews.reasons,
      reviewerName: user.name,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(books, eq(reviews.bookId, books.id))
    .leftJoin(user, eq(reviews.reviewerId, user.id))
    .where(where)
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}
