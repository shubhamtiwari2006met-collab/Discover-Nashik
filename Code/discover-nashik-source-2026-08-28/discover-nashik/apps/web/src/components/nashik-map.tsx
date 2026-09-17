"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Place } from "../lib/types";

const nashikCenter: [number, number] = [19.9975, 73.7898];

export default function NashikMap({
  places,
  selectedSlug,
  onSelect
}: {
  places: Place[];
  selectedSlug?: string;
  onSelect: (place: Place) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const nextMap = L.map(container.current, { zoomControl: false }).setView(nashikCenter, 12);
    L.control.zoom({ position: "bottomright" }).addTo(nextMap);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(nextMap);
    map.current = nextMap;
    markerLayer.current = L.layerGroup().addTo(nextMap);
    return () => {
      nextMap.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !markerLayer.current) return;
    markerLayer.current.clearLayers();
    const bounds: [number, number][] = [];
    places.forEach((place) => {
      const [longitude, latitude] = place.location.coordinates;
      const isSelected = selectedSlug === place.slug;
      const icon = L.divIcon({
        className: "",
        html: `<span class="map-marker ${isSelected ? "selected" : ""}">${isSelected ? "●" : "•"}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const marker = L.marker([latitude, longitude], { icon, title: place.name });
      marker.bindTooltip(place.name, { direction: "top", offset: [0, -10] });
      marker.on("click", () => onSelect(place));
      marker.addTo(markerLayer.current!);
      bounds.push([latitude, longitude]);
    });
    if (selectedSlug) {
      const selected = places.find((place) => place.slug === selectedSlug);
      if (selected) map.current.setView([selected.location.coordinates[1], selected.location.coordinates[0]], 15, { animate: true });
    } else if (bounds.length > 1) {
      map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }, [places, selectedSlug, onSelect]);

  return <div className="nashik-map" ref={container} aria-label="Interactive map of Nashik places" />;
}
