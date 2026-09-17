"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Place } from "./PlaceCard";
import Link from "next/link";
import { Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type LeafletMapLib = {
  MapContainer: any;
  TileLayer: any;
  Marker: any;
  Popup: any;
  markerIcon: any;
};

export default function MapComponent({ places }: { places: Place[] }) {
  const { t } = useTranslation();
  const center: [number, number] = [20.0, 73.78];
  const [mapLib, setMapLib] = useState<LeafletMapLib | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMapLib() {
      const L = await import("leaflet");
      const ReactLeaflet = await import("react-leaflet");

      if (!active) return;

      const markerIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      setMapLib({
        MapContainer: ReactLeaflet.MapContainer,
        TileLayer: ReactLeaflet.TileLayer,
        Marker: ReactLeaflet.Marker,
        Popup: ReactLeaflet.Popup,
        markerIcon,
      });
    }

    loadMapLib();
    return () => {
      active = false;
    };
  }, []);

  if (!mapLib) {
    return <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-500">{t("Loading Map...")}</div>;
  }

  const { MapContainer, TileLayer, Marker, Popup, markerIcon } = mapLib;

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={true}
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {places.map((place, index) => {
        const lat = center[0] + (index * 0.05) - 0.05;
        const lng = center[1] + (index * 0.05) - 0.05;

        return (
          <Marker key={place._id} position={[lat, lng]} icon={markerIcon}>
            <Popup className="custom-popup">
              <div className="w-48">
                <div className="mb-2 h-24 w-full overflow-hidden rounded-md bg-slate-200">
                  <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{place.name}</h3>
                <div className="mt-1 mb-2 flex items-center text-xs font-semibold text-orange-500">
                  <Star className="mr-1 h-3 w-3 fill-orange-500" />
                  {place.rating}
                </div>
                <Link href={`/place/${place._id}`} className="mt-2 block w-full rounded bg-orange-500 px-2 py-1 text-center text-xs text-white hover:bg-orange-600">
                  {t("Explore")}
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
