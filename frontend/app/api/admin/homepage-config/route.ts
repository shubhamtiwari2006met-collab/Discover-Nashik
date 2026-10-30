import { NextRequest, NextResponse } from "next/server";
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
    console.warn("[homepage-config API] Failed to read local fallback config:", err);
  }
  return null;
}

function writeLocalConfig(config: SavedConfig): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.warn("[homepage-config API] Failed to write local fallback config:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization token missing" }, { status: 401 });
    }

    // Attempt to fetch from backend
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${BACKEND_URL}/api/admin/homepage-config`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        // Keep local cache in sync
        if (data.success && Array.isArray(data.places)) {
          writeLocalConfig({
            places: data.places,
            updatedAt: data.updatedAt || new Date().toISOString(),
            updatedBy: data.updatedBy || "admin",
          });
        }
        return NextResponse.json(data);
      }
    } catch {
      // Backend unreachable or timed out — fall back to local file
    }

    const localConfig = readLocalConfig();
    return NextResponse.json({
      success: true,
      places: localConfig?.places || [],
      updatedAt: localConfig?.updatedAt || null,
      updatedBy: localConfig?.updatedBy || null,
    });
  } catch (error) {
    console.error("[Next.js Proxy API] Error in GET /api/admin/homepage-config:", error);
    return NextResponse.json({ message: "Failed to load homepage configuration" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization token missing" }, { status: 401 });
    }

    const body = await req.json();
    const places = Array.isArray(body?.places) ? body.places : [];

    const now = new Date().toISOString();
    const savedConfig: SavedConfig = {
      places: places.map((p: any, idx: number) => ({
        placeId: String(p.placeId || p.id || "").trim(),
        visible: p.visible !== false,
        order: typeof p.order === "number" ? p.order : idx,
      })).filter((p: HomepageConfigPlace) => Boolean(p.placeId)),
      updatedAt: now,
      updatedBy: "admin",
    };

    // Always persist to local fallback
    writeLocalConfig(savedConfig);

    // Also forward to backend if available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${BACKEND_URL}/api/admin/homepage-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ places: savedConfig.places }),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline — local write succeeded
    }

    return NextResponse.json({
      success: true,
      message: "Homepage configuration saved successfully",
      updatedAt: now,
      savedCount: savedConfig.places.length,
    });
  } catch (error) {
    console.error("[Next.js Proxy API] Error in PUT /api/admin/homepage-config:", error);
    return NextResponse.json({ message: "Failed to save homepage configuration" }, { status: 500 });
  }
}
