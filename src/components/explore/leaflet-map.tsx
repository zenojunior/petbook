"use client";

import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "./map.css";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { CoverSurface } from "@/components/book/cover-surface";
import type { ExploreBook } from "@/lib/books/explore";
import { speciesLabel } from "@/lib/domain/species";

const pin = L.divIcon({ className: "petbook-pin", html: '<span aria-hidden="true">♥</span>', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });

function BookPins({ books }: { books: ExploreBook[] }) {
  const map = useMap();
  const pins = useMemo(() => books.map((book) => {
    const popup = document.createElement("div");
    const marker = L.marker([book.lat, book.lng], { icon: pin, title: `${book.title} · ${book.city ?? ""}`, alt: book.petName });
    marker.bindPopup(popup, { minWidth: 170, maxWidth: 220 });
    return { book, popup, marker };
  }), [books]);
  useEffect(() => {
    const group = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 55, spiderfyOnMaxZoom: true });
    group.addLayers(pins.map(({ marker }) => marker));
    map.addLayer(group);
    if (pins.length > 0) map.fitBounds(group.getBounds(), { padding: [45, 45], maxZoom: 9, animate: false });
    else map.setView([15, 0], 2, { animate: false });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => { observer.disconnect(); map.removeLayer(group); group.clearLayers(); };
  }, [map, pins]);
  return pins.map(({ book, popup }) => createPortal(
    <Link href={`/b/${book.slug}`} className="petbook-popup-link" aria-label={`Read ${book.title}`}>
      <CoverSurface color={book.coverColor} pattern={book.coverPattern} className="mx-auto flex aspect-[3/4] w-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-r-lg border-l-4 border-black/15 p-3 shadow-md">
        {/* Uploaded photos are already resized and served from the app. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {book.coverUrl && <img src={book.coverUrl} alt="" className="h-20 w-full rounded object-cover" loading="lazy" />}
        <span className="text-center font-heading text-sm font-semibold">{book.title}</span>
      </CoverSurface>
      <span className="mt-3 block text-center text-xs">{speciesLabel(book.species)} · {book.city}</span>
      <span className="mt-2 block text-center text-sm font-medium underline">Read the book →</span>
    </Link>, popup, book.id));
}

export default function LeafletMap({ books }: { books: ExploreBook[] }) {
  return (
    <MapContainer center={[15, 0]} zoom={2} minZoom={2} maxZoom={18} scrollWheelZoom={false} className="h-full w-full" worldCopyJump>
      <TileLayer referrerPolicy="strict-origin-when-cross-origin" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'} />
      <BookPins books={books} />
    </MapContainer>
  );
}
