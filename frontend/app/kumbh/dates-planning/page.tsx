"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Search, ArrowLeft, Loader2, Clock, MapPin, AlertCircle, CheckCircle2, Sparkles, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface KumbhEvent {
  _id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  instructions?: string;
  status: "upcoming" | "completed";
  image?: string;
}

export default function KumbhDatesPlanningPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<KumbhEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [activeModalEvent, setActiveModalEvent] = useState<KumbhEvent | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/kumbh/events");
        if (!res.ok) throw new Error("Failed to load Kumbh events");
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || "Could not fetch Kumbh dates & events");
      } finally {
        setLoading(false);
      }
    }
    void fetchEvents();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const matchesStatus = statusFilter === "all" || evt.status === statusFilter;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (evt.location && evt.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
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
        <section className="rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-8 text-white shadow-xl md:p-12 mb-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <CalendarDays className="h-6 w-6 text-white" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">{t("Kumbh Mela 2027")}</p>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">{t("Dates and planning")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-orange-100 md:text-lg">
            {t("Plan your Kumbh 2027 pilgrimage, then stay for the temples, vineyards, trails and stories that make Nashik timeless.")}
          </p>
        </section>

        {/* Controls: Search & Status Filter */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("Search Shahi Snan, Flag Hoisting, Ram Kund...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-2 rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-1.5 shadow-sm">
            {(["all", "upcoming", "completed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all ${
                  statusFilter === status
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {t(status === "all" ? "All" : status === "upcoming" ? "Upcoming" : "Completed")}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center text-orange-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3 font-semibold text-slate-700">{t("Loading official Kumbh dates...")}</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700 border border-red-200">
            <p className="font-bold">{t(error)}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-12 text-center text-slate-600">
            <CalendarDays className="mx-auto h-12 w-12 text-orange-400" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{t("No events found")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("Try adjusting your search query or status filter.")}</p>
          </div>
        )}

        {/* Events Timeline / List */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="space-y-6">
            {filteredEvents.map((evt) => {
              const eventDate = new Date(evt.date);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleString("en-IN", { month: "short" }).toUpperCase();
              const year = eventDate.getFullYear();

              return (
                <article
                  key={evt._id}
                  className="group flex flex-col md:flex-row items-stretch overflow-hidden rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_10px_25px_rgba(77,58,30,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-orange-400"
                >
                  {/* Left Date Badge Container */}
                  <div className="flex flex-row md:flex-col items-center justify-between md:justify-center bg-gradient-to-br from-orange-600 to-amber-600 p-6 text-white md:w-48 flex-shrink-0">
                    <div className="text-center">
                      <span className="block text-3xl md:text-5xl font-extrabold tracking-tight">{day}</span>
                      <span className="block text-xs md:text-sm font-bold uppercase tracking-widest text-orange-100 mt-0.5">
                        {month} {year}
                      </span>
                    </div>

                    <span
                      className={`mt-0 md:mt-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        evt.status === "completed"
                          ? "bg-slate-900/40 text-slate-200"
                          : "bg-white/20 text-white backdrop-blur-sm"
                      }`}
                    >
                      {t(evt.status === "completed" ? "Completed" : "Upcoming")}
                    </span>
                  </div>

                  {/* Right Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {t(evt.title)}
                        </h2>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                        {(evt.startTime || evt.endTime) && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span>
                              {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ""}
                            </span>
                          </div>
                        )}
                        {evt.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span>{t(evt.location)}</span>
                          </div>
                        )}
                      </div>

                      {evt.description && (
                        <p className="mt-3 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {t(evt.description)}
                        </p>
                      )}

                      {evt.instructions && (
                        <div className="mt-4 rounded-xl bg-orange-50 p-3 text-xs text-orange-950 border border-orange-200/60">
                          <span className="font-bold text-orange-700 flex items-center gap-1 mb-1">
                            <AlertCircle className="h-3.5 w-3.5 text-orange-600" /> {t("Important Instructions:")}
                          </span>
                          <p className="line-clamp-2 font-medium">{t(evt.instructions)}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex justify-end border-t border-[#e1cfb0] pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveModalEvent(evt)}
                        className="rounded-2xl bg-orange-600 hover:bg-orange-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition-all cursor-pointer"
                      >
                        {t("View Full Event Details")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal Dialog for Event Details */}
        {activeModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 md:p-8 shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveModalEvent(null)}
                className="absolute top-4 right-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 uppercase tracking-wider">
                  {formatDate(activeModalEvent.date)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    activeModalEvent.status === "completed"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {t(activeModalEvent.status === "completed" ? "Completed" : "Upcoming")}
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
                {t(activeModalEvent.title)}
              </h2>

              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                {(activeModalEvent.startTime || activeModalEvent.endTime) && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>
                      {activeModalEvent.startTime} {activeModalEvent.endTime ? `- ${activeModalEvent.endTime}` : ""}
                    </span>
                  </div>
                )}
                {activeModalEvent.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span>{t(activeModalEvent.location)}</span>
                  </div>
                )}
              </div>

              {activeModalEvent.image && (
                <div className="mt-5 h-56 w-full overflow-hidden rounded-2xl border border-[#e1cfb0]">
                  <img
                    src={activeModalEvent.image}
                    alt={activeModalEvent.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                {activeModalEvent.description && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">{t("Event Overview")}</h4>
                    <p className="mt-1 leading-relaxed">{t(activeModalEvent.description)}</p>
                  </div>
                )}

                {activeModalEvent.instructions && (
                  <div className="rounded-2xl bg-orange-50 p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-orange-600" /> {t("Official Instructions & Guidelines")}
                    </h4>
                    <p className="mt-1.5 text-orange-950 leading-relaxed font-medium">
                      {t(activeModalEvent.instructions)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end border-t border-[#e1cfb0] pt-5">
                <button
                  type="button"
                  onClick={() => setActiveModalEvent(null)}
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
