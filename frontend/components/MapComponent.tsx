"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import {
  MapPin,
  Search,
  Navigation,
  Sparkles,
  X,
  Star,
  CheckCircle,
  List,
  Layers,
  HeartPulse,
  Bed,
  Utensils,
  Landmark,
  Bus,
  Compass,
  AlertCircle,
  ChevronRight,
  Heart,
  Share2,
  Mic,
  MicOff,
  Volume2,
  Car,
  Footprints,
  RotateCcw,
  Flag
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Place, PlaceCard } from "@/components/PlaceCard";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { calculateHaversineDistance, formatDistance } from "@/lib/distance";
import { getPlaceCoordinates, LatLng } from "@/lib/nashikCoordinates";
import { resolveCategory } from "@/lib/categories";

export interface GroupMemberPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  role?: string;
  lastUpdated?: string;
}

interface MapComponentProps {
  places: Place[];
  initialCategory?: string;
  groupMembers?: GroupMemberPin[]; // Future-compatibility hook for Group Tracker
}

interface MapPlaceItem extends Place {
  lat: number;
  lng: number;
  distanceKm?: number;
  isKumbhLocation?: boolean;
}

type LeafletMapLib = {
  MapContainer: typeof import("react-leaflet").MapContainer;
  TileLayer: typeof import("react-leaflet").TileLayer;
  Marker: typeof import("react-leaflet").Marker;
  Popup: typeof import("react-leaflet").Popup;
  Polyline: typeof import("react-leaflet").Polyline;
  L: typeof import("leaflet");
};

// Speech Recognition Type Definitions
type SpeechRecognitionEventLike = Event & {
  results: SpeechRecognitionResultList;
};
type SpeechRecognitionErrorEventLike = Event & { error: string };
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
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
  { id: "Saved", labelKey: "Saved Places", icon: Heart, color: "#e11d48" },
];

const NASHIK_CENTER: [number, number] = [20.005, 73.785];
const LOCAL_STORAGE_SAVED_KEY = "discover_nashik_saved_places";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSavedPlaceIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch (error) {
    console.warn("Could not load saved places from local storage:", error);
    return [];
  }
}

function getVoiceFallbackReply(destination: string, language: string): string {
  if (language === "hi") return `${destination} का मार्ग मानचित्र पर दिखाया जा रहा है।`;
  if (language === "mr") return `${destination} चा मार्ग नकाशावर दाखवत आहे.`;
  return `Showing the route to ${destination} on your map.`;
}

function MapController({ center, zoom, bounds }: { center: [number, number]; zoom: number; bounds?: [number, number][] | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, bounds, map]);

  return null;
}

