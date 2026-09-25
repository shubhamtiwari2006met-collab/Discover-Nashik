"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import PhotoInput from "@/components/PhotoInput";
import { createClient } from "@/utils/supabase/client";

export default function AddPlacePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    bestAbout: "",
    heritage: "",
    mapLink: "",
    tagline: "",
    famousThing: "",
    category: "Temples & Spiritual",
    imageUrl: "",
    imageFile: null as File | null,
  });

  const categories = [
    "Temples & Spiritual",
    "Mountain & Treks",
    "Hotels & Stays",
    "Restaurant & Food",
    "Wineries",
    "Tourist Spots",
    "Family Activities",
    "Events",
  ];

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      // Query profiles table directly via Supabase
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const userRole = profile?.role?.toLowerCase() || "visitor";

      let isApproved = false;
      if (userRole === "business") {
        const { data: reg } = await supabase
          .from("business_registrations")
          .select("verification_status")
          .eq("owner_id", session.user.id)
          .maybeSingle();
        if (reg?.verification_status === "approved") {
          isApproved = true;
        }
      }

      if (userRole === "admin") {
        router.replace("/admin/add-place");
        return;
      }

      if (!isApproved) {
        router.replace(userRole === "business" ? "/business/pending" : "/");
        return;
      }
      setCheckingAccess(false);
    })();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, imageUrl: reader.result as string, imageFile: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          location: formData.location,
          description: formData.bestAbout,
          heritage: formData.heritage,
          tagline: formData.tagline,
          famousThing: formData.famousThing,
          mapLink: formData.mapLink,
          image: formData.imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to save place");

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error saving place:", error);
      alert("Failed to save the place. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-orange-600">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold mb-4 text-center text-orange-600 dark:text-orange-400">
          {t("Add a New Place")}
        </h2>
        <form onSubmit={handleSubmit} className="add-place-form space-y-5">
          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Name")}</label>
              <input
                type="text"
                required
                placeholder="e.g. Trimbakeshwar Temple"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Category")}</label>
              <select
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Location")}</label>
              <input
                type="text"
                required
                placeholder="e.g. Trimbak, Nashik"
                className="add-place-location w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Map Link (URL)")}</label>
              <input
                type="url"
                placeholder="https://maps.google.com/..."
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.mapLink}
                onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
              />
            </div>
          </div>

          {/* Tagline & Famous Thing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Tagline")}</label>
              <input
                type="text"
                placeholder="e.g. The Divine Abode"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Famous Thing")}</label>
              <input
                type="text"
                placeholder="e.g. Jyotirlinga, Misal Pav"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.famousThing}
                onChange={(e) => setFormData({ ...formData, famousThing: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Best About It (Description)")}</label>
            <textarea
              rows={3}
              required
              placeholder="What makes this place special?"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.bestAbout}
              onChange={(e) => setFormData({ ...formData, bestAbout: e.target.value })}
            />
          </div>

          {/* Heritage */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Heritage")} <span className="text-xs font-normal text-slate-500">({t("Optional")})</span></label>
            <textarea
              rows={3}
              placeholder="Historical background, spiritual significance, legends, or cultural importance..."
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.heritage}
              onChange={(e) => setFormData({ ...formData, heritage: e.target.value })}
            />
          </div>

          {/* Photo Upload */}
          <PhotoInput
            label={t("Add a Photo")}
            description={t("Attach a photo via camera, device, or web URL")}
            value={formData.imageUrl}
            onChange={(val) => setFormData({ ...formData, imageUrl: val })}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t("Saving...") : t("Save Place")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
