"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Place } from "@/components/PlaceCard";
import { useTranslation } from "@/lib/i18n";
import { MapPin } from "lucide-react";

function MapLoading() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full bg-[#f8f2e8] animate-pulse flex items-center justify-center rounded-2xl border border-[#e1cfb0]">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 border-4 border-[#e86f18] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-[#173247]">{t("Loading Interactive Nashik Map...")}</p>
      </div>
    </div>
  );
}

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const initialCategory = searchParams.get("category") || searchParams.get("cat") || "All";

  useEffect(() => {
    fetch("/api/places", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlaces(data);
      })
      .catch((err) => console.error("Map places fetch error:", err));
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pt-3 pb-3 sm:pt-5 sm:pb-5 px-2 sm:px-4 max-w-7xl mx-auto w-full">
      <div className="mb-3 px-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff7ed] text-[#e86f18] border border-[#e7b06d]">
              <MapPin className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#173247]">{t("Nashik Interactive Map")}</h1>
          </div>
          <p className="mt-0.5 text-xs text-[#667883]">
            {t("Explore temples, ghats, hotels, hospitals, transport & Kumbh 2027 locations around Nashik.")}
          </p>
        </div>
      </div>

      <div className="flex-1 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_16px_48px_rgba(77,58,30,0.12)] border border-[#e1cfb0] relative z-0">
        <MapComponent places={places} initialCategory={initialCategory} />
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f2e8]" />}>
      <MapContent />
    </Suspense>
  );
}
