import { describe, expect, it } from "vitest";
import { toAppError, safeJson } from "@/lib/errors";

describe("toAppError", () => {
  it("converts a string to an application error with default severity", () => {
    expect(toAppError("request failed")).toMatchObject({
      name: "AppError",
      message: "request failed",
      severity: "high",
    });
  });

  it("safely converts null, undefined, and primitive rejection values", () => {
    expect(toAppError(null)).toMatchObject({ name: "AppError", message: "null", severity: "high" });
    expect(toAppError(undefined)).toMatchObject({ name: "AppError", message: "undefined", severity: "high" });
    expect(toAppError(42)).toMatchObject({ name: "AppError", message: "42", severity: "high" });
  });

  it("preserves status and code and merges context", () => {
    const input = Object.assign(new Error("bad request"), {
      status: 400,
      code: "BAD_REQUEST",
      context: { route: "/books" },
    });
    expect(toAppError(input, { severity: "medium", context: { requestId: "req-1" } }))
      .toMatchObject({
        status: 400,
        code: "BAD_REQUEST",
        severity: "medium",
        context: { requestId: "req-1", route: "/books" },
      });
  });
});

describe("safeJson", () => {
  it("parses JSON and handles empty bodies", async () => {
    await expect(safeJson(new Response('{"ok":true}'))).resolves.toEqual({ ok: true });
    await expect(safeJson(new Response(""))).resolves.toEqual({});
  });

  it("returns the original text when a response is not JSON", async () => {
    await expect(safeJson(new Response("upstream unavailable"))).resolves.toEqual({
      raw: "upstream unavailable",
    });
  });
});
