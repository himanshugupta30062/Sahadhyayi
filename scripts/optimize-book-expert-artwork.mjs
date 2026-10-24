import sharp from 'sharp';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '../src/components/book-expert/Sahadhyayi_Book_optimized.webp');
const output = path.resolve(here, '../src/components/book-expert/Sahadhyayi_Book_optimized.generated.webp');

try {
  await access(source);
} catch {
  throw new Error(`Book Expert artwork source is missing: ${source}`);
}

// The artwork is displayed as a small assistant icon, so cap its dimensions and
// encode a visually high-quality WebP derivative for the browser bundle.
await sharp(source, { failOn: 'error' })
  .rotate()
  .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 78, effort: 5, smartSubsample: true })
  .toFile(output);

const [before, after] = await Promise.all([stat(source), stat(output)]);
const reduction = before.size ? (1 - after.size / before.size) * 100 : 0;
console.log(`Book Expert artwork: ${(before.size / 1024).toFixed(0)} KB -> ${(after.size / 1024).toFixed(0)} KB (${reduction.toFixed(1)}% smaller)`);
