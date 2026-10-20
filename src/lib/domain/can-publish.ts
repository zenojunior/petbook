import { speciesKeys } from "./species";

export type PublishableBook = {
  id: string;
  title: string;
  coverUrl: string | null;
  pet: { name: string; species: string; city: string | null; lat: number | null; lng: number | null };
  pages: { layout: "text" | "photo" | "photo+text"; text: string | null; imageUrl: string | null }[];
};

// Completeness only. Passing this check never means the content is safe to publish.
export function canPublish(book: PublishableBook): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!book.title.trim()) missing.push("title");
  if (!book.coverUrl) missing.push("cover");
  if (!book.pet.name.trim()) missing.push("pet name");
  if (!speciesKeys.some((key) => key === book.pet.species)) missing.push("species");
  const { city, lat, lng } = book.pet;
  if (!city?.trim() || lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) missing.push("city");
  if (!book.pages.length) missing.push("at least one page");
  book.pages.forEach((page, i) => {
    if (page.layout !== "photo" && !page.text?.trim()) missing.push(`text on page ${i + 1}`);
    if (page.layout !== "text" && !page.imageUrl) missing.push(`photo on page ${i + 1}`);
  });
  return { ok: missing.length === 0, missing };
}
