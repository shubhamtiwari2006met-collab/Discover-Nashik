"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  PlusCircle,
  Search,
  Landmark,
  Star,
  CheckCircle2,
  X,
  Save,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { SavedPlace } from "@/app/api/places/route";
import { DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";

export default function AdminPlacesPage() {
  const { t } = useTranslation();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Modal State
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    category: string;
    location: string;
    description: string;
    heritage: string;
    images: string[];
    rating: number;
    tagline: string;
    famousThing: string;
    mapLink: string;
  } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const categories = ["all", "Temples", "Trekking", "Nature", "Waterfalls", "Vineyards", "Food", "Hotels", "Shopping", "Emergency"];

  async function loadPlaces() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/places", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch places");
      const data = await res.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load places");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlaces();
  }, []);

  async function handleDeletePlace(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/places?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete place");
      setPlaces((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      alert(err.message || "Could not delete place");
    } finally {
      setActionLoading(null);
    }
  }

  function handleOpenEdit(place: SavedPlace) {
    setEditingPlace(place);
    const existingImages = place.images && place.images.length > 0
      ? place.images
      : (place.image ? [place.image] : []);
    
    // Ensure array has 6 entries for editing
    const paddedImages = [...existingImages];
    while (paddedImages.length < 6) paddedImages.push("");

    setEditForm({
      name: place.name || "",
      category: place.category || "Temples",
      location: place.location || "",
      description: place.description || "",
      heritage: place.heritage || "",
      images: paddedImages.slice(0, 6),
      rating: place.rating || 4.8,
      tagline: place.tagline || "",
      famousThing: place.famousThing || "",
      mapLink: place.mapLink || "",
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlace || !editForm) return;

    setSaveLoading(true);
    try {
      const cleanedImages = editForm.images.filter((u) => u && u.trim()).slice(0, 6);
      const payload = {
        _id: editingPlace._id,
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        location: editForm.location.trim(),
        description: editForm.description.trim(),
        heritage: editForm.heritage.trim() || undefined,
        tagline: editForm.tagline.trim() || undefined,
        famousThing: editForm.famousThing.trim() || undefined,
        mapLink: editForm.mapLink.trim() || undefined,
        image: cleanedImages[0] || DEFAULT_FALLBACK_IMAGE,
        images: cleanedImages.length > 0 ? cleanedImages : [DEFAULT_FALLBACK_IMAGE],
        rating: Number(editForm.rating) || 4.8,
      };

      const res = await fetch("/api/places", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();

      setPlaces((prev) =>
        prev.map((p) => (p._id === editingPlace._id ? { ...p, ...updated } : p))
      );
      setEditingPlace(null);
      setEditForm(null);
    } catch (err: any) {
      alert(err.message || "Failed to save place");
    } finally {
      setSaveLoading(false);
    }
  }

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory !== "all" && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[#e86f18]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-2">
      {/* Top Header */}
      <div className="mb-6 border-b border-[#e1cfb0] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#173247]">Places Management</h1>
          <p className="mt-1 text-[#667883]">
            Manage all places directly added by Admin (such as Brahmagiri Mountain, Trimbakeshwar Jyotirling, and custom added places).
          </p>
        </div>

        <Link
          href="/admin/add-place"
          className="flex items-center gap-2 rounded-2xl bg-[#e86f18] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#c9580f] transition-all hover:scale-105"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Place</span>
        </Link>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      {/* Stats Counter */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-[#e86f18] bg-[#fff8e6] p-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-[#e86f18]">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#173247]">{places.length}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#667883]">Total Managed Places</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-amber-300 bg-amber-50/50 p-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-amber-600">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#173247]">{places.filter((p) => p.heritage).length}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#667883]">Places with Heritage info</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-emerald-600">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#173247]">4.8+</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#667883]">Avg Tourist Rating</p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-[#d8c4a3] bg-white px-3.5 py-2 text-sm shadow-sm w-full sm:max-w-md">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search place name, location, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-xs md:text-sm text-[#173247]"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#e1cfb0] bg-[#fffdf8] p-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 capitalize ${
                selectedCategory === cat
                  ? "bg-[#e86f18] text-white shadow-sm"
                  : "text-[#667883] hover:bg-orange-50 hover:text-[#c9580f]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Places */}
      {!filteredPlaces.length ? (
        <div className="rounded-2xl border border-dashed border-[#d8c4a3] p-12 text-center text-[#667883]">
          No places found matching your search filter.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => {
            const displayImg = place.image || (place.images && place.images[0]) || DEFAULT_FALLBACK_IMAGE;
            const photoCount = place.images ? place.images.filter((u) => u && u.trim()).length : (place.image ? 1 : 0);

            return (
              <article
                key={place._id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative h-48 w-full bg-black/5">
                  <img
                    src={displayImg}
                    alt={place.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE; }}
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {place.category}
                  </span>
                  {photoCount > 1 && (
                    <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {photoCount} Photos
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#173247] line-clamp-1">{place.name}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{place.rating || 4.8}</span>
                    </div>
                  </div>

                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#e86f18]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{place.location}</span>
                  </p>

                  <p className="mt-3 text-xs text-[#667883] line-clamp-2">{place.description}</p>

                  {place.heritage && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#9d4300] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                      <Landmark className="h-3.5 w-3.5 shrink-0" />
                      <span>Heritage info attached</span>
                    </div>
                  )}

                  <div className="mt-auto pt-5 flex items-center gap-2 border-t border-[#e1cfb0] mt-4">
                    <Link
                      href={`/place/${place._id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#d8c4a3] bg-white py-2 text-xs font-bold text-[#173247] hover:bg-orange-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(place)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#e86f18] py-2 text-xs font-bold text-white hover:bg-[#c9580f]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading === place._id}
                      onClick={() => handleDeletePlace(place._id, place.name)}
                      className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-60"
                      title="Delete Place"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* EDIT PLACE MODAL */}
      {editingPlace && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d8c4a3] bg-[#fffdf8] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-4">
              <h2 className="text-xl font-bold text-[#173247]">Edit Place: {editingPlace.name}</h2>
              <button
                onClick={() => { setEditingPlace(null); setEditForm(null); }}
                className="rounded-full p-1 text-[#667883] hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#173247]">Place Name *</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-sm text-[#173247] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#173247]">Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-sm text-[#173247] outline-none"
                  >
                    {categories.filter((c) => c !== "all").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#173247]">Location *</label>
                <input
                  required
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-sm text-[#173247] outline-none"
                  placeholder="e.g. Trimbak, Nashik"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#173247]">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-sm text-[#173247] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#173247]">Heritage & History (Optional)</label>
                <textarea
                  rows={4}
                  value={editForm.heritage}
                  onChange={(e) => setEditForm({ ...editForm, heritage: e.target.value })}
                  className="w-full rounded-xl border border-[#d8c4a3] bg-white p-3 text-sm text-[#173247] outline-none"
                  placeholder="Add historical background, legends, spiritual significance..."
                />
              </div>

              {/* Photo URLs */}
              <div>
                <label className="mb-2 block text-xs font-bold text-[#173247]">Photo URLs (Up to 6 photos)</label>
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      type="url"
                      value={editForm.images[idx] || ""}
                      onChange={(e) => {
                        const updated = [...editForm.images];
                        updated[idx] = e.target.value;
                        setEditForm({ ...editForm, images: updated });
                      }}
                      placeholder={`Photo ${idx + 1} URL${idx === 0 ? " (Primary)" : " (Optional)"}`}
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white p-2.5 text-xs text-[#173247] outline-none"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#e1cfb0] pt-4">
                <button
                  type="button"
                  onClick={() => { setEditingPlace(null); setEditForm(null); }}
                  className="rounded-xl border border-[#d8c4a3] bg-white px-5 py-2.5 text-xs font-bold text-[#667883] hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#c9580f] disabled:opacity-60"
                >
                  {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
