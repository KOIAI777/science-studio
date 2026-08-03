const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2048;

type VerifyTurnstileInput = {
  token: FormDataEntryValue | null;
  expectedAction: string;
  remoteIp?: string;
};

type SiteverifyResponse = {
  success?: unknown;
  action?: unknown;
  hostname?: unknown;
};

function configuredHostnames() {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
}

export async function verifyTurnstileToken(
  {token, expectedAction, remoteIp}: VerifyTurnstileInput,
  fetchSiteverify: typeof fetch = fetch,
) {
  const secret = process.env.TURNSTILE_SECRET?.trim();
  const expectedHostnames = configuredHostnames();

  if (
    typeof token !== "string"
    || token.length === 0
    || token.length > MAX_TOKEN_LENGTH
    || !secret
    || expectedHostnames.size === 0
  ) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  const normalizedRemoteIp = remoteIp?.trim();
  if (normalizedRemoteIp && normalizedRemoteIp.length <= 64) {
    body.set("remoteip", normalizedRemoteIp);
  }

  try {
    const response = await fetchSiteverify(SITEVERIFY_URL, {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;

    const result = await response.json() as SiteverifyResponse;
    return result.success === true
      && result.action === expectedAction
      && typeof result.hostname === "string"
      && expectedHostnames.has(result.hostname);
  } catch {
    return false;
  }
}
