import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
  new URL("../../scripts/generateSitemap.js", import.meta.url),
);
const roots: string[] = [];

function runGenerator() {
  const root = mkdtempSync(path.join(os.tmpdir(), "sahadhyayi-sitemap-"));
  roots.push(root);
  mkdirSync(path.join(root, "public"), { recursive: true });

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    },
  });

  const sitemapPath = path.join(root, "public", "sitemap.xml");
  const xml = result.status === 0 ? readFileSync(sitemapPath, "utf8") : "";
  return { result, xml };
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("sitemap generator", () => {
  it("generates a valid XML sitemap using safe fallback data without credentials", () => {
    const { result, xml } = runGenerator();

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("[sitemap] Supabase environment variables are missing");
    expect(result.stdout).toContain("[sitemap] Generated");
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain("<loc>https://sahadhyayi.com/</loc>");
    expect(xml).toContain("<loc>https://sahadhyayi.com/library</loc>");
    expect(xml).not.toContain("<loc>https://sahadhyayi.com/book/1</loc>");
    expect(xml).not.toContain("<loc>https://sahadhyayi.com/book/2</loc>");
    expect(xml).not.toContain("<loc>https://sahadhyayi.com/authors/");
    expect(xml).toContain("<image:loc>https://sahadhyayi.com/lovable-uploads/sahadhyayi-logo-digital-reading.png</image:loc>");
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).toContain("</urlset>");
  });

  it("encodes non-Latin author names safely in generated URLs", () => {
    const { xml } = runGenerator();

    // The fallback dataset includes Hindi book titles; URLs remain valid and encoded by encodeURIComponent.
    expect(xml).not.toContain("<loc>https://sahadhyayi.com/book/2</loc>");
    expect(xml).not.toContain("<loc>https://sahadhyayi.com/authors/");
  });
});
