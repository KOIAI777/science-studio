import {describe, expect, it} from "vitest";
import {formatAccountRole, normalizeAuthReturnPath} from "./auth";

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

describe("formatAccountRole", () => {
  it("only exposes the internal administrator label for the admin role", () => {
    expect(formatAccountRole("admin")).toBe("Administrator");
    expect(formatAccountRole("teacher")).toBe("Teacher");
    expect(formatAccountRole(undefined)).toBe("Teacher");
  });
});
