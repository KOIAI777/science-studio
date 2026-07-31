const LOCAL_SITE_URL = "http://127.0.0.1:5173";

function isPlaceholder(value: string | undefined) {
  return !value || value.includes("your-project-ref") || value === "your-publishable-key";
}

export function isSupabaseConfigured() {
  return !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL)
    && !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseEnvironment() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase Auth is not configured.");
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
  };
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? LOCAL_SITE_URL;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return LOCAL_SITE_URL;
  }
}
