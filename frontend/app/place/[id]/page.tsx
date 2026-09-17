"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Globe, Mail, MapPin, Pencil, Phone, Save, Star, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/utils/supabase/client";

type PlaceRecord = {
  _id: string;
  name: string;
  category: string;
  location: string;
  description: string;
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
          const photos = bus.photos ? String(bus.photos).split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean) : [];
          const item: PlaceRecord = {
            _id: bus.id,
            name: bus.business_name,
            category: bus.category,
            location: bus.city_area ? `${bus.city_area}, ${bus.address}` : bus.address,
            description: bus.description || `${bus.business_name} in ${bus.address}`,
            image: photos[0] || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
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

  async function savePlace() {
    if (!form) return;

    // Ensure images array is synced with the primary image before saving
    const updatedImages = form.image ? [form.image] : [];
    const payload = { ...form, images: updatedImages.length > 0 ? updatedImages : form.images };

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

  const allPhotos = (form.images && form.images.length > 0) ? form.images : (form.image ? [form.image] : []);
  const activeImage = allPhotos[selectedPhotoIndex] || form.image || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80";

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-12">
      <div className="container mx-auto px-4">
        <Link href="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700"><ArrowLeft className="h-4 w-4" /> {t("Back to places")}</Link>
        <div className="mt-8 grid overflow-hidden rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_20px_55px_rgba(77,58,30,0.12)] md:grid-cols-2">
          <div className="flex flex-col">
            <img src={activeImage} alt={form.name} className="h-72 sm:h-96 w-full object-cover" />
            {allPhotos.length > 1 && (
              <div className="flex gap-2 p-3 bg-amber-900/5 overflow-x-auto no-scrollbar border-t border-[#e1cfb0]">
                {allPhotos.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPhotoIndex === idx ? "border-[#e86f18] scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Image URL")}</label>
                  <input
                    value={form.image || ""}
                    onChange={(event) => {
                      const newUrl = event.target.value;
                      setForm({ ...form, image: newUrl, images: newUrl ? [newUrl] : [] });
                    }}
                    placeholder="Image URL"
                    className="w-full rounded-xl border border-amber-200 bg-white p-3 text-slate-900 outline-none"
                  />
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
              </div>
            ) : (
              <>
                <p className="mt-8 text-lg leading-8 text-orange-950">{form.description}</p>
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
