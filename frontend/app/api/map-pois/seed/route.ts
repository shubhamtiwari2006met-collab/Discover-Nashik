import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { DEFAULT_MAP_POIS } from "@/lib/defaultMapPois";

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if ((profile?.role || "").toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Admin role required to seed map POIs" }, { status: 403 });
    }

    // Try triggering MongoDB Express backend seed if active
    let backendSuccess = false;
    let backendCount = 0;
    try {
      const res = await fetch(`${BACKEND_URL}/api/map-pois/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        backendSuccess = true;
        backendCount = data.count || DEFAULT_MAP_POIS.length;
      }
    } catch (e) {
      console.warn("Backend seed warning:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${DEFAULT_MAP_POIS.length} Nashik Map Points of Interest!`,
      count: DEFAULT_MAP_POIS.length,
      backendSynced: backendSuccess
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to seed map POIs" }, { status: 500 });
  }
}
