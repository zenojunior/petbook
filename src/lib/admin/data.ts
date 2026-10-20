// Data reads for the admin panel. Each one calls requireAdmin() itself, so a page that forgets
// the check, or a future caller outside /admin, still cannot read this data as a non-admin.
// Admins see everything, drafts included: that is the point of the panel.
import { and, count, desc, eq, gte, ilike, max, or, isNull, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { account, books, pages, pets, reviews, session, user } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { bookUsage, listBookFiles, totalUsage, UPLOAD_DIR } from "@/lib/uploads";
import { getModerationUsage, knownBookCost, knownOwnerCost, bookUnpriced } from "./moderation";
import { describeSchema } from "./schema-diagram";

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
      db.select({ status: books.status, n: count() }).from(books).where(isNull(books.deletedAt)).groupBy(books.status),
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
          deletedAt: books.deletedAt,
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

  const [usage, [deleted]] = await Promise.all([
    getModerationUsage(), db.select({ n: count() }).from(books).where(isNotNull(books.deletedAt)),
  ]);
  return {
    usage, deletedBooks: deleted.n,
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
        estimatedCostUsd: knownOwnerCost,
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
        bookDeletedAt: books.deletedAt,
      })
      .from(pets)
      .leftJoin(books, eq(books.petId, pets.id))
      .where(eq(pets.ownerId, id))
      .orderBy(desc(pets.createdAt)),
  ]);
  if (!profile) return null;

  // Uploads are on disk, one folder per book, so a user's storage is the sum of their books'.
  const petsWithUsage = await Promise.all(
    userPets.map(async (pet) => ({ ...pet, usage: pet.bookId ? await bookUsage(pet.bookId) : null })),
  );
  const storage = petsWithUsage.reduce(
    (sum, pet) => ({ files: sum.files + (pet.usage?.files ?? 0), bytes: sum.bytes + (pet.usage?.bytes ?? 0) }),
    { files: 0, bytes: 0 },
  );

  return {
    profile,
    moderationUsage: await getModerationUsage({ ownerId: id }),
    providers: providers.map((p) => p.providerId),
    sessionCount: sessions?.total ?? 0,
    lastSeenAt: sessions?.lastSeenAt ?? null,
    pets: petsWithUsage,
    storage,
  };
}

export async function listBooks({
  q,
  status,
  deleted = "all",
  page,
}: {
  q?: string;
  status?: BookStatus;
  deleted?: "all" | "active" | "deleted";
  page: number;
}) {
  await requireAdmin();
  const filters: SQL[] = [];
  if (status) filters.push(eq(books.status, status));
  if (deleted === "active") filters.push(isNull(books.deletedAt));
  if (deleted === "deleted") filters.push(isNotNull(books.deletedAt));
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
        deletedAt: books.deletedAt,
        estimatedCostUsd: knownBookCost,
        unpricedReviews: bookUnpriced,
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

  const [[row], bookPages, bookReviews, files] = await Promise.all([
    db
      .select({ book: books, pet: pets, owner: { id: user.id, name: user.name, email: user.email } })
      .from(books)
      .innerJoin(pets, eq(books.petId, pets.id))
      .innerJoin(user, eq(books.ownerId, user.id))
      .where(eq(books.id, id)),
    db.select().from(pages).where(eq(pages.bookId, id)).orderBy(pages.position),
    listReviewsWhere(eq(reviews.bookId, id), 200),
    listBookFiles(id),
  ]);
  if (!row) return null;

  return { ...row, pages: bookPages, reviews: bookReviews, files };
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
      .where(and(isNull(books.deletedAt), or(eq(books.status, "needs_human"), eq(books.status, "in_review"))))
      // Oldest first: whoever has waited longest is reviewed first.
      .orderBy(books.updatedAt),
    listReviewsWhere(undefined, 50),
  ]);

  return { queue, recent };
}

export async function getDatabase() {
  await requireAdmin();
  const tables = describeSchema();

  // Sizes come from Postgres itself: data, indexes and TOAST (long text and jsonb) together.
  const sizeRows = await db.execute<{ name: string; total: string; data: string; indexes: string }>(sql`
    select c.relname as name,
      pg_total_relation_size(c.oid) as total,
      pg_relation_size(c.oid) as data,
      pg_indexes_size(c.oid) as indexes
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  `);
  const sizes = new Map(sizeRows.map((r) => [r.name, r]));

  const [[database], rowCounts, uploads] = await Promise.all([
    db.execute<{ bytes: string }>(sql`select pg_database_size(current_database()) as bytes`),
    // Exact counts are cheap at this size. Table names come from our own schema, never from input.
    Promise.all(
      tables.map(async (t) => {
        const [r] = await db.execute<{ n: string }>(sql`select count(*) as n from ${sql.identifier(t.name)}`);
        return [t.name, Number(r.n)] as const;
      }),
    ),
    totalUsage(),
  ]);
  const counts = new Map(rowCounts);

  return {
    databaseBytes: Number(database.bytes),
    uploads: { ...uploads, dir: UPLOAD_DIR },
    tables: tables.map((t) => {
      const size = sizes.get(t.name);
      return {
        ...t,
        rows: counts.get(t.name) ?? 0,
        totalBytes: Number(size?.total ?? 0),
        dataBytes: Number(size?.data ?? 0),
        indexBytes: Number(size?.indexes ?? 0),
      };
    }),
  };
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
