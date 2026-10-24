import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "wrangler.jsonc",
  "netlify.toml",
  "dist/index.html",
];
const missing = requiredFiles.filter((file) => !existsSync(path.join(root, file)));
const errors = [];

if (missing.length > 0) {
  errors.push(`Missing required deployment file(s): ${missing.join(", ")}`);
}

if (existsSync(path.join(root, "public/_redirects"))) {
  errors.push(
    "public/_redirects must not exist for the Cloudflare Workers Static Assets deployment. " +
    "Use wrangler.jsonc for Cloudflare SPA fallback and netlify.toml for Netlify."
  );
}

if (existsSync(path.join(root, "dist/_redirects"))) {
  errors.push(
    "dist/_redirects was emitted into the Cloudflare asset bundle. Remove the incompatible " +
    "redirect file so Wrangler can publish the deployment."
  );
}

if (missing.length === 0) {
  const wrangler = readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
  if (!/"not_found_handling"\s*:\s*"single-page-application"/.test(wrangler)) {
    errors.push(
      'wrangler.jsonc must set assets.not_found_handling to "single-page-application" ' +
      "so direct client-side routes continue to work without _redirects."
    );
  }

  const hasApexWorkerRoute =
    /"pattern"\\s*:\\s*"sahadhyayi\\.com\\/\\*"\\s*,\\s*"zone_name"\\s*:\\s*"sahadhyayi\\.com"/.test(wrangler);
  const hasWwwWorkerRoute =
    /"pattern"\\s*:\\s*"www\\.sahadhyayi\\.com\\/\\*"\\s*,\\s*"zone_name"\\s*:\\s*"sahadhyayi\\.com"/.test(wrangler);
  if (!hasApexWorkerRoute || !hasWwwWorkerRoute) {
    errors.push(
      "wrangler.jsonc must route both sahadhyayi.com/* and www.sahadhyayi.com/* " +
      "through the sahadhyayi.com Cloudflare zone."
    );
  }

  const netlify = readFileSync(path.join(root, "netlify.toml"), "utf8");
  const hasNetlifySpaFallback =
    /\[\[redirects\]\]/.test(netlify) &&
    /from\s*=\s*"\/\*"/.test(netlify) &&
    /to\s*=\s*"\/index\.html"/.test(netlify) &&
    /status\s*=\s*200/.test(netlify);
  if (!hasNetlifySpaFallback) {
    errors.push(
      'netlify.toml must keep the SPA fallback (from = "/*", to = "/index.html", status = 200).'
    );
  }
}

if (errors.length > 0) {
  console.error("[deployment-routing] Invalid routing configuration:");
  for (const error of errors) console.error(` - ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "[deployment-routing] Cloudflare SPA fallback and Netlify SPA fallback are configured; " +
    "no Cloudflare-incompatible _redirects file is present."
  );
}
