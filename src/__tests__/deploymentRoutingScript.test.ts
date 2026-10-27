import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(
  new URL("../../scripts/check-cloudflare-routing-config.mjs", import.meta.url),
);
const tempRoots: string[] = [];

function createFixture({
  wrangler = {
    assets: { not_found_handling: "single-page-application" },
    routes: [
      { pattern: "sahadhyayi.com", custom_domain: true },
      { pattern: "www.sahadhyayi.com", custom_domain: true },
    ],
  },
  publicRedirects = false,
  distRedirects = false,
  includeRequiredFiles = true,
} = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "sahadhyayi-routing-"));
  tempRoots.push(root);

  if (includeRequiredFiles) {
    writeFileSync(
      path.join(root, "wrangler.jsonc"),
      JSON.stringify(wrangler, null, 2),
    );
    mkdirSync(path.join(root, "dist"), { recursive: true });
    writeFileSync(path.join(root, "dist", "index.html"), "<!doctype html>");
  }

  if (publicRedirects) {
    mkdirSync(path.join(root, "public"), { recursive: true });
    writeFileSync(path.join(root, "public", "_redirects"), "/* /index.html 200");
  }
  if (distRedirects) {
    mkdirSync(path.join(root, "dist"), { recursive: true });
    writeFileSync(path.join(root, "dist", "_redirects"), "/* /index.html 200");
  }

  return root;
}

function runCheck(root: string) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Cloudflare deployment routing guard", () => {
  it("accepts valid Worker custom domains and the Cloudflare SPA fallback", () => {
    const result = runCheck(createFixture());

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("configured");
    expect(result.stderr).toBe("");
  });

  it("fails with a useful message when required deployment files are missing", () => {
    const result = runCheck(createFixture({ includeRequiredFiles: false }));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Missing required deployment file(s)");
    expect(result.stderr).toContain("wrangler.jsonc");
    expect(result.stderr).toContain("dist/index.html");
  });

  it("rejects a Cloudflare-incompatible public redirects file", () => {
    const result = runCheck(createFixture({ publicRedirects: true }));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("public/_redirects must not exist");
  });

  it("rejects redirects emitted into the built asset directory", () => {
    const result = runCheck(createFixture({ distRedirects: true }));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("dist/_redirects was emitted");
  });

  it("rejects missing SPA fallback configuration in Wrangler", () => {
    const result = runCheck(
      createFixture({
        wrangler: {
          assets: { not_found_handling: "404-page" },
          routes: [
            { pattern: "sahadhyayi.com", custom_domain: true },
            { pattern: "www.sahadhyayi.com", custom_domain: true },
          ],
        },
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not_found_handling");
  });

  it("rejects wildcard routes that conflict with the static-site custom domains", () => {
    const result = runCheck(
      createFixture({
        wrangler: {
          assets: { not_found_handling: "single-page-application" },
          routes: [
            { pattern: "sahadhyayi.com", custom_domain: true },
            { pattern: "www.sahadhyayi.com", custom_domain: true },
            { pattern: "sahadhyayi.com/*" },
          ],
        },
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not wildcard Worker Routes");
  });

  it("rejects a missing www custom domain", () => {
    const result = runCheck(
      createFixture({
        wrangler: {
          assets: { not_found_handling: "single-page-application" },
          routes: [{ pattern: "sahadhyayi.com", custom_domain: true }],
        },
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("must configure sahadhyayi.com and www.sahadhyayi.com");
  });

  it("rejects wildcard routes instead of Cloudflare Worker Custom Domains", () => {
    const result = runCheck(
      createFixture({
        wrangler: {
          assets: { not_found_handling: "single-page-application" },
          routes: [
            { pattern: "sahadhyayi.com/*" },
            { pattern: "www.sahadhyayi.com/*" },
          ],
        },
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not wildcard Worker Routes");
  });
});
