import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { normalizeImageUrl, parsePhotoList, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import { Place } from "@/components/PlaceCard";
import { places as staticPlaces } from "@/lib/places";

export async function getPlaces(): Promise<Place[]> {
  let registeredPlaces: Place[] = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: businesses, error: dbError } = await supabase
        .from("business_registrations")
        .select("*")
        .eq("verification_status", "approved");

      if (!dbError && businesses && businesses.length > 0) {
        registeredPlaces = businesses.map((b: any) => {
          const allPhotos = parsePhotoList(b.photos);
          const firstPhoto = allPhotos[0] || DEFAULT_FALLBACK_IMAGE;
          const isAdminPlace = b.contact_name === "Admin Added" || b.admin_remarks === "Added directly by Admin";
          return {
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
            contact_name: b.contact_name,
            admin_remarks: b.admin_remarks,
            isBusinessApplication: !isAdminPlace,
          };
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
      const data = await mongoRes.json();
      if (Array.isArray(data)) {
        mongoPlaces = data.map((item: any) => ({
          _id: String(item._id || item.id),
          name: item.name,
          category: item.category,
          location: item.location,
          description: item.description,
          tagline: item.tagline || item.subcategory,
          famousThing: item.famousThing,
          image: item.image,
          images: item.images,
          rating: item.rating || 4.8,
          phone: item.phone,
          email: item.email,
        }));
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
