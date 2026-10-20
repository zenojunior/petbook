// Coordinates are snapped to a grid before they are stored, so a pin on the map shows an area
// of a few kilometres, never a home. 0.02 degrees is about 2 km of latitude.
const GRID_DEGREES = 0.02;

export function fuzzLocation({ lat, lng }: { lat: number; lng: number }): { lat: number; lng: number } {
  // "+ 0" turns -0 into 0.
  const snap = (value: number) => Number((Math.round(value / GRID_DEGREES) * GRID_DEGREES).toFixed(2)) + 0;
  return {
    lat: Math.min(90, Math.max(-90, snap(lat))),
    // Wrap the longitude into -180..180 first, so 181 becomes -179 instead of an invalid value.
    lng: snap(((((lng + 180) % 360) + 360) % 360) - 180),
  };
}
