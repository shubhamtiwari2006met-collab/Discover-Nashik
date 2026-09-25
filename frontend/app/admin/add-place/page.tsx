"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
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
    heritage: "",
    tagline: "",
    famousThing: "",
    mapLink: "",
    rating: 4.8,
  });

  const [photos, setPhotos] = useState<string[]>(["", "", "", "", "", ""]);

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

  const updatePhoto = (index: number, value: string) => {
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.description) {
      alert("Please fill in all required fields.");
      return;
    }

    const validPhotos = photos.filter((p) => p.trim());

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
          heritage: formData.heritage,
          tagline: formData.tagline,
          famousThing: formData.famousThing,
          mapLink: formData.mapLink,
          rating: Number(formData.rating) || 4.8,
          images: validPhotos.length > 0 ? validPhotos : ["https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80"],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save place");
      }

      const created = await response.json();
      router.push("/admin/places");
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
          href="/admin/places"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#c9580f] hover:text-[#173247] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Places Management
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

            {/* Heritage */}
            <div>
              <label className="block text-sm font-bold text-[#173247] mb-1.5">
                Heritage Information <span className="text-xs font-normal text-[#667883]">(Optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Historical background, spiritual significance, ancient stories, local legends, religious traditions, or cultural importance..."
                className="w-full rounded-2xl border border-[#d8c4a3] bg-white px-4 py-3 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                value={formData.heritage}
                onChange={(e) => setFormData({ ...formData, heritage: e.target.value })}
              />
            </div>

            {/* Photo URL Fields (6 slots) */}
            <div className="rounded-2xl border border-[#d8c4a3] bg-[#fdfbf7] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#173247]">Photo URLs <span className="text-xs font-normal text-[#667883]">(Up to 6 photos, Photo 1 is primary)</span></h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e86f18]/10 text-[#c9580f]">
                  {photos.filter((p) => p.trim()).length} / 6 Photos
                </span>
              </div>
              <div className="space-y-2.5">
                {photos.map((photoUrl, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="shrink-0 w-16 text-xs font-bold text-[#667883]">Photo {idx + 1}{idx === 0 ? " *" : ""}</span>
                    <input
                      type="url"
                      placeholder={idx === 0 ? "Primary photo URL (required)" : `Photo ${idx + 1} URL (optional)`}
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-2.5 text-sm text-[#173247] outline-none focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
                      value={photoUrl}
                      onChange={(e) => updatePhoto(idx, e.target.value)}
                    />
                    {photoUrl.trim() && (
                      <img
                        src={photoUrl}
                        alt={`Preview ${idx + 1}`}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover border border-[#d8c4a3]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#667883]">
                Paste image URLs. Leave optional fields empty. Example: https://images.unsplash.com/photo-...
              </p>
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
