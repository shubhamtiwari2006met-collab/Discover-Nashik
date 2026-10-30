import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
const DATA_FILE = path.join(process.cwd(), "data", "homepage-config.json");

interface HomepageConfigPlace {
  placeId: string;
  visible: boolean;
  order: number;
}

interface SavedConfig {
  places: HomepageConfigPlace[];
  updatedAt: string;
  updatedBy: string;
}

function readLocalConfig(): SavedConfig | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[places/homepage API] Failed to read local fallback config:", err);
  }
  return null;
}

/**
 * Public endpoint proxy — fetches the admin-configured homepage places
 * ordering and visibility. No auth required.
 */
export async function GET() {
  try {
    // 1. Try backend first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${BACKEND_URL}/api/places/homepage`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.configured && Array.isArray(data.placeIds) && data.placeIds.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch {
      // Backend offline or timed out
    }

    // 2. Check local fallback file
    const local = readLocalConfig();
    if (local && Array.isArray(local.places) && local.places.length > 0) {
      const visibleEntries = local.places
        .filter((p) => p.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      return NextResponse.json({
        configured: true,
        placeIds: visibleEntries.map((p) => String(p.placeId)),
      });
    }

    return NextResponse.json({ configured: false, placeIds: [] }, { status: 200 });
  } catch (error) {
    console.error("[Next.js Proxy API] Error in GET /api/places/homepage:", error);
    return NextResponse.json({ configured: false, placeIds: [] }, { status: 200 });
  }
}
