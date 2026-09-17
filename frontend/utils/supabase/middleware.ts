import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request: { headers: request.headers },
	});

	if (!supabaseUrl || !supabaseKey) return supabaseResponse;

	const supabase = createServerClient(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				// 1. Sync cookies into the request so subsequent reads see
				//    the refreshed tokens.
				cookiesToSet.forEach(({ name, value }) =>
					request.cookies.set(name, value)
				);

				// 2. Re-create the response with the updated request.
				supabaseResponse = NextResponse.next({ request });

				// 3. Write Set-Cookie headers into the outgoing response.
				cookiesToSet.forEach(({ name, value, options }) =>
					supabaseResponse.cookies.set(name, value, options)
				);
			},
		},
	});

	await supabase.auth.getUser();
	return supabaseResponse;
}
