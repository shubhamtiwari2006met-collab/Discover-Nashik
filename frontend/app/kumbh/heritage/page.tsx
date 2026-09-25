"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  List,
  Bookmark,
  Landmark,
  Feather,
  Info
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Chapter {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  pageIndex: number;
}

const CHAPTERS: Chapter[] = [
  { id: "chap-1", num: "01", title: "The Story of Nashik", subtitle: "Origins, Ramayana connection & Tapovan", pageIndex: 2 },
  { id: "chap-2", num: "02", title: "Understanding Kumbh", subtitle: "The Amrita Drop legend & celestial alignments", pageIndex: 4 },
  { id: "chap-3", num: "03", title: "Spiritual Nashik", subtitle: "Sacred Godavari, Ram Kund & Trimbakeshwar", pageIndex: 6 },
  { id: "chap-4", num: "04", title: "Sacred Places", subtitle: "Panchavati, Sita Gufa & Brahmagiri", pageIndex: 8 },
  { id: "chap-5", num: "05", title: "Nashik Through History", subtitle: "Satavahanas, Peshwas & cultural heritage", pageIndex: 10 },
  { id: "chap-6", num: "06", title: "Stories & Traditions", subtitle: "Akharas, Shahi Snan & folk wisdom", pageIndex: 12 },
  { id: "chap-7", num: "07", title: "Kumbh 2027 Pilgrimage", subtitle: "Sacred bathing dates & spiritual journey", pageIndex: 14 }
];

