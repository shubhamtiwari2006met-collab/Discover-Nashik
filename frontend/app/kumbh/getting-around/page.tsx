"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, Search, ArrowLeft, Loader2, Navigation, AlertTriangle, ShieldCheck, MapPin, Footprints, Train, Car, Info, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface KumbhTransport {
  _id: string;
  title: string;
  category: string;
  description: string;
  routeOrDetails?: string;
  locationOrStation?: string;
  advisories?: string;
  image?: string;
}

export default function KumbhGettingAroundPage() {
  const { t } = useTranslation();
  const [transports, setTransports] = useState<KumbhTransport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeModalTransport, setActiveModalTransport] = useState<KumbhTransport | null>(null);

  const categories = ["All", "Bus", "Railway", "Shuttle", "Parking", "Walking Route", "Traffic Advisory"];

  useEffect(() => {
    async function fetchTransports() {
      try {
        const res = await fetch("/api/kumbh/transport");
        if (!res.ok) throw new Error("Failed to load transportation information");
        const data = await res.json();
        setTransports(data);
      } catch (err: any) {
        setError(err.message || "Could not fetch transportation details");
      } finally {
        setLoading(false);
      }
    }
    void fetchTransports();
  }, []);

  const filteredTransports = transports.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.routeOrDetails && item.routeOrDetails.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.locationOrStation && item.locationOrStation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Bus":
      case "Shuttle":
        return <Bus className="h-5 w-5 text-orange-600" />;
      case "Railway":
        return <Train className="h-5 w-5 text-blue-600" />;
      case "Parking":
        return <Car className="h-5 w-5 text-emerald-600" />;
      case "Walking Route":
        return <Footprints className="h-5 w-5 text-amber-600" />;
      case "Traffic Advisory":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Navigation className="h-5 w-5 text-orange-600" />;
    }
  };

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
        <section className="rounded-3xl bg-gradient-to-r from-orange-600 to-amber-700 p-8 text-white shadow-xl md:p-12 mb-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Bus className="h-6 w-6 text-white" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">{t("Kumbh Mela 2027")}</p>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">{t("Getting Around")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-orange-100 md:text-lg">
            {t("Keep flexible travel time for crowds and use public transport where possible.")}
          </p>
        </section>

        {/* Controls: Search & Category Filter */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("Search bus routes, trains, parking grounds...")}
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
            <span className="ml-3 font-semibold text-slate-700">{t("Loading transportation details...")}</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700 border border-red-200">
            <p className="font-bold">{t(error)}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredTransports.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-slate-600">
            <Navigation className="mx-auto h-12 w-12 text-orange-400" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{t("No transport options found")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("Try adjusting your search query or category filter.")}</p>
          </div>
        )}

        {/* Transport Cards Grid */}
        {!loading && !error && filteredTransports.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTransports.map((item) => (
              <article
                key={item._id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_10px_25px_rgba(77,58,30,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-400"
              >
                <div>
                  {item.image && (
                    <div className="h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t(item.category)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {t(item.title)}
                    </h2>

                    {item.locationOrStation && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                        <span>{t(item.locationOrStation)}</span>
                      </p>
                    )}

                    <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {t(item.description)}
                    </p>

                    {item.routeOrDetails && (
                      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-950 border border-amber-200/60">
                        <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                          <Navigation className="h-3.5 w-3.5 text-amber-600" /> {t("Route & Frequency:")}
                        </span>
                        <p className="line-clamp-2 font-medium">{t(item.routeOrDetails)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => setActiveModalTransport(item)}
                    className="w-full rounded-2xl bg-orange-600 hover:bg-orange-700 py-3 text-center text-xs font-bold text-white shadow-md shadow-orange-600/20 transition-all cursor-pointer"
                  >
                    {t("View Full Transport Info")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal Dialog for Transport Details */}
        {activeModalTransport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 md:p-8 shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveModalTransport(null)}
                className="absolute top-4 right-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                  {getCategoryIcon(activeModalTransport.category)}
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 uppercase tracking-wider">
                  {t(activeModalTransport.category)}
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
                {t(activeModalTransport.title)}
              </h2>

              {activeModalTransport.locationOrStation && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {t(activeModalTransport.locationOrStation)}
                </p>
              )}

              {activeModalTransport.image && (
                <div className="mt-5 h-56 w-full overflow-hidden rounded-2xl border border-[#e1cfb0]">
                  <img
                    src={activeModalTransport.image}
                    alt={activeModalTransport.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">{t("Overview")}</h4>
                  <p className="mt-1 leading-relaxed">{t(activeModalTransport.description)}</p>
                </div>

                {activeModalTransport.routeOrDetails && (
                  <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="h-4 w-4 text-amber-600" /> {t("Route, Schedule & Timings")}
                    </h4>
                    <p className="mt-1.5 text-amber-950 leading-relaxed font-medium">
                      {t(activeModalTransport.routeOrDetails)}
                    </p>
                  </div>
                )}

                {activeModalTransport.advisories && (
                  <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
                    <h4 className="font-bold text-red-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-600" /> {t("Public Advisory & Safety Rules")}
                    </h4>
                    <p className="mt-1.5 text-red-950 leading-relaxed font-medium">
                      {t(activeModalTransport.advisories)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end border-t border-[#e1cfb0] pt-5">
                <button
                  type="button"
                  onClick={() => setActiveModalTransport(null)}
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
