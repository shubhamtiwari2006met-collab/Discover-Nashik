import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resolveCategory } from "@/lib/categories";
import { parsePhotoList } from "@/lib/imageUrl";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const queryCategory = searchParams.get("category") || searchParams.get("query") || "";
    const radiusStr = searchParams.get("radius") || "10";
    const limitStr = searchParams.get("limit") || "20";

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Latitude (lat) and longitude (lng) are required parameters." },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = Math.min(Math.max(parseFloat(radiusStr) || 10, 0.5), 50); // Clamp 0.5 - 50 km
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 20, 1), 50);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json({ error: "Invalid latitude value." }, { status: 400 });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Invalid longitude value." }, { status: 400 });
    }

    // Map category query if provided
    let searchCategory = queryCategory.trim();
    if (searchCategory) {
      const resolved = resolveCategory(searchCategory);
      if (resolved) {
        searchCategory = resolved.name;
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ nearby: [], total: 0, message: "Supabase credentials not configured." });
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Call Postgres RPC function
    const { data: rawNearby, error: rpcError } = await supabase.rpc("nearby_places", {
      user_lat: lat,
      user_lng: lng,
      search_category: searchCategory || null,
      search_radius_km: radius,
      result_limit: limit,
    });

    if (rpcError) {
      console.warn("nearby_places RPC error or function not installed yet:", rpcError.message);
      // Fallback: If RPC is not created yet in SQL editor, perform client-side fallback query on business_registrations
      const { data: businesses, error: dbError } = await supabase
        .from("business_registrations")
        .select("*")
        .eq("verification_status", "approved");

      if (dbError || !businesses) {
        return NextResponse.json({ nearby: [], total: 0 });
      }

      // Filter and compute distance manually in JS as fallback
      const filtered = businesses
        .filter((b) => b.latitude != null && b.longitude != null)
        .map((b) => {
          const distKm = haversineDistance(lat, lng, Number(b.latitude), Number(b.longitude));
          return {
            id: b.id,
            title: b.business_name,
            name: b.business_name,
            category: b.category,
            subcategory: b.subcategory,
            location: b.address || b.city_area || "Nashik",
            description: b.description,
            phone: b.phone,
            email: b.email,
            latitude: b.latitude,
            longitude: b.longitude,
            distance_km: distKm,
            image: parsePhotoList(b.photos)[0],
            verified: true,
            isApprovedBusiness: true,
          };
        })
        .filter((b) => b.distance_km <= radius)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, limit);

      return NextResponse.json({ nearby: filtered, total: filtered.length });
    }

    // Format RPC response into standard Place objects
    const formatted = (rawNearby || []).map((b: any) => ({
      id: b.id,
      title: b.business_name,
      name: b.business_name,
      category: b.category,
      subcategory: b.subcategory,
      location: b.address || b.city_area || "Nashik",
      address: b.address,
      description: b.description,
      phone: b.phone,
      email: b.email,
      website_url: b.website_url,
      opening_time: b.opening_time,
      closing_time: b.closing_time,
      working_days: b.working_days,
      latitude: b.latitude,
      longitude: b.longitude,
      distance: b.distance_km,
      distance_km: b.distance_km,
      image: parsePhotoList(b.photos)[0],
      verified: true,
      isApprovedBusiness: true,
    }));

    return NextResponse.json({ nearby: formatted, total: formatted.length });
  } catch (err: any) {
    console.error("GET /api/places/nearby error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
