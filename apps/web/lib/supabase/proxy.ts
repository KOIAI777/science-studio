import {createServerClient} from "@supabase/ssr";
import {type NextRequest, NextResponse} from "next/server";
import {getSupabaseEnvironment, isSupabaseConfigured} from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({request});

  if (!isSupabaseConfigured()) return response;

  const {url, publishableKey} = getSupabaseEnvironment();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
        response = NextResponse.next({request});
        cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options));
        Object.entries(cacheHeaders).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
