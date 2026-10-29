// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
  new URL("../../scripts/check-initial-js-size.mjs", import.meta.url),
);
const roots: string[] = [];

function fixture({
  manifest = {
    "index.html": { file: "index.html", isEntry: true, imports: ["assets/main.js"] },
    "assets/main.js": { file: "assets/main.js", isEntry: false },
  },
  includeLogo = true,
  includeGeneratedArtwork = true,
} = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "sahadhyayi-size-"));
  roots.push(root);
  const dist = path.join(root, "dist");
  mkdirSync(path.join(dist, "optimized-assets"), { recursive: true });
  mkdirSync(path.join(dist, "assets"), { recursive: true });
  mkdirSync(path.join(dist, ".vite"), { recursive: true });

  if (includeLogo) {
    writeFileSync(path.join(dist, "optimized-assets/site-logo.webp"), "logo");
    writeFileSync(path.join(dist, "optimized-assets/sahadhyayi-brand-logo.webp"), "brand");
    writeFileSync(path.join(dist, "optimized-assets/library-hero-bg.webp"), "hero");
  }
  if (includeGeneratedArtwork) {
    writeFileSync(path.join(dist, "assets/Sahadhyayi_Book_optimized.generated-123.webp"), "art");
  }
  writeFileSync(path.join(dist, "index.html"), "<!doctype html>");
  writeFileSync(path.join(dist, "assets/main.js"), "console.log('ok');");
  writeFileSync(path.join(dist, ".vite/manifest.json"), JSON.stringify(manifest));
  return root;
}

function runCheck(root: string, budget?: string) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...(budget ? { INITIAL_JS_BUDGET_KB: budget } : {}) },
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("initial JavaScript size guard", () => {
  it("accepts a valid manifest and all required optimized artwork", () => {
    const result = runCheck(fixture());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Initial-route JS (Brotli)");
    expect(result.stderr).toBe("");
  });

  it("fails clearly when a required optimized asset is missing", () => {
    const result = runCheck(fixture({ includeLogo: false }));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Required optimized asset is missing");
  });

  it("fails when generated book artwork is missing", () => {
    const result = runCheck(fixture({ includeGeneratedArtwork: false }));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Required optimized asset is missing");
  });

  it("fails when the manifest has no supported application entry", () => {
    const result = runCheck(fixture({ manifest: { "assets/other.js": { file: "assets/other.js" } } }));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Missing index.html or src/main.tsx entry");
  });

  it("fails when an entry imports a chunk absent from the manifest", () => {
    const result = runCheck(fixture({
      manifest: {
        "index.html": { file: "index.html", isEntry: true, imports: ["assets/missing.js"] },
      },
    }));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Missing manifest import: assets/missing.js");
  });

  it("fails when Brotli-compressed initial JavaScript exceeds the configured budget", () => {
    const result = runCheck(fixture(), "0.001");
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Initial-route JS (Brotli)");
  });
});
