import { MapPin } from "lucide-react";

// Illustrative pins only. The real map (Leaflet + OpenStreetMap) shows published books.
const pins = [
  { label: "Thor · São Paulo", left: "33%", top: "66%", onPhones: true },
  { label: "Mochi · Tokyo", left: "84%", top: "38%" },
  { label: "Biscuit · Lisbon", left: "47%", top: "36%", onPhones: true },
  { label: "Luna · Toronto", left: "25%", top: "30%" },
  { label: "Kiwi · Cape Town", left: "54%", top: "78%" },
  { label: "Pepper · Sydney", left: "88%", top: "76%" },
];

export function MapPreview() {
  return (
    <div
      aria-hidden
      className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border bg-card"
      style={{
        backgroundImage:
          "radial-gradient(circle, oklch(0.24 0.018 60 / 0.14) 1.2px, transparent 1.3px)",
        backgroundSize: "18px 18px",
      }}
    >
      {pins.map((pin) => (
        <div
          key={pin.label}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: pin.left, top: pin.top }}
        >
          <div className="flex flex-col items-center">
            <span
              className={
                "mb-1 rounded-full border bg-card px-2.5 py-1 text-xs whitespace-nowrap shadow-sm " +
                (pin.onPhones ? "" : "hidden sm:inline")
              }
            >
              {pin.label}
            </span>
            <MapPin className="size-6 fill-accent text-foreground" strokeWidth={1.75} />
          </div>
        </div>
      ))}
    </div>
  );
}
