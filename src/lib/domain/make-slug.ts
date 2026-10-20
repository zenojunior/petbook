// URL slug for a book: readable words from the title plus a short suffix, so two books
// called "Thor" do not collide. The suffix comes from the caller to keep this pure.
export function makeSlug(title: string, suffix: string): string {
  const words = title
    .normalize("NFKD")
    // Drop the accents left as combining marks by NFKD: "Café" -> "Cafe".
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  const tail = suffix.toLowerCase().replace(/[^a-z0-9]/g, "");
  return words ? `${words}-${tail}` : `book-${tail}`;
}
