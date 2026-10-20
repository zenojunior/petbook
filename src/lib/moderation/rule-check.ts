import { canPublish, type PublishableBook } from "@/lib/domain/can-publish";
import { isBookImageUrl } from "@/lib/domain/book-images";

export function ruleCheck(book: PublishableBook): { decision: "reject" | "needs_human"; reasons: string[] } {
  const { missing } = canPublish(book);
  const reasons = missing.map((field) => `Missing or invalid: ${field}.`);
  if ([book.coverUrl, ...book.pages.map((page) => page.imageUrl)].some((url) => url !== null && !isBookImageUrl(url, book.id))) {
    reasons.push("A photo does not belong to this book.");
  }
  if (book.pages.length > 100) reasons.push("A book can have at most 100 pages.");
  if (reasons.length) return { decision: "reject", reasons };
  // Until the AI moderator is configured, every complete submission needs a human.
  return { decision: "needs_human", reasons: ["Automatic checks passed. Content requires a human review."] };
}
