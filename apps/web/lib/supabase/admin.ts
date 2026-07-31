import {execFileSync} from "node:child_process";
import {createClient as createSupabaseClient} from "@supabase/supabase-js";
import {getSupabaseEnvironment} from "./config";

function getAdminKey() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key) return key;

  const keychainService = process.env.SUPABASE_SECRET_KEYCHAIN_SERVICE?.trim();
  const keychainAccount = process.env.SUPABASE_SECRET_KEYCHAIN_ACCOUNT?.trim();
  if (process.platform === "darwin" && keychainService && keychainAccount) {
    return execFileSync(
      "/usr/bin/security",
      ["find-generic-password", "-a", keychainAccount, "-s", keychainService, "-w"],
      {encoding: "utf8"},
    ).trim();
  }

  throw new Error("Supabase server key is not configured.");
}

export function isSupabaseAdminConfigured() {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY
      || process.env.SUPABASE_SERVICE_ROLE_KEY
      || (process.platform === "darwin"
        && process.env.SUPABASE_SECRET_KEYCHAIN_SERVICE
        && process.env.SUPABASE_SECRET_KEYCHAIN_ACCOUNT),
  );
}

export function createAdminClient() {
  const {url} = getSupabaseEnvironment();
  return createSupabaseClient(url, getAdminKey(), {
    auth: {autoRefreshToken: false, persistSession: false},
  });
}
