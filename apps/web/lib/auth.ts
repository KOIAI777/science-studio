export const DEFAULT_AUTH_RETURN_PATH = "/account";

const AUTH_RETURN_ORIGIN = "https://science-studio.invalid";
const MAX_AUTH_CREDENTIAL_LENGTH = 2048;

type AuthConfirmationInput = {
  code?: FormDataEntryValue | null;
  tokenHash?: FormDataEntryValue | null;
  type?: FormDataEntryValue | null;
};

export type AuthConfirmation =
  | {kind: "token_hash"; tokenHash: string}
  | {kind: "code"; code: string};

function validCredential(value: FormDataEntryValue | null | undefined): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_AUTH_CREDENTIAL_LENGTH;
}

export function parseAuthConfirmation({code, tokenHash, type}: AuthConfirmationInput): AuthConfirmation | null {
  if (type === "email" && validCredential(tokenHash)) {
    return {kind: "token_hash", tokenHash};
  }

  if (validCredential(code)) {
    return {kind: "code", code};
  }

  return null;
}

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