export default function MapComponent({ places: initialPlaces, initialCategory = "All", groupMembers = [] }: MapComponentProps) {
  const { t, language } = useTranslation();
  const [mapLib, setMapLib] = useState<LeafletMapLib | null>(null);
  const [kumbhLocations, setKumbhLocations] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceItem | null>(null);
  const [detailModalPlace, setDetailModalPlace] = useState<Place | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Destination & Route Planner State
  const [selectedDestination, setSelectedDestination] = useState<MapPlaceItem | null>(null);
  const [routeTravelMode, setRouteTravelMode] = useState<"driving" | "walking">("driving");
  const [activeRoutePolyline, setActiveRoutePolyline] = useState<[number, number][] | null>(null);
  const [routeBounds, setRouteBounds] = useState<[number, number][] | null>(null);
  const [routeSteps, setRouteSteps] = useState<{ instruction: string; distance: number; duration: number }[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [osrmDistance, setOsrmDistance] = useState<number | null>(null);
  const [osrmDuration, setOsrmDuration] = useState<number | null>(null);

  // Geolocation state
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Saved / Favorite Places state
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>(readSavedPlaceIds);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Map Voice Guide State
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [spokenMessage, setSpokenMessage] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recognitionRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRequestRef = useRef<AbortController | null>(null);
  const voiceRequestIdRef = useRef(0);
  const speechIdRef = useRef(0);

  useEffect(() => () => {
    if (recognitionRetryTimeoutRef.current) clearTimeout(recognitionRetryTimeoutRef.current);
    recognitionRef.current?.abort();
    voiceRequestRef.current?.abort();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Map center control state
  const [mapCenter, setMapCenter] = useState<[number, number]>(NASHIK_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Sync Saved Places to localStorage
  const toggleSavePlace = (placeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setSavedPlaceIds((prev) => {
      const isSaved = prev.includes(placeId);
      const updated = isSaved ? prev.filter((id) => id !== placeId) : [...prev, placeId];
      try {
        localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
      } catch {
        // Fallback silently
      }

      showToast(isSaved ? t("Removed from Saved Places") : t("Saved to your Favorites! ♥"));
      return updated;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Share Place Handler
  const handleSharePlace = async (place: Place, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/place/${place._id}` : "";
    const shareData = {
      title: place.name,
      text: `${place.name} - ${place.location}. Discover Nashik!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t("Place link copied to clipboard!"));
    } catch {
      showToast(t("Share URL: ") + shareUrl);
    }
  };

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
          Polyline: ReactLeaflet.Polyline,
          L,
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
        const data: unknown = await res.json();
        if (!active || !Array.isArray(data)) return;

        const mappedKumbhPlaces: Place[] = data.flatMap((value): Place[] => {
          if (!isRecord(value)) return [];
          const id = typeof value._id === "string" || typeof value._id === "number"
            ? value._id
            : typeof value.id === "string" || typeof value.id === "number"
              ? value.id
              : null;
          if (id === null || typeof value.name !== "string" || !value.name.trim()) return [];

          const category = typeof value.category === "string" ? value.category : "Kumbh Location";
          const importance = typeof value.kumbhImportance === "string" ? value.kumbhImportance : "";
          const description = typeof value.description === "string" ? value.description : "";
          const facilities = typeof value.nearbyFacilities === "string"
            ? value.nearbyFacilities
            : Array.isArray(value.nearbyFacilities)
              ? value.nearbyFacilities.filter((facility): facility is string => typeof facility === "string")
              : undefined;

          return [{
            _id: `kumbh-${id}`,
            name: value.name,
            category: "Kumbh 2027",
            subcategory: category,
            location: typeof value.address === "string" ? value.address : "Nashik Kumbh Area",
            description: importance ? `${importance} ${description}` : description || "Verified Kumbh Mela 2027 location.",
            image: typeof value.image === "string" ? value.image : "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
            rating: 4.9,
            verified: true,
            latitude: typeof value.latitude === "number" ? value.latitude : undefined,
            longitude: typeof value.longitude === "number" ? value.longitude : undefined,
            tagline: `Kumbh Category: ${category}`,
            famousThing: typeof value.instructions === "string" ? `Instructions: ${value.instructions}` : undefined,
            facilities,
          }];
        });

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
      if (!coords) return; // Exclude locations without valid coordinates

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

  // Filter and sort places based on Category, Search & Distance
  const filteredMapPlaces = useMemo(() => {
    let result = allMapPlaces.filter((item) => {
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
      if (selectedCategory === "Saved") {
        return savedPlaceIds.includes(item._id);
      }

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

    // Nearest Result Prioritization: If user location is active, sort by distance ascending!
    if (userLocation) {
      result = [...result].sort((a, b) => {
        const distA = a.distanceKm ?? Infinity;
        const distB = b.distanceKm ?? Infinity;
        return distA - distB;
      });
    }

    return result;
  }, [allMapPlaces, searchQuery, selectedCategory, savedPlaceIds, userLocation]);

  // Handle Destination Route Calculation via OSRM (real road routing)
  const handleSelectRouteDestination = async (dest: MapPlaceItem, travelMode = routeTravelMode) => {
    setSelectedDestination(dest);
    setSelectedPlace(dest);
    setRouteLoading(true);
    setRouteSteps([]);
    setOsrmDistance(null);
    setOsrmDuration(null);

    const startLat = userLocation ? userLocation.lat : NASHIK_CENTER[0];
    const startLng = userLocation ? userLocation.lng : NASHIK_CENTER[1];
    const endLat = dest.lat;
    const endLng = dest.lng;

    try {
      // OSRM free routing API — no API key needed
      const profile = travelMode === "walking" ? "foot" : "car";
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(8000) });

      if (res.ok) {
        const data = await res.json();
        const route = data?.routes?.[0];

        if (route?.geometry?.coordinates) {
          // OSRM returns [lng, lat] — convert to [lat, lng] for Leaflet
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          setActiveRoutePolyline(coords);

          // Extract route distance (meters) and duration (seconds)
          setOsrmDistance(route.distance / 1000); // km
          setOsrmDuration(route.duration / 60); // minutes

          // Extract turn-by-turn steps
          const legs = route.legs || [];
          const steps: { instruction: string; distance: number; duration: number }[] = [];
          for (const leg of legs) {
            for (const step of (leg.steps || [])) {
              if (step.maneuver?.type && step.maneuver.type !== "depart" && step.maneuver.type !== "arrive") {
                const dir = step.maneuver.modifier ? ` ${step.maneuver.modifier}` : "";
                const road = step.name ? ` onto ${step.name}` : "";
                steps.push({
                  instruction: `${step.maneuver.type}${dir}${road}`.replace(/^./, (c: string) => c.toUpperCase()),
                  distance: step.distance,
                  duration: step.duration,
                });
              }
            }
          }
          setRouteSteps(steps.slice(0, 8)); // Limit to 8 steps for UI

          // Calculate bounds from coords
          let minLat = coords[0][0], maxLat = coords[0][0];
          let minLng = coords[0][1], maxLng = coords[0][1];
          for (const [lt, lg] of coords) {
            if (lt < minLat) minLat = lt;
            if (lt > maxLat) maxLat = lt;
            if (lg < minLng) minLng = lg;
            if (lg > maxLng) maxLng = lg;
          }
          setRouteBounds([[minLat, minLng], [maxLat, maxLng]]);
          setRouteLoading(false);
          showToast(`${t("Route calculated to")} ${dest.name}`);
          return;
        }
      }
    } catch {
      // Fallback silently to interpolated route
    }

    // Fallback: Generate smooth interpolated route polyline
    const pointsCount = 12;
    const polyline: [number, number][] = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount;
      const bend = Math.sin(t * Math.PI) * 0.003;
      const lat = startLat + (endLat - startLat) * t + bend;
      const lng = startLng + (endLng - startLng) * t - bend;
      polyline.push([lat, lng]);
    }

    setActiveRoutePolyline(polyline);
    setRouteBounds([[startLat, startLng], [endLat, endLng]]);
    setRouteLoading(false);
    showToast(`${t("Route calculated to")} ${dest.name}`);
  };

  const handleClearRoute = () => {
    setSelectedDestination(null);
    setActiveRoutePolyline(null);
    setRouteBounds(null);
    setRouteSteps([]);
    setOsrmDistance(null);
    setOsrmDuration(null);
  };

  // Dedicated Map Voice Guide Speech Recognition & Synthesis Engine
  const handleStartVoiceGuide = () => {
    // If already active, stop and reset
    if (voiceStatus !== "idle") {
      voiceRequestIdRef.current += 1;
      voiceRequestRef.current?.abort();
      voiceRequestRef.current = null;
      if (recognitionRetryTimeoutRef.current) {
        clearTimeout(recognitionRetryTimeoutRef.current);
        recognitionRetryTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      recognitionRef.current = null;
      speechIdRef.current += 1;
      setVoiceStatus("idle");
      setVoiceTranscript("");
      // Cancel any ongoing speech synthesis
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const SpeechConstructor = getSpeechRecognition();
    if (!SpeechConstructor) {
      showToast(t("Voice recognition is not supported in your browser."));
      return;
    }

    // Start speech recognition directly (browser native prompt will trigger if not yet set)
    startVoiceRecognition(SpeechConstructor, false);
  };

  const startVoiceRecognition = (SpeechConstructor: SpeechRecognitionConstructor, isRetry: boolean) => {
    if (recognitionRetryTimeoutRef.current) {
      clearTimeout(recognitionRetryTimeoutRef.current);
      recognitionRetryTimeoutRef.current = null;
    }

    // Cleanup any previous instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechConstructor();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true; // Allow interim results for better responsiveness
      recognition.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";

      recognition.onstart = () => {
        if (recognitionRef.current !== recognition) return;
        setVoiceStatus("listening");
        setVoiceTranscript("");
        setSpokenMessage(null);
      };

      recognition.onresult = (event) => {
        if (recognitionRef.current !== recognition) return;

        // Collect all results, prefer final ones
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result?.[0]?.transcript) {
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
        }

        // Show interim transcript while user is speaking
        const displayTranscript = finalTranscript || interimTranscript;
        if (displayTranscript.trim()) {
          setVoiceTranscript(displayTranscript.trim());
        }

        // Process only when we have a final result
        if (finalTranscript.trim()) {
          setVoiceTranscript(finalTranscript.trim());
          setVoiceStatus("processing");
          // Stop recognition before processing
          try { recognition.stop(); } catch {}
          recognitionRef.current = null;
          processVoiceQuery(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        if (recognitionRef.current !== recognition) return;

        const errorType = event.error;

        // Skip aborted errors (user deliberately stopped)
        if (errorType === "aborted") {
          recognitionRef.current = null;
          return;
        }

        // Handle no-speech: auto-retry once, then give gentle feedback
        if (errorType === "no-speech") {
          recognitionRef.current = null;
          if (!isRetry) {
            // Auto-retry once silently
            setVoiceStatus("idle");
            recognitionRetryTimeoutRef.current = setTimeout(() => {
              recognitionRetryTimeoutRef.current = null;
              startVoiceRecognition(SpeechConstructor, true);
            }, 300);
            return;
          }
          setVoiceStatus("idle");
          showToast(t("No speech detected. Tap the mic and speak clearly."));
          return;
        }

        // Handle permission errors
        if (errorType === "not-allowed" || errorType === "permission-denied" || errorType === "service-not-allowed") {
          recognitionRef.current = null;
          setVoiceStatus("idle");
          showToast(t("Microphone permission denied. Please allow microphone access in your browser settings."));
          return;
        }

        // Handle audio capture errors
        if (errorType === "audio-capture") {
          recognitionRef.current = null;
          setVoiceStatus("idle");
          showToast(t("Microphone is unavailable. Check your device and try again."));
          return;
        }

        // Handle network errors
        if (errorType === "network") {
          recognitionRef.current = null;
          setVoiceStatus("idle");
          showToast(t("Voice recognition unavailable due to network issue. Try again."));
          return;
        }

        // Generic fallback for unknown errors
        recognitionRef.current = null;
        setVoiceStatus("idle");
        showToast(t("Voice recognition encountered an issue. Please try again."));
      };

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        recognitionRef.current = null;
        // Only reset to idle if we're still in listening state (not processing/speaking)
        setVoiceStatus((prev) => (prev === "listening" ? "idle" : prev));
      };

      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      setVoiceStatus("idle");
      showToast(t("Microphone access is required for the Map Voice Guide."));
      console.warn("Voice recognition could not start:", err);
    }
  };

  // Match voice query against places with NLP-aware category matching & generate audio response
  const processVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) {
      setVoiceStatus("idle");
      return;
    }

    const q = queryText.toLowerCase().trim();
    const requestId = ++voiceRequestIdRef.current;
    voiceRequestRef.current?.abort();
    const controller = new AbortController();
    voiceRequestRef.current = controller;

    // Category-aware keyword mapping for voice commands (EN, HI, MR)
    const categoryKeywords: Record<string, string[]> = {
      emergency: ["hospital", "doctor", "medical", "emergency", "ambulance", "clinic", "health", "अस्पताल", "दवाखाना", "रुग्णालय", "हॉस्पिटल"],
      hotel: ["hotel", "stay", "lodge", "room", "accommodation", "resort", "dharamshala", "होटल", "हॉटेल", "धर्मशाळा"],
      food: ["food", "restaurant", "eat", "dining", "cafe", "misal", "thali", "breakfast", "lunch", "dinner", "खाना", "भोजन", "रेस्टोरेंट", "मिसळ"],
      temple: ["temple", "mandir", "spiritual", "worship", "darshan", "puja", "मंदिर", "दर्शन", "घाट"],
      transport: ["bus", "station", "railway", "train", "parking", "transport", "auto", "taxi", "cab", "बस", "स्टेशन", "पार्किंग"],
      kumbh: ["kumbh", "kumbha", "mela", "ghat", "snaan", "bathing", "कुंभ", "मेळा", "स्नान"],
      tourist: ["tourist", "fort", "trek", "nature", "cave", "scenic", "viewpoint", "waterfall", "पर्यटन", "किल्ला"],
    };

    // 1. Direct name match from allMapPlaces
    let matchedPlace = allMapPlaces.find((p) => {
      const pName = p.name.toLowerCase();
      return pName.includes(q) || q.includes(pName);
    });

    // 2. Keyword-to-place matching with Hindi & Marathi support
    if (!matchedPlace) {
      const knownPlaces: [string[], string][] = [
        [["ram kund", "ramkund", "रामकुंड", "राम कुंड"], "ram kund"],
        [["trimbak", "trimbakeshwar", "त्र्यंबकेश्वर", "त्र्यंबक"], "trimbak"],
        [["kalaram", "kala ram", "काळाराम", "कालाराम"], "kalaram"],
        [["panchavati", "panchwati", "पंचवटी"], "panchavati"],
        [["muktidham", "मुक्तिधाम"], "muktidham"],
        [["pandavleni", "pandav leni", "caves", "पांडवलेणी"], "pandavleni"],
        [["sula", "vineyard", "winery", "सुला"], "sula"],
        [["tapovan", "तपोवन"], "tapovan"],
        [["someshwar", "सोमेश्वर"], "someshwar"],
        [["gangapur", "गंगापूर"], "gangapur"],
        [["anjaneri", "अंजनेरी"], "anjaneri"],
      ];

      for (const [keywords, searchTerm] of knownPlaces) {
        if (keywords.some((kw) => q.includes(kw))) {
          matchedPlace = allMapPlaces.find((p) => p.name.toLowerCase().includes(searchTerm));
          if (matchedPlace) break;
        }
      }
    }

    // 3. Category-based nearest match — "find nearest hospital", "take me to a hotel"
    if (!matchedPlace) {
      for (const [catKey, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((kw) => q.includes(kw))) {
          const catPlaces = allMapPlaces.filter((p) => {
            const cat = (p.category || "").toLowerCase();
            const sub = (p.subcategory || "").toLowerCase();
            return (
              cat.includes(catKey) ||
              sub.includes(catKey) ||
              keywords.some((kw) => cat.includes(kw) || sub.includes(kw))
            );
          });

          if (catPlaces.length > 0) {
            if (userLocation) {
              catPlaces.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
            }
            matchedPlace = catPlaces[0];
          }
          break;
        }
      }
    }

    // 4. Fuzzy partial word match
    if (!matchedPlace) {
      const qWords = q.split(/\s+/).filter((w) => w.length > 2);
      matchedPlace = allMapPlaces.find((p) => {
        const pName = p.name.toLowerCase();
        return qWords.some((w) => pName.includes(w));
      });
    }

    // Ask the server to normalize the request and provide a concise spoken reply.
    try {
      const res = await fetch("/api/map-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, language, userLocation }),
        signal: controller.signal,
      });

      if (requestId !== voiceRequestIdRef.current) return;

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        showToast(t("Map Voice Guide response was unavailable. Using local directions."));
      } else if (
        typeof data === "object" &&
        data !== null &&
        "destinationName" in data &&
        typeof data.destinationName === "string"
      ) {
        const destinationName = data.destinationName.trim().toLowerCase();
        if (!matchedPlace && destinationName) {
          matchedPlace = allMapPlaces.find((place) => {
            const name = place.name.toLowerCase();
            return name.includes(destinationName) || destinationName.includes(name);
          });
        }
      }

      // Fallback: If still no matched place, take the first place from allMapPlaces
      if (!matchedPlace && allMapPlaces.length > 0) {
        matchedPlace = allMapPlaces[0];
      }

      if (matchedPlace) {
        setViewMode("map");
        setSelectedPlace(matchedPlace);
        setMapCenter([matchedPlace.lat, matchedPlace.lng]);
        setMapZoom(14);
        void handleSelectRouteDestination(matchedPlace);
      }

      const spokenResponse =
        typeof data === "object" &&
        data !== null &&
        "spokenResponse" in data &&
        typeof data.spokenResponse === "string" &&
        data.spokenResponse.trim()
          ? data.spokenResponse.trim()
          : getVoiceFallbackReply(matchedPlace?.name || queryText.trim(), language);
      speakVoiceResponse(spokenResponse);
    } catch (error: unknown) {
      if (controller.signal.aborted || requestId !== voiceRequestIdRef.current) return;
      console.error("Map Voice Guide request failed:", error);
      showToast(t("Map Voice Guide response was unavailable. Using local directions."));

      if (!matchedPlace && allMapPlaces.length > 0) {
        matchedPlace = allMapPlaces[0];
      }

      if (matchedPlace) {
        setViewMode("map");
        setSelectedPlace(matchedPlace);
        setMapCenter([matchedPlace.lat, matchedPlace.lng]);
        setMapZoom(14);
        void handleSelectRouteDestination(matchedPlace);
      }
      speakVoiceResponse(getVoiceFallbackReply(matchedPlace?.name || queryText.trim(), language));
    } finally {
      if (voiceRequestRef.current === controller) {
        voiceRequestRef.current = null;
      }
    }
  };

  const speakVoiceResponse = (text: string) => {
    speechIdRef.current += 1;
    const speechId = speechIdRef.current;
    setSpokenMessage(text);
    setVoiceStatus("speaking");

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
      utterance.onend = () => {
        if (speechIdRef.current === speechId) setVoiceStatus("idle");
      };
      utterance.onerror = () => {
        if (speechIdRef.current === speechId) setVoiceStatus("idle");
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setVoiceStatus("idle");
    }
  };

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

  // Helper to create Group Member Pin Icon for future Group Tracker compatibility
  const createGroupMemberIcon = (member: GroupMemberPin) => {
    if (!mapLib?.L) return undefined;
    const html = `
      <div className="relative flex items-center justify-center group cursor-pointer">
        <div className="h-9 w-9 rounded-full border-2 border-emerald-500 bg-[#173247] text-white shadow-xl flex items-center justify-center font-bold text-xs">
          ${member.name.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-5 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
          ${member.name}
        </div>
      </div>
    `;
    return mapLib.L.divIcon({
      html,
      className: "group-member-marker",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const handleMarkerClick = (place: MapPlaceItem) => {
    setSelectedPlace(place);
    setMapCenter([place.lat, place.lng]);
    setMapZoom(15);
  };

  // Route travel calculations — prefer OSRM real data, fallback to Haversine estimate
  const routeDistKm = osrmDistance ?? (selectedDestination
    ? (selectedDestination.distanceKm ?? calculateHaversineDistance(userLocation ? userLocation.lat : NASHIK_CENTER[0], userLocation ? userLocation.lng : NASHIK_CENTER[1], selectedDestination.lat, selectedDestination.lng))
    : 0);

  const drivingMinutes = osrmDuration && routeTravelMode === "driving"
    ? Math.max(1, Math.round(osrmDuration))
    : Math.max(1, Math.round((routeDistKm / 28) * 60));
  const walkingMinutes = osrmDuration && routeTravelMode === "walking"
    ? Math.max(1, Math.round(osrmDuration))
    : Math.max(1, Math.round((routeDistKm / 4.5) * 60));

  return (
    <div className="relative flex flex-col h-full w-full bg-[#f8f2e8] overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#173247] text-white px-4 py-2 text-xs font-bold shadow-2xl animate-in fade-in zoom-in-95 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Spoken Response Banner from Map Voice Guide */}
      {spokenMessage && (
        <div className="absolute top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 rounded-2xl bg-[#173247] text-white p-3.5 shadow-2xl border border-orange-500/40 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-orange-400 animate-pulse shrink-0" />
              <p className="text-xs font-semibold leading-relaxed text-orange-100">{spokenMessage}</p>
            </div>
            <button type="button" onClick={() => setSpokenMessage(null)} className="p-1 text-slate-400 hover:text-white shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

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
              placeholder={t("Search destination, places, temples, hospitals, Kumbh locations...")}
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

          {/* Action Buttons: Near Me & Map/List View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={locating}
              className="flex items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3.5 py-2 text-xs font-bold text-[#c9580f] shadow-sm transition-all hover:bg-[#ffedd5] active:scale-95 disabled:opacity-60"
            >
              <Navigation className={`h-3.5 w-3.5 text-[#e86f18] ${locating ? "animate-spin" : ""}`} />
              <span>{locating ? t("Locating...") : userLocation ? t("Near Me (Active)") : t("Near Me")}</span>
            </button>

            {/* Map / List View Toggle */}
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
                <span>
                  {t(cat.labelKey)}
                  {cat.id === "Saved" && savedPlaceIds.length > 0 ? ` (${savedPlaceIds.length})` : ""}
                </span>
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
                  {t("Showing")} <span className="text-[#c9580f]">{filteredMapPlaces.length}</span> {t("places")}
                  {userLocation ? ` (${t("Sorted by distance from you")})` : ""}
                </p>
              </div>

              {filteredMapPlaces.length === 0 ? (
                <div className="py-16 text-center rounded-2xl bg-white/70 border border-[#e1cfb0] p-8">
                  <MapPin className="h-10 w-10 text-orange-400 mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#173247]">
                    {selectedCategory === "Saved"
                      ? t("No saved places yet")
                      : t("No places found matching your filter")}
                  </h3>
                  <p className="mt-1 text-xs text-[#667883]">
                    {selectedCategory === "Saved"
                      ? t("Click the heart icon on any place card to bookmark your favorites.")
                      : t("Try clearing your search or picking another category.")}
                  </p>
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
                    <div key={place._id} className="flex flex-col justify-between">
                      <PlaceCard place={place} onExplore={setDetailModalPlace} />
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("map");
                          handleSelectRouteDestination(place);
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] py-2 text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5] transition-colors"
                      >
                        <Navigation className="h-3.5 w-3.5 text-[#e86f18]" />
                        <span>{t("Route Here")}</span>
                      </button>
                    </div>
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
                <MapController center={mapCenter} zoom={mapZoom} bounds={routeBounds} />

                <mapLib.TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render Polyline Route inside Map */}
                {activeRoutePolyline && (
                  <>
                    {/* Route shadow for depth */}
                    <mapLib.Polyline
                      positions={activeRoutePolyline}
                      pathOptions={{ color: "#173247", weight: 9, opacity: 0.25 }}
                    />
                    {/* Main route line */}
                    <mapLib.Polyline
                      positions={activeRoutePolyline}
                      pathOptions={{ color: "#e86f18", weight: 5, opacity: 0.9 }}
                    />
                  </>
                )}

                {/* User Current Location Marker */}
                {userLocation && (
                  <mapLib.Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={createUserLocationIcon()}
                  >
                    <mapLib.Popup>
                      <div className="p-1 text-center font-bold text-xs text-[#173247]">
                        📍 {t("Your Location")}
                      </div>
                    </mapLib.Popup>
                  </mapLib.Marker>
                )}

                {/* Optional Group Member Markers (Future Group Tracker Integration) */}
                {groupMembers.map((member) => (
                  <mapLib.Marker
                    key={`group-${member.id}`}
                    position={[member.lat, member.lng]}
                    icon={createGroupMemberIcon(member)}
                  >
                    <mapLib.Popup>
                      <div className="p-1 text-center">
                        <p className="font-bold text-xs text-[#173247]">{member.name}</p>
                        <p className="text-[10px] text-[#667883]">{member.role || "Group Member"} • {member.lastUpdated || "Just now"}</p>
                      </div>
                    </mapLib.Popup>
                  </mapLib.Marker>
                ))}

                {/* Render Filtered Location Markers */}
                {filteredMapPlaces.map((place) => {
                  const isSelected = selectedPlace?._id === place._id || selectedDestination?._id === place._id;
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
                        <div className="w-60 p-1">
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
                            {/* Save Heart Button inside Popup */}
                            <button
                              type="button"
                              onClick={(e) => toggleSavePlace(place._id, e)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow text-[#c9580f] hover:scale-110 transition-transform"
                            >
                              <Heart className={`h-4 w-4 ${savedPlaceIds.includes(place._id) ? "fill-red-500 text-red-500" : ""}`} />
                            </button>
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
                            <button
                              type="button"
                              onClick={() => handleSelectRouteDestination(place)}
                              className="flex-1 rounded-lg bg-[#c9580f] px-2 py-1.5 text-center text-xs font-bold text-white hover:bg-[#173247] transition-colors"
                            >
                              {t("Route Here")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailModalPlace(place)}
                              className="flex-1 rounded-lg bg-[#fff7ed] border border-[#e7b06d] px-2 py-1.5 text-center text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5]"
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

            {/* Active Route Information Card Overlay */}
            {selectedDestination && (activeRoutePolyline || routeLoading) && (
              <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-40 rounded-2xl border border-orange-400 bg-[#fffdf8] p-4 shadow-[0_16px_48px_rgba(77,58,30,0.25)] animate-in slide-in-from-top-4 duration-300 max-h-[60vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#f1d9b6]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c9580f] text-white">
                      <Flag className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9580f] block truncate">
                        {t("Destination Route")}
                      </span>
                      <h3 className="text-sm font-black text-[#173247] truncate">{selectedDestination.name}</h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearRoute}
                    className="p-1 rounded-full text-[#667883] hover:bg-[#fff7ed] hover:text-[#173247]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Route Loading State */}
                {routeLoading && (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#667883]">
                    <div className="h-4 w-4 border-2 border-[#e86f18] border-t-transparent rounded-full animate-spin" />
                    <span>{t("Calculating route...")}</span>
                  </div>
                )}

                {/* Distance & Travel Time Stats */}
                {!routeLoading && (
                  <>
                    <div className="py-2.5 flex items-center justify-between text-xs border-b border-[#f1d9b6]/60">
                      <span className="font-bold text-[#173247]">
                        📍 {routeDistKm.toFixed(1)} {t("km")}
                        {osrmDistance !== null && <span className="ml-1 text-[10px] font-normal text-emerald-600">{t("(road)")}</span>}
                      </span>
                      <div className="flex items-center gap-2 font-bold text-[#c9580f]">
                        {routeTravelMode === "driving" ? (
                          <span className="flex items-center gap-1">
                            <Car className="h-3.5 w-3.5 text-[#e86f18]" />
                            <span>~{drivingMinutes} {t("min")}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Footprints className="h-3.5 w-3.5 text-[#e86f18]" />
                            <span>~{walkingMinutes} {t("min")}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Travel Mode Selector */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRouteTravelMode("driving");
                          if (selectedDestination) void handleSelectRouteDestination(selectedDestination, "driving");
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          routeTravelMode === "driving"
                            ? "bg-[#c9580f] text-white"
                            : "bg-[#fff7ed] border border-[#e7b06d] text-[#c9580f]"
                        }`}
                      >
                        <Car className="h-3.5 w-3.5" />
                        <span>{t("Driving")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRouteTravelMode("walking");
                          if (selectedDestination) void handleSelectRouteDestination(selectedDestination, "walking");
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          routeTravelMode === "walking"
                            ? "bg-[#c9580f] text-white"
                            : "bg-[#fff7ed] border border-[#e7b06d] text-[#c9580f]"
                        }`}
                      >
                        <Footprints className="h-3.5 w-3.5" />
                        <span>{t("Walking")}</span>
                      </button>
                    </div>

                    {/* Turn-by-Turn Route Steps */}
                    {routeSteps.length > 0 && (
                      <div className="mt-3 rounded-xl bg-[#f8f2e8]/80 border border-[#e1cfb0] p-2.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#c9580f] mb-2 flex items-center gap-1">
                          <Compass className="h-3 w-3" />
                          {t("Route Steps")}
                        </h4>
                        <div className="space-y-1.5">
                          {routeSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11px] text-[#173247]">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#c9580f] text-[8px] font-bold text-white mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="font-medium">{step.instruction}</span>
                                <span className="ml-1 text-[10px] text-[#667883]">
                                  ({step.distance < 1000 ? `${Math.round(step.distance)}m` : `${(step.distance / 1000).toFixed(1)}km`})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Route Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={
                          selectedDestination.mapLink ||
                          `https://www.google.com/maps/dir/?api=1${
                            userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ""
                          }&destination=${selectedDestination.lat},${selectedDestination.lng}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-3 py-2 text-xs font-bold text-white shadow hover:opacity-95"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>{t("Start Navigation")}</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleClearRoute}
                        className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{t("Clear")}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bottom Floating Place Info Drawer */}
            {selectedPlace && !activeRoutePolyline && (
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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleSharePlace(selectedPlace, e)}
                      aria-label={t("Share Place")}
                      className="p-1 rounded-full text-[#667883] hover:bg-[#fff7ed] hover:text-[#173247]"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleSavePlace(selectedPlace._id, e)}
                      aria-label={t("Save Place")}
                      className="p-1 rounded-full text-[#667883] hover:bg-[#fff7ed] hover:text-[#c9580f]"
                    >
                      <Heart className={`h-4 w-4 ${savedPlaceIds.includes(selectedPlace._id) ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlace(null)}
                      className="p-1 rounded-full text-[#667883] hover:bg-[#fff7ed] hover:text-[#173247]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRouteDestination(selectedPlace)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-3 py-2 text-xs font-bold text-white shadow hover:opacity-95"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{t("Route Here")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalPlace(selectedPlace)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5] transition-colors"
                  >
                    <span>{t("View Details")}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* DEDICATED MAP VOICE GUIDE FLOATING BUTTON (Replaces default Chatbot on /map) */}
            <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 md:right-8 z-50 flex flex-col items-end gap-2">
              {/* Voice transcript bubble — shows what user said */}
              {voiceTranscript && voiceStatus !== "idle" && (
                <div className="max-w-[240px] sm:max-w-xs rounded-2xl rounded-br-md bg-[#173247] text-white px-3.5 py-2.5 text-xs font-medium shadow-2xl border border-orange-500/40 animate-in slide-in-from-bottom-2 duration-200">
                  <p className="text-[10px] uppercase tracking-wider text-orange-400 font-bold mb-1">🎤 {t("You said")}</p>
                  <p className="text-orange-100 leading-relaxed">&ldquo;{voiceTranscript}&rdquo;</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Voice state indicator bubble */}
                {voiceStatus !== "idle" && (
                  <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#173247] text-white px-3.5 py-2 text-xs font-bold shadow-xl border border-orange-500/50 animate-in fade-in">
                    <div className={`h-2.5 w-2.5 rounded-full ${voiceStatus === "listening" ? "bg-red-500 animate-ping" : voiceStatus === "processing" ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-bounce"}`} />
                    <span>
                      {voiceStatus === "listening"
                        ? t("Listening...")
                        : voiceStatus === "processing"
                        ? t("Finding destination & route...")
                        : t("Speaking...")}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartVoiceGuide}
                  aria-label={t("Map Voice Guide")}
                  className={`group relative flex h-[54px] w-[54px] sm:h-[62px] sm:w-[62px] items-center justify-center rounded-full border-4 border-[#fff7ed] text-white shadow-[0_10px_30px_rgba(234,88,12,0.4)] transition-all hover:scale-105 active:scale-95 ${
                    voiceStatus === "listening"
                      ? "bg-red-600 ring-4 ring-red-400/60"
                      : voiceStatus === "processing"
                      ? "bg-amber-600"
                      : voiceStatus === "speaking"
                      ? "bg-emerald-600 ring-4 ring-emerald-400/60"
                      : "bg-gradient-to-r from-[#ea580c] to-[#c2410c] hover:bg-[#c2410c]"
                  }`}
                >
                  {/* Pulse ring animation for listening state */}
                  {voiceStatus === "listening" && (
                    <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                  )}
                  {voiceStatus === "listening" ? (
                    <MicOff className="relative h-6 w-6 text-white" />
                  ) : voiceStatus === "processing" ? (
                    <div className="relative h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : voiceStatus === "speaking" ? (
                    <Volume2 className="relative h-6 w-6 text-white animate-pulse" />
                  ) : (
                    <Mic className="relative h-6 w-6 text-white transition-transform group-hover:scale-110" />
                  )}
                </button>
              </div>
            </div>
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
