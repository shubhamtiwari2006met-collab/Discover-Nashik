import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await getAuthHeader();

    const res = await fetch(`http://localhost:5000/api/admin/admins/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json().catch(() => ({ message: "Request failed" }));
    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Action failed" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
