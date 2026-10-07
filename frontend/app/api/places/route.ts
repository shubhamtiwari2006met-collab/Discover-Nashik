import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { normalizeImageUrl, parsePhotoList, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import { isLanguage } from "@/lib/locale";
import { isLocalizedContent, localizeFields, type LocalizedContent, type TranslationStatus } from "@/lib/localizedContent";
import { generateVisitorContentTranslations } from "@/lib/serverContentTranslation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export type SavedPlace = {
  _id: string;
  id?: string;
  name: string;
  category: string;
  location: string;
  description: string;
  heritage?: string;
  tagline?: string;
  famousThing?: string;
  mapLink?: string;
  image?: string;
  images?: string[];
  rating?: number;
  // Business-specific public fields (populated for approved businesses)
  phone?: string;
  email?: string;
  websiteUrl?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string;
  subcategory?: string;
  contact_name?: string;
  admin_remarks?: string;
  isBusinessApplication?: boolean;
  localizedContent?: LocalizedContent;
  translationStatus?: TranslationStatus;
};

type BusinessRegistrationRow = {
  id: string;
  business_name: string;
  category: string;
  subcategory: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  city_area: string | null;
  description: string | null;
  opening_time: string | null;
  closing_time: string | null;
  working_days: string | null;
  website_url: string | null;
  photos: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  admin_remarks: string | null;
  localized_content?: LocalizedContent | null;
  translation_status?: TranslationStatus | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

import { places as staticPlaces } from "@/lib/places";

function getStaticPlaces(): SavedPlace[] {
  return staticPlaces.map((p) => ({
    _id: p._id,
    id: p._id,
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
}

let inMemoryPlaces: SavedPlace[] = getStaticPlaces();
const editedPlacesMap = new Map<string, SavedPlace>();
const deletedPlaceIds = new Set<string>();

async function requireAdminAccess() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (profileError) {
    return { response: NextResponse.json({ error: profileError.message }, { status: 400 }) };
  }

  const role = (profile.role || "").toLowerCase();
  if (role !== "admin") {
    return { response: NextResponse.json({ error: "Admin role required to manage places" }, { status: 403 }) };
  }

  return { user: { role, id: session.user.id, email: session.user.email } };
}

async function generatePlaceTranslations(place: SavedPlace): Promise<void> {
  const source: Record<string, string> = {};
  for (const field of ["name", "category", "location", "description", "heritage", "tagline", "famousThing"] as const) {
    const value = place[field];
    if (typeof value === "string" && value.trim()) source[field] = value.trim().slice(0, 4000);
  }
  try {
    place.localizedContent = await generateVisitorContentTranslations(source);
    place.translationStatus = "needs_review";
  } catch (error) {
    console.error(`Could not generate place translations for ${place._id}.`, error);
    place.translationStatus = "failed";
  }
}

function translationColumnsAreMissing(message: string): boolean {
  return message.includes("localized_content") || message.includes("translation_status");
}

function normalizePlace(payload: unknown): SavedPlace | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  const name = String(data.name || "").trim();
  const category = String(data.category || "").trim();
  const location = String(data.location || "").trim();
  const description = String(data.description || data.bestAbout || "").trim();
  const heritage = typeof data.heritage === "string" ? data.heritage.trim() : (data.heritage ? String(data.heritage).trim() : "");

  if (!name || !category || !location || !description) {
    return null;
  }

  let images: string[] = [];
  if (Array.isArray(data.images)) {
    images = parsePhotoList(data.images);
  } else if (typeof data.photos === "string" && data.photos.trim()) {
    images = parsePhotoList(data.photos);
  } else if (data.image || data.imageUrl) {
    images = [normalizeImageUrl(String(data.image || data.imageUrl))];
  }

  images = images.slice(0, 6);
  const primaryImage = images[0] || DEFAULT_FALLBACK_IMAGE;

  return {
    _id: String(data._id || data.id || `place-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
    name,
    category,
    location,
    description,
    heritage: heritage || undefined,
    tagline: data.tagline ? String(data.tagline) : undefined,
    famousThing: data.famousThing ? String(data.famousThing) : undefined,
    mapLink: data.mapLink ? String(data.mapLink) : undefined,
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage],
    rating: typeof data.rating === "number" ? data.rating : 4.8,
    phone: data.phone ? String(data.phone) : undefined,
    email: data.email ? String(data.email) : undefined,
    websiteUrl: data.websiteUrl ? String(data.websiteUrl) : undefined,
    openingTime: data.openingTime ? String(data.openingTime) : undefined,
    closingTime: data.closingTime ? String(data.closingTime) : undefined,
    workingDays: data.workingDays ? String(data.workingDays) : undefined,
    subcategory: data.subcategory ? String(data.subcategory) : undefined,
    localizedContent: data.localizedContent && typeof data.localizedContent === "object"
      ? data.localizedContent as LocalizedContent
      : undefined,
    translationStatus: data.translationStatus === "complete" || data.translationStatus === "failed" || data.translationStatus === "needs_review"
      ? data.translationStatus
      : "pending",
  };
}

export async function GET() {
  const localeValue = (await cookies()).get("discover-nashik-language")?.value;
  const locale = isLanguage(localeValue) ? localeValue : "en";
  let registeredPlaces: SavedPlace[] = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      // Create direct unauthenticated public client to fetch approved business registrations
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      let businesses: BusinessRegistrationRow[] | null;
      let dbError: { message: string } | null;
      const localizedQuery = await supabase
        .from("business_registrations")
        .select("id, business_name, category, subcategory, contact_name, phone, email, address, city_area, description, opening_time, closing_time, working_days, website_url, photos, latitude, longitude, verification_status, admin_remarks, localized_content, translation_status")
        .eq("verification_status", "approved");
      businesses = localizedQuery.data as unknown as BusinessRegistrationRow[] | null;
      dbError = localizedQuery.error;

      if (dbError?.message.includes("localized_content") || dbError?.message.includes("translation_status")) {
        console.warn("[GET /api/places] Localized columns are not installed; serving existing business data.");
        const legacyQuery = await supabase
          .from("business_registrations")
          .select("id, business_name, category, subcategory, contact_name, phone, email, address, city_area, description, opening_time, closing_time, working_days, website_url, photos, latitude, longitude, verification_status, admin_remarks")
          .eq("verification_status", "approved");
        businesses = legacyQuery.data as unknown as BusinessRegistrationRow[] | null;
        dbError = legacyQuery.error;
      }

      if (dbError) {
        console.error("[GET /api/places] Supabase query error:", dbError.message);
      }

      if (businesses && businesses.length > 0) {
        registeredPlaces = businesses.map((b) => {
          const allPhotos = parsePhotoList(b.photos);
          const firstPhoto = allPhotos[0] || DEFAULT_FALLBACK_IMAGE;
          const isAdminPlace = b.contact_name === "Admin Added" || b.admin_remarks === "Added directly by Admin";
          return {
            _id: b.id,
            id: b.id,
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
            // Public business metadata
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
        });
      }
    }
  } catch (e) {
    console.error("Failed to fetch registered businesses for places API:", e);
  }

  // Also query MongoDB Express backend if running to merge any MongoDB approved businesses
  let mongoPlaces: SavedPlace[] = [];
  try {
    const mongoRes = await fetch(`${BACKEND_URL}/api/places`, { cache: "no-store" });
    if (mongoRes.ok) {
      const data: unknown = await mongoRes.json();
      if (Array.isArray(data)) {
        mongoPlaces = data.flatMap((candidate) => {
          if (!isRecord(candidate)) return [];
          const item = candidate;
          const pid = String(item._id || item.id || "");
          const name = typeof item.name === "string" ? item.name : "";
          const category = typeof item.category === "string" ? item.category : "";
          const location = typeof item.location === "string" ? item.location : "";
          const description = typeof item.description === "string" ? item.description : "";
          if (!pid || !name || !category || !location || !description) {
            console.warn("[GET /api/places] Skipping malformed MongoDB place record.");
            return [];
          }
          return {
            _id: pid,
            id: pid,
            name,
            category,
            location,
            description,
            tagline: typeof item.tagline === "string" ? item.tagline : typeof item.subcategory === "string" ? item.subcategory : undefined,
            famousThing: typeof item.famousThing === "string" ? item.famousThing : undefined,
            image: typeof item.image === "string" ? item.image : undefined,
            images: Array.isArray(item.images) && item.images.every((image) => typeof image === "string")
              ? item.images
              : undefined,
            rating: typeof item.rating === "number" ? item.rating : 4.8,
            phone: typeof item.phone === "string" ? item.phone : undefined,
            email: typeof item.email === "string" ? item.email : undefined,
            localizedContent: isLocalizedContent(item.localizedContent) ? item.localizedContent : undefined,
            translationStatus: item.translationStatus === "complete" || item.translationStatus === "failed" || item.translationStatus === "needs_review"
              ? item.translationStatus
              : "pending",
          };
        });
      }
    }
  } catch {
    // Express backend not running or unreachable
  }

  const staticPlacesList = getStaticPlaces();
  const placesMap = new Map<string, SavedPlace>();

  // 1. Add base places
  [...registeredPlaces, ...mongoPlaces, ...staticPlacesList].forEach((p) => {
    if (p && p._id && !deletedPlaceIds.has(p._id)) {
      placesMap.set(p._id, { ...p, id: p._id });
    }
  });

  // 2. Add in-memory places created by admin
  inMemoryPlaces.forEach((p) => {
    if (p && p._id && !deletedPlaceIds.has(p._id)) {
      placesMap.set(p._id, p);
    }
  });

  // 3. Apply admin edit overrides
  editedPlacesMap.forEach((editedPlace, id) => {
    if (!deletedPlaceIds.has(id)) {
      const existing = placesMap.get(id);
      placesMap.set(id, existing ? { ...existing, ...editedPlace } : editedPlace);
    }
  });

  const finalPlaces = Array.from(placesMap.values()).filter((p) => {
    if (!p || deletedPlaceIds.has(p._id)) return false;
    return true;
  });

  return NextResponse.json(finalPlaces.map((place) => localizeFields(place, place.localizedContent, locale)), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

export async function PUT(request: Request) {
  try {
    const access = await requireAdminAccess();
    if (access.response) return access.response;
    const payload = await request.json();
    const id = String(payload?._id || payload?.id || "").trim();
    const normalized = normalizePlace(payload);

    if (!normalized || !id) {
      return NextResponse.json({ error: "Place id and required fields are required" }, { status: 400 });
    }

    const previous = editedPlacesMap.get(id) || inMemoryPlaces.find((place) => place._id === id);
    if (normalized.localizedContent) {
      normalized.translationStatus = "needs_review";
    } else if (previous?.localizedContent) {
      normalized.localizedContent = previous.localizedContent;
      const sourceChanged = ["name", "category", "location", "description", "heritage", "tagline", "famousThing"]
        .some((field) => previous[field as keyof SavedPlace] !== normalized[field as keyof SavedPlace]);
      normalized.translationStatus = sourceChanged ? "needs_review" : previous.translationStatus;
    } else {
      await generatePlaceTranslations(normalized);
    }

    // Unmark from deleted set if re-edited
    deletedPlaceIds.delete(id);

    // Save in editedPlacesMap
    editedPlacesMap.set(id, normalized);

    const index = inMemoryPlaces.findIndex((place) => place._id === id);
    if (index !== -1) {
      inMemoryPlaces[index] = { ...inMemoryPlaces[index], ...normalized, _id: id };
    } else {
      inMemoryPlaces.push({ ...normalized, _id: id });
    }

    // Also update in Supabase if found in business_registrations
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const baseUpdate = {
        business_name: normalized.name,
        category: normalized.category,
        address: normalized.location,
        city_area: normalized.location,
        description: normalized.description,
        photos: (normalized.images || [normalized.image]).filter(Boolean).join("\n"),
        updated_at: new Date().toISOString(),
      };
      const translationUpdate = {
        localized_content: normalized.localizedContent || {},
        translation_status: normalized.translationStatus || "failed",
      };
      let { error } = await supabase.from("business_registrations").update({
        ...baseUpdate,
        ...translationUpdate,
      }).eq("id", id);
      if (error && translationColumnsAreMissing(error.message)) {
        console.warn("Localized content columns are missing; retrying place update with legacy columns.");
        ({ error } = await supabase.from("business_registrations").update(baseUpdate).eq("id", id));
        normalized.localizedContent = undefined;
        normalized.translationStatus = "failed";
      }
      if (error) console.error("Supabase update error:", error.message);
    } catch (e) {
      console.error("Supabase update error:", e);
    }

    // Also update MongoDB Express backend if running
    try {
      await fetch(`${BACKEND_URL}/api/places/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
    } catch {}

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireAdminAccess();
    if (access.response) return access.response;
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get("id");
    const payload = await request.json().catch(() => null);
    const id = String(idFromQuery || payload?.id || payload?._id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Place id is required" }, { status: 400 });
    }

    // Mark as deleted in global set
    deletedPlaceIds.add(id);
    editedPlacesMap.delete(id);
    inMemoryPlaces = inMemoryPlaces.filter((place) => place._id !== id);

    // Delete or deactivate from Supabase business_registrations
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      await supabase.from("business_registrations").delete().eq("id", id);
    } catch (e) {
      console.error("Supabase delete error:", e);
    }

    // Also delete from MongoDB Express backend if running
    try {
      await fetch(`${BACKEND_URL}/api/places/${id}`, {
        method: "DELETE",
      });
    } catch {}

    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAdminAccess();
    if (access.response) return access.response;
    const payload = await request.json();
    const normalized = normalizePlace(payload);

    if (!normalized) {
      return NextResponse.json({ error: "Missing required place fields (Name, Category, Location, Description)" }, { status: 400 });
    }

    if (!normalized.localizedContent) await generatePlaceTranslations(normalized);

    // Save to Supabase business_registrations as approved so it permanently shows for all users
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const photoStr = (normalized.images && normalized.images.length > 0)
        ? normalized.images.join("\n")
        : (normalized.image || "");

      const baseInsert = {
        owner_id: access.user!.id,
        business_name: normalized.name,
        category: normalized.category,
        subcategory: normalized.tagline || "",
        contact_name: "Admin Added",
        phone: "N/A",
        email: access.user!.email || "admin@discovernashik.com",
        address: normalized.location,
        city_area: normalized.location,
        description: normalized.description,
        photos: photoStr,
        verification_status: "approved",
        admin_remarks: "Added directly by Admin",
      };
      let { data: newBus, error: dbError } = await supabase.from("business_registrations").insert([{
        ...baseInsert,
        localized_content: normalized.localizedContent || {},
        translation_status: normalized.translationStatus || "failed",
      }]).select().single();

      if (dbError && translationColumnsAreMissing(dbError.message)) {
        console.warn("Localized content columns are missing; retrying place creation with legacy columns.");
        ({ data: newBus, error: dbError } = await supabase.from("business_registrations").insert([baseInsert]).select().single());
        normalized.localizedContent = undefined;
        normalized.translationStatus = "failed";
      }
      if (dbError) console.error("Failed to insert place to Supabase:", dbError.message);

      if (!dbError && newBus) {
        normalized._id = newBus.id;
      }
    } catch (e) {
      console.error("Failed to insert place to Supabase:", e);
    }

    inMemoryPlaces.unshift(normalized);
    return NextResponse.json(normalized, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
