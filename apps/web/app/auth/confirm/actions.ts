"use server";

import {redirect} from "next/navigation";
import {normalizeAuthReturnPath, parseAuthConfirmation} from "../../../lib/auth";
import {isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";

export async function confirmMagicLink(formData: FormData) {
  const confirmation = parseAuthConfirmation({
    code: formData.get("code"),
    tokenHash: formData.get("token_hash"),
    type: formData.get("type"),
  });
  const next = normalizeAuthReturnPath(String(formData.get("next") ?? ""));

  if (!confirmation) {
    redirect("/auth/error?reason=invalid");
  }

  if (!isSupabaseConfigured()) {
    redirect(`/login?error=configuration&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const {error} = confirmation.kind === "code"
    ? await supabase.auth.exchangeCodeForSession(confirmation.code)
    : await supabase.auth.verifyOtp({type: "email", token_hash: confirmation.tokenHash});

  if (error) {
    redirect("/auth/error?reason=expired");
  }

  redirect(next);
}
