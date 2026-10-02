"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Navigation, MapPin, Sparkles } from "lucide-react";
import { Filters } from "@/components/Filters";
import { PlaceCard, Place } from "@/components/PlaceCard";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { useTranslation } from "@/lib/i18n";
import { resolveCategory } from "@/lib/categories";

interface HomeClientProps {
  initialPlaces: Place[];
}

export function HomeClient({ initialPlaces }: HomeClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selectedModalPlace, setSelectedModalPlace] = useState<Place | null>(null);

  const exploreNearMe = () => {
    router.push("/search?nearby=true");
  };

  useEffect(() => {
    fetch("/api/places", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlaces(data);
        }
      })
      .catch((err) => {
        console.error("Failed to refresh places client-side:", err);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Home Hero Section (~45-55% initial mobile viewport height, smooth curve bottom) */}
      <div className="relative w-full min-h-[430px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] bg-[#f8f2e8]">
        {/* Hero Background Image Container with clipped overflow */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <img
            src="/images/nashik-hero.webp"
            loading="eager"
            alt="Nashik Ghats at Sunset - Discover Nashik"
            className="w-full h-full object-cover object-[78%_center] sm:object-center"
          />
          {/* Soft, Bright Gradient Overlay for Positivity & Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />
        </div>

        {/* Hero Main Content */}
        <section className="relative z-20 flex flex-col justify-center min-h-[430px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] pt-14 pb-16 sm:pt-20 sm:pb-20 md:pt-24 px-4 sm:px-8 text-left">
          <div className="container mx-auto max-w-6xl">
            {/* Restricted to ~50-55% max width on left so temples and ghats on right side are prominently visible */}
            <div className="w-full max-w-[78%] sm:max-w-[58%] md:max-w-[52%] lg:max-w-[48%] text-left">
              <p className="mb-1 sm:mb-1.5 text-[9px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FFE082] drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                {t("Kumbh Mela 2027 · The river remembers")}
              </p>

              <h1 className="font-display mb-1.5 sm:mb-2.5 text-xl sm:text-3xl md:text-4xl font-extrabold leading-[1.12] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,1)]">
                {t("A sacred journey")}{" "}
                <span className="text-[#FFE082] drop-shadow-[0_3px_10px_rgba(0,0,0,1)]">{t("begins in Nashik")}</span>
              </h1>

              <p className="mb-3 sm:mb-4 text-[11px] sm:text-xs md:text-sm font-semibold leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                {t("Plan your Kumbh 2027 pilgrimage, then stay for the temples, vineyards, trails and stories that make Nashik timeless.")}
              </p>

              {/* Compact Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  window.location.href = q ? `/search?query=${encodeURIComponent(q)}` : "/search";
                }}
                className="flex w-full items-center overflow-hidden rounded-full border border-white/40 bg-white/95 px-2.5 py-1 sm:px-3.5 sm:py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md gap-1 sm:gap-2"
              >
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#667883] ml-1 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Search places, temples, events...")}
                  className="flex-1 min-w-0 bg-transparent text-[#173247] placeholder-[#667883] py-0.5 sm:py-1 outline-none text-[11px] sm:text-xs"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#e86f18] px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white transition-all hover:bg-[#c9580f] shrink-0 shadow-sm"
                >
                  <span>{t("Search")}</span>
                </button>
              </form>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-start gap-1 sm:gap-2 mt-2.5 sm:mt-3.5">
                <button
                  type="button"
                  onClick={exploreNearMe}
                  disabled={locationStatus === "loading"}
                  className="flex items-center justify-center rounded-full border border-white/50 bg-white/90 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-[#173247] shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                >
                  <Navigation className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-[#e86f18] shrink-0" />
                  <span className="truncate">{locationStatus === "loading" ? t("Finding nearby...") : t("Near Me")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-chatbot"))}
                  className="flex items-center justify-center rounded-full border border-white/50 bg-white/90 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-[#173247] shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-[1.02] active:scale-95"
                >
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-[#e86f18] shrink-0" />
                  <span>{t("AI Assistant")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/map")}
                  className="flex items-center justify-center rounded-full border border-white/50 bg-white/90 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-[#173247] shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-[1.02] active:scale-95"
                >
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-[#e86f18] shrink-0" />
                  <span>{t("Map")}</span>
                </button>
              </div>

              {locationStatus === "error" && (
                <p role="alert" className="mt-2 text-xs text-orange-200">
                  {t("We couldn't access your location. Please allow location access and try again.")}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Completely Seamless Hero bottom curve overlapping bottom edge seamlessly */}
        <div className="absolute -bottom-1 left-0 right-0 z-20 pointer-events-none leading-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-12 sm:h-16 md:h-24 text-[#f8f2e8] fill-current"
          >
            <path d="M-10,-5 C300,25 800,115 1210,40 L1210,130 L-10,130 Z"></path>
          </svg>
        </div>
      </div>

      <section className="relative z-20 pt-1 pb-3 sm:pt-2 sm:pb-4">
        <div className="container relative mx-auto px-3 sm:px-4">
          <div className="rounded-xl sm:rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] px-3.5 py-2 sm:px-5 sm:py-3 shadow-[0_16px_48px_rgba(77,58,30,0.1)]">
            <h2 className="mb-0 ml-1 text-lg sm:text-xl font-black tracking-tight text-[#173247]">{t("Browse Categories")}</h2>
            <p className="mb-2 sm:mb-2.5 ml-1 text-[10px] sm:text-[11px] text-[#667883]">
              {t("Explore Nashik by category — temples, heritage, nature, food and more.")}
            </p>
            <Filters selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          </div>
        </div>
      </section>

      <section id="explore" className="bg-[linear-gradient(180deg,_#fffdf8_0%,_#f8f2e8_52%,_#edf3f3_100%)] py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mb-6 sm:mb-10 flex flex-col gap-2 sm:gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#c9580f]">{t("Sacred & scenic")}</p>
              <h2 className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-semibold text-[#173247]">{t("Popular Right Now")}</h2>
              <p className="mt-1 sm:mt-2 text-xs sm:text-base text-[#667883]">{t("Discover the most cherished places in Nashik.")}</p>
            </div>
            <a href="/search" className="hidden text-base font-semibold text-[#c9580f] transition-colors hover:text-[#173247] md:block">
              {t("View all places")} &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {places.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-2xl bg-white/60 border border-amber-200/60 p-8">
                <p className="text-lg font-semibold text-[#173247] mb-2">{t("No places added yet")}</p>
                <p className="text-sm text-[#667883] mb-4">{t("Start building your Nashik directory by adding places.")}</p>
                <a href="/add-place" className="inline-block rounded-full bg-[#c9580f] px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#173247]">
                  + {t("Add New Place")}
                </a>
              </div>
            ) : (
              (selectedCategory === "All" ? places : places.filter((place) => {
                const catDef = resolveCategory(selectedCategory);
                if (catDef) {
                  const targetCat = (place.category || "").toLowerCase();
                  return (
                    catDef.placeCategories.some((c: string) => c.toLowerCase() === targetCat) ||
                    catDef.aliases.some((a: string) => a.toLowerCase() === targetCat)
                  );
                }
                return (place.category || "").toLowerCase() === selectedCategory.toLowerCase();
              })).slice(0, 6).map((place) => (
                <PlaceCard key={place._id} place={place} onExplore={setSelectedModalPlace} />
              ))
            )}
          </div>

          <div className="mt-8 sm:mt-10 text-center">
            <a
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-[#e7b06d] bg-[#fffdf8] px-8 py-3.5 text-sm sm:text-base font-bold text-[#c9580f] shadow-md transition-all hover:bg-[#c9580f] hover:text-white"
            >
              {t("View All Places")} ({places.length}) &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Kumbh 2027 Teaser */}
      <section className="relative overflow-hidden bg-[#173247] py-12 sm:py-20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-25 mix-blend-overlay z-0" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="mb-4 sm:mb-6 inline-block rounded-full border border-[#f5ad45]/60 bg-[#f5ad45]/15 px-3.5 py-1 text-xs sm:text-sm font-bold uppercase tracking-widest text-[#ffd48a] backdrop-blur-sm">
            {t("Upcoming Mega Event")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6">
            Kumbh Mela 2027
          </h2>
          <p className="mx-auto mb-8 sm:mb-10 max-w-3xl text-sm sm:text-xl text-[#dbe7e7] px-2">
            {t("Millions will gather in Nashik for the sacred Kumbh Mela. Start planning your pilgrimage early with our dedicated resources and guides.")}
          </p>
          <a href="/kumbh" className="inline-block rounded-full bg-[#f5ad45] px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-bold text-[#173247] shadow-[0_15px_35px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 hover:bg-[#ffd48a]">
            {t("Explore Kumbh Guide")}
          </a>
        </div>
      </section>

      {selectedModalPlace && (
        <PlaceDetailModal place={selectedModalPlace} onClose={() => setSelectedModalPlace(null)} />
      )}
    </div>
  );
}
