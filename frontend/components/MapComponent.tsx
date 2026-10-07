"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import {
  MapPin,
  Search,
  Navigation,
  Sparkles,
  X,
  Star,
  Phone,
  CheckCircle,
  ExternalLink,
  Clock,
  List,
  Layers,
  HeartPulse,
  Bed,
  Utensils,
  Landmark,
  Bus,
  Compass,
  AlertCircle,
  Maximize2,
  ChevronRight,
  Info
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Place, PlaceCard } from "@/components/PlaceCard";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { calculateHaversineDistance, formatDistance } from "@/lib/distance";
import { getPlaceCoordinates, LatLng } from "@/lib/nashikCoordinates";
import { resolveCategory } from "@/lib/categories";

interface MapComponentProps {
  places: Place[];
  initialCategory?: string;
}

interface MapPlaceItem extends Place {
  lat: number;
  lng: number;
  distanceKm?: number;
  isKumbhLocation?: boolean;
}

type LeafletMapLib = {
  MapContainer: any;
  TileLayer: any;
  Marker: any;
  Popup: any;
  useMap: any;
  L: any;
};

// Map Categories for filter bar
const MAP_CATEGORIES = [
  { id: "All", labelKey: "All Places", icon: Layers, color: "#e86f18" },
  { id: "Kumbh 2027", labelKey: "Kumbh 2027", icon: Sparkles, color: "#d97706" },
  { id: "Temples", labelKey: "Temples & Spiritual", icon: Landmark, color: "#c9580f" },
  { id: "Emergency", labelKey: "Hospitals & Help", icon: HeartPulse, color: "#dc2626" },
  { id: "Hotels", labelKey: "Hotels & Stays", icon: Bed, color: "#2563eb" },
  { id: "Food", labelKey: "Food & Dining", icon: Utensils, color: "#e11d48" },
  { id: "Transport", labelKey: "Transport & Parking", icon: Bus, color: "#0d9488" },
  { id: "Tourist", labelKey: "Tourist Spots", icon: MapPin, color: "#059669" },
];

const NASHIK_CENTER: [number, number] = [20.005, 73.785];

