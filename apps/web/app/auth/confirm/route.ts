import {createServerClient} from "@supabase/ssr";
import {type NextRequest, NextResponse} from "next/server";
import {normalizeAuthReturnPath} from "../../../lib/auth";
import {getSupabaseEnvironment, isSupabaseConfigured} from "../../../lib/supabase/config";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const next = normalizeAuthReturnPath(request.nextUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  }

  if (!tokenHash || type !== "email") {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const {url, publishableKey} = getSupabaseEnvironment();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options));
        Object.entries(cacheHeaders).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const {error} = await supabase.auth.verifyOtp({type: "email", token_hash: tokenHash});
  return error ? NextResponse.redirect(new URL("/auth/error", request.url)) : response;
}
