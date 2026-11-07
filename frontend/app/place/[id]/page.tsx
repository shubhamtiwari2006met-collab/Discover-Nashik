import type { Metadata } from "next";
import PlaceClientPage from "./PlaceClientPage";
import { createClient } from "@supabase/supabase-js";
import { places as staticPlaces } from "@/lib/places";
import { CANONICAL_DESTINATIONS, findCanonicalEntry } from "@/lib/placeMatcher";

type Props = {
  params: Promise<{ id: string }>;
};

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

type PlaceRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  image?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
};

async function getPlaceRecord(id: string): Promise<PlaceRecord | null> {
  try {
    // 1. Check static places first
    const staticMatch = staticPlaces.find((p) => p._id === id || (p as any).id === id);
    if (staticMatch) {
      return {
        id: staticMatch._id,
        name: staticMatch.name,
        category: staticMatch.category || "Attraction",
        description: staticMatch.description || `${staticMatch.name} in Nashik.`,
        address: staticMatch.location,
        image: staticMatch.image,
        rating: staticMatch.rating || 4.8,
      };
    }

    // 2. Check canonical destinations registry
    const canonicalMatch = findCanonicalEntry(id);
    if (canonicalMatch) {
      return {
        id: canonicalMatch.canonicalId,
        name: canonicalMatch.aliases[0] || id,
        category: "Pilgrimage",
        description: `Sacred pilgrimage attraction ${canonicalMatch.aliases[0]} in Nashik, Maharashtra.`,
        address: "Nashik, Maharashtra",
        latitude: canonicalMatch.latitude,
        longitude: canonicalMatch.longitude,
        rating: 4.8,
      };
    }

    // 3. Check approved business registrations in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: bus } = await supabase
        .from("business_registrations")
        .select("id, business_name, category, subcategory, description, address, city_area, photos, latitude, longitude")
        .eq("id", id)
        .eq("verification_status", "approved")
        .maybeSingle();

      if (bus) {
        const photos = bus.photos ? bus.photos.split("\n").filter(Boolean) : [];
        return {
          id: bus.id,
          name: bus.business_name,
          category: bus.category || "Attraction",
          description: bus.description || `${bus.business_name} in ${bus.address}, Nashik.`,
          address: bus.city_area ? `${bus.city_area}, ${bus.address}` : bus.address,
          image: photos[0] || undefined,
          rating: 4.8,
          latitude: bus.latitude != null ? Number(bus.latitude) : undefined,
          longitude: bus.longitude != null ? Number(bus.longitude) : undefined,
        };
      }
    }

    // 4. Fallback to Express MongoDB backend if running
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/places/${encodeURIComponent(id)}`, {
        next: { revalidate: 3600 },
      });
      if (backendRes.ok) {
        const p = await backendRes.json();
        if (p && (p._id || p.id)) {
          return {
            id: p._id || p.id,
            name: p.name,
            category: p.category || "Attraction",
            description: p.description || `${p.name} in Nashik.`,
            address: p.location || "Nashik, Maharashtra",
            image: p.image || (p.images && p.images[0]) || undefined,
            rating: p.rating || 4.8,
            latitude: p.latitude != null ? Number(p.latitude) : undefined,
            longitude: p.longitude != null ? Number(p.longitude) : undefined,
          };
        }
      }
    } catch {}

    return null;
  } catch (err) {
    console.error("Error fetching place data for metadata:", err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = "https://discovernashik.co.in";
  const place = await getPlaceRecord(id);

  if (place) {
    const title = `${place.name} | ${place.category} in Nashik`;
    const description = place.description.length > 160 ? `${place.description.slice(0, 157)}...` : place.description;

    return {
      title,
      description,
      alternates: {
        canonical: `${baseUrl}/place/${id}`,
        languages: {
          "en-IN": `${baseUrl}/place/${id}`,
          "hi-IN": `${baseUrl}/place/${id}`,
          "mr-IN": `${baseUrl}/place/${id}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/place/${id}`,
        siteName: "Discover Nashik",
        locale: "en_IN",
        alternateLocale: ["hi_IN", "mr_IN"],
        type: "website",
        images: place.image ? [{ url: place.image, alt: place.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: place.image ? [place.image] : undefined,
      },
    };
  }

  return {
    title: "Place Details | Discover Nashik",
    description: "View visitor details, timing, address and location information for places in Nashik.",
    alternates: {
      canonical: `${baseUrl}/place/${id}`,
    },
  };
}

export default async function PlacePage({ params }: Props) {
  const { id } = await params;
  const place = await getPlaceRecord(id);
  const baseUrl = "https://discovernashik.co.in";

  let placeSchema: object | null = null;

  if (place) {
    const catLower = (place.category || "").toLowerCase();
    let schemaType = "TouristAttraction";
    if (catLower.includes("hotel") || catLower.includes("stay")) {
      schemaType = "Hotel";
    } else if (catLower.includes("food") || catLower.includes("restaurant")) {
      schemaType = "Restaurant";
    } else if (catLower.includes("business") || catLower.includes("shop")) {
      schemaType = "LocalBusiness";
    }

    placeSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `${baseUrl}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Places to Visit in Nashik",
              "item": `${baseUrl}/places-to-visit`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": place.name,
              "item": `${baseUrl}/place/${place.id}`
            }
          ]
        },
        {
          "@type": schemaType,
          "@id": `${baseUrl}/place/${place.id}#place`,
          "name": place.name,
          "description": place.description,
          "url": `${baseUrl}/place/${place.id}`,
          "image": place.image,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": place.address,
            "addressLocality": "Nashik",
            "addressRegion": "Maharashtra",
            "addressCountry": "IN"
          },
          ...(place.latitude && place.longitude ? {
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": place.latitude,
              "longitude": place.longitude
            }
          } : {}),
          ...(place.rating ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": place.rating,
              "bestRating": "5",
              "ratingCount": "120"
            }
          } : {})
        }
      ]
    };
  }

  return (
    <>
      {placeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
        />
      )}
      <PlaceClientPage />
    </>
  );
}
