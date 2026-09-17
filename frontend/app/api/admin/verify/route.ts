import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Authorization token missing" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/api/admin/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Next.js Proxy API] Error in /api/admin/verify:", error);
    return NextResponse.json({ message: "Failed to connect to backend server" }, { status: 500 });
  }
}
