"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Loader2,
  X,
  Compass,
  Building2,
  Landmark,
  HeartPulse,
  Bed,
  Utensils,
  Mountain,
  Footprints,
  Bath,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { MapPOIItem } from "@/lib/defaultMapPois";

const CATEGORIES = [
  "All",
  "Spiritual",
  "Religious",
  "Historic",
  "Tourist Spot",
  "Trek",
  "Mountains",
  "Hotels",
  "Restaurants",
  "Hospitals",
  "Public Toilets",
  "Emergency",
  "Transport"
];

function getCategoryBadge(category: string) {
  switch (category) {
    case "Spiritual":
    case "Religious":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "Historic":
    case "Tourist Spot":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "Trek":
    case "Mountains":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "Hotels":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Restaurants":
      return "bg-rose-100 text-rose-800 border-rose-300";
    case "Hospitals":
    case "Emergency":
      return "bg-red-100 text-red-800 border-red-300";
    case "Public Toilets":
      return "bg-cyan-100 text-cyan-800 border-cyan-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export default function MapPOIsAdminPage() {
  const [pois, setPois] = useState<MapPOIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPoi, setEditingPoi] = useState<MapPOIItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Spiritual",
    latitude: 20.005,
    longitude: 73.785,
    location: "",
    description: "",
    image: "",
    phone: "",
    famousThing: "",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchPOIs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/map-pois", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPois(data);
      }
    } catch (err) {
      showNotification("error", "Failed to load map POIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOIs();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingPoi(null);
    setFormData({
      name: "",
      category: "Spiritual",
      latitude: 20.0055,
      longitude: 73.7946,
      location: "Panchavati, Nashik",
      description: "",
      image: "",
      phone: "",
      famousThing: "",
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (poi: MapPOIItem) => {
    setEditingPoi(poi);
    setFormData({
      name: poi.name,
      category: poi.category,
      latitude: poi.latitude,
      longitude: poi.longitude,
      location: poi.location,
      description: poi.description || "",
      image: poi.image || "",
      phone: poi.phone || "",
      famousThing: poi.famousThing || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = "/api/map-pois";
      const method = editingPoi ? "PUT" : "POST";
      const payload = editingPoi
        ? { ...formData, _id: editingPoi._id }
        : formData;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification("success", editingPoi ? "Map POI updated successfully!" : "New Map POI added!");
        setModalOpen(false);
        fetchPOIs();
      } else {
        const err = await res.json();
        showNotification("error", err.error || "Failed to save Map POI");
      }
    } catch (err) {
      showNotification("error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/map-pois?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showNotification("success", "Map POI deleted successfully");
        setDeleteId(null);
        fetchPOIs();
      } else {
        showNotification("error", "Failed to delete Map POI");
      }
    } catch (err) {
      showNotification("error", "Failed to delete Map POI");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm("Are you sure you want to seed default Nashik locations (35+ places)?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/map-pois/seed", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showNotification("success", data.message || "Seeded default Nashik POIs!");
        fetchPOIs();
      } else {
        showNotification("error", "Failed to seed POIs");
      }
    } catch (err) {
      showNotification("error", "Failed to seed POIs");
    } finally {
      setSeeding(false);
    }
  };

  const filteredPois = pois.filter((poi) => {
    const matchesCategory = selectedCategory === "All" || poi.category === selectedCategory;
    const matchesSearch =
      poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poi.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poi.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#173247] via-[#1c3d5a] to-[#102232] p-6 text-white shadow-xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-[#e86f18] border border-orange-400/30">
              <Compass className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Leaflet Map Points of Interest (POIs)</h1>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Manage spiritual spots, treks, hospitals, hotels, restaurants, public toilets & emergency locations shown strictly on the map.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {seeding ? <Loader2 className="h-4 w-4 animate-spin text-orange-400" /> : <RefreshCw className="h-4 w-4 text-orange-400" />}
            <span>Seed 35+ Default POIs</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] hover:from-[#d9620f] hover:to-[#b84e0b] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-950/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Map POI</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 border text-sm font-medium transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-amber-900/10 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#173247] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search POIs by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* POI List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-amber-900/10 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading Map POIs...</p>
        </div>
      ) : filteredPois.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-amber-900/10 shadow-sm text-center p-6">
          <Compass className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Map POIs Found</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
            No points match your selected filter. Click below to seed 35+ default Nashik locations!
          </p>
          <button
            onClick={handleSeedData}
            className="rounded-xl bg-[#173247] text-white px-4 py-2 text-xs font-bold hover:bg-[#102232] transition-colors"
          >
            Seed Default Locations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPois.map((poi) => (
            <div
              key={poi._id}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-orange-300 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${getCategoryBadge(
                      poi.category
                    )}`}
                  >
                    {poi.category}
                  </span>
                  <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {poi.name}
                </h3>

                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                  <span className="truncate">{poi.location}</span>
                </p>

                {poi.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {poi.description}
                  </p>
                )}

                {poi.famousThing && (
                  <div className="mt-2.5 bg-amber-50 rounded-xl p-2 border border-amber-200/60">
                    <p className="text-[11px] text-amber-900 font-medium">
                      <span className="font-bold">✨ Highlights:</span> {poi.famousThing}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  Map-Only POI
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(poi)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                    title="Edit POI"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(poi._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete POI"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPoi ? "Edit Map POI" : "Add New Map POI"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Place Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalaram Temple"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panchavati, Nashik"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Latitude (Coordinates) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="20.0055"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Longitude (Coordinates) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="73.7946"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Short description of this location for map visitors..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Highlights / Famous Thing</label>
                <input
                  type="text"
                  placeholder="e.g. Black Stone Architecture, Ramayana Heritage"
                  value={formData.famousThing}
                  onChange={(e) => setFormData({ ...formData, famousThing: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Helpline (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] text-xs font-bold text-white shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingPoi ? "Save Changes" : "Create Map POI"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-slate-200 shadow-2xl">
            <Trash2 className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Delete Map POI?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              This will permanently remove this location from the Leaflet map and Near Me search.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-md transition-colors"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete POI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
