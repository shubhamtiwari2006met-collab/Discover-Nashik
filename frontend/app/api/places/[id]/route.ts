import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { places as staticPlaces } from "@/lib/places";
import { normalizeImageUrl, parsePhotoList, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import { isLanguage } from "@/lib/locale";
import { isLocalizedContent, localizeFields } from "@/lib/localizedContent";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Place ID is required" }, { status: 400 });
  }

  const localeValue = (await cookies()).get("discover-nashik-language")?.value;
  const locale = isLanguage(localeValue) ? localeValue : "en";

  // 1. Check static places first (in-memory lookup)
  const staticMatch = staticPlaces.find((p) => p._id === id || ("id" in p && (p as { id?: string }).id === id));
  if (staticMatch) {
    const rawImage = normalizeImageUrl(staticMatch.image);
    const rawImages = (staticMatch.images || (staticMatch.image ? [staticMatch.image] : [])).map((img) =>
      normalizeImageUrl(img)
    );
    const place = {
      _id: staticMatch._id,
      id: staticMatch._id,
      name: staticMatch.name,
      category: staticMatch.category,
      location: staticMatch.location,
      description: staticMatch.description,
      heritage: staticMatch.heritage,
      tagline: staticMatch.tagline,
      famousThing: staticMatch.famousThing,
      mapLink: staticMatch.mapLink,
      image: rawImage,
      images: rawImages.length > 0 ? rawImages : [rawImage],
      rating: staticMatch.rating || 4.8,
      phone: staticMatch.phone,
      email: staticMatch.email,
      websiteUrl: staticMatch.websiteUrl,
      openingTime: staticMatch.openingTime,
      closingTime: staticMatch.closingTime,
      workingDays: staticMatch.workingDays,
      subcategory: staticMatch.subcategory,
    };
    return NextResponse.json(place);
  }

  // 2. Check Supabase approved business registrations by exact ID
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: b, error } = await supabase
        .from("business_registrations")
        .select(
          "id, business_name, category, subcategory, contact_name, phone, email, address, city_area, description, opening_time, closing_time, working_days, website_url, photos, latitude, longitude, verification_status, admin_remarks, localized_content, translation_status"
        )
        .eq("id", id)
        .eq("verification_status", "approved")
        .maybeSingle();

      if (!error && b) {
        const allPhotos = parsePhotoList(b.photos);
        const firstPhoto = allPhotos[0] || DEFAULT_FALLBACK_IMAGE;
        const isAdminPlace = b.contact_name === "Admin Added" || b.admin_remarks === "Added directly by Admin";
        const place = {
          _id: b.id,
          id: b.id,
          name: b.business_name,
          category: b.category,
          location: b.city_area ? `${b.city_area}, ${b.address}` : b.address,
          description: b.description || `${b.business_name} in ${b.address}`,
          tagline: b.subcategory || undefined,
          famousThing: b.working_days
            ? `Working Days: ${b.working_days} (${b.opening_time || "9 AM"} - ${b.closing_time || "9 PM"})`
            : undefined,
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
          contact_name: b.contact_name || undefined,
          admin_remarks: b.admin_remarks || undefined,
          isBusinessApplication: !isAdminPlace,
          localizedContent: b.localized_content || undefined,
          translationStatus: b.translation_status || "pending",
        };
        return NextResponse.json(localizeFields(place, b.localized_content, locale));
      }
    }
  } catch (err) {
    console.warn(`[GET /api/places/${id}] Supabase lookup error:`, err);
  }

  // 3. Fallback: check MongoDB Express backend if configured
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const mongoRes = await fetch(`${BACKEND_URL}/api/places/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (mongoRes.ok) {
      const item = (await mongoRes.json()) as Record<string, unknown> | null;
      if (item && (item._id || item.id)) {
        const pid = String(item._id || item.id);
        const place = {
          _id: pid,
          id: pid,
          name: typeof item.name === "string" ? item.name : "",
          category: typeof item.category === "string" ? item.category : "",
          location: typeof item.location === "string" ? item.location : "",
          description: typeof item.description === "string" ? item.description : "",
          tagline: typeof item.tagline === "string" ? item.tagline : typeof item.subcategory === "string" ? item.subcategory : undefined,
          famousThing: typeof item.famousThing === "string" ? item.famousThing : undefined,
          image: typeof item.image === "string" ? item.image : undefined,
          images: Array.isArray(item.images) ? (item.images.filter((img): img is string => typeof img === "string")) : undefined,
          rating: typeof item.rating === "number" ? item.rating : 4.8,
          phone: typeof item.phone === "string" ? item.phone : undefined,
          email: typeof item.email === "string" ? item.email : undefined,
          localizedContent: isLocalizedContent(item.localizedContent) ? item.localizedContent : undefined,
          translationStatus: typeof item.translationStatus === "string" ? item.translationStatus : "pending",
        };
        return NextResponse.json(localizeFields(place, place.localizedContent, locale));
      }
    }
  } catch {
    // Mongo backend not reachable or timed out
  }

  return NextResponse.json({ message: "Place not found" }, { status: 404 });
}

