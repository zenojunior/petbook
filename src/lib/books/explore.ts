import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { books, pets } from "@/db/schema";
import { fuzzLocation } from "@/lib/domain/fuzz-location";
import { toSpecies } from "@/lib/domain/species";

// Deliberate public projection: never send owner ids, share tokens or draft data to the map.
export async function listPublishedBooks() {
  const rows = await db.select({
    id: books.id, slug: books.slug, title: books.title, coverUrl: books.coverUrl,
    coverColor: books.coverColor, coverPattern: books.coverPattern,
    petName: pets.name, species: pets.species, city: pets.city, lat: pets.lat, lng: pets.lng,
  }).from(books).innerJoin(pets, eq(books.petId, pets.id))
    .where(and(eq(books.status, "published"), isNull(books.deletedAt))).orderBy(desc(books.publishedAt));
  return rows.flatMap((row) => {
    if (row.lat === null || row.lng === null || !Number.isFinite(row.lat) || !Number.isFinite(row.lng) || Math.abs(row.lat) > 90 || Math.abs(row.lng) > 180) return [];
    return [{ ...row, ...fuzzLocation({ lat: row.lat, lng: row.lng }), species: toSpecies(row.species) }];
  });
}

export type ExploreBook = Awaited<ReturnType<typeof listPublishedBooks>>[number];
