"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2,
  Save,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Search,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Info,
  Check,
  XCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { normalizeImageUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import { createClient } from "@/utils/supabase/client";

interface HomepagePlaceEntry {
  placeId: string;
  visible: boolean;
  order: number;
  name: string;
  category: string;
  image: string;
}

export default function HomepageDisplayManagementPage() {
  const { t } = useTranslation();
  const supabase = createClient();

  const [places, setPlaces] = useState<HomepagePlaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Drag-and-drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  // Original state for change detection
  const originalRef = useRef<string>("");

  async function getAuthToken(): Promise<string> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    } catch {
      // Fallback to localStorage
    }

    if (typeof window !== "undefined") {
      try {
        const raw = Object.keys(localStorage).find((k) =>
          k.startsWith("sb-") && k.endsWith("-auth-token")
        );
        if (raw) {
          const parsed = JSON.parse(localStorage.getItem(raw) || "{}");
          return parsed?.access_token || "";
        }
      } catch {
        /* ignore */
      }
    }
    return "";
  }

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch all places from /api/places (same source as Places Management)
      const placesRes = await fetch("/api/places", { cache: "no-store" });
      if (!placesRes.ok) {
        throw new Error(t("Failed to load places from directory"));
      }
      const allPlacesData = await placesRes.json();
      const allPlacesList: any[] = Array.isArray(allPlacesData) ? allPlacesData : [];

      if (allPlacesList.length === 0) {
        setPlaces([]);
        setLoading(false);
        return;
      }

      // Build a map of all places by ID
      const placesMap = new Map<string, any>();
      for (const p of allPlacesList) {
        const id = String(p._id || p.id || "").trim();
        if (id) {
          placesMap.set(id, p);
        }
      }

      // 2. Fetch saved homepage configuration
      let savedConfigList: { placeId: string; visible?: boolean; order?: number }[] = [];
      let savedUpdatedAt: string | null = null;

      const token = await getAuthToken();
      if (token) {
        try {
          const configRes = await fetch("/api/admin/homepage-config", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.success && Array.isArray(configData.places)) {
              savedConfigList = configData.places;
              savedUpdatedAt = configData.updatedAt || null;
            }
          }
        } catch {
          // If config fetch fails, we still show all places with default ordering
        }
      }

      // 3. Merge: saved config takes precedence in ordering and visibility
      const merged: HomepagePlaceEntry[] = [];
      const seenIds = new Set<string>();

      // Apply saved order and visibility for places that still exist
      for (const entry of savedConfigList) {
        const id = String(entry.placeId || "").trim();
        const placeData = placesMap.get(id);
        if (placeData && !seenIds.has(id)) {
          seenIds.add(id);
          const firstImage = (placeData.images && placeData.images[0]) || placeData.image || "";
          merged.push({
            placeId: id,
            visible: entry.visible !== false,
            order: merged.length,
            name: placeData.name || "Untitled Place",
            category: placeData.category || "General",
            image: firstImage,
          });
        }
      }

      // Append any places not in saved config yet (newly added places)
      for (const [id, placeData] of placesMap.entries()) {
        if (!seenIds.has(id)) {
          seenIds.add(id);
          const firstImage = (placeData.images && placeData.images[0]) || placeData.image || "";
          merged.push({
            placeId: id,
            visible: true,
            order: merged.length,
            name: placeData.name || "Untitled Place",
            category: placeData.category || "General",
            image: firstImage,
          });
        }
      }

      setPlaces(merged);
      originalRef.current = JSON.stringify(merged.map((p) => ({ id: p.placeId, v: p.visible, o: p.order })));
      setHasChanges(false);
      if (savedUpdatedAt) {
        setLastSavedAt(new Date(savedUpdatedAt).toLocaleString());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load configuration";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // Change detection
  useEffect(() => {
    const current = JSON.stringify(places.map((p) => ({ id: p.placeId, v: p.visible, o: p.order })));
    setHasChanges(current !== originalRef.current);
  }, [places]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Toggle single place visibility
  function toggleVisibility(index: number) {
    setPlaces((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], visible: !updated[index].visible };
      return updated;
    });
  }

  // Bulk visibility controls
  function setAllVisibility(visible: boolean) {
    setPlaces((prev) => prev.map((p) => ({ ...p, visible })));
  }

  // Move up/down
  function moveItem(fromIndex: number, direction: "up" | "down") {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= places.length) return;
    setPlaces((prev) => {
      const updated = [...prev];
      [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
      return updated.map((p, idx) => ({ ...p, order: idx }));
    });
  }

  // Drag handlers
  function handleDragStart(index: number) {
    dragItemRef.current = index;
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragEnd() {
    if (dragItemRef.current !== null && dragOverIndex !== null && dragItemRef.current !== dragOverIndex) {
      setPlaces((prev) => {
        const updated = [...prev];
        const [draggedItem] = updated.splice(dragItemRef.current!, 1);
        updated.splice(dragOverIndex!, 0, draggedItem);
        return updated.map((p, idx) => ({ ...p, order: idx }));
      });
    }
    dragItemRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  }

  // Save configuration
  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const token = await getAuthToken();
      if (!token) {
        setError(t("Authentication required. Please log in as admin."));
        return;
      }
      const payload = places.map((p, idx) => ({
        placeId: p.placeId,
        visible: p.visible,
        order: idx,
      }));

      const res = await fetch("/api/admin/homepage-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ places: payload }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save configuration");
      }

      const data = await res.json();
      setSuccessMsg(data.message || "Homepage configuration saved successfully!");
      originalRef.current = JSON.stringify(places.map((p) => ({ id: p.placeId, v: p.visible, o: p.order })));
      setHasChanges(false);
      if (data.updatedAt) {
        setLastSavedAt(new Date(data.updatedAt).toLocaleString());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save configuration";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // Reset changes
  function handleReset() {
    void loadConfig();
  }

  // Filter places by search
  const filteredPlaces = places.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const visibleCount = places.filter((p) => p.visible).length;
  const hiddenCount = places.filter((p) => !p.visible).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#e86f18] mx-auto mb-3" />
          <p className="text-sm text-[#667883] font-medium">{t("Loading homepage display configuration...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e86f18] to-[#f5ad45] text-white shadow-md">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173247] tracking-tight">
              {t("Homepage Display Management")}
            </h1>
            <p className="text-xs sm:text-sm text-[#667883] mt-0.5">
              {t("Control which places appear on the Discover Nashik homepage and their exact display order.")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-amber-200/70 bg-white p-3 shadow-sm">
          <p className="text-xs text-[#667883] font-medium">{t("Total Places")}</p>
          <p className="text-xl font-extrabold text-[#173247]">{places.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-white p-3 shadow-sm">
          <p className="text-xs text-emerald-600 font-medium">{t("Visible on Homepage")}</p>
          <p className="text-xl font-extrabold text-emerald-700">{visibleCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
          <p className="text-xs text-[#667883] font-medium">{t("Hidden from Homepage")}</p>
          <p className="text-xl font-extrabold text-slate-500">{hiddenCount}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667883]" />
          <input
            type="text"
            placeholder={t("Search places by name or category...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-amber-200/70 bg-white py-2.5 pl-10 pr-4 text-sm text-[#173247] placeholder-[#667883]/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e86f18]/30 focus:border-[#e86f18] transition-all"
          />
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllVisibility(true)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
            title={t("Make all places visible")}
          >
            <Check className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("Show All")}</span>
          </button>
          <button
            type="button"
            onClick={() => setAllVisibility(false)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
            title={t("Hide all places")}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("Hide All")}</span>
          </button>
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#667883] shadow-sm transition-all hover:bg-slate-50 hover:text-[#173247] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("Reset")}
        </button>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? t("Saving...") : t("Save Changes")}
        </button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          {error}
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm">
          <Info className="h-5 w-5 flex-shrink-0 text-amber-600" />
          {t("You have unsaved changes. Click \"Save Changes\" to update the homepage.")}
        </div>
      )}

      {/* Instructions Info Card */}
      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-[#173247]/80">
        <p className="font-bold text-[#173247] mb-1">
          {t("Homepage Display Rules:")}
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-[#667883]">
          <li><strong>{t("Visibility Switch (ON/OFF):")}</strong> {t("ON displays the place on the homepage. OFF hides it from the homepage places list.")}</li>
          <li><strong>{t("Database Safe:")}</strong> {t("Hiding a place does NOT delete it. Hidden places remain fully active on search, category filters, and maps.")}</li>
          <li><strong>{t("Display Order:")}</strong> {t("Drag items or use the Move Up / Move Down buttons to set the order places appear on the homepage.")}</li>
        </ul>
      </div>

      {/* Places List */}
      {places.length === 0 ? (
        <div className="rounded-2xl border border-amber-200/60 bg-white p-12 text-center shadow-sm">
          <LayoutDashboard className="h-12 w-12 text-[#667883]/40 mx-auto mb-3" />
          <p className="text-lg font-semibold text-[#173247] mb-1">{t("No places found")}</p>
          <p className="text-sm text-[#667883]">{t("Add places through Places Management first.")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200/70 bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[44px_1fr_140px_110px_80px] gap-2 px-4 py-3 bg-gradient-to-r from-[#173247] to-[#1c3a52] text-white text-xs font-bold uppercase tracking-wider">
            <span className="text-center">#</span>
            <span>{t("Place")}</span>
            <span className="text-center">{t("Category")}</span>
            <span className="text-center">{t("Homepage Status")}</span>
            <span className="text-center">{t("Order")}</span>
          </div>

          {/* Place Rows */}
          <div className="divide-y divide-amber-100/60">
            {(searchQuery.trim() ? filteredPlaces : places).map((place, displayIndex) => {
              const actualIndex = searchQuery.trim()
                ? places.findIndex((p) => p.placeId === place.placeId)
                : displayIndex;
              const isSearching = searchQuery.trim().length > 0;
              const isDragging = dragIndex === actualIndex;
              const isDragOver = dragOverIndex === actualIndex;

              return (
                <div
                  key={place.placeId}
                  draggable={!isSearching}
                  onDragStart={() => handleDragStart(actualIndex)}
                  onDragOver={(e) => handleDragOver(e, actualIndex)}
                  onDragEnd={handleDragEnd}
                  className={`group grid grid-cols-1 sm:grid-cols-[44px_1fr_140px_110px_80px] gap-2 sm:gap-2 px-3 sm:px-4 py-3 items-center transition-all duration-200 ${
                    isDragging
                      ? "opacity-50 bg-amber-50 scale-[0.98]"
                      : isDragOver
                      ? "bg-[#e86f18]/5 border-t-2 border-[#e86f18]"
                      : place.visible
                      ? "bg-white hover:bg-amber-50/50"
                      : "bg-slate-50/80 hover:bg-slate-100/60"
                  } ${!isSearching ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  {/* Position Number */}
                  <div className="hidden sm:flex items-center justify-center">
                    <div className="flex items-center gap-1">
                      {!isSearching && (
                        <GripVertical className="h-4 w-4 text-[#667883]/40 group-hover:text-[#e86f18]/60 transition-colors" />
                      )}
                      <span className={`text-xs font-bold ${place.visible ? "text-[#e86f18]" : "text-slate-400"}`}>
                        {actualIndex + 1}
                      </span>
                    </div>
                  </div>

                  {/* Place Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile position badge */}
                    <div className="flex sm:hidden items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-[#e86f18]/10 to-[#f5ad45]/10 text-xs font-bold text-[#e86f18] flex-shrink-0">
                      {actualIndex + 1}
                    </div>
                    <div
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-cover bg-center border border-amber-200/60 shadow-sm flex-shrink-0"
                      style={{
                        backgroundImage: `url(${normalizeImageUrl(place.image, DEFAULT_FALLBACK_IMAGE)})`,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${place.visible ? "text-[#173247]" : "text-slate-400 line-through"}`}>
                        {place.name}
                      </p>
                      <p className="text-xs text-[#667883] sm:hidden">{place.category}</p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="hidden sm:flex items-center justify-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      place.visible
                        ? "bg-amber-100/80 text-amber-800"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {place.category}
                    </span>
                  </div>

                  {/* Visibility Toggle Button */}
                  <div className="flex items-center justify-center gap-2 sm:gap-0">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(actualIndex)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm ${
                        place.visible
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-300"
                      }`}
                      title={place.visible ? t("Click to hide from homepage") : t("Click to show on homepage")}
                    >
                      {place.visible ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{t("VISIBLE")}</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                          <span>{t("HIDDEN")}</span>
                        </>
                      )}
                    </button>

                    {/* Mobile reorder buttons */}
                    <div className="flex sm:hidden items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => moveItem(actualIndex, "up")}
                        disabled={actualIndex === 0 || isSearching}
                        className="rounded-lg p-1.5 border border-slate-200 text-[#667883] hover:bg-amber-50 hover:text-[#e86f18] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title={t("Move up")}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(actualIndex, "down")}
                        disabled={actualIndex === places.length - 1 || isSearching}
                        className="rounded-lg p-1.5 border border-slate-200 text-[#667883] hover:bg-amber-50 hover:text-[#e86f18] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title={t("Move down")}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Order Controls */}
                  <div className="hidden sm:flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(actualIndex, "up")}
                      disabled={actualIndex === 0 || isSearching}
                      className="rounded-lg p-1 border border-slate-200 text-[#667883] hover:bg-amber-50 hover:text-[#e86f18] hover:border-[#e86f18]/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                      title={t("Move up")}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(actualIndex, "down")}
                      disabled={actualIndex === places.length - 1 || isSearching}
                      className="rounded-lg p-1 border border-slate-200 text-[#667883] hover:bg-amber-50 hover:text-[#e86f18] hover:border-[#e86f18]/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                      title={t("Move down")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search empty state */}
          {searchQuery.trim() && filteredPlaces.length === 0 && (
            <div className="px-4 py-10 text-center">
              <Search className="h-8 w-8 text-[#667883]/30 mx-auto mb-2" />
              <p className="text-sm text-[#667883]">{t("No places match your search.")}</p>
            </div>
          )}
        </div>
      )}

      {/* Last Saved Info */}
      {lastSavedAt && (
        <p className="mt-4 text-xs text-[#667883] text-center">
          {t("Last saved:")} {lastSavedAt}
        </p>
      )}
    </div>
  );
}
