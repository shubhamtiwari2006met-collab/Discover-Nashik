"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Globe, Landmark, Mail, MapPin, Pencil, Phone, Save, Star, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/utils/supabase/client";
import { parsePhotoList, normalizeImageUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";

type PlaceRecord = {
  _id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  heritage?: string;
  tagline?: string;
  famousThing?: string;
  image?: string;
  images?: string[];
  rating?: number;
  mapLink?: string;
  // Business-specific public fields
  phone?: string;
  email?: string;
  websiteUrl?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string;
  subcategory?: string;
};

export default function PlacePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [place, setPlace] = useState<PlaceRecord | null>(null);
  const [form, setForm] = useState<PlaceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.role?.toLowerCase() === "admin") {
        setIsAdmin(true);
      }
    }
    void checkRole();

    async function loadPlaceData() {
      try {
        const res = await fetch("/api/places");
        if (res.ok) {
          const data = await res.json();
          const found = Array.isArray(data) ? data.find((item: PlaceRecord) => item._id === id) : null;
          if (found) {
            setPlace(found);
            setForm(found);
            setLoading(false);
            return;
          }
        }

        // Direct fallback for approved business in Supabase
        const { data: bus } = await supabase
          .from("business_registrations")
          .select("*")
          .eq("id", id)
          .eq("verification_status", "approved")
          .maybeSingle();

        if (bus) {
          const photos = parsePhotoList(bus.photos);
          const item: PlaceRecord = {
            _id: bus.id,
            name: bus.business_name,
            category: bus.category,
            location: bus.city_area ? `${bus.city_area}, ${bus.address}` : bus.address,
            description: bus.description || `${bus.business_name} in ${bus.address}`,
            image: photos[0] || DEFAULT_FALLBACK_IMAGE,
            images: photos.length > 0 ? photos : undefined,
            rating: 4.8,
            mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bus.business_name}, ${bus.address}`)}`,
            phone: bus.phone || undefined,
            email: bus.email || undefined,
            websiteUrl: bus.website_url || undefined,
            openingTime: bus.opening_time || undefined,
            closingTime: bus.closing_time || undefined,
            workingDays: bus.working_days || undefined,
            subcategory: bus.subcategory || undefined,
          };
          setPlace(item);
          setForm(item);
        } else {
          setPlace(null);
        }
      } catch {
        setPlace(null);
      } finally {
        setLoading(false);
      }
    }

    void loadPlaceData();
  }, [id]);

  const categories = ["Temples", "Food", "Hotels", "Nature", "Waterfalls", "Trekking", "Vineyards", "Shopping", "Emergency"];

  // --- Carousel auto-slide logic ---
  const validPhotos = (form?.images && form.images.length > 0)
    ? form.images.filter(u => u && u.trim())
    : (form?.image ? [form.image] : []);
  const photoCount = validPhotos.length;

  const goToSlide = useCallback((index: number) => {
    setSelectedPhotoIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setSelectedPhotoIndex(prev => (prev + 1) % Math.max(photoCount, 1));
  }, [photoCount]);

  const goPrev = useCallback(() => {
    setSelectedPhotoIndex(prev => (prev - 1 + Math.max(photoCount, 1)) % Math.max(photoCount, 1));
  }, [photoCount]);

  // Pause carousel briefly after manual interaction
  const pauseCarousel = useCallback(() => {
    setCarouselPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setCarouselPaused(false), 6000);
  }, []);

  useEffect(() => {
    if (photoCount <= 1 || carouselPaused || editing) return;
    const interval = setInterval(goNext, 3000);
    return () => clearInterval(interval);
  }, [photoCount, carouselPaused, editing, goNext]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      pauseCarousel();
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // Broken-image tracker
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  async function savePlace() {
    if (!form) return;

    // Filter out empty image URLs before saving, keep up to 6
    const cleanedImages = (form.images || (form.image ? [form.image] : [])).filter((u: string) => u && u.trim()).slice(0, 6);
    const payload = { ...form, image: cleanedImages[0] || form.image || "", images: cleanedImages.length > 0 ? cleanedImages : (form.image ? [form.image] : []) };

    const response = await fetch("/api/places", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Failed to update place. Admin permissions required.");
      return;
    }
    const updated = await response.json();
    setPlace(updated);
    setForm(updated);
    setEditing(false);
  }

  async function deletePlace() {
    if (!window.confirm("Delete this place?")) return;

    const response = await fetch(`/api/places?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/");
    } else {
      alert("Failed to delete place. Admin permissions required.");
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-orange-50 py-16 text-center text-orange-800">{t("Loading place details...")}</main>;
  }

  if (!place || !form) {
    return (
      <main className="min-h-screen bg-orange-50 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-lg">
          <h1 className="text-3xl font-bold text-orange-900">{t("Place not found")}</h1>
          <p className="mt-3 text-orange-800">{t("This place may have been removed or is not available yet.")}</p>
          <Link href="/search" className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-semibold text-white">{t("Back to places")}</Link>
        </div>
      </main>
    );
  }

  const displayPhotos = validPhotos.length > 0 ? validPhotos : [DEFAULT_FALLBACK_IMAGE];
  const safeIndex = selectedPhotoIndex < displayPhotos.length ? selectedPhotoIndex : 0;
  const activeImage = displayPhotos[safeIndex] || DEFAULT_FALLBACK_IMAGE;

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-12">
      <div className="container mx-auto px-4">
        <Link href="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700"><ArrowLeft className="h-4 w-4" /> {t("Back to places")}</Link>
        <div className="mt-8 grid overflow-hidden rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_20px_55px_rgba(77,58,30,0.12)] md:grid-cols-2">
          {/* Photo Carousel */}
          <div className="relative flex flex-col">
            <div
              className="relative w-full overflow-hidden bg-black/5"
              style={{ aspectRatio: "4 / 5", maxHeight: "520px" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {displayPhotos.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={brokenImages.has(idx) ? DEFAULT_FALLBACK_IMAGE : imgUrl}
                  alt={`${form.name} photo ${idx + 1}`}
                  onError={() => setBrokenImages(prev => new Set(prev).add(idx))}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out"
                  style={{ opacity: safeIndex === idx ? 1 : 0 }}
                />
              ))}

              {/* Arrow controls — only when multiple photos */}
              {displayPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => { pauseCarousel(); goPrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { pauseCarousel(); goNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {displayPhotos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                  {displayPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { pauseCarousel(); goToSlide(idx); }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        safeIndex === idx
                          ? "w-5 bg-white shadow-md"
                          : "w-2 bg-white/50 hover:bg-white/70"
                      }`}
                      aria-label={`Go to photo ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Photo counter badge */}
              {displayPhotos.length > 1 && (
                <span className="absolute top-3 right-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {safeIndex + 1} / {displayPhotos.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-7 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">{form.category}</p>
                {editing ? (
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-3 w-full rounded-xl border border-amber-200 p-2 text-2xl font-bold" />
                ) : (
                  <h1 className="mt-3 text-3xl font-bold text-orange-950">{form.name}</h1>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={editing ? savePlace : () => setEditing(true)} className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white">
                    {editing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}{editing ? t("Save") : t("Edit")}
                  </button>
                  <button onClick={deletePlace} className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"><Trash2 className="h-4 w-4" /> {t("Delete")}</button>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-orange-900">
              {editing ? (
                <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="w-full rounded-xl border border-amber-200 p-2" />
              ) : (
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {form.location}</span>
              )}
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> {form.rating || 4.6}</span>
            </div>
            {editing ? (
              <div className="mt-8 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Category")}</label>
                    <select
                      value={form.category}
                      onChange={(event) => setForm({ ...form, category: event.target.value })}
                      className="w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none ring-0"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Rating")}</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={form.rating ?? 4.6}
                      onChange={(event) => setForm({ ...form, rating: Number(event.target.value) || 0 })}
                      className="w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Location")}</label>
                  <input
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    className="w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Map Link")}</label>
                  <input
                    value={form.mapLink || ""}
                    onChange={(event) => setForm({ ...form, mapLink: event.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                  />
                </div>

                {/* 6 Photo URL fields */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Photo URLs")} <span className="text-xs font-normal text-slate-500">({t("Up to 6 photos")})</span></label>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const currentImages = form.images && form.images.length > 0 ? form.images : (form.image ? [form.image] : []);
                      const currentVal = currentImages[idx] || "";
                      return (
                        <input
                          key={idx}
                          value={currentVal}
                          onChange={(event) => {
                            const newVal = event.target.value;
                            const updated = [...(form.images && form.images.length > 0 ? form.images : (form.image ? [form.image] : []))];
                            // Extend array if needed
                            while (updated.length <= idx) updated.push("");
                            updated[idx] = newVal;
                            // Filter out empty trailing entries for images, but keep image as first valid
                            const cleaned = updated.slice(0, 6);
                            const firstValid = cleaned.find(u => u.trim()) || "";
                            setForm({ ...form, image: firstValid, images: cleaned });
                          }}
                          placeholder={`${t("Photo")} ${idx + 1} URL${idx === 0 ? " (" + t("Primary") + ")" : " (" + t("Optional") + ")"}`}
                          className="w-full rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-900 outline-none"
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Tagline")}</label>
                  <input
                    value={form.tagline || ""}
                    onChange={(event) => setForm({ ...form, tagline: event.target.value })}
                    placeholder="Short tagline"
                    className="w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Famous Thing")}</label>
                  <input
                    value={form.famousThing || ""}
                    onChange={(event) => setForm({ ...form, famousThing: event.target.value })}
                    placeholder="Special highlight"
                    className="w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Description")}</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Description"
                    className="min-h-36 w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t("Heritage")} <span className="text-xs font-normal text-slate-500">({t("Optional - Historical background, spiritual significance, legends")})</span>
                  </label>
                  <textarea
                    value={form.heritage || ""}
                    onChange={(event) => setForm({ ...form, heritage: event.target.value })}
                    placeholder={t("Enter historical background, spiritual significance, local legends, or cultural importance...")}
                    className="min-h-36 w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="mt-8 text-lg leading-8 text-orange-950">{form.description}</p>
                {Boolean(form.heritage && form.heritage.trim()) && (
                  <div className="mt-8 rounded-2xl border border-[#e1cfb0] bg-[#fffaf0] p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-[#c9580f]" />
                      <h3 className="text-base font-bold uppercase tracking-[0.15em] text-[#c9580f]">
                        {t("Heritage")}
                      </h3>
                    </div>
                    <div className="whitespace-pre-line text-base leading-7 text-[#173247]">
                      {form.heritage?.trim()}
                    </div>
                  </div>
                )}
                {/* Business Details Section — shown for approved business listings */}
                {(form.phone || form.email || form.websiteUrl || form.openingTime || form.workingDays) && (
                  <div className="mt-8 rounded-2xl border border-[#e1cfb0] bg-[#fffaf0] p-5">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-[#c9580f]">{t("Business Details")}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {form.phone && (
                        <div className="flex items-center gap-2 text-sm text-orange-900">
                          <Phone className="h-4 w-4 text-[#e86f18]" />
                          <a href={`tel:${form.phone}`} className="font-semibold hover:text-[#c9580f] transition-colors">{form.phone}</a>
                        </div>
                      )}
                      {form.email && (
                        <div className="flex items-center gap-2 text-sm text-orange-900">
                          <Mail className="h-4 w-4 text-[#e86f18]" />
                          <a href={`mailto:${form.email}`} className="font-semibold hover:text-[#c9580f] transition-colors">{form.email}</a>
                        </div>
                      )}
                      {form.websiteUrl && (
                        <div className="flex items-center gap-2 text-sm text-orange-900">
                          <Globe className="h-4 w-4 text-[#e86f18]" />
                          <a href={form.websiteUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-[#c9580f] transition-colors truncate">{form.websiteUrl.replace(/^https?:\/\//, '')}</a>
                        </div>
                      )}
                      {(form.openingTime || form.closingTime) && (
                        <div className="flex items-center gap-2 text-sm text-orange-900">
                          <Clock className="h-4 w-4 text-[#e86f18]" />
                          <span className="font-semibold">{form.openingTime || '—'} – {form.closingTime || '—'}</span>
                        </div>
                      )}
                      {form.workingDays && (
                        <div className="flex items-center gap-2 text-sm text-orange-900 sm:col-span-2">
                          <Clock className="h-4 w-4 text-[#e86f18]" />
                          <span className="font-semibold">{t("Open")}: {form.workingDays}</span>
                        </div>
                      )}
                      {form.subcategory && (
                        <div className="sm:col-span-2">
                          <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#b45309]">{form.subcategory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={form.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${form.name}, ${form.location}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
              >
                {t("Get directions")}
              </a>
              <Link href="/map" className="inline-flex rounded-full border border-amber-200 bg-orange-50 px-6 py-3 font-semibold text-orange-900 hover:bg-orange-100">{t("Open Nashik map")}</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
