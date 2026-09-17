"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "@/lib/i18n";

export interface GroupMemberLocation {
  id: string;
  name: string;
  role: "coordinator" | "member";
  lat: number;
  lng: number;
  lastUpdated: string;
  note?: string;
}

interface GroupMapProps {
  members: GroupMemberLocation[];
  currentMemberId?: string;
  onUpdateLocation?: (lat: number, lng: number) => void;
}

type LeafletLib = {
  MapContainer: any;
  TileLayer: any;
  Marker: any;
  Popup: any;
  coordinatorIcon: any;
  memberIcon: any;
};

export default function GroupMapComponent({ members, currentMemberId, onUpdateLocation }: GroupMapProps) {
  const { t } = useTranslation();
  const defaultCenter: [number, number] = [20.0, 73.78]; // Nashik center
  const [mapLib, setMapLib] = useState<LeafletLib | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMapLib() {
      const L = await import("leaflet");
      const ReactLeaflet = await import("react-leaflet");

      if (!active) return;

      // Custom icon for Group Coordinator (Orange/Gold pin)
      const coordinatorIcon = L.divIcon({
        className: "custom-coord-marker",
        html: `
          <div style="background-color: #e86f18; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold; font-size: 16px;">
            👑
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      // Custom icon for Group Member (Blue pin)
      const memberIcon = L.divIcon({
        className: "custom-member-marker",
        html: `
          <div style="background-color: #0284c7; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); font-weight: bold; font-size: 14px;">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      setMapLib({
        MapContainer: ReactLeaflet.MapContainer,
        TileLayer: ReactLeaflet.TileLayer,
        Marker: ReactLeaflet.Marker,
        Popup: ReactLeaflet.Popup,
        coordinatorIcon,
        memberIcon,
      });
    }

    loadMapLib();
    return () => {
      active = false;
    };
  }, []);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        if (onUpdateLocation) {
          onUpdateLocation(latitude, longitude);
        }
      },
      (err) => {
        setIsLocating(false);
        // Fallback to approximate Nashik landmark location if blocked or offline
        const mockLat = 20.0 + (Math.random() * 0.02 - 0.01);
        const mockLng = 73.78 + (Math.random() * 0.02 - 0.01);
        if (onUpdateLocation) {
          onUpdateLocation(mockLat, mockLng);
        }
        setLocationError("GPS location access disabled. Used approximate Nashik location.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Calculate center from active member positions or default
  const mapCenter: [number, number] =
    members.length > 0 && members[0].lat && members[0].lng
      ? [members[0].lat, members[0].lng]
      : defaultCenter;

  if (!mapLib) {
    return (
      <div className="h-72 w-full bg-orange-50/50 dark:bg-slate-800 rounded-3xl animate-pulse flex flex-col items-center justify-center text-slate-500 border border-orange-100 dark:border-slate-700">
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Loading Group Map...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, coordinatorIcon, memberIcon } = mapLib;

  return (
    <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-md border border-[#e7b06d]/40">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {members.map((m) => (
          <Marker
            key={m.id || m.name}
            position={[m.lat, m.lng]}
            icon={m.role === "coordinator" ? coordinatorIcon : memberIcon}
          >
            <Popup>
              <div className="p-1 min-w-[160px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                  {m.role === "coordinator" ? (
                    <span className="bg-orange-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Coordinator
                    </span>
                  ) : (
                    <span className="bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      Member
                    </span>
                  )}
                </div>
                {m.note && (
                  <p className="text-xs italic text-slate-700 bg-amber-50 p-1.5 rounded border border-amber-200 mb-1">
                    "{m.note}"
                  </p>
                )}
                <p className="text-[10px] text-slate-400">Updated: {m.lastUpdated}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Share Location Overlay Button */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1 items-end">
        {locationError && (
          <span className="text-[11px] bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-medium shadow border border-amber-200">
            {locationError}
          </span>
        )}
        <button
          type="button"
          onClick={handleShareLocation}
          disabled={isLocating}
          className="flex items-center gap-2 bg-[#e86f18] hover:bg-[#c9580f] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <span>📍</span>
          <span>{isLocating ? t("Locating...") : t("Live Member Locations")}</span>
        </button>
      </div>
    </div>
  );
}
