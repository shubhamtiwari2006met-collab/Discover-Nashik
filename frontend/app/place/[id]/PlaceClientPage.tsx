"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Globe, Landmark, Mail, MapPin, Pencil, Phone, Save, Star, Trash2, BedDouble, Tag, Check, Calendar, MessageSquare, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/utils/supabase/client";
import { parsePhotoList, normalizeImageUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import { HotelData } from "@/app/api/business/hotel-data/route";

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

export default function PlaceClientPage() {
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
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
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
        let item: PlaceRecord | null = null;
        if (res.ok) {
          const data = await res.json();
          const found = Array.isArray(data) ? data.find((p: PlaceRecord) => p._id === id || (p as any).id === id) : null;
          if (found) {
            item = { ...found, _id: found._id || (found as any).id };
          }
        }

        if (!item) {
          // Direct fallback for approved business in Supabase by exact ID
          const { data: bus } = await supabase
            .from("business_registrations")
            .select("*")
            .eq("id", id)
            .eq("verification_status", "approved")
            .maybeSingle();

          if (bus) {
            const photos = parsePhotoList(bus.photos);
            item = {
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
          }
        }

        if (item) {
          setPlace(item);
          setForm(item);

          try {
            const hRes = await fetch(`/api/business/hotel-data?id=${item._id}`);
            if (hRes.ok) {
              const hData = await hRes.json();
              if (
                hData &&
                (hData.rooms?.length > 0 ||
                  hData.amenities?.length > 0 ||
                  hData.customAmenities?.length > 0 ||
                  hData.offers?.length > 0 ||
                  hData.packages?.length > 0 ||
                  hData.reviews?.length > 0)
              ) {
                setHotelData(hData);
              }
            }
          } catch (err) {
            console.error("Failed to load hotel data", err);
          }
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

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/business/hotel-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_review",
          businessId: id,
          reviewerName: newReviewName,
          rating: newReviewRating,
          comment: newReviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHotelData(data.data);
        setNewReviewName("");
        setNewReviewComment("");
        setNewReviewRating(5);
        setReviewMessage("Thank you! Your review has been submitted.");
        setTimeout(() => setReviewMessage(""), 4000);
      }
    } catch {
      alert("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

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

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-12">
      <div className="container mx-auto px-4">
        <Link href="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700"><ArrowLeft className="h-4 w-4" /> {t("Back to places")}</Link>
        <div className="mt-8 grid overflow-hidden rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_20px_55px_rgba(77,58,30,0.12)] md:grid-cols-2">
          {/* Photo Carousel */}
          <div className="relative flex flex-col">
            <div
              className="relative w-full overflow-hidden bg-slate-950"
              style={{ aspectRatio: "4 / 3", maxHeight: "520px" }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {displayPhotos.map((imgUrl, idx) => {
                const src = brokenImages.has(idx) ? DEFAULT_FALLBACK_IMAGE : imgUrl;
                const isVisible = safeIndex === idx;
                return (
                  <div
                    key={idx}
                    className="absolute inset-0 h-full w-full transition-opacity duration-500 ease-in-out"
                    style={{ opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? "auto" : "none" }}
                  >
                    {/* Ambient Blurred Background Image */}
                    <img
                      src={src}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-35 blur-xl scale-110 pointer-events-none"
                      aria-hidden="true"
                    />
                    {/* Complete Uncropped Main Image */}
                    <img
                      src={src}
                      alt={`${form.name} photo ${idx + 1}`}
                      onError={() => setBrokenImages((prev) => new Set(prev).add(idx))}
                      className="relative z-10 h-full w-full object-contain drop-shadow-md"
                    />
                  </div>
                );
              })}

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
                            while (updated.length <= idx) updated.push("");
                            updated[idx] = newVal;
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

        {/* HOTEL & STAYS EXTENDED CUSTOMER-FACING SECTION */}
        {hotelData && (
          <div className="mt-12 space-y-12">
            {/* Active Offers & Stay Packages */}
            {((hotelData.offers && hotelData.offers.filter(o => o.enabled).length > 0) || (hotelData.packages && hotelData.packages.filter(p => p.enabled).length > 0)) && (
              <section className="rounded-3xl border border-amber-200 bg-[#fffdf8] p-6 md:p-8 shadow-[0_10px_30px_rgba(77,58,30,0.08)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Special Offers & Stay Packages</h2>
                    <p className="text-xs text-slate-500">Exclusive promotions for your Nashik stay</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Offers */}
                  {hotelData.offers?.filter(o => o.enabled).map((offer) => (
                    <div key={offer.id} className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-500/5 to-amber-600/10 p-5">
                      <span className="absolute top-3 right-3 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        {offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 pr-16">{offer.title}</h3>
                      <p className="mt-2 text-sm text-slate-700">{offer.description}</p>
                      <div className="mt-4 flex items-baseline gap-3">
                        <span className="text-2xl font-extrabold text-amber-800">₹{offer.offerPrice}</span>
                        {offer.originalPrice > offer.offerPrice && (
                          <span className="text-sm font-semibold text-slate-400 line-through">₹{offer.originalPrice}</span>
                        )}
                        <span className="text-xs text-slate-500">/ night</span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">Valid: {offer.validFrom} to {offer.validUntil}</div>
                      {offer.terms && <div className="mt-1 text-xs text-slate-400 italic">Terms: {offer.terms}</div>}
                    </div>
                  ))}

                  {/* Packages */}
                  {hotelData.packages?.filter(p => p.enabled).map((pkg) => (
                    <div key={pkg.id} className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-amber-50/50 p-5">
                      <span className="absolute top-3 right-3 rounded-full bg-indigo-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        {pkg.duration}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 pr-20">{pkg.title}</h3>
                      <p className="mt-2 text-sm text-slate-700 font-medium">Includes: {pkg.inclusions}</p>
                      <div className="mt-4 flex items-baseline gap-3">
                        <span className="text-2xl font-extrabold text-indigo-950">₹{pkg.packagePrice}</span>
                        {pkg.savings && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">{pkg.savings}</span>}
                      </div>
                      <div className="mt-3 text-xs text-slate-500">Valid until: {pkg.validUntil}</div>
                      {pkg.terms && <div className="mt-1 text-xs text-slate-400 italic">Terms: {pkg.terms}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Rooms & Accommodation */}
            {hotelData.rooms && hotelData.rooms.length > 0 && (
              <section className="rounded-3xl border border-amber-200 bg-[#fffdf8] p-6 md:p-8 shadow-[0_10px_30px_rgba(77,58,30,0.08)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                    <BedDouble className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Available Rooms & Accommodations</h2>
                    <p className="text-xs text-slate-500">Explore room types, capacity, and current room availability</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {hotelData.rooms.map((room) => {
                    const availableCount = Math.max(0, room.totalRooms - (room.bookedRooms || 0));
                    return (
                      <div key={room.id} className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm transition hover:shadow-md flex flex-col">
                        {room.photos && room.photos[0] && (
                          <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                            <img src={room.photos[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 blur-xl scale-110 pointer-events-none" aria-hidden="true" />
                            <img src={room.photos[0]} alt={room.name} className="relative z-10 h-full w-full object-contain" />
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${room.isAC ? "bg-cyan-100 text-cyan-800" : "bg-orange-100 text-orange-800"}`}>
                                {room.isAC ? "AC Room" : "Non-AC"}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600 line-clamp-2">{room.description}</p>

                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1">🛏️ {room.bedType} Bed ({room.numBeds})</span>
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1">👥 Max Guests: {room.maxGuests} ({room.adultsAllowed} Adults{room.childrenAllowed ? `, ${room.childrenAllowed} Kids` : ""})</span>
                            </div>

                            {room.extraNotes && (
                              <p className="mt-3 text-xs text-amber-800 italic">💡 {room.extraNotes}</p>
                            )}
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="text-xl font-bold text-slate-900">₹{room.price} <span className="text-xs font-normal text-slate-500">/ night</span></div>
                              <div className="text-xs font-semibold text-emerald-700">{availableCount} of {room.totalRooms} rooms available</div>
                            </div>
                            <a
                              href={`tel:${form.phone || ""}`}
                              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 transition"
                            >
                              Inquire Room
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Property Amenities */}
            {((hotelData.amenities && hotelData.amenities.length > 0) || (hotelData.customAmenities && hotelData.customAmenities.length > 0)) && (
              <section className="rounded-3xl border border-amber-200 bg-[#fffdf8] p-6 md:p-8 shadow-[0_10px_30px_rgba(77,58,30,0.08)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Property Amenities & Facilities</h2>
                    <p className="text-xs text-slate-500">Services and features available at this stay</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[...(hotelData.amenities || []), ...(hotelData.customAmenities || [])].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 rounded-xl border border-amber-200/80 bg-white p-3 text-xs font-semibold text-slate-800 shadow-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Policies & Timings */}
            <section className="rounded-3xl border border-amber-200 bg-[#fffdf8] p-6 md:p-8 shadow-[0_10px_30px_rgba(77,58,30,0.08)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Check-in / Check-out & Property Policies</h2>
                  <p className="text-xs text-slate-500">Important rules and timings for staying guests</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">Standard Check-In</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">{hotelData.checkInTime || "12:00 PM"}</div>
                  {hotelData.earlyCheckInPolicy && <p className="mt-2 text-xs text-slate-600">{hotelData.earlyCheckInPolicy}</p>}
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">Standard Check-Out</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">{hotelData.checkOutTime || "11:00 AM"}</div>
                  {hotelData.lateCheckOutPolicy && <p className="mt-2 text-xs text-slate-600">{hotelData.lateCheckOutPolicy}</p>}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-700">
                {hotelData.cancellationPolicy && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Cancellation Policy:</span>
                    {hotelData.cancellationPolicy}
                  </div>
                )}
                {hotelData.idRequirements && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">ID Requirements:</span>
                    {hotelData.idRequirements}
                  </div>
                )}
                {hotelData.childPolicy && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Child Policy:</span>
                    {hotelData.childPolicy}
                  </div>
                )}
                {hotelData.extraBedPolicy && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Extra Bed Policy:</span>
                    {hotelData.extraBedPolicy}
                  </div>
                )}
                {hotelData.petPolicy && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Pet Policy:</span>
                    {hotelData.petPolicy}
                  </div>
                )}
                {hotelData.smokingPolicy && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Smoking Policy:</span>
                    {hotelData.smokingPolicy}
                  </div>
                )}
              </div>
            </section>

            {/* Guest Reviews */}
            <section className="rounded-3xl border border-amber-200 bg-[#fffdf8] p-6 md:p-8 shadow-[0_10px_30px_rgba(77,58,30,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Guest Reviews & Feedback</h2>
                    <p className="text-xs text-slate-500">Verified visitor ratings and genuine experiences</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-amber-100/70 px-4 py-2 text-amber-900">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                  <span className="text-lg font-bold">
                    {hotelData.reviews?.length > 0
                      ? (hotelData.reviews.reduce((acc, r) => acc + r.rating, 0) / hotelData.reviews.length).toFixed(1)
                      : "4.8"}
                  </span>
                  <span className="text-xs text-amber-800 font-medium">({hotelData.reviews?.length || 0} reviews)</span>
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-4 mb-8">
                {hotelData.reviews && hotelData.reviews.length > 0 ? (
                  hotelData.reviews.map((rev) => (
                    <div key={rev.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white uppercase">
                            {rev.reviewerName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{rev.reviewerName}</div>
                            <div className="text-[11px] text-slate-400">{rev.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < rev.rating ? "fill-amber-500 text-amber-500" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-slate-700 leading-relaxed">{rev.comment}</p>

                      {rev.ownerReply && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                            <span>🏨 Response from property owner</span>
                            {rev.ownerReplyDate && <span className="text-[10px] text-amber-700 font-normal">({rev.ownerReplyDate})</span>}
                          </div>
                          <p>{rev.ownerReply}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-6">No guest reviews yet. Be the first to review this property!</p>
                )}
              </div>

              {/* Leave a review form */}
              <form onSubmit={handleAddReview} className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Leave a Review for {form.name}</h3>

                {reviewMessage && (
                  <div className="mb-4 rounded-xl bg-emerald-100 p-3 text-xs font-semibold text-emerald-800">
                    {reviewMessage}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 mb-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh K."
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rating</label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-amber-500"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                      <option value={3}>⭐⭐⭐ (3 - Average)</option>
                      <option value={2}>⭐⭐ (2 - Poor)</option>
                      <option value={1}>⭐ (1 - Terrible)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Review</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Share details about your room, cleanliness, staff, or location..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Genuine Review"}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
