"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Tag, Star, AlignLeft, Info, Search, Loader2, Landmark } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPlaceModal({ isOpen, onClose }: AddPlaceModalProps) {
  const { t } = useTranslation();
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
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const categories = [
    "Temples & Spiritual",
    "Mountain & Treks",
    "Hotels & Stays",
    "Restaurant & Food",
    "Wineries",
    "Tourist Spots",
    "Family Activities",
    "Events",
    "Shopping",
    "Others"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/places", {
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
          image: formData.imageUrl || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add place");
      }

      setSuccessMsg("Place added successfully!");
      setTimeout(() => {
        setFormData({
          name: "",
          location: "",
          bestAbout: "",
          heritage: "",
          mapLink: "",
          tagline: "",
          famousThing: "",
          category: "Temples & Spiritual",
          imageUrl: "",
        });
        setSuccessMsg("");
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add place. Make sure you are logged in as Admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-orange-50 dark:bg-orange-950/30 px-6 py-4 flex items-center justify-between border-b border-orange-100 dark:border-orange-900/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                  {t("Add a New Place")}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("Help common users discover new places on Discover Nashik")}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
              {errorMsg && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
                  {t(errorMsg)}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
                  {t(successMsg)}
                </div>
              )}

              <form id="add-place-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Name")} *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Trimbakeshwar Temple" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Category")} *</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Location")} *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Trimbak, Nashik" 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Map Link (URL)")}</label>
                    <input 
                      type="url" 
                      placeholder="https://maps.google.com/..." 
                      value={formData.mapLink}
                      onChange={(e) => setFormData({...formData, mapLink: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Tagline")}</label>
                    <div className="relative">
                      <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. The Divine Abode" 
                        value={formData.tagline}
                        onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Famous Thing")}</label>
                    <div className="relative">
                      <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Jyotirlinga, Misal Pav" 
                        value={formData.famousThing}
                        onChange={(e) => setFormData({...formData, famousThing: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Best About It (Description)")} *</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <textarea 
                      required
                      rows={3}
                      placeholder="What makes this place special?" 
                      value={formData.bestAbout}
                      onChange={(e) => setFormData({...formData, bestAbout: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Heritage")} <span className="text-xs font-normal text-slate-500">({t("Optional")})</span></label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <textarea 
                      rows={3}
                      placeholder="Historical background, spiritual significance, legends, or cultural importance..." 
                      value={formData.heritage}
                      onChange={(e) => setFormData({...formData, heritage: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 text-black dark:bg-slate-800/50 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("Add a Photo")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500">{t("Paste Image URL")}</span>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white text-black dark:bg-slate-800/50 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500">{t("Or Upload File")}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white text-black dark:bg-slate-800/50 dark:text-white text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer / Actions */}
            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {t("Cancel")}
              </button>
              <button 
                form="add-place-form"
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? t("Saving...") : t("Save Place")}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

