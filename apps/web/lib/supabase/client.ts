import {createBrowserClient} from "@supabase/ssr";
import {getSupabaseEnvironment} from "./config";

export function createClient() {
  const {url, publishableKey} = getSupabaseEnvironment();
  return createBrowserClient(url, publishableKey);
}
