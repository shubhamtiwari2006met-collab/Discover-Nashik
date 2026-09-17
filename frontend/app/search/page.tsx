"use client";

import { Loader2, Search, MapPin, Navigation, RefreshCw, AlertCircle } from "lucide-react";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PlaceCard, Place } from "@/components/PlaceCard";
import { places as staticPlaces } from "@/lib/places";
import { useTranslation } from "@/lib/i18n";
import { resolveCategory } from "@/lib/categories";
import { createClient } from "@/utils/supabase/client";
import { calculateHaversineDistance } from "@/lib/distance";

function SearchResults() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("query") || params.get("category") || "");
  const { t } = useTranslation();
  const [allPlaces, setAllPlaces] = useState<Place[]>(staticPlaces);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data: businesses, error: dbError } = await supabase
          .from("business_registrations")
          .select("*")
          .eq("verification_status", "approved");

        if (dbError) {
          console.error("Error fetching approved businesses:", dbError.message);
        }

        const registeredPlaces: Place[] = (businesses || []).map((b: any) => {
          let firstPhoto: string | undefined = undefined;
          if (b.photos) {
            const lines = String(b.photos).split("\n").filter(Boolean);
            if (lines.length > 0) {
              firstPhoto = lines[0].split(",")[0].trim();
            }
          }
          return {
            _id: b.id,
            name: b.business_name,
            category: b.category,
            subcategory: b.subcategory,
            location: b.city_area ? `${b.city_area}, ${b.address}` : b.address,
            description: b.description || `${b.business_name} located at ${b.address}`,
            phone: b.phone,
            rating: 4.8,
            latitude: b.latitude != null ? Number(b.latitude) : undefined,
            longitude: b.longitude != null ? Number(b.longitude) : undefined,
            verified: true,
            isApprovedBusiness: true,
            image: firstPhoto || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
            mapLink: b.latitude && b.longitude
              ? `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.business_name}, ${b.address}`)}`,
          };
        });

        let combinedPlaces: Place[] = [...registeredPlaces, ...staticPlaces];

        // Fetch from /api/places to guarantee all approved & admin added places are merged
        try {
          const apiRes = await fetch("/api/places").then((r) => r.json());
          if (Array.isArray(apiRes)) {
            const placesMap = new Map<string, Place>();
            [...combinedPlaces, ...apiRes].forEach((p) => {
              if (p && (p._id || (p as any).id)) {
                const id = p._id || (p as any).id;
                placesMap.set(id, { ...p, _id: id });
              }
            });
            combinedPlaces = Array.from(placesMap.values());
          }
        } catch (apiErr) {
          console.error("API places fetch error in search page:", apiErr);
        }

        if (isMounted) {
          setAllPlaces(combinedPlaces);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load places.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch nearby places whenever user location or category query changes
  const fetchNearbyPlaces = useCallback(async (lat: number, lng: number, categoryQuery: string) => {
    setNearbyLoading(true);
    try {
      const url = new URL("/api/places/nearby", window.location.origin);
      url.searchParams.set("lat", lat.toString());
      url.searchParams.set("lng", lng.toString());
      if (categoryQuery) {
        url.searchParams.set("category", categoryQuery);
      }
      url.searchParams.set("radius", "25");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.nearby)) {
          const mappedNearby: Place[] = data.nearby.map((b: any) => ({
            _id: b.id || b._id,
            name: b.name || b.title,
            category: b.category,
            subcategory: b.subcategory,
            location: b.location || b.address || "Nashik",
            description: b.description || `${b.name} nearby`,
            phone: b.phone,
            rating: b.rating || 4.8,
            distance: b.distance ?? b.distance_km,
            distance_km: b.distance_km ?? b.distance,
            latitude: b.latitude,
            longitude: b.longitude,
            verified: true,
            isApprovedBusiness: true,
            image: b.image || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80",
            mapLink: b.latitude && b.longitude
              ? `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name}, ${b.location}`)}`,
          }));
          setNearbyPlaces(mappedNearby);
        }
      }
    } catch (err) {
      console.error("Failed to fetch nearby places:", err);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  // Handle Location Request
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setLocating(false);
        fetchNearbyPlaces(coords.lat, coords.lng, query);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t("Location permission denied. You can still search normally by typing above."));
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(t("Location information is unavailable. Showing normal search results."));
            break;
          case error.TIMEOUT:
            setLocationError(t("Location request timed out. Please try again."));
            break;
          default:
            setLocationError(t("An unknown error occurred while retrieving your location."));
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchNearbyPlaces, query]);

  // Auto-request location if ?nearby=true was passed in URL
  useEffect(() => {
    if (params.get("nearby") === "true") {
      handleGetLocation();
    }
  }, [params, handleGetLocation]);

  // Update nearby query when search term changes and location is active
  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlaces(userLocation.lat, userLocation.lng, query);
    }
  }, [query, userLocation, fetchNearbyPlaces]);

  const category = resolveCategory(query);
  const normalizedQuery = query.toLowerCase();

  // Attach calculated distance to allPlaces if user location is available
  const placesWithCalculatedDistance = allPlaces.map((place) => {
    if (userLocation && place.latitude != null && place.longitude != null) {
      const dist = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        place.latitude,
        place.longitude
      );
      return { ...place, distance: dist, distance_km: dist };
    }
    return place;
  });

  const filteredPlaces = placesWithCalculatedDistance.filter((place) => {
    if (!normalizedQuery) return true;
    if (category) {
      const matchCategory =
        category.placeCategories.some(
          (c) => c.toLowerCase() === (place.category || "").toLowerCase()
        ) ||
        category.aliases.some(
          (a) => a.toLowerCase() === (place.category || "").toLowerCase()
        );
      if (matchCategory) return true;
    }
    const searchableText = `${place.name} ${place.category} ${place.location} ${place.description}`.toLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  // Sort filtered places so approved/nearby businesses appear first if user location is present
  const sortedFilteredPlaces = [...filteredPlaces].sort((a, b) => {
    // If both have distance, sort by distance ASC
    if (a.distance != null && b.distance != null) {
      return a.distance - b.distance;
    }
    // Verified approved businesses first
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return 0;
  });

  return (
    <main className="min-h-screen bg-[#f8f2e8] py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">{t("Explore Nashik")}</p>
          <h1 className="mt-2 text-4xl font-bold text-[#173247]">{category ? t(category.name) : t("Find your next stop")}</h1>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] px-4 py-3 shadow-sm">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Search temples, food, hotels, cafes, shopping, hospitals...")}
                className="w-full bg-transparent text-[#173247] outline-none"
                aria-label={t("Search places")}
              />
            </div>

            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white px-5 py-3 font-semibold text-sm transition-all shadow-md shrink-0 border border-amber-800 disabled:opacity-70"
            >
              {locating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("Locating...")}</span>
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 fill-white text-white" />
                  <span>📍 {t("Use My Location")}</span>
                </>
              )}
            </button>
          </div>

          {/* Location Status Bar */}
          {userLocation && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-700" />
                <span>
                  <strong>{t("Location enabled:")}</strong> {t("Showing nearby places within reach")}
                </span>
              </div>
              <button
                onClick={handleGetLocation}
                className="flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> {t("Refresh")}
              </button>
            </div>
          )}

          {/* Location Error Message */}
          {locationError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center text-orange-600">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Section 1: Nearby Places directly from RPC query (when location is enabled) */}
            {userLocation && (
              <section className="mb-12">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#173247] flex items-center gap-2">
                      <span>📍 {t("Nearby Registered Places")}</span>
                      {nearbyLoading && <Loader2 className="h-4 w-4 animate-spin text-amber-700" />}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{t("Verified businesses near your current position")}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {nearbyPlaces.length} {t("Nearby")}
                  </span>
                </div>

                {nearbyPlaces.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {nearbyPlaces.map((place) => (
                      <PlaceCard key={`nearby-${place._id}`} place={place} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center text-slate-600 text-sm">
                    {nearbyLoading
                      ? t("Finding registered places near you...")
                      : t("No registered places with exact coordinates found nearby for this search term. See all available results below.")}
                  </div>
                )}
              </section>
            )}

            {/* Section 2: All / Broader Results */}
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#173247]">
                  {userLocation ? t("All Matching Places in Nashik") : t("All Places")}
                </h2>
                <p className="text-xs text-slate-500">{sortedFilteredPlaces.length} {t("places to explore")}</p>
              </div>

              {sortedFilteredPlaces.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {sortedFilteredPlaces.map((place) => (
                    <PlaceCard key={place._id} place={place} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#d8c4a3] bg-[#fffdf8] p-10 text-center text-[#667883]">
                  {category ? t(`No businesses found in "${category.name}" category yet.`) : t("No businesses found matching your search.")}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f8f2e8]" />}><SearchResults /></Suspense>;
}

