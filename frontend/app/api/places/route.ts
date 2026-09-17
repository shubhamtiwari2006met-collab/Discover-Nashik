import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export type SavedPlace = {
  _id: string;
  name: string;
  category: string;
  location: string;
  description: string;
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
};

import { places as staticPlaces } from "@/lib/places";

function getStaticPlaces(): SavedPlace[] {
  return staticPlaces.map((p) => ({
    _id: p._id,
    name: p.name,
    category: p.category,
    location: p.location,
    description: p.description,
    tagline: p.tagline,
    famousThing: p.famousThing,
    mapLink: p.mapLink,
    image: p.image,
    images: p.images || (p.image ? [p.image] : []),
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

function normalizePlace(payload: unknown): SavedPlace | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  const name = String(data.name || "").trim();
  const category = String(data.category || "").trim();
  const location = String(data.location || "").trim();
  const description = String(data.description || data.bestAbout || "").trim();

  if (!name || !category || !location || !description) {
    return null;
  }

  let images: string[] = [];
  if (Array.isArray(data.images)) {
    images = data.images.map(String).map(s => s.trim()).filter(Boolean);
  } else if (typeof data.photos === "string") {
    images = data.photos.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
  } else if (data.image || data.imageUrl) {
    images = [String(data.image || data.imageUrl).trim()];
  }

  images = images.slice(0, 6);
  const primaryImage = images[0] || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80";

  return {
    _id: String(data._id || data.id || `place-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
    name,
    category,
    location,
    description,
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
  };
}

export async function GET() {
  let registeredPlaces: SavedPlace[] = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      // Create direct unauthenticated public client to fetch approved business registrations
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: businesses, error: dbError } = await supabase
        .from("business_registrations")
        .select("*")
        .eq("verification_status", "approved");

      if (dbError) {
        console.error("[GET /api/places] Supabase query error:", dbError.message);
      }

      if (businesses && businesses.length > 0) {
        registeredPlaces = businesses.map((b: any) => {
          let allPhotos: string[] = [];
          if (b.photos) {
            allPhotos = String(b.photos)
              .split(/[\n,]/)
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
          const firstPhoto = allPhotos[0] || "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80";
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
            // Public business metadata
            phone: b.phone || undefined,
            email: b.email || undefined,
            websiteUrl: b.website_url || undefined,
            openingTime: b.opening_time || undefined,
            closingTime: b.closing_time || undefined,
            workingDays: b.working_days || undefined,
            subcategory: b.subcategory || undefined,
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
    const mongoRes = await fetch("http://localhost:5000/api/places", { cache: "no-store" });
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
    // Express backend not running or unreachable
  }

  const staticPlacesList = getStaticPlaces();
  const placesMap = new Map<string, SavedPlace>();

  // 1. Add base places
  [...registeredPlaces, ...mongoPlaces, ...staticPlacesList].forEach((p) => {
    if (p && p._id && !deletedPlaceIds.has(p._id)) {
      placesMap.set(p._id, p);
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

  // Filter out any explicitly deleted IDs and sample places
  const SAMPLE_PLACE_NAMES = [
    "trimbakeshwar shiva temple",
    "sula vineyards",
    "dugarwadi waterfall",
    "sadhana restaurant"
  ];

  const finalPlaces = Array.from(placesMap.values()).filter((p) => {
    if (!p || deletedPlaceIds.has(p._id)) return false;
    const lowerName = (p.name || "").toLowerCase().trim();
    if (SAMPLE_PLACE_NAMES.some(sample => lowerName.includes(sample))) return false;
    return true;
  });

  return NextResponse.json(finalPlaces, {
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
      await supabase.from("business_registrations").update({
        business_name: normalized.name,
        category: normalized.category,
        address: normalized.location,
        city_area: normalized.location,
        description: normalized.description,
        photos: (normalized.images || [normalized.image]).filter(Boolean).join("\n"),
        updated_at: new Date().toISOString(),
      }).eq("id", id);
    } catch (e) {
      console.error("Supabase update error:", e);
    }

    // Also update MongoDB Express backend if running
    try {
      await fetch(`http://localhost:5000/api/places/${id}`, {
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
      await fetch(`http://localhost:5000/api/places/${id}`, {
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

    // Save to Supabase business_registrations as approved so it permanently shows for all users
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const photoStr = (normalized.images && normalized.images.length > 0)
        ? normalized.images.join("\n")
        : (normalized.image || "");

      const { data: newBus, error: dbError } = await supabase.from("business_registrations").insert([{
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
      }]).select().single();

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
