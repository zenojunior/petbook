// Where to send the user after sign-in. Only same-site paths are allowed, so a link like
// /sign-in?next=https://evil.example cannot bounce someone off the site (open redirect).
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/")) return fallback;
  // "//host" and "/\host" are treated by browsers as protocol-relative URLs to another site.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
