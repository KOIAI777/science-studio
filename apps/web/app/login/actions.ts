"use server";

import {redirect} from "next/navigation";
import {z} from "zod";
import {normalizeAuthReturnPath} from "../../lib/auth";
import {getSiteUrl, isSupabaseConfigured} from "../../lib/supabase/config";
import {createClient} from "../../lib/supabase/server";

const emailSchema = z.string().trim().email().max(254);

function loginHref(parameters: Record<string, string>) {
  const search = new URLSearchParams(parameters);
  return `/login?${search.toString()}`;
}

export async function requestMagicLink(formData: FormData) {
  const emailResult = emailSchema.safeParse(formData.get("email"));
  const next = normalizeAuthReturnPath(String(formData.get("next") ?? ""));

  if (!emailResult.success) {
    redirect(loginHref({error: "invalid_email", next}));
  }

  if (!isSupabaseConfigured()) {
    redirect(loginHref({error: "configuration", next}));
  }

  const confirmationUrl = new URL("/auth/confirm", getSiteUrl());
  confirmationUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const {error} = await supabase.auth.signInWithOtp({
    email: emailResult.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: confirmationUrl.toString(),
    },
  });

  if (error) {
    redirect(loginHref({error: "send_failed", next}));
  }

  redirect(loginHref({sent: emailResult.data, next}));
}
