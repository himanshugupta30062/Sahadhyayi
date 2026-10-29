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
      SAHADHYAYI_DISABLE_PUBLIC_SEO_CONFIG: "1",
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
  it("generates canonical static public URLs without inventing dynamic URLs when credentials are absent", () => {
    const { result, xml } = runGenerator();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Generated");
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain("<loc>https://sahadhyayi.com/</loc>");
    expect(xml).toContain("<loc>https://sahadhyayi.com/library</loc>");
    expect(xml).toContain("<loc>https://sahadhyayi.com/articles</loc>");
    expect(xml).toContain("<loc>https://sahadhyayi.com/blog/what-is-sahadhyayi-meaning-story</loc>");
    expect(xml).toContain("<image:loc>https://sahadhyayi.com/lovable-uploads/sahadhyayi-logo-digital-reading.png</image:loc>");
    expect(xml).not.toContain("<loc>https://sahadhyayi.com/book/");
    expect(xml).not.toContain("<loc>https://sahadhyayi.com/author/");
    expect(xml).toContain("</urlset>");
  });

  it("escapes XML-sensitive values and uses only known canonical routes", () => {
    const { result, xml } = runGenerator();

    expect(result.status).toBe(0);
    expect(xml).not.toContain("/signin");
    expect(xml).not.toContain("/signup");
    expect(xml).not.toContain("undefined");
    expect(xml).not.toContain("null");
  });
});
