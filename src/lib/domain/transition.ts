export type BookStatus = "draft" | "in_review" | "published" | "rejected" | "needs_human";
export type BookEvent = "submit" | "approve" | "reject" | "needs_human" | "revise" | "unpublish";

const destinations: Record<BookStatus, Partial<Record<BookEvent, BookStatus>>> = {
  draft: { submit: "in_review" },
  in_review: { approve: "published", reject: "rejected", needs_human: "needs_human" },
  needs_human: { approve: "published", reject: "rejected" },
  rejected: { revise: "draft" },
  published: { unpublish: "draft" },
};

// Authorization is the caller's responsibility; invalid state changes never reach the DB.
export function transition(status: BookStatus, event: BookEvent): BookStatus {
  const next = destinations[status][event];
  if (!next) throw new Error(`Cannot ${event} a ${status} book.`);
  return next;
}
