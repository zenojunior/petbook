import { BookMap } from "@/components/explore/book-map";
import { listPublishedBooks } from "@/lib/books/explore";

export async function MapPreview() {
  return <BookMap books={await listPublishedBooks()} compact />;
}
