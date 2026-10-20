import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PlaceSearchError, searchPlaces } from "@/lib/places";
import { checkRateLimit } from "@/lib/rate-limit";

// City search for the editor. Signed-in users only, so this is not an open proxy to Nominatim.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to search." }, { status: 401 });

  const limited = checkRateLimit("places", user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many searches. Try again in a moment." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "Type a city name." }, { status: 400 });
  }

  try {
    return NextResponse.json({ places: await searchPlaces(query) });
  } catch (error) {
    if (error instanceof PlaceSearchError) {
      return NextResponse.json({ error: "City search is unavailable. Try again in a moment." }, { status: 502 });
    }
    throw error;
  }
}
