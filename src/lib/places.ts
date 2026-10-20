// City search through Nominatim (OpenStreetMap's geocoder, no API key).
// Only settlements (cities, towns, villages) are returned, never streets or addresses, and
// the caller still runs the chosen coordinates through fuzzLocation() before storing them.
// Usage policy: https://operations.osmfoundation.org/policies/nominatim/ (identify the app,
// at most one request per second, no search-as-you-type).
import { z } from "zod";

export type Place = { city: string; lat: number; lng: number };

const nominatimResult = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  name: z.string(),
  address: z.object({ state: z.string().optional(), country: z.string().optional() }).optional(),
});

export class PlaceSearchError extends Error {}

export async function searchPlaces(query: string): Promise<Place[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    featureType: "settlement",
    addressdetails: "1",
    limit: "6",
    "accept-language": "en",
  }).toString();

  let json: unknown;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": `Petbook/0.1 (+${process.env.BETTER_AUTH_URL ?? "https://petbook.local"})` },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new PlaceSearchError(`Nominatim answered ${response.status}`);
    json = await response.json();
  } catch (error) {
    throw error instanceof PlaceSearchError ? error : new PlaceSearchError("Nominatim is unreachable");
  }

  const results = z.array(nominatimResult).safeParse(json);
  if (!results.success) throw new PlaceSearchError("Unexpected answer from Nominatim");

  // The same city often comes back twice (as a city and as a municipality).
  const places = new Map<string, Place>();
  for (const result of results.data) {
    const city = [result.name, result.address?.state, result.address?.country]
      .filter((part, i, parts) => part && parts.indexOf(part) === i)
      .join(", ");
    if (!places.has(city)) places.set(city, { city, lat: result.lat, lng: result.lon });
  }
  return [...places.values()];
}
