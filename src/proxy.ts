import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// First gate for the admin area: non-admins get the regular 404 before anything renders.
// It is not the only check: every admin page and admin action also calls requireAdmin(),
// because a proxy matcher can silently stop covering a path after a refactor.
export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user.role === "admin") return NextResponse.next();

  // Rewriting to a route that does not exist renders the app's 404 page with a 404 status.
  return NextResponse.rewrite(new URL("/__not-found", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
