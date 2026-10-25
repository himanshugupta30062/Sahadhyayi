/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
vi.unmock("@/utils/security");
vi.unmock("@/utils/security.ts");
import {
  clearCSRFToken,
  createSecureHeaders,
  generateCSRFToken,
  getCSRFToken,
  getSafeRedirectUrl,
  initializeSecurity,
  setCSRFToken,
  validateFileUpload,
} from "@/utils/security";

describe("CSRF token helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.cookie = "csrfToken=; Path=/; Max-Age=0";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a non-empty token without base64 padding", () => {
    const token = generateCSRFToken();
    expect(token).toMatch(/^[A-Za-z0-9+/]+$/);
    expect(token).not.toContain("=");
  });

  it("stores and retrieves a token from session storage", () => {
    setCSRFToken("test-token");
    expect(sessionStorage.getItem("csrfToken")).toBe("test-token");
    expect(getCSRFToken()).toBe("test-token");
  });

  it("falls back to the cookie when session storage is empty", () => {
    document.cookie = "csrfToken=cookie-token; Path=/";
    expect(getCSRFToken()).toBe("cookie-token");
  });

  it("clears the token from session storage and expires its cookie", () => {
    setCSRFToken("old-token");
    clearCSRFToken();
    expect(sessionStorage.getItem("csrfToken")).toBeNull();
    expect(getCSRFToken()).toBeNull();
  });

  it("includes the CSRF header only when requested and a token exists", () => {
    setCSRFToken("header-token");
    expect(createSecureHeaders()).toMatchObject({ "X-CSRF-Token": "header-token" });
    expect(createSecureHeaders(false)).not.toHaveProperty("X-CSRF-Token");
    clearCSRFToken();
    expect(createSecureHeaders()).not.toHaveProperty("X-CSRF-Token");
  });

  it("initializes a session token only when one is absent", () => {
    const randomSpy = vi.spyOn(crypto, "getRandomValues");
    initializeSecurity();
    expect(getCSRFToken()).toBeTruthy();
    const token = getCSRFToken();
    initializeSecurity();
    expect(getCSRFToken()).toBe(token);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });
});

describe("validateFileUpload", () => {
  const file = (name: string, type: string, size = 100) =>
    new File(["x".repeat(size)], name, { type });

  it("rejects missing files and files larger than the configured limit", () => {
    expect(validateFileUpload(null as unknown as File)).toMatchObject({
      valid: false,
      error: "No file provided",
    });
    expect(validateFileUpload(file("large.png", "image/png", 11), [], 10)).toMatchObject({
      valid: false,
      error: expect.stringContaining("File size exceeds"),
    });
  });

  it("checks allowed MIME types when a list is provided", () => {
    expect(validateFileUpload(file("doc.pdf", "application/pdf"), ["image/png"])).toMatchObject({
      valid: false,
      error: "File type not allowed",
    });
  });

  it.each([
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["photo.png", "image/png"],
    ["photo.webp", "image/webp"],
    ["book.pdf", "application/pdf"],
    ["notes.txt", "text/plain"],
    ["data.json", "application/json"],
  ])("accepts matching extension for %s", (name, type) => {
    expect(validateFileUpload(file(name, type)).valid).toBe(true);
  });

  it("rejects a known MIME type with a mismatched extension", () => {
    expect(validateFileUpload(file("payload.exe", "application/pdf"))).toMatchObject({
      valid: false,
      error: "File extension does not match content type",
    });
  });

  it("allows unknown MIME types when no allow-list blocks them", () => {
    expect(validateFileUpload(file("payload.bin", "application/octet-stream")).valid).toBe(true);
  });
});

describe("getSafeRedirectUrl", () => {
  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/javascript:alert(1)", "data:text/html,hello"])(
    "falls back for unsafe redirect %s",
    (target) => expect(getSafeRedirectUrl(target)).toBe("/dashboard"),
  );

  it("preserves safe internal paths and custom defaults", () => {
    expect(getSafeRedirectUrl("/library?sort=recent")).toBe("/library?sort=recent");
    expect(getSafeRedirectUrl(null, "/")).toBe("/");
    expect(getSafeRedirectUrl("  /profile  ")).toBe("/profile");
  });
});
