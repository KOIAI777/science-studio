export const DEFAULT_AUTH_RETURN_PATH = "/account";

const AUTH_RETURN_ORIGIN = "https://science-studio.invalid";

export function normalizeAuthReturnPath(value: string | null | undefined) {
  if (!value || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) {
    return DEFAULT_AUTH_RETURN_PATH;
  }

  try {
    const url = new URL(value, AUTH_RETURN_ORIGIN);
    if (url.origin !== AUTH_RETURN_ORIGIN || !url.pathname.startsWith("/")) {
      return DEFAULT_AUTH_RETURN_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_RETURN_PATH;
  }
}

export function formatAccountRole(role: string | null | undefined) {
  return role === "admin" ? "Administrator" : "Teacher";
}
