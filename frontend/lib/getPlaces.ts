import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { normalizeImageUrl, parsePhotoList, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import { Place } from "@/components/PlaceCard";
import { places as staticPlaces } from "@/lib/places";
import { isLanguage } from "@/lib/locale";
import { localizeFields } from "@/lib/localizedContent";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function getPlaces(): Promise<Place[]> {
  const localeValue = (await cookies()).get("discover-nashik-language")?.value;
  const locale = isLanguage(localeValue) ? localeValue : "en";
  let registeredPlaces: Place[] = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const localizedQuery = await supabase
        .from("business_registrations")
        .select("id, business_name, category, subcategory, contact_name, phone, email, address, city_area, description, opening_time, closing_time, working_days, website_url, photos, latitude, longitude, verification_status, admin_remarks, localized_content")
        .eq("verification_status", "approved");
      let businesses = localizedQuery.data;
      let dbError = localizedQuery.error;

      if (dbError?.message.includes("localized_content")) {
        console.warn("[getPlaces] Localized content column is not installed; serving existing business data.");
        const legacyQuery = await supabase
          .from("business_registrations")
          .select("id, business_name, category, subcategory, contact_name, phone, email, address, city_area, description, opening_time, closing_time, working_days, website_url, photos, latitude, longitude, verification_status, admin_remarks")
          .eq("verification_status", "approved");
        businesses = legacyQuery.data as unknown as typeof businesses;
        dbError = legacyQuery.error;
      }

      if (!dbError && businesses && businesses.length > 0) {
        registeredPlaces = businesses.map((b) => {
          const allPhotos = parsePhotoList(b.photos);
          const firstPhoto = allPhotos[0] || DEFAULT_FALLBACK_IMAGE;
          const isAdminPlace = b.contact_name === "Admin Added" || b.admin_remarks === "Added directly by Admin";
          const place = {
            _id: b.id,
            name: b.business_name,
            category: b.category,
            location: b.city_area ? `${b.city_area}, ${b.address}` : b.address,
            description: b.description || `${b.business_name} in ${b.address}`,
            tagline: b.subcategory || undefined,
            famousThing: b.working_days ? `Working Days: ${b.working_days} (${b.opening_time || '9 AM'} - ${b.closing_time || '9 PM'})` : undefined,
            mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.business_name}, ${b.address}`)}`,
            image: firstPhoto,
            images: allPhotos.length > 0 ? allPhotos.slice(0, 6) : [firstPhoto],
            rating: 4.8,
            phone: b.phone || undefined,
            email: b.email || undefined,
            websiteUrl: b.website_url || undefined,
            openingTime: b.opening_time || undefined,
            closingTime: b.closing_time || undefined,
            workingDays: b.working_days || undefined,
            subcategory: b.subcategory || undefined,
            latitude: b.latitude != null ? Number(b.latitude) : undefined,
            longitude: b.longitude != null ? Number(b.longitude) : undefined,
            contact_name: b.contact_name,
            admin_remarks: b.admin_remarks,
            isBusinessApplication: !isAdminPlace,
            localizedContent: b.localized_content || undefined,
          };
          return localizeFields(place, b.localized_content, locale);
        });
      }
    }
  } catch (e) {
    console.error("[getPlaces] Supabase fetch error:", e);
  }

  let mongoPlaces: Place[] = [];
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const mongoRes = await fetch(`${backendUrl}/api/places`, { next: { revalidate: 60 } });
    if (mongoRes.ok) {
      const data: unknown = await mongoRes.json();
      if (Array.isArray(data)) {
        mongoPlaces = data.flatMap((candidate) => {
          if (!isRecord(candidate)) return [];
          const id = String(candidate._id || candidate.id || "");
          const name = typeof candidate.name === "string" ? candidate.name : "";
          const category = typeof candidate.category === "string" ? candidate.category : "";
          const location = typeof candidate.location === "string" ? candidate.location : "";
          const description = typeof candidate.description === "string" ? candidate.description : "";
          if (!id || !name || !category || !location || !description) {
            console.warn("[getPlaces] Skipping malformed MongoDB place record.");
            return [];
          }
          return [localizeFields({
            _id: id,
            name,
            category,
            location,
            description,
            tagline: typeof candidate.tagline === "string" ? candidate.tagline : typeof candidate.subcategory === "string" ? candidate.subcategory : undefined,
            famousThing: typeof candidate.famousThing === "string" ? candidate.famousThing : undefined,
            image: typeof candidate.image === "string" ? candidate.image : undefined,
            images: Array.isArray(candidate.images) && candidate.images.every((image) => typeof image === "string")
              ? candidate.images
              : undefined,
            rating: typeof candidate.rating === "number" ? candidate.rating : 4.8,
            phone: typeof candidate.phone === "string" ? candidate.phone : undefined,
            email: typeof candidate.email === "string" ? candidate.email : undefined,
            localizedContent: candidate.localizedContent,
          }, candidate.localizedContent, locale)];
        });
      }
    }
  } catch {
    // Mongo backend not reachable
  }

  const staticList: Place[] = staticPlaces.map((p) => ({
    _id: p._id,
    name: p.name,
    category: p.category,
    location: p.location,
    description: p.description,
    heritage: p.heritage,
    tagline: p.tagline,
    famousThing: p.famousThing,
    mapLink: p.mapLink,
    image: normalizeImageUrl(p.image),
    images: (p.images || (p.image ? [p.image] : [])).map(img => normalizeImageUrl(img)),
    rating: p.rating,
    phone: p.phone,
    email: p.email,
    websiteUrl: p.websiteUrl,
    openingTime: p.openingTime,
    closingTime: p.closingTime,
    workingDays: p.workingDays,
    subcategory: p.subcategory,
  }));

  const placesMap = new Map<string, Place>();

  // 1. Add static base places first
  staticList.forEach((p) => {
    if (p && p._id) placesMap.set(p._id, p);
  });

  // 2. Override with DB & Mongo places
  [...registeredPlaces, ...mongoPlaces].forEach((p) => {
    if (p && p._id) placesMap.set(p._id, p);
  });

  return Array.from(placesMap.values());
}
