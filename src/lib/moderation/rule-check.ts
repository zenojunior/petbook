import { canPublish, type PublishableBook } from "../domain/can-publish";
import { isBookImageUrl } from "../domain/book-images";

export function ruleCheck(book: PublishableBook): { decision: "reject" | "approve"; reasons: string[] } {
  const { missing } = canPublish(book);
  const reasons = missing.map((field) => `Missing or invalid: ${field}.`);
  if ([book.coverUrl, ...book.pages.map((page) => page.imageUrl)].some((url) => url !== null && !isBookImageUrl(url, book.id))) {
    reasons.push("A photo does not belong to this book.");
  }
  if (book.pages.length > 100) reasons.push("A book can have at most 100 pages.");
  if (reasons.length) return { decision: "reject", reasons };
  // This approves structure only; content moderation must still run.
  return { decision: "approve", reasons: ["Completeness and photo ownership checks passed."] };
}
