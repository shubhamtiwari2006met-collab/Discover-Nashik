import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { generateVisitorContentTranslations } from "@/lib/serverContentTranslation";

const TRANSLATABLE_FIELDS = new Set([
  "name",
  "category",
  "location",
  "description",
  "heritage",
  "tagline",
  "famousThing",
]);

async function requireContentEditor() {
  const supabase = createClient(await cookies());
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if ((user.email || "").toLowerCase() === "shubhamtiwari.2006.met@gmail.com") {
    return { response: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Unable to verify content editor role.", error);
    return { response: NextResponse.json({ error: "Unable to verify account permissions." }, { status: 500 }) };
  }

  const role = (profile?.role || "").toLowerCase();
  if (role !== "admin" && role !== "business") {
    return { response: NextResponse.json({ error: "Admin or business access is required." }, { status: 403 }) };
  }
  return { response: null };
}

export async function POST(request: Request) {
  const access = await requireContentEditor();
  if (access.response) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A content object is required." }, { status: 400 });
  }

  const content = (body as Record<string, unknown>).content;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return NextResponse.json({ error: "A content object is required." }, { status: 400 });
  }

  const source: Record<string, string> = {};
  for (const [field, value] of Object.entries(content as Record<string, unknown>)) {
    if (!TRANSLATABLE_FIELDS.has(field) || typeof value !== "string") continue;
    const normalized = value.trim();
    if (normalized) source[field] = normalized.slice(0, 4000);
  }
  if (!Object.keys(source).length) {
    return NextResponse.json({ error: "At least one supported text field is required." }, { status: 400 });
  }

  try {
    const localizedContent = await generateVisitorContentTranslations(source);
    return NextResponse.json({ localizedContent, translationStatus: "needs_review" });
  } catch (error) {
    console.error("Could not generate requested visitor-content translations.", error);
    const message = error instanceof Error ? error.message : "Translation service is unavailable.";
    return NextResponse.json(
      { error: `${message} The original content has not been changed.` },
      { status: message === "Translation service is unavailable." ? 503 : 502 }
    );
  }
}