export default function MapComponent({ places: initialPlaces, initialCategory = "All" }: MapComponentProps) {
  const { t } = useTranslation();
  const [mapLib, setMapLib] = useState<LeafletMapLib | null>(null);
  const [kumbhLocations, setKumbhLocations] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceItem | null>(null);
  const [detailModalPlace, setDetailModalPlace] = useState<Place | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Geolocation state
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Map center control state
  const [mapCenter, setMapCenter] = useState<[number, number]>(NASHIK_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Dynamically load Leaflet client-side
  useEffect(() => {
    let active = true;

    async function loadMapLib() {
      try {
        const L = await import("leaflet");
        const ReactLeaflet = await import("react-leaflet");

        if (!active) return;

        setMapLib({
          MapContainer: ReactLeaflet.MapContainer,
          TileLayer: ReactLeaflet.TileLayer,
          Marker: ReactLeaflet.Marker,
          Popup: ReactLeaflet.Popup,
          useMap: ReactLeaflet.useMap,
          L: L.default || L,
        });
      } catch (err) {
        console.error("Failed to initialize Leaflet map:", err);
      }
    }

    void loadMapLib();
    return () => {
      active = false;
    };
  }, []);

  // Fetch Kumbh Locations to enrich map options
  useEffect(() => {
    let active = true;
    async function fetchKumbhLocations() {
      try {
        const res = await fetch("/api/kumbh/locations");
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data)) return;

        const mappedKumbhPlaces: Place[] = data.map((loc: any) => ({
          _id: `kumbh-${loc._id || loc.id}`,
          name: loc.name,
          category: "Kumbh 2027",
          subcategory: loc.category || "Kumbh Location",
          location: loc.address || "Nashik Kumbh Area",
          description: loc.kumbhImportance
            ? `${loc.kumbhImportance} ${loc.description || ""}`
            : loc.description || "Verified Kumbh Mela 2027 location.",
          image: loc.image || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
          verified: true,
          latitude: typeof loc.latitude === "number" ? loc.latitude : undefined,
          longitude: typeof loc.longitude === "number" ? loc.longitude : undefined,
          tagline: loc.category ? `Kumbh Category: ${loc.category}` : undefined,
          famousThing: loc.instructions ? `Instructions: ${loc.instructions}` : undefined,
          facilities: loc.nearbyFacilities,
        }));

        setKumbhLocations(mappedKumbhPlaces);
      } catch {
        // Fallback silently if Kumbh API endpoint not configured
      }
    }

    void fetchKumbhLocations();
    return () => {
      active = false;
    };
  }, []);

  // Consolidate all places with valid coordinates
  const allMapPlaces = useMemo<MapPlaceItem[]>(() => {
    const combined = [...initialPlaces, ...kumbhLocations];
    const uniqueMap = new Map<string, MapPlaceItem>();

    combined.forEach((item) => {
      if (!item || !item._id || uniqueMap.has(item._id)) return;

      const coords = getPlaceCoordinates(item);
      if (!coords) return; // Exclude locations without valid coordinates per guidelines

      let distKm: number | undefined = undefined;
      if (userLocation) {
        distKm = calculateHaversineDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
      }

      uniqueMap.set(item._id, {
        ...item,
        lat: coords.lat,
        lng: coords.lng,
        distanceKm: distKm,
        isKumbhLocation: item.category === "Kumbh 2027" || item.subcategory?.toLowerCase().includes("kumbh"),
      });
    });

    return Array.from(uniqueMap.values());
  }, [initialPlaces, kumbhLocations, userLocation]);

  // Filter places based on search query & category selection
  const filteredMapPlaces = useMemo(() => {
    return allMapPlaces.filter((item) => {
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesLoc = (item.location || "").toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        const matchesCat = (item.category || "").toLowerCase().includes(q);
        const matchesSub = (item.subcategory || "").toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc && !matchesCat && !matchesSub) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Kumbh 2027") {
        return item.isKumbhLocation || (item.category || "").toLowerCase().includes("kumbh");
      }
      if (selectedCategory === "Emergency") {
        const catLower = (item.category || "").toLowerCase();
        const subLower = (item.subcategory || "").toLowerCase();
        return (
          catLower.includes("emergency") ||
          catLower.includes("hospital") ||
          catLower.includes("healthcare") ||
          subLower.includes("hospital") ||
          subLower.includes("medical")
        );
      }
      if (selectedCategory === "Temples") {
        const catLower = (item.category || "").toLowerCase();
        return catLower.includes("temple") || catLower.includes("spiritual") || catLower.includes("ghat");
      }
      if (selectedCategory === "Hotels") {
        const catLower = (item.category || "").toLowerCase();
        return catLower.includes("hotel") || catLower.includes("stay") || catLower.includes("resort");
      }
      if (selectedCategory === "Food") {
        const catLower = (item.category || "").toLowerCase();
        return catLower.includes("food") || catLower.includes("restaurant") || catLower.includes("cafe") || catLower.includes("dining");
      }
      if (selectedCategory === "Transport") {
        const catLower = (item.category || "").toLowerCase();
        const subLower = (item.subcategory || "").toLowerCase();
        return (
          catLower.includes("transport") ||
          catLower.includes("service") ||
          catLower.includes("parking") ||
          subLower.includes("bus") ||
          subLower.includes("station") ||
          subLower.includes("railway")
        );
      }
      if (selectedCategory === "Tourist") {
        const catLower = (item.category || "").toLowerCase();
        return catLower.includes("tourist") || catLower.includes("nature") || catLower.includes("winer") || catLower.includes("trek");
      }

      // Category resolver fallback
      const catDef = resolveCategory(selectedCategory);
      if (catDef) {
        const targetCat = (item.category || "").toLowerCase();
        return (
          catDef.placeCategories.some((c) => c.toLowerCase() === targetCat) ||
          catDef.aliases.some((a) => a.toLowerCase() === targetCat)
        );
      }

      return (item.category || "").toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [allMapPlaces, searchQuery, selectedCategory]);

  // Request browser current location (user-initiated ONLY)
  const handleRequestLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError(t("Geolocation is not supported by your browser."));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const userLatLng = { lat, lng };

        setUserLocation(userLatLng);
        setMapCenter([lat, lng]);
        setMapZoom(14);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(t("Location access was denied. You can still explore Nashik on the map manually."));
        } else {
          setLocationError(t("Could not retrieve current location. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Helper to create category-specific colored SVG Leaflet DivIcon
  const createCategoryIcon = (category: string, isSelected: boolean, isKumbh?: boolean) => {
    if (!mapLib?.L) return undefined;

    let bgColor = "#e86f18"; // default orange
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    const catLower = (category || "").toLowerCase();
    if (isKumbh || catLower.includes("kumbh")) {
      bgColor = "#d97706"; // Amber Gold
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`;
    } else if (catLower.includes("temple") || catLower.includes("spiritual") || catLower.includes("ghat")) {
      bgColor = "#c9580f"; // Saffron
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M4 10h16M6 10v10h12V10M10 14h4v6h-4z"/></svg>`;
    } else if (catLower.includes("emergency") || catLower.includes("hospital") || catLower.includes("healthcare")) {
      bgColor = "#dc2626"; // Red
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
    } else if (catLower.includes("hotel") || catLower.includes("stay")) {
      bgColor = "#2563eb"; // Blue
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>`;
    } else if (catLower.includes("food") || catLower.includes("restaurant") || catLower.includes("dining")) {
      bgColor = "#e11d48"; // Rose
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/></svg>`;
    } else if (catLower.includes("transport") || catLower.includes("parking") || catLower.includes("service")) {
      bgColor = "#0d9488"; // Teal
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6M15 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/></svg>`;
    } else if (catLower.includes("tourist") || catLower.includes("nature") || catLower.includes("winer")) {
      bgColor = "#059669"; // Emerald Green
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
    }

    const scale = isSelected ? "scale-125 z-50 ring-4 ring-orange-400/80" : "hover:scale-110";
    const border = isSelected ? "border-2 border-white shadow-2xl" : "border border-white/90 shadow-md";

    const html = `
      <div className="relative group cursor-pointer transition-transform duration-200">
        <div style="background-color: ${bgColor};" className="flex items-center justify-center h-9 w-9 rounded-full text-white ${border} ${scale}">
          ${iconSvg}
        </div>
      </div>
    `;

    return mapLib.L.divIcon({
      html,
      className: "custom-leaflet-marker",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  // Helper to create User Location Marker
  const createUserLocationIcon = () => {
    if (!mapLib?.L) return undefined;
    const html = `
      <div className="relative flex items-center justify-center">
        <div className="absolute h-8 w-8 rounded-full bg-blue-500/30 animate-ping"></div>
        <div className="h-6 w-6 rounded-full border-2 border-white bg-blue-600 shadow-lg flex items-center justify-center text-white">
          <div className="h-2 w-2 rounded-full bg-white"></div>
        </div>
      </div>
    `;
    return mapLib.L.divIcon({
      html,
      className: "user-location-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Map Controller sub-component to programmatically view coordinates
  function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    if (!mapLib) return null;
    const map = mapLib.useMap();
    useEffect(() => {
      map.flyTo(center, zoom, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
  }

  const handleMarkerClick = (place: MapPlaceItem) => {
    setSelectedPlace(place);
    setMapCenter([place.lat, place.lng]);
    setMapZoom(15);
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#f8f2e8] overflow-hidden">
      {/* Top Search & Filter Bar Overlay */}
      <div className="relative z-20 p-3 sm:p-4 bg-gradient-to-b from-[#fffdf8] via-[#fffdf8]/95 to-transparent border-b border-[#e1cfb0]/60 shadow-sm backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667883]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search places, temples, hospitals, Kumbh locations...")}
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-full border border-[#e1cfb0] bg-white text-xs sm:text-sm text-[#173247] placeholder-[#667883] shadow-sm outline-none transition-all focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#667883] hover:text-[#173247]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Near Me & View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={locating}
              className="flex items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3.5 py-2 text-xs font-bold text-[#c9580f] shadow-sm transition-all hover:bg-[#ffedd5] active:scale-95 disabled:opacity-60"
            >
              <Navigation className={`h-3.5 w-3.5 text-[#e86f18] ${locating ? "animate-spin" : ""}`} />
              <span>{locating ? t("Locating...") : t("Near Me")}</span>
            </button>

            <div className="flex items-center rounded-full border border-[#e1cfb0] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === "map" ? "bg-[#e86f18] text-white shadow-sm" : "text-[#667883] hover:text-[#173247]"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("Map View")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === "list" ? "bg-[#e86f18] text-white shadow-sm" : "text-[#667883] hover:text-[#173247]"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("List View")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="max-w-6xl mx-auto mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {MAP_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id === "Kumbh 2027") {
                    // Smooth pan to Ram Kund / Kumbh hub
                    setMapCenter([20.0063, 73.7915]);
                    setMapZoom(13);
                  }
                }}
                className={`flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  isSelected
                    ? "border-[#c9580f] bg-[#c9580f] text-white shadow-md scale-[1.02]"
                    : "border-[#e1cfb0] bg-white text-[#173247] hover:bg-[#fff7ed] hover:border-[#e7b06d]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : ""}`} style={{ color: isSelected ? "#fff" : cat.color }} />
                <span>{t(cat.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* Location Status Message Alert */}
        {locationError && (
          <div className="max-w-6xl mx-auto mt-2 flex items-center justify-between gap-2 rounded-xl bg-orange-100 border border-orange-300 px-3.5 py-2 text-xs font-medium text-orange-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button type="button" onClick={() => setLocationError(null)} className="p-1 text-orange-700 hover:text-orange-900">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area (Map or List) */}
      <div className="relative flex-1 w-full h-full z-0 overflow-hidden">
        {viewMode === "list" ? (
          /* List View Mode */
          <div className="h-full w-full overflow-y-auto p-4 sm:p-6 bg-[#f8f2e8]">
            <div className="max-w-6xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-[#667883]">
                  {t("Showing")} <span className="text-[#c9580f]">{filteredMapPlaces.length}</span> {t("places on map")}
                </p>
              </div>

              {filteredMapPlaces.length === 0 ? (
                <div className="py-16 text-center rounded-2xl bg-white/70 border border-[#e1cfb0] p-8">
                  <MapPin className="h-10 w-10 text-orange-400 mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#173247]">{t("No places found in this category")}</h3>
                  <p className="mt-1 text-xs text-[#667883]">{t("Try clearing your search or picking another category.")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchQuery("");
                    }}
                    className="mt-4 rounded-full bg-[#c9580f] px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-[#173247]"
                  >
                    {t("Reset Filters")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredMapPlaces.map((place) => (
                    <PlaceCard key={place._id} place={place} onExplore={setDetailModalPlace} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Interactive Map View Mode */
          <div className="relative h-full w-full">
            {!mapLib ? (
              <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-500">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 border-4 border-[#e86f18] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-semibold text-[#173247]">{t("Loading Interactive Nashik Map...")}</p>
                </div>
              </div>
            ) : (
              <mapLib.MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
              >
                <MapController center={mapCenter} zoom={mapZoom} />

                <mapLib.TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Current Location Marker */}
                {userLocation && (
                  <mapLib.Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={createUserLocationIcon()}
                  >
                    <mapLib.Popup>
                      <div className="p-1 text-center font-bold text-xs text-[#173247]">
                        📍 {t("Your Current Location")}
                      </div>
                    </mapLib.Popup>
                  </mapLib.Marker>
                )}

                {/* Render Filtered Location Markers */}
                {filteredMapPlaces.map((place) => {
                  const isSelected = selectedPlace?._id === place._id;
                  const icon = createCategoryIcon(place.category, isSelected, place.isKumbhLocation);

                  return (
                    <mapLib.Marker
                      key={place._id}
                      position={[place.lat, place.lng]}
                      icon={icon}
                      eventHandlers={{
                        click: () => handleMarkerClick(place),
                      }}
                    >
                      <mapLib.Popup className="custom-map-popup">
                        <div className="w-56 p-1">
                          <div className="relative mb-2 h-28 w-full overflow-hidden rounded-xl bg-slate-100">
                            <img
                              src={place.image || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80"}
                              alt={place.name}
                              className="h-full w-full object-cover"
                            />
                            {place.isKumbhLocation && (
                              <span className="absolute top-2 left-2 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                ✨ {t("Kumbh 2027")}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-[#173247] line-clamp-1">{place.name}</h4>
                          <p className="text-[11px] text-[#667883] line-clamp-1 mt-0.5">{place.location}</p>

                          <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span className="flex items-center font-bold text-amber-600">
                              <Star className="mr-1 h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              {place.rating || 4.8}
                            </span>
                            {place.distanceKm !== undefined && (
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                                {formatDistance(place.distanceKm)} {t("away")}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-1.5">
                            <a
                              href={
                                place.mapLink ||
                                `https://www.google.com/maps/dir/?api=1${
                                  userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ""
                                }&destination=${place.lat},${place.lng}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 rounded-lg bg-[#fff7ed] border border-[#e7b06d] px-2 py-1.5 text-center text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5]"
                            >
                              {t("Directions")}
                            </a>
                            <button
                              type="button"
                              onClick={() => setDetailModalPlace(place)}
                              className="flex-1 rounded-lg bg-[#c9580f] px-2 py-1.5 text-center text-xs font-bold text-white hover:bg-[#173247]"
                            >
                              {t("View Details")}
                            </button>
                          </div>
                        </div>
                      </mapLib.Popup>
                    </mapLib.Marker>
                  );
                })}
              </mapLib.MapContainer>
            )}

            {/* Bottom Floating Place Info Drawer (Mobile & Desktop Overlay on Marker Click) */}
            {selectedPlace && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-40 rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-4 shadow-[0_16px_48px_rgba(77,58,30,0.22)] animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#f1d9b6]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-[#c9580f] border border-[#e7b06d]">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9580f] block truncate">
                        {selectedPlace.category}
                      </span>
                      <h3 className="text-sm font-black text-[#173247] truncate">{selectedPlace.name}</h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlace(null)}
                    className="p-1 rounded-full text-[#667883] hover:bg-[#fff7ed] hover:text-[#173247]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs border-b border-[#f1d9b6]/60">
                  <div className="flex items-center gap-1.5 text-[#667883] truncate">
                    <MapPin className="h-3.5 w-3.5 text-[#c9580f] shrink-0" />
                    <span className="truncate">{selectedPlace.location}</span>
                  </div>
                  {selectedPlace.distanceKm !== undefined && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      {formatDistance(selectedPlace.distanceKm)} {t("away")}
                    </span>
                  )}
                </div>

                {selectedPlace.famousThing && (
                  <p className="mt-2 text-[11px] font-semibold text-[#a45317] bg-[#fff7ed] px-2.5 py-1 rounded-lg border border-[#e7b06d]/60">
                    ℹ️ {selectedPlace.famousThing}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={
                      selectedPlace.mapLink ||
                      `https://www.google.com/maps/dir/?api=1${
                        userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ""
                      }&destination=${selectedPlace.lat},${selectedPlace.lng}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5] transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{t("Directions")}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDetailModalPlace(selectedPlace)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-3 py-2 text-xs font-bold text-white shadow hover:opacity-95 transition-opacity"
                  >
                    <span>{t("View Details")}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Place Details Modal Preview */}
      {detailModalPlace && (
        <PlaceDetailModal place={detailModalPlace} onClose={() => setDetailModalPlace(null)} />
      )}
    </div>
  );
}
