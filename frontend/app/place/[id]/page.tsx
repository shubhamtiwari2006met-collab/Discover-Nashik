import type { Metadata } from "next";
import PlaceClientPage from "./PlaceClientPage";
import { createClient } from "@supabase/supabase-js";

type Props = {
  params: Promise<{ id: string }>;
};

import { places as staticPlaces } from "@/lib/places";

async function getPlaceRecord(id: string) {
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
      };
    }

    // 2. Check approved business registrations in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: bus } = await supabase
      .from("business_registrations")
      .select("id, business_name, category, subcategory, description, address, city_area, photos")
      .eq("id", id)
      .eq("verification_status", "approved")
      .maybeSingle();

    if (!bus) return null;

    const photos = bus.photos ? bus.photos.split("\n").filter(Boolean) : [];
    return {
      id: bus.id,
      name: bus.business_name,
      category: bus.category || "Attraction",
      description: bus.description || `${bus.business_name} in ${bus.address}, Nashik.`,
      address: bus.city_area ? `${bus.city_area}, ${bus.address}` : bus.address,
      image: photos[0] || undefined,
    };
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
    const title = `${place.name} | ${place.category} in Nashik | Discover Nashik`;
    const description = place.description.slice(0, 160);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/place/${id}`,
        siteName: "Discover Nashik",
        locale: "en_US",
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
    description: "View details, location, and visitor information for places in Nashik.",
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
              "name": "Places",
              "item": `${baseUrl}/search`
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
          }
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
