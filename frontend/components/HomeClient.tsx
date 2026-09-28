"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Navigation } from "lucide-react";
import { Filters } from "@/components/Filters";
import { PlaceCard, Place } from "@/components/PlaceCard";
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
      {/* Combined Hero and Best Things To Visit Wrapper */}
      <div className="relative w-full min-h-[85vh] sm:min-h-screen overflow-hidden">
        {/* Subtle background gradient accents */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,_rgba(239,145,45,0.25),_rgba(0,0,0,0)_42%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(245,173,69,0.15),_rgba(0,0,0,0)_50%)]" />
        </div>
        {/* Hero background image - WebP optimized */}
        <img
          src="/images/nashik-hero.webp"
          loading="eager"
          alt="Nashik Ghats at Sunset - Discover Nashik"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <section className="relative z-10 overflow-hidden pb-12 pt-20 sm:pb-16 sm:pt-24 md:pt-28 md:pb-24">
          <div className="container mx-auto px-4 max-w-full">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-16">
              {/* Left: Text Content */}
              <div className="flex-1 text-center lg:text-left w-full max-w-full">
                <p className="mb-3 sm:mb-5 text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.3em] text-orange-200 leading-snug">
                  {t("Kumbh Mela 2027 · The river remembers")}
                </p>
                <h1 className="font-display mb-4 sm:mb-5 text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.15] sm:leading-[0.95] text-white drop-shadow-[0_8px_25px_rgba(0,0,0,0.35)]">
                  {t("A sacred journey")}<br />
                  <span className="text-[#f5ad45]">{t("begins in Nashik")}</span>
                </h1>
                <p className="mx-auto mb-6 sm:mb-10 max-w-2xl text-sm sm:text-lg md:text-xl font-medium leading-relaxed sm:leading-8 text-orange-50/90 drop-shadow-md lg:mx-0 px-1">
                  {t("Plan your Kumbh 2027 pilgrimage, then stay for the temples, vineyards, trails and stories that make Nashik timeless.")}
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = searchQuery.trim();
                    window.location.href = q ? `/search?query=${encodeURIComponent(q)}` : "/search";
                  }}
                  className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-2xl border border-white/35 bg-white/95 shadow-[0_24px_70px_rgba(9,35,48,0.35)] backdrop-blur-md lg:mx-0"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("Search temples, food, vineyards…")}
                    className="flex-1 min-w-0 bg-transparent !text-[#173247] placeholder-[#667883] px-3.5 py-3.5 sm:px-5 sm:py-4 outline-none text-xs sm:text-base"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#e86f18] px-4 py-3.5 sm:px-7 sm:py-4 font-bold text-white transition-all hover:bg-[#c9580f] shrink-0 text-xs sm:text-base"
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{t("Search")}</span>
                  </button>
                </form>

                <div className="flex flex-wrap justify-center gap-4 mt-5 sm:mt-6 lg:justify-start">
                  <button
                    onClick={exploreNearMe}
                    disabled={locationStatus === "loading"}
                    className="flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-5 py-2.5 sm:px-6 text-xs sm:text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:cursor-wait disabled:opacity-70 max-w-full truncate"
                  >
                    <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 shrink-0" />
                    <span className="truncate">{locationStatus === "loading" ? t("Finding nearby places...") : t("Explore Near Me")}</span>
                  </button>
                </div>
                {locationStatus === "error" && (
                  <p role="alert" className="mt-3 text-xs sm:text-sm text-orange-100">
                    {t("We couldn't access your location. Please allow location access and try again.")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="relative z-20 py-6 sm:py-8">
        <div className="container relative mx-auto px-3 sm:px-4">
          <div className="rounded-2xl sm:rounded-[28px] border border-[#e1cfb0] bg-[#fffdf8] p-4 sm:p-6 shadow-[0_20px_60px_rgba(77,58,30,0.12)]">
            <h2 className="mb-4 sm:mb-6 ml-1 sm:ml-2 text-lg sm:text-xl font-bold text-[#173247]">{t("Browse Categories")}</h2>
            <Filters selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          </div>
        </div>
      </section>

      <section id="explore" className="bg-[linear-gradient(180deg,_#fffdf8_0%,_#f8f2e8_52%,_#edf3f3_100%)] py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 sm:mb-10 flex flex-col gap-2 sm:gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#c9580f]">{t("Sacred & scenic")}</p>
              <h2 className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-semibold text-[#173247]">{t("Popular Right Now")}</h2>
              <p className="mt-1 sm:mt-2 text-xs sm:text-base text-[#667883]">{t("Discover the most cherished places in Nashik.")}</p>
            </div>
            <a href="/search" className="hidden text-base font-semibold text-[#c9580f] transition-colors hover:text-[#173247] md:block">
              {t("View all places")} &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              })).map((place) => (
                <PlaceCard key={place._id} place={place} />
              ))
            )}
          </div>

          <div className="mt-8 sm:mt-10 text-center md:hidden">
            <a href="/search" className="inline-block w-full rounded-full border border-[#e7b06d] bg-[#fffdf8] px-6 py-3 font-medium text-[#c9580f] shadow-sm">
              {t("View all places")}
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
    </div>
  );
}
