import {describe, expect, it} from "vitest";
import {formatAccountRole, normalizeAuthReturnPath, parseAuthConfirmation} from "./auth";

describe("normalizeAuthReturnPath", () => {
  it("keeps local application paths", () => {
    expect(normalizeAuthReturnPath("/account?tab=library")).toBe("/account?tab=library");
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(normalizeAuthReturnPath("https://example.com")).toBe("/account");
    expect(normalizeAuthReturnPath("//example.com")).toBe("/account");
  });

  it("rejects backslash and control-character redirect variants", () => {
    expect(normalizeAuthReturnPath("/\\example.com")).toBe("/account");
    expect(normalizeAuthReturnPath("/account\nLocation: https://example.com")).toBe("/account");
  });

  it("defaults missing return paths to the account page", () => {
    expect(normalizeAuthReturnPath(undefined)).toBe("/account");
  });
});

describe("parseAuthConfirmation", () => {
  it("accepts an email token hash", () => {
    expect(parseAuthConfirmation({tokenHash: "token-hash", type: "email"})).toEqual({
      kind: "token_hash",
      tokenHash: "token-hash",
    });
  });

  it("keeps compatibility with PKCE authorization codes", () => {
    expect(parseAuthConfirmation({code: "authorization-code"})).toEqual({
      kind: "code",
      code: "authorization-code",
    });
  });

  it("rejects token hashes without the email verification type", () => {
    expect(parseAuthConfirmation({tokenHash: "token-hash", type: "recovery"})).toBeNull();
    expect(parseAuthConfirmation({tokenHash: "token-hash"})).toBeNull();
  });

  it("rejects missing, file, and oversized credentials", () => {
    expect(parseAuthConfirmation({})).toBeNull();
    expect(parseAuthConfirmation({code: new File([], "code")})).toBeNull();
    expect(parseAuthConfirmation({code: "x".repeat(2049)})).toBeNull();
  });
});

describe("formatAccountRole", () => {
  it("only exposes the internal administrator label for the admin role", () => {
    expect(formatAccountRole("admin")).toBe("Administrator");
    expect(formatAccountRole("teacher")).toBe("Teacher");
    expect(formatAccountRole(undefined)).toBe("Teacher");
  });
});
