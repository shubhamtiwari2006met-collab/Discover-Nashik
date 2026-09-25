"use client";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Bus,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Sparkles,
  Compass,
  ChevronRight,
  ShieldCheck,
  Landmark
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function KumbhPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-[#f7f2e9] text-[#173247] py-8 md:py-14 relative overflow-hidden">
      {/* Subtle Heritage Background Motif (Scoped SVG pattern) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#b86628_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* Redesigned Heritage Hero Section */}
        <section className="relative rounded-3xl bg-gradient-to-br from-[#4a1c12] via-[#612417] to-[#3a150e] p-8 md:p-12 text-[#fffdf8] shadow-[0_20px_50px_rgba(50,20,10,0.25)] border border-[#8c3b28]/40 overflow-hidden mb-12">
          {/* Subtle Background Radial Warm Glow */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Decorative Corner Filigree SVGs */}
          <svg className="absolute top-4 right-4 w-24 h-24 text-[#d4a359]/15 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 C65 25 75 35 100 50 C75 65 65 75 50 100 C35 75 25 65 0 50 C25 35 35 25 50 0 Z" />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content Column */}
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d4a359]/20 border border-[#d4a359]/40 text-[#fce8c5] text-xs font-bold uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5 text-[#d4a359]" /> {t("Nashik guide")}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-[#fffdf8] leading-tight">
                {t("Kumbh Mela 2027")}
              </h1>

              <p className="text-xs sm:text-sm font-serif italic text-[#fce8c5]/90 tracking-wide">
                &ldquo;Where sacred Godavari, ancient traditions, and millions of divine journeys meet.&rdquo;
              </p>

              <p className="text-sm md:text-base text-[#e6d5c3] leading-relaxed max-w-2xl pt-1">
                {t("Prepare for one of India's largest spiritual gatherings with practical locations, transport, and planning information.")}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <a
                  href="#explore-sections"
                  className="px-6 py-3 rounded-full bg-[#d4a359] text-[#2c1810] font-bold text-xs sm:text-sm shadow-md hover:bg-[#e4b66d] transition-all flex items-center gap-2"
                >
                  {t("Explore Kumbh")} <ChevronRight className="w-4 h-4" />
                </a>
                <Link
                  href="/map"
                  className="px-6 py-3 rounded-full border border-[#fce8c5]/30 bg-white/10 backdrop-blur-sm text-[#fffdf8] font-bold text-xs sm:text-sm hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-[#fce8c5]" /> {t("Open Nashik map")}
                </Link>
              </div>
            </div>

            {/* Right Visual Emblem Card (Desktop) */}
            <div className="hidden md:flex md:col-span-4 justify-end">
              <div className="p-6 rounded-2xl bg-white/5 border border-[#d4a359]/30 backdrop-blur-md text-center space-y-3 w-full max-w-xs shadow-inner">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#d4a359]/20 border border-[#d4a359]/40 flex items-center justify-center text-[#fce8c5]">
                  <Landmark className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a359] block">
                    Sacred Pilgrimage
                  </span>
                  <h3 className="text-lg font-serif font-bold text-[#fffdf8]">Nashik 2027</h3>
                </div>
                <p className="text-xs text-[#e6d5c3]/80 leading-snug">
                  Ram Kund • Panchavati • Trimbakeshwar Bathing Ghats
                </p>
                <div className="pt-2 border-t border-white/10 text-[11px] text-[#fce8c5] font-medium">
                  ✨ Official Pilgrim Information Portal
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Anchor point for smooth navigation */}
        <div id="explore-sections" className="space-y-12">
          
          {/* SECTION 1: ESSENTIAL GUIDE & LOCATIONS */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e1cfb0] pb-3 gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9e4129]">
                  01 • ESSENTIAL GUIDES
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2c1810]">
                  Explore Kumbh
                </h2>
              </div>
              <p className="text-xs text-[#667883]">Key locations, transport hubs &amp; bathing dates</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Important Locations Card */}
              <Link
                href="/kumbh/locations"
                className="group relative flex flex-col justify-between rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_10px_25px_rgba(60,35,15,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c86218] hover:shadow-xl cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange-700 opacity-0 transition-opacity group-hover:opacity-100">
                      {t("Explore")} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#173247] group-hover:text-orange-700 transition-colors">
                      {t("Important locations")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#667883]">
                      {t("Plan your route around Ram Kund, Panchavati, and the main bathing ghats.")}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center font-semibold text-orange-700 text-xs sm:text-sm pt-4 border-t border-[#f2e6d5]">
                  <span>{t("View Details")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </div>
              </Link>

              {/* Getting Around Card */}
              <Link
                href="/kumbh/getting-around"
                className="group relative flex flex-col justify-between rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_10px_25px_rgba(60,35,15,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c86218] hover:shadow-xl cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 transition-colors group-hover:bg-amber-700 group-hover:text-white">
                      <Bus className="h-6 w-6" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-800 opacity-0 transition-opacity group-hover:opacity-100">
                      {t("Explore")} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#173247] group-hover:text-amber-800 transition-colors">
                      {t("Getting around")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#667883]">
                      {t("Keep flexible travel time for crowds and use public transport where possible.")}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center font-semibold text-amber-800 text-xs sm:text-sm pt-4 border-t border-[#f2e6d5]">
                  <span>{t("View Details")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </div>
              </Link>

              {/* Dates and Planning Card */}
              <Link
                href="/kumbh/dates-planning"
                className="group relative flex flex-col justify-between rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_10px_25px_rgba(60,35,15,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c86218] hover:shadow-xl cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-800 transition-colors group-hover:bg-orange-700 group-hover:text-white">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange-800 opacity-0 transition-opacity group-hover:opacity-100">
                      {t("Explore")} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#173247] group-hover:text-orange-800 transition-colors">
                      {t("Dates and planning")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#667883]">
                      {t("Save your stay early and follow official updates as the 2027 event approaches.")}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center font-semibold text-orange-800 text-xs sm:text-sm pt-4 border-t border-[#f2e6d5]">
                  <span>{t("View Details")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </div>
              </Link>
            </div>
          </section>

          {/* Ornamental Cultural Divider */}
          <div className="flex items-center justify-center gap-3 text-[#d4a359]/60 my-8">
            <span className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[#d4a359]/40 to-transparent" />
            <span className="text-xs font-serif text-[#9e4129]">❖</span>
            <span className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[#d4a359]/40 to-transparent" />
          </div>

          {/* SECTION 2: VISITOR ASSISTANCE */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e1cfb0] pb-3 gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9e4129]">
                  02 • PILGRIM SUPPORT
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2c1810]">
                  Your Kumbh Journey
                </h2>
              </div>
              <p className="text-xs text-[#667883]">Helpline &amp; community support services</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Lost & Found Card */}
              <Link
                href="/kumbh/lost-found"
                className="group relative flex flex-col justify-between rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_10px_25px_rgba(60,35,15,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c86218] hover:shadow-xl cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange-700 opacity-0 transition-opacity group-hover:opacity-100">
                      {t("Explore")} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#173247] group-hover:text-orange-700 transition-colors">
                      {t("Lost & Found")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#667883]">
                      {t("Report a lost person or item, or help someone by reporting something you found.")}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center font-semibold text-orange-700 text-xs sm:text-sm pt-4 border-t border-[#f2e6d5]">
                  <span>{t("View Details")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </div>
              </Link>

              {/* Interactive Map Quick Card */}
              <Link
                href="/map"
                className="group relative flex flex-col justify-between rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_10px_25px_rgba(60,35,15,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c86218] hover:shadow-xl cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 transition-colors group-hover:bg-amber-700 group-hover:text-white">
                      <Compass className="h-6 w-6" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-800 opacity-0 transition-opacity group-hover:opacity-100">
                      {t("Explore")} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#173247] group-hover:text-amber-800 transition-colors">
                      {t("Open Nashik map")}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#667883]">
                      Navigate temples, bathing ghats, parking zones and emergency control rooms.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center font-semibold text-amber-800 text-xs sm:text-sm pt-4 border-t border-[#f2e6d5]">
                  <span>{t("View Details")}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </div>
              </Link>
            </div>
          </section>

          {/* SECTION 3: HERITAGE & STORIES (FEATURE HIGHLIGHT CARD) */}
          <section className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e1cfb0] pb-3 gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c4b18]">
                  03 • CULTURAL HERITAGE
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2c1810]">
                  Discover the Heritage
                </h2>
              </div>
              <p className="text-xs text-[#667883]">Sacred legends, Ramayana history &amp; stories</p>
            </div>

            {/* Special Digital Book Heritage Invitation Card */}
            <Link
              href="/kumbh/heritage"
              className="group relative flex flex-col md:flex-row items-center justify-between rounded-3xl border-2 border-[#d4a359]/60 bg-gradient-to-r from-[#fffbf4] via-[#fcf7ec] to-[#f8efde] p-6 md:p-8 shadow-[0_15px_35px_rgba(80,45,15,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#b87628] hover:shadow-2xl cursor-pointer overflow-hidden"
            >
              <div className="space-y-3 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-orange-100 text-orange-900 border border-orange-200">
                  <BookOpen className="w-3.5 h-3.5 text-orange-700" /> Digital Book Preview
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2c1810] group-hover:text-orange-800 transition-colors">
                  {t("Nashik & Kumbh Heritage")}
                </h3>
                <p className="text-sm text-[#667883] leading-relaxed">
                  {t("Explore the history, spirituality and stories of Nashik and Kumbh Mela.")} Dive into ancient Ramayana chronicles, sacred Godavari folklore, and Kumbh traditions.
                </p>
              </div>

              <div className="mt-6 md:mt-0 shrink-0">
                <span className="px-6 py-3.5 rounded-full bg-[#612417] text-[#fffdf8] font-bold text-xs sm:text-sm shadow-md group-hover:bg-[#7e2e1e] transition-colors flex items-center gap-2">
                  <span>Explore Heritage Book</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                </span>
              </div>
            </Link>
          </section>

        </div>
      </div>
    </main>
  );
}

