import {afterEach, describe, expect, it, vi} from "vitest";
import {verifyTurnstileToken} from "./turnstile";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function configureTurnstile() {
  vi.stubEnv("TURNSTILE_SECRET", "test-secret");
  vi.stubEnv("TURNSTILE_HOSTNAMES", "localhost, 127.0.0.1");
}

describe("verifyTurnstileToken", () => {
  it("accepts a successful response with the expected action and hostname", async () => {
    configureTurnstile();
    const fetchSiteverify = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      action: "login",
      hostname: "127.0.0.1",
    }), {status: 200}));

    await expect(verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "login",
      remoteIp: "203.0.113.8",
    }, fetchSiteverify)).resolves.toBe(true);

    const request = fetchSiteverify.mock.calls[0]?.[1];
    expect(request?.method).toBe("POST");
    expect(String(request?.body)).toContain("response=valid-token");
    expect(String(request?.body)).toContain("remoteip=203.0.113.8");
  });

  it("fails closed when the token or server configuration is missing", async () => {
    const fetchSiteverify = vi.fn<typeof fetch>();

    await expect(verifyTurnstileToken({
      token: null,
      expectedAction: "login",
    }, fetchSiteverify)).resolves.toBe(false);
    await expect(verifyTurnstileToken({
      token: "valid-token",
      expectedAction: "login",
    }, fetchSiteverify)).resolves.toBe(false);
    expect(fetchSiteverify).not.toHaveBeenCalled();
  });

  it("rejects oversized tokens before contacting Siteverify", async () => {
    configureTurnstile();
    const fetchSiteverify = vi.fn<typeof fetch>();

    await expect(verifyTurnstileToken({
      token: "x".repeat(2049),
      expectedAction: "login",
    }, fetchSiteverify)).resolves.toBe(false);
    expect(fetchSiteverify).not.toHaveBeenCalled();
  });

  it.each([
    {success: false, action: "login", hostname: "127.0.0.1"},
    {success: true, action: "checkout", hostname: "127.0.0.1"},
    {success: true, action: "login", hostname: "attacker.example"},
  ])("rejects an invalid Siteverify result %#", async (result) => {
    configureTurnstile();
    const fetchSiteverify = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(result), {status: 200}),
    );

    await expect(verifyTurnstileToken({
      token: "invalid-token",
      expectedAction: "login",
    }, fetchSiteverify)).resolves.toBe(false);
  });

  it("fails closed on Siteverify network and response errors", async () => {
    configureTurnstile();
    const failedRequest = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));
    const failedResponse = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, {status: 503}));

    await expect(verifyTurnstileToken({token: "token", expectedAction: "login"}, failedRequest)).resolves.toBe(false);
    await expect(verifyTurnstileToken({token: "token", expectedAction: "login"}, failedResponse)).resolves.toBe(false);
  });
});
