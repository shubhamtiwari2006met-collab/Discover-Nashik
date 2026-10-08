import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { DEFAULT_MAP_POIS, MapPOIItem } from "@/lib/defaultMapPois";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

let inMemoryMapPois: MapPOIItem[] = [...DEFAULT_MAP_POIS];
const editedMapPoisMap = new Map<string, MapPOIItem>();
const deletedMapPoiIds = new Set<string>();

async function requireAdminAccess() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = (profile?.role || "").toLowerCase();
  if (role !== "admin") {
    return { response: NextResponse.json({ error: "Admin role required to manage map POIs" }, { status: 403 }) };
  }

  return { user: session.user };
}

export async function GET() {
  let backendPois: MapPOIItem[] = [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/map-pois`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        backendPois = data;
      }
    }
  } catch (err) {
    // Backend express server not running or unreachable
  }

  const poisMap = new Map<string, MapPOIItem>();

  // 1. Load backend or default POIs
  const basePois = backendPois.length > 0 ? backendPois : inMemoryMapPois;
  basePois.forEach((poi) => {
    if (poi && poi._id && !deletedMapPoiIds.has(poi._id)) {
      poisMap.set(poi._id, poi);
    }
  });

  // 2. Add edited/added overrides
  editedMapPoisMap.forEach((editedPoi, id) => {
    if (!deletedMapPoiIds.has(id)) {
      poisMap.set(id, editedPoi);
    }
  });

  const finalPois = Array.from(poisMap.values()).filter((p) => !deletedMapPoiIds.has(p._id));

  return NextResponse.json(finalPois, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    }
  });
}

export async function POST(request: Request) {
  try {
    const access = await requireAdminAccess();
    if (access.response) return access.response;

    const body = await request.json();
    const { name, category, latitude, longitude, location, description, image, phone, famousThing } = body;

    if (!name || !category || latitude == null || longitude == null || !location) {
      return NextResponse.json({ error: "Name, Category, Latitude, Longitude, and Location are required" }, { status: 400 });
    }

    const newPoi: MapPOIItem = {
      _id: `poi-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: String(name).trim(),
      category: String(category).trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: String(location).trim(),
      description: description ? String(description).trim() : "",
      image: image ? String(image).trim() : "",
      phone: phone ? String(phone).trim() : "",
      famousThing: famousThing ? String(famousThing).trim() : "",
      mapOnly: true
    };

    // Try posting to Express backend if running
    try {
      const res = await fetch(`${BACKEND_URL}/api/map-pois`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPoi),
      });
      if (res.ok) {
        const savedBackend = await res.json();
        if (savedBackend._id) newPoi._id = savedBackend._id;
      }
    } catch {}

    inMemoryMapPois.unshift(newPoi);
    editedMapPoisMap.set(newPoi._id, newPoi);

    return NextResponse.json(newPoi, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create map POI" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const access = await requireAdminAccess();
    if (access.response) return access.response;

    const body = await request.json();
    const { _id, id, name, category, latitude, longitude, location, description, image, phone, famousThing } = body;
    const targetId = _id || id;

    if (!targetId || !name || !category || latitude == null || longitude == null || !location) {
      return NextResponse.json({ error: "ID, Name, Category, Latitude, Longitude, and Location are required" }, { status: 400 });
    }

    const updatedPoi: MapPOIItem = {
      _id: targetId,
      name: String(name).trim(),
      category: String(category).trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: String(location).trim(),
      description: description ? String(description).trim() : "",
      image: image ? String(image).trim() : "",
      phone: phone ? String(phone).trim() : "",
      famousThing: famousThing ? String(famousThing).trim() : "",
      mapOnly: true
    };

    deletedMapPoiIds.delete(targetId);
    editedMapPoisMap.set(targetId, updatedPoi);

    const idx = inMemoryMapPois.findIndex((p) => p._id === targetId);
    if (idx !== -1) {
      inMemoryMapPois[idx] = updatedPoi;
    } else {
      inMemoryMapPois.unshift(updatedPoi);
    }

    // Try sending PUT to Express backend if running
    try {
      await fetch(`${BACKEND_URL}/api/map-pois/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPoi),
      });
    } catch {}

    return NextResponse.json(updatedPoi);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update map POI" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireAdminAccess();
    if (access.response) return access.response;

    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get("id");
    const body = await request.json().catch(() => null);
    const targetId = idFromQuery || body?._id || body?.id;

    if (!targetId) {
      return NextResponse.json({ error: "Map POI id is required" }, { status: 400 });
    }

    deletedMapPoiIds.add(targetId);
    editedMapPoisMap.delete(targetId);
    inMemoryMapPois = inMemoryMapPois.filter((p) => p._id !== targetId);

    // Try sending DELETE to Express backend if running
    try {
      await fetch(`${BACKEND_URL}/api/map-pois/${targetId}`, {
        method: "DELETE",
      });
    } catch {}

    return NextResponse.json({ success: true, deletedId: targetId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete map POI" }, { status: 500 });
  }
}
