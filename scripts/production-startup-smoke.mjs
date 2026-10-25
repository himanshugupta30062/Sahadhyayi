import { chromium } from "playwright";

const baseURL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const startupErrors = [];

page.on("pageerror", (error) => {
  const message = error?.message || String(error);
  if (/createContext|before initialization|Cannot access|Failed to fetch dynamically imported module|Loading chunk/i.test(message)) {
    startupErrors.push(message);
  }
});

try {
  const response = await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  if (!response || !response.ok()) {
    throw new Error(`Homepage returned HTTP ${response?.status() ?? "no response"}`);
  }

  await page.waitForFunction(() => {
    const root = document.querySelector("#root");
    if (!root || root.childElementCount === 0) return false;
    return !root.innerText.includes("Sahadhyayi could not start");
  }, undefined, { timeout: 25_000 });

  await page.waitForTimeout(1500);
  if (startupErrors.length) {
    throw new Error(`JavaScript startup exception(s): ${startupErrors.join(" | ")}`);
  }

  const rootText = await page.locator("#root").innerText();
  if (!rootText.trim()) {
    throw new Error("React root mounted but contains no visible application content");
  }

  console.log(`Production startup smoke test passed at ${baseURL}`);
  console.log(`Rendered content sample: ${rootText.replace(/\s+/g, " ").slice(0, 180)}`);
} catch (error) {
  console.error(error);
  await page.screenshot({ path: "production-startup-failure.png", fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
