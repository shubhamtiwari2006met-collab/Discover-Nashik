/**
 * Comprehensive dictionary of verified coordinates for Nashik places, landmarks,
 * temples, ghats, hospitals, transit hubs, and Kumbh locations.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const LANDMARK_COORDINATES: Record<string, LatLng> = {
  // Temples & Spiritual
  "ram kund": { lat: 20.0063, lng: 73.7915 },
  "ramkund": { lat: 20.0063, lng: 73.7915 },
  "kalaram": { lat: 20.0075, lng: 73.7935 },
  "kala ram": { lat: 20.0075, lng: 73.7935 },
  "panchavati": { lat: 20.0080, lng: 73.7930 },
  "sita gufa": { lat: 20.0082, lng: 73.7932 },
  "trimbakeshwar": { lat: 19.9318, lng: 73.5307 },
  "trimbak": { lat: 19.9318, lng: 73.5307 },
  "muktidham": { lat: 19.9575, lng: 73.8340 },
  "kapaleshwar": { lat: 20.0058, lng: 73.7922 },
  "sundarnarayan": { lat: 20.0045, lng: 73.7908 },
  "navshya ganpati": { lat: 20.0210, lng: 73.7530 },
  "someshwar": { lat: 20.0270, lng: 73.7380 },
  "bhakti dham": { lat: 20.0120, lng: 73.7980 },
  "ishwar deshmukh": { lat: 20.0020, lng: 73.7780 },

  // Ghats & Kumbh
  "godavari ghat": { lat: 20.0055, lng: 73.7905 },
  "lakshman kund": { lat: 20.0060, lng: 73.7918 },
  "gai mukh ghat": { lat: 20.0068, lng: 73.7910 },
  "tapovan": { lat: 20.0020, lng: 73.8150 },
  "kushavarta": { lat: 19.9322, lng: 73.5315 },
  "brahmagiri": { lat: 19.9360, lng: 73.5220 },

  // Tourist & Scenic
  "sula": { lat: 20.0067, lng: 73.6897 },
  "sula vineyards": { lat: 20.0067, lng: 73.6897 },
  "york winery": { lat: 20.0110, lng: 73.6820 },
  "pandavleni": { lat: 19.9504, lng: 73.7483 },
  "pandav leni": { lat: 19.9504, lng: 73.7483 },
  "phalke smarak": { lat: 19.9510, lng: 73.7490 },
  "anjaneri": { lat: 19.9230, lng: 73.5780 },
  "coin museum": { lat: 19.9480, lng: 73.5700 },
  "gangapur dam": { lat: 20.0350, lng: 73.6850 },
  "chamar leni": { lat: 20.0450, lng: 73.8120 },

  // Transport & Transit
  "cbs": { lat: 20.0005, lng: 73.7845 },
  "central bus stand": { lat: 20.0005, lng: 73.7845 },
  "nashik road railway station": { lat: 19.9556, lng: 73.8322 },
  "nashik road": { lat: 19.9556, lng: 73.8322 },
  "nimani bus stand": { lat: 20.0105, lng: 73.7950 },
  "thakkar bazaar": { lat: 19.9985, lng: 73.7810 },
  "ozar airport": { lat: 20.1500, lng: 73.9200 },

  // Healthcare / Emergency / Hospitals
  "apollo hospital": { lat: 19.9860, lng: 73.7740 },
  "sahyadri hospital": { lat: 19.9980, lng: 73.7700 },
  "civil hospital": { lat: 19.9975, lng: 73.7850 },
  "wockhardt hospital": { lat: 19.9720, lng: 73.7650 },
  "manavata cancer centre": { lat: 19.9850, lng: 73.7620 },
  "kalaram hospital": { lat: 20.0080, lng: 73.7920 },
};

/**
 * Resolves latitude/longitude coordinates for a place.
 * Returns direct coordinates if valid numbers are provided,
 * or falls back to known Nashik landmark coordinate match.
 */
export function getPlaceCoordinates(place: {
  latitude?: number;
  longitude?: number;
  name?: string;
  location?: string;
  category?: string;
  address?: string;
}): LatLng | null {
  if (
    typeof place.latitude === "number" &&
    typeof place.longitude === "number" &&
    !isNaN(place.latitude) &&
    !isNaN(place.longitude) &&
    place.latitude >= -90 &&
    place.latitude <= 90 &&
    place.longitude >= -180 &&
    place.longitude <= 180 &&
    (place.latitude !== 0 || place.longitude !== 0)
  ) {
    return { lat: place.latitude, lng: place.longitude };
  }

  // Fallback: match by place name or location string
  const searchText = `${place.name || ""} ${place.location || ""} ${place.address || ""}`.toLowerCase();

  for (const [key, coords] of Object.entries(LANDMARK_COORDINATES)) {
    if (searchText.includes(key)) {
      return coords;
    }
  }

  // Fallback by general area in Nashik if specified
  if (searchText.includes("panchavati")) return { lat: 20.0080, lng: 73.7930 };
  if (searchText.includes("trimbak")) return { lat: 19.9318, lng: 73.5307 };
  if (searchText.includes("nashik road")) return { lat: 19.9556, lng: 73.8322 };
  if (searchText.includes("gangapur")) return { lat: 20.0250, lng: 73.7250 };
  if (searchText.includes("satpur")) return { lat: 19.9820, lng: 73.7310 };
  if (searchText.includes("cidco")) return { lat: 19.9620, lng: 73.7610 };
  if (searchText.includes("indira nagar")) return { lat: 19.9690, lng: 73.7780 };
  if (searchText.includes("college road")) return { lat: 20.0050, lng: 73.7650 };
  if (searchText.includes("mahatma nagar")) return { lat: 20.0010, lng: 73.7580 };

  return null;
}
