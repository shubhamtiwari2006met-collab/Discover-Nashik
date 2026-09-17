import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  // Create a response that we can mutate — critical: pass the request so
  // headers (including cookies) flow through correctly.
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 1. Update the request cookies so that subsequent `getAll()` calls
        //    (and `NextResponse.next({ request })`) see the refreshed tokens.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        // 2. Re-create the response with the updated request to carry the
        //    cookie changes through to any downstream Server Components.
        supabaseResponse = NextResponse.next({
          request,
        });

        // 3. Also write Set-Cookie headers into the outgoing response so the
        //    browser persists the refreshed tokens.
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use getSession() here — getUser() contacts the auth
  // server and is the secure way to validate tokens in middleware.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If the refresh token is missing/invalid, clear stale auth cookies
  if (authError?.code === "refresh_token_not_found") {
    for (const cookie of request.cookies.getAll()) {
      if (
        cookie.name.startsWith("sb-") &&
        cookie.name.includes("-auth-token")
      ) {
        supabaseResponse.cookies.delete(cookie.name);
      }
    }
  }

  const pathname = request.nextUrl.pathname;

  // Skip protection for the login page itself to avoid redirect loops
  if (pathname.startsWith("/login")) {
    return supabaseResponse;
  }

  // Determine role (fallback to visitor)
  let role = "visitor";
  if (user) {
    const userEmail = (user.email || "").toLowerCase().trim();
    if (userEmail === "shubhamtiwari.2006.met@gmail.com") {
      role = "admin";
    } else {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) {
        console.error("[Middleware] Failed to fetch profile:", profileError);
        role = "visitor";
      } else {
        const pRole = (profile?.role || "").toLowerCase();
        role = pRole === "admin" ? "admin" : pRole === "business" ? "business" : "visitor";
      }

      // If the user is trying to access /admin/* and profile role isn't admin,
      // verify against backend MongoDB (additional admins may not have Supabase profile updated)
      if (role !== "admin" && pathname.startsWith("/admin")) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          if (accessToken) {
            const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
            const verifyRes = await fetch(`${backendUrl}/api/admin/verify`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            });
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData?.user?.role === "admin" && verifyData?.user?.adminStatus === "active") {
                role = "admin";
                console.log(`[Middleware] Backend verified admin access for ${userEmail}`);
              }
            }
          }
        } catch (verifyErr) {
          console.warn("[Middleware] Backend admin verification failed, falling back to profile role:", verifyErr);
        }
      }
    }
  }

  console.log(`[Middleware] path=${pathname} | user=${user?.id ?? 'NONE'} | authError=${authError?.code ?? 'none'} | role=${role}`);

  // Admin protection
  if (pathname.startsWith("/admin") && role !== "admin") {
    console.log(`[Middleware] BLOCKING admin access — redirecting to login`);
    const loginUrl = new URL("/login?role=admin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Business protection (allow registration and pending pages)
  if (
    pathname.startsWith("/business") &&
    pathname !== "/business/register" &&
    pathname !== "/business/pending" &&
    role !== "business"
  ) {
    const loginUrl = new URL("/login?role=business", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If a business user tries to access the dashboard, verify approval status
  if (role === "business" && pathname.startsWith("/business/dashboard")) {
    try {
      const { data: regData, error: regError } = await supabase
        .from("business_registrations")
        .select("verification_status")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (regError) throw regError;
      if (regData?.verification_status !== "approved") {
        return NextResponse.redirect(
          new URL("/business/pending", request.url)
        );
      }
    } catch (e) {
      console.error("Failed to fetch business approval status", e);
      return NextResponse.redirect(
        new URL("/business/pending", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
