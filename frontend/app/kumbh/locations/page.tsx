"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Search, ArrowLeft, Loader2, Info, Compass, ShieldAlert, CheckCircle, ExternalLink, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface KumbhLocation {
  _id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  kumbhImportance?: string;
  instructions?: string;
  nearbyFacilities?: string;
  placeId?: {
    _id: string;
    name: string;
    category: string;
    location: string;
    description: string;
    image: string;
    latitude?: number;
    longitude?: number;
  };
}

export default function KumbhLocationsPage() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<KumbhLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeModalLocation, setActiveModalLocation] = useState<KumbhLocation | null>(null);

  const categories = ["All", "Ghat", "Temple", "Parking", "Medical/Help", "Entry/Exit", "Emergency"];

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/kumbh/locations");
        if (!res.ok) throw new Error("Failed to load Kumbh locations");
        const data = await res.json();
        setLocations(data);
      } catch (err: any) {
        setError(err.message || "Could not fetch Kumbh locations");
      } finally {
        setLoading(false);
      }
    }
    void fetchLocations();
  }, []);

  const filteredLocations = locations.filter((loc) => {
    const matchesCategory = selectedCategory === "All" || loc.category === selectedCategory;
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.description && loc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#f8f2e8] pb-16 pt-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Navigation Breadcrumb */}
        <Link
          href="/kumbh"
          className="inline-flex items-center gap-2 font-semibold text-orange-700 hover:text-orange-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("Back")}</span>
        </Link>

        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-r from-orange-600 to-amber-600 p-8 text-white shadow-xl md:p-12 mb-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <MapPin className="h-6 w-6 text-white" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">{t("Kumbh Mela 2027")}</p>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">{t("Important Locations")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-orange-100 md:text-lg">
            {t("Explore key spiritual sites, Ram Kund ghats, main bathing zones, parking areas, and emergency help desks verified for Kumbh Mela 2027 in Nashik and Trimbakeshwar.")}
          </p>
        </section>

        {/* Controls: Search & Category Filter */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("Search Ram Kund, Panchavati, parking...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "border border-[#e1cfb0] bg-[#fffdf8] text-slate-700 hover:bg-orange-50 hover:border-orange-300"
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center text-orange-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3 font-semibold text-slate-700">{t("Loading Kumbh locations...")}</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700 border border-red-200">
            <p className="font-bold">{t(error)}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredLocations.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-slate-600">
            <Compass className="mx-auto h-12 w-12 text-orange-400" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{t("No locations found")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("Try adjusting your search query or filter category.")}</p>
          </div>
        )}

        {/* Locations Grid */}
        {!loading && !error && filteredLocations.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((loc) => {
              const displayImage =
                loc.image ||
                loc.placeId?.image ||
                "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80";

              return (
                <article
                  key={loc._id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_10px_25px_rgba(77,58,30,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-400"
                >
                  <div>
                    {/* Location Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={displayImage}
                        alt={loc.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                        {t(loc.category)}
                      </span>
                      {loc.placeId && (
                        <span className="absolute top-3 right-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-slate-900 shadow-sm">
                          {t("Discover Nashik Place")}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {t(loc.name)}
                      </h2>

                      {loc.address && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 font-medium">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-orange-500 mt-0.5" />
                          <span>{t(loc.address)}</span>
                        </p>
                      )}

                      {loc.description && (
                        <p className="mt-3 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {t(loc.description)}
                        </p>
                      )}

                      {/* Kumbh Importance Snippet */}
                      {loc.kumbhImportance && (
                        <div className="mt-4 rounded-xl bg-orange-50 p-3 text-xs text-orange-950 border border-orange-200/60">
                          <span className="font-bold text-orange-700 flex items-center gap-1 mb-1">
                            <Info className="h-3.5 w-3.5 text-orange-600" /> {t("Kumbh Significance:")}
                          </span>
                          <p className="line-clamp-2">{t(loc.kumbhImportance)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Button */}
                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setActiveModalLocation(loc)}
                      className="w-full rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-center text-xs font-bold text-white shadow-md shadow-orange-600/20 transition-all cursor-pointer"
                    >
                      {t("View Kumbh Details & Map")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal Dialog for Location Details */}
        {activeModalLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 md:p-8 shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveModalLocation(null)}
                className="absolute top-4 right-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700">
                  {t(activeModalLocation.category)}
                </span>
                {activeModalLocation.placeId && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    {t("Linked Place")}
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
                {t(activeModalLocation.name)}
              </h2>

              {activeModalLocation.address && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {t(activeModalLocation.address)}
                </p>
              )}

              {/* Modal Image */}
              <div className="mt-5 h-56 w-full overflow-hidden rounded-2xl border border-[#e1cfb0]">
                <img
                  src={
                    activeModalLocation.image ||
                    activeModalLocation.placeId?.image ||
                    "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={activeModalLocation.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Description */}
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                {activeModalLocation.description && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">{t("Description")}</h4>
                    <p className="mt-1 leading-relaxed">{t(activeModalLocation.description)}</p>
                  </div>
                )}

                {/* Why Important during Kumbh */}
                {activeModalLocation.kumbhImportance && (
                  <div className="rounded-2xl bg-orange-50 p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-orange-600" /> {t("Why Important During Kumbh 2027")}
                    </h4>
                    <p className="mt-1.5 text-orange-950 leading-relaxed font-medium">
                      {t(activeModalLocation.kumbhImportance)}
                    </p>
                  </div>
                )}

                {/* Kumbh Instructions */}
                {activeModalLocation.instructions && (
                  <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-600" /> {t("Kumbh Instructions & Guidance")}
                    </h4>
                    <p className="mt-1.5 text-amber-950 leading-relaxed">
                      {t(activeModalLocation.instructions)}
                    </p>
                  </div>
                )}

                {/* Nearby Facilities */}
                {activeModalLocation.nearbyFacilities && (
                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200">
                    <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" /> {t("Nearby Kumbh Facilities")}
                    </h4>
                    <p className="mt-1.5 text-emerald-950 leading-relaxed">
                      {t(activeModalLocation.nearbyFacilities)}
                    </p>
                  </div>
                )}
              </div>

              {/* Map Directions Action */}
              <div className="mt-6 flex flex-wrap gap-3 border-t border-[#e1cfb0] pt-5">
                {activeModalLocation.latitude && activeModalLocation.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${activeModalLocation.latitude},${activeModalLocation.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> {t("Open in Google Maps")}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveModalLocation(null)}
                  className="rounded-xl border border-[#d8c4a3] px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {t("Close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
