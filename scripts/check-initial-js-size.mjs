import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { brotliCompressSync } from 'node:zlib';

const dist = path.resolve('dist');

const compressedAssetBudgets = [
  { path: 'optimized-assets/site-logo.webp', maxKb: 40 },
  { path: 'optimized-assets/sahadhyayi-brand-logo.webp', maxKb: 100 },
  { path: 'optimized-assets/library-hero-bg.webp', maxKb: 180 },
  { path: 'assets/Sahadhyayi_Book_optimized.generated', prefix: true, suffix: '.webp', maxKb: 80 },
];

for (const asset of compressedAssetBudgets) {
  let assetPath = path.join(dist, asset.path);
  if (asset.prefix) {
    const directory = path.dirname(assetPath);
    const match = readdirSync(directory).find((name) =>
      name.startsWith(path.basename(asset.path)) && name.endsWith(asset.suffix)
    );
    if (!match) throw new Error('Required optimized asset is missing: ' + asset.path + '*.webp');
    assetPath = path.join(directory, match);
  }

  const bytes = readFileSync(assetPath).length;
  const sizeKb = bytes / 1000;
  console.log('[asset-budget] ' + path.relative(dist, assetPath) + ': ' + sizeKb.toFixed(2) + ' kB / ' + asset.maxKb + ' kB');
  if (sizeKb > asset.maxKb) {
    throw new Error('Optimized asset exceeds its size budget: ' + path.relative(dist, assetPath));
  }
}
const manifest = JSON.parse(readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8'));
const entries = Object.entries(manifest);
// Vite's HTML entry points to src/main.tsx through static imports. Start
// from index.html so the check follows the same initial dependency graph as the browser.
const entry = entries.find(([key, value]) =>
  value.isEntry && (key === 'index.html' || value.src === 'index.html')
) ?? entries.find(([key, value]) =>
  value.isEntry && (value.src === 'src/main.tsx' || key === 'src/main.tsx' || key.endsWith('/main.tsx'))
);
if (!entry) throw new Error('Missing index.html or src/main.tsx entry in Vite manifest.');

const visited = new Set();
const files = new Set();
function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error('Missing manifest import: ' + key);
  if (chunk.file?.endsWith('.js')) files.add(chunk.file);
  for (const imported of chunk.imports ?? []) visit(imported);
}
visit(entry[0]);

let bytes = 0;
for (const file of files) {
  bytes += brotliCompressSync(readFileSync(path.join(dist, file))).length;
}
const kb = bytes / 1000;
const limit = Number(process.env.INITIAL_JS_BUDGET_KB ?? 280);
console.log('Initial-route JS (Brotli): ' + kb.toFixed(2) + ' kB / ' + limit + ' kB across ' + files.size + ' static chunks.');
if (kb > limit) process.exitCode = 1;