export default function HeritageBookPage() {
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [showTocModal, setShowTocModal] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const totalPages = 16;

  const turnToPage = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages || newPage === currentPage) return;
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsFlipping(false);
    }, 200);
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      if (isDesktop && currentPage >= 2 && currentPage < totalPages - 2) {
        turnToPage(currentPage + 2);
      } else {
        turnToPage(currentPage + 1);
      }
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      if (isDesktop && currentPage >= 4) {
        turnToPage(currentPage - 2);
      } else {
        turnToPage(currentPage - 1);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPage();
      else prevPage();
    }
    setTouchStartX(null);
  };

  const renderPageContent = (pageNo: number) => {
    if (pageNo === 0) {
      return (
        <div className="flex flex-col items-center justify-between min-h-[480px] p-6 md:p-10 text-center bg-[#faf4e8] border-4 border-[#b8860b]/40 rounded-xl relative overflow-hidden shadow-inner">
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#b8860b]" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#b8860b]" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#b8860b]" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#b8860b]" />

          <div className="space-y-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-orange-100 text-orange-900 border border-orange-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" /> Digital Heritage Book
            </span>
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-600/10 flex items-center justify-center text-orange-700 my-4 shadow-sm border border-orange-200">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#173247] tracking-wide leading-tight">
              NASHIK &amp; KUMBH<br /><span className="text-orange-700">HERITAGE</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.25em] text-[#8c6b43] font-semibold">
              History • Spirituality • Culture • Stories
            </p>
          </div>

          <div className="my-6 max-w-sm p-4 rounded-2xl bg-white/70 border border-[#e1cfb0] shadow-sm backdrop-blur-sm">
            <p className="text-xs text-[#667883] leading-relaxed font-medium">
              Explore the timeless legends of Ramayana, the sacred origin of Godavari, and the eternal spiritual journey of Kumbh Mela.
            </p>
          </div>

          <div className="w-full space-y-3 mb-2">
            <button
              onClick={() => turnToPage(1)}
              className="w-full max-w-xs mx-auto py-3 px-6 rounded-full bg-orange-600 text-white font-bold text-sm shadow-md hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Open Book &amp; Contents
            </button>
            <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
              Preview Edition • Content Coming Soon
            </p>
          </div>
        </div>
      );
    }

    if (pageNo === 1) {
      return (
        <div className="flex flex-col min-h-[480px] p-6 md:p-8 bg-[#fcf9f2] border border-[#e1cfb0] rounded-xl relative">
          <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-orange-700" />
              <h2 className="text-xl font-serif font-bold text-[#173247]">CONTENTS</h2>
            </div>
            <span className="text-xs font-bold text-[#8c6b43] uppercase tracking-wider">Table of Chapters</span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {CHAPTERS.map((chap) => (
              <button
                key={chap.id}
                onClick={() => turnToPage(chap.pageIndex)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-[#d8c4a3] hover:bg-white/80 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    {chap.num}
                  </span>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-[#173247] group-hover:text-orange-700 transition-colors">
                      {chap.title}
                    </h3>
                    <p className="text-[11px] text-[#667883] line-clamp-1">{chap.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Page {chap.pageIndex}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#e1cfb0] flex items-center justify-between text-xs text-[#8c6b43]">
            <span>📖 Select any chapter to preview</span>
            <span className="font-bold">Table of Contents</span>
          </div>
        </div>
      );
    }

    const chapIndex = Math.floor((pageNo - 2) / 2);
    const activeChap = CHAPTERS[chapIndex] || CHAPTERS[0];
    const isLeftPage = pageNo % 2 === 0;

    return (
      <div className="flex flex-col justify-between min-h-[480px] p-6 md:p-8 bg-[#fcf9f2] border border-[#e1cfb0] rounded-xl relative">
        <div className="flex items-center justify-between border-b border-[#e1cfb0]/80 pb-2 mb-4 text-xs text-[#8c6b43]">
          <span className="font-bold font-serif tracking-wider flex items-center gap-1.5">
            <Feather className="w-3.5 h-3.5 text-orange-600" />
            Chapter {activeChap.num}: {activeChap.title}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {isLeftPage ? "Left Page" : "Right Page"}
          </span>
        </div>

        <div className="flex-1 space-y-4">
          {isLeftPage ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-800">
                  Section {activeChap.num}.1
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#173247]">
                  {activeChap.title}
                </h2>
                <p className="text-xs text-[#667883] italic">{activeChap.subtitle}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/80 border-l-4 border-orange-600 space-y-1 my-3">
                <p className="text-xs font-serif italic text-orange-950">
                  &ldquo;Nashik &amp; Kumbh Mela represent an unbroken stream of spiritual consciousness, heritage, and sacred devotion.&rdquo;
                </p>
                <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                  — Sacred Lore &amp; Cultural Heritage
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="h-3.5 bg-slate-200/80 rounded w-full animate-pulse" />
                <div className="h-3.5 bg-slate-200/80 rounded w-11/12 animate-pulse" />
                <div className="h-3.5 bg-slate-200/80 rounded w-4/5 animate-pulse" />
                <div className="h-3.5 bg-slate-200/80 rounded w-10/12 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-dashed border-[#d8c4a3] bg-orange-50/40 p-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-700">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-serif font-bold text-[#173247]">
                  Historical Illustration &amp; Archives
                </h3>
                <p className="text-xs text-[#667883] max-w-xs mx-auto">
                  Authentic maps, ancient temple diagrams and traditional stories will be embedded here.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#e1cfb0] space-y-1.5 shadow-sm">
                <span className="text-[11px] font-bold text-[#173247] uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-orange-600" /> Sacred Reference Points
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                    Godavari River
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                    Ram Kund
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                    Tapovan
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                    Trimbakeshwar
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="h-3 bg-slate-200/70 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-200/70 rounded w-9/12 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-2 border-t border-[#e1cfb0]/60 flex items-center justify-between text-xs text-[#8c6b43] font-mono">
          <span>{`Page ${pageNo}`}</span>
          <span className="text-[11px] font-sans font-semibold text-orange-800">Coming Soon</span>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f2e8] text-[#173247] py-8 md:py-12 px-4 flex flex-col justify-between">
      <div className="container mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/kumbh"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d8c4a3] bg-white text-xs font-bold text-[#667883] hover:bg-orange-50 hover:text-orange-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {t("Back to Kumbh Guide")}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTocModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#d8c4a3] text-xs font-bold text-[#173247] hover:border-orange-500 hover:text-orange-600 shadow-sm transition-all"
            >
              <List className="w-4 h-4 text-orange-600" /> Contents
            </button>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/90 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-600 text-white shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-orange-600 text-white">
                  COMING SOON
                </span>
                <h2 className="text-sm font-bold text-orange-950">
                  Nashik &amp; Kumbh Heritage Digital Book
                </h2>
              </div>
              <p className="text-xs text-orange-900 mt-1 leading-relaxed">
                We are preparing a rich collection of historical, spiritual and cultural stories of Nashik and Kumbh Mela for you.
              </p>
            </div>
          </div>
          <Link
            href="/kumbh"
            className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 shrink-0 transition-colors shadow-sm"
          >
            Explore Kumbh
          </Link>
        </section>

        <section
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative max-w-4xl mx-auto my-4 transition-all duration-300"
        >
          <div className="rounded-3xl border-8 border-[#3d2716] bg-[#3d2716] p-2 md:p-4 shadow-[0_20px_50px_rgba(40,25,10,0.25)] relative overflow-hidden">
            <div className="hidden md:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/20 via-black/5 to-black/20 z-20 pointer-events-none" />

            <div className={`transition-opacity duration-200 ${isFlipping ? "opacity-40 scale-[0.99]" : "opacity-100 scale-100"}`}>
              {currentPage === 0 || currentPage === 1 ? (
                <div className="w-full max-w-lg mx-auto">
                  {renderPageContent(currentPage)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 relative z-10">
                  <div className="w-full">
                    {renderPageContent(currentPage)}
                  </div>
                  <div className="hidden md:block w-full">
                    {currentPage + 1 < totalPages ? (
                      renderPageContent(currentPage + 1)
                    ) : (
                      renderPageContent(currentPage)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 mt-6 p-4 rounded-2xl bg-white border border-[#e1cfb0] shadow-sm max-w-4xl mx-auto">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#d8c4a3] bg-white text-xs font-bold text-[#173247] hover:bg-orange-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-orange-600" /> Previous Page
          </button>

          <div className="text-center">
            <p className="text-xs font-bold text-[#173247] font-mono">
              {currentPage === 0
                ? "Book Cover"
                : currentPage === 1
                ? "Table of Contents"
                : typeof window !== "undefined" && window.innerWidth >= 768
                ? `Pages ${currentPage}–${Math.min(currentPage + 1, totalPages - 1)} of ${totalPages - 1}`
                : `Page ${currentPage} of ${totalPages - 1}`}
            </p>
            <p className="text-[10px] text-[#8c6b43] font-semibold uppercase tracking-wider">
              {currentPage === 0 ? "Tap Open Book to Start" : "Swipe or click arrows to flip pages"}
            </p>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-40 disabled:hover:bg-orange-600 transition-all shadow-sm"
          >
            Next Page <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>

      {showTocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-3">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-serif font-bold text-[#173247]">Book Table of Contents</h3>
              </div>
              <button
                onClick={() => setShowTocModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  turnToPage(0);
                  setShowTocModal(false);
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 text-xs font-bold text-[#173247] flex items-center justify-between"
              >
                <span>📖 Book Cover</span>
                <span className="text-[10px] font-mono text-slate-500">Page 0</span>
              </button>

              {CHAPTERS.map((chap) => (
                <button
                  key={chap.id}
                  onClick={() => {
                    turnToPage(chap.pageIndex);
                    setShowTocModal(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-transparent hover:border-[#d8c4a3] hover:bg-orange-50/60 text-xs flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-orange-100 text-orange-800 font-bold text-[11px] flex items-center justify-center">
                      {chap.num}
                    </span>
                    <div>
                      <p className="font-bold text-[#173247]">{chap.title}</p>
                      <p className="text-[10px] text-[#667883]">{chap.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                    Pg {chap.pageIndex}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTocModal(false)}
              className="w-full py-2.5 rounded-xl border border-[#d8c4a3] text-xs font-bold text-[#667883] hover:bg-slate-100"
            >
              Close Contents
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
