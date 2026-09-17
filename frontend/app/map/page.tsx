"use client";

import { Place } from "@/components/PlaceCard";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/i18n";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  loading: () => (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center rounded-2xl">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Map Data...</p>
      </div>
    </div>
  ),
});

import { places as staticPlaces } from "@/lib/places";

const mockPlaces: Place[] = staticPlaces;

export default function MapPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pt-6 pb-6 px-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("Interactive Map")}</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t("Discover places around Nashik visually. Click on markers for details.")}
        </p>
      </div>
      
      <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative z-0">
        <MapComponent places={mockPlaces} />
      </div>
    </div>
  );
}
