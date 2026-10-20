// Who can read a book, and through which URL. A book has three visibilities:
//   private  - only the owner (and admins) see it;
//   link     - also anyone who has the secret share link (/s/<token>), even while it is a draft;
//   public   - published after review: listed on the site and readable at /b/<slug>.
// Link sharing skips review on purpose (it is like sending a draft to a friend), so a book the
// review rejected stops opening through its link: its content was found to break the rules.

type BookStatus = "draft" | "in_review" | "published" | "rejected" | "needs_human";

export type Visibility = "private" | "link" | "public";

export function visibilityOf(book: { status: BookStatus; shareToken: string | null }): Visibility {
  if (book.status === "published") return "public";
  return book.shareToken ? "link" : "private";
}

// Whether a book found by its share token may be shown to whoever holds the link.
export function opensBySharedLink(status: BookStatus): boolean {
  return status !== "rejected";
}

// Whether a book found by its slug may be shown to the public.
export function opensByPublicLink(status: BookStatus): boolean {
  return status === "published";
}


export function canReadBookImages(
  book: { status: BookStatus; ownerId: string; shareToken: string | null; deletedAt: Date | null },
  viewer: { id: string; role: string } | null,
  token: string | null,
): boolean {
  if (viewer?.role === "admin") return true;
  if (book.deletedAt) return false;
  if (viewer?.id === book.ownerId || opensByPublicLink(book.status)) return true;
  return token !== null && token === book.shareToken && opensBySharedLink(book.status);
}
