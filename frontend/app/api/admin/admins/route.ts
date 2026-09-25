import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function getAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
    return headers;
  }
  const rawToken = cookieStore.get('sb-access-token')?.value;
  if (rawToken) {
    headers["Authorization"] = `Bearer ${rawToken}`;
  }
  return headers;
}

export async function GET() {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}/api/admin/admins`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Failed to fetch admin accounts" }));
      return NextResponse.json({ error: errData.message || "Unauthorized" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headers = await getAuthHeader();
    const body = await request.json();

    const res = await fetch(`${BACKEND_URL}/api/admin/admins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ message: "Request failed" }));
    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Action failed" }, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
