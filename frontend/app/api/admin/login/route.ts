import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: "Server returned an invalid response. Please ensure the backend is running.",
    }));

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[Next.js Proxy API] Error in /api/admin/login:", error);
    return NextResponse.json(
      { success: false, message: "Failed to connect to backend authentication server." },
      { status: 500 }
    );
  }
}
