"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Upload, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/utils/supabase/client";

export default function AdminAddPlacePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    category: "Temples & Spiritual",
    location: "",
    description: "",
    tagline: "",
    famousThing: "",
    mapLink: "",
    rating: 4.8,
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");

  const categories = [
    "Temples & Spiritual",
    "Mountain & Treks",
    "Hotels & Stays",
    "Restaurant & Food",
    "Wineries",
    "Tourist Spots",
    "Family Activities",
    "Events",
    "Shopping & Retail",
    "Emergency & Healthcare",
    "Services",
  ];

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?role=admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const userRole = profile?.role?.toLowerCase() || "";

      if (userRole !== "admin") {
        router.replace("/login?role=admin");
        return;
      }
      setCheckingAccess(false);
    })();
  }, [router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const remainingSlots = 6 - photos.length;
    if (remainingSlots <= 0) {
      alert("You can upload a maximum of 6 photos per place.");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos((prev) => [...prev, reader.result as string].slice(0, 6));
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleAddUrlPhoto = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (photos.length >= 6) {
      alert("Maximum 6 photos allowed.");
      return;
    }
    setPhotos((prev) => [...prev, trimmed].slice(0, 6));
    setUrlInput("");
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.description) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          location: formData.location,
          description: formData.description,
          tagline: formData.tagline,
          famousThing: formData.famousThing,
          mapLink: formData.mapLink,
          rating: Number(formData.rating) || 4.8,
          images: photos.length > 0 ? photos : ["https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80"],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save place");
      }

      const created = await response.json();
      router.push(created._id ? `/place/${created._id}` : "/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error saving place:", error);
      alert(error instanceof Error ? error.message : "Failed to save place.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8] text-[#e86f18]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#c9580f] hover:text-[#173247] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Admin Dashboard
        </Link>

        <div className="bg-[#fffdf8] rounded-3xl border border-[#e1cfb0] p-6 sm:p-10 shadow-[0_20px_55px_rgba(77,58,30,0.12)]">
          <div className="mb-8 border-b border-[#e1cfb0] pb-5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e86f18]">Admin Workspace</span>
            <h1 className="text-3xl font-extrabold text-[#173247] mt-1">Add New Place</h1>
            <p className="text-sm text-[#667883] mt-1">
              Add a new tourist spot, temple, business, or attraction to Discover Nashik.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-[#173247] mb-1.5">
                  Place Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trimbakeshwar Shiva Temple"
                  className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#173247] mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location & Map Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-[#173247] mb-1.5">
                  Location / Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trimbak, Nashik"
                  className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#173247] mb-1.5">Google Maps Link</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                  value={formData.mapLink}
                  onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                />
              </div>
            </div>

            {/* Tagline & Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-[#173247] mb-1.5">Tagline / Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. One of the 12 Sacred Jyotirlingas"
                  className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#173247] mb-1.5">Famous Highlight</label>
                <input
                  type="text"
                  placeholder="e.g. Ancient Architecture & Godavari Origin"
                  className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                  value={formData.famousThing}
                  onChange={(e) => setFormData({ ...formData, famousThing: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-[#173247] mb-1.5">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide detailed description of the place, history, visiting tips, opening hours, etc."
                className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Photo Upload Section (Max 6 photos) */}
            <div className="rounded-2xl border border-[#d8c4a3] bg-[#fdfbf7] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#e86f18]" />
                  <h3 className="text-sm font-bold text-[#173247]">Upload Photos (Max 6 Photos)</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e86f18]/10 text-[#c9580f]">
                  {photos.length} / 6 Photos
                </span>
              </div>

              {/* Upload Controls */}
              {photos.length < 6 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <label className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#e86f18] bg-white p-3 text-xs font-bold text-[#c9580f] hover:bg-[#e86f18]/5 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Upload Image Files (Max {6 - photos.length} more)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>

                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="Paste Image URL"
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-xs text-[#173247] outline-none"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddUrlPhoto();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddUrlPhoto}
                      className="rounded-xl bg-[#173247] px-3 text-xs font-bold text-white hover:bg-[#234863]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Gallery Grid */}
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {photos.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-[#d8c4a3] bg-slate-100">
                      <img src={src} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700 transition-transform hover:scale-110"
                          title="Remove photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center text-[#667883] py-4">
                  No photos uploaded yet. Select files or paste URLs above to add up to 6 photos.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#e1cfb0]">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-[#d8c4a3] px-6 py-2.5 text-sm font-semibold text-[#173247] hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-[#e86f18] px-7 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#c9580f] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Saving Place..." : "Publish Place"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
