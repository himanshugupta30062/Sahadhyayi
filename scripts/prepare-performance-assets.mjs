import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicOutput = path.join(root, 'public', 'optimized-assets');

const jobs = [
  {
    input: 'public/lovable-uploads/logo-small.webp',
    output: 'site-logo.webp',
    width: 256,
    height: 256,
    quality: 76,
  },
  {
    input: 'src/components/book-expert/Sahadhyayi_Book_optimized.webp',
    output: 'book-expert-icon.webp',
    width: 256,
    height: 256,
    quality: 76,
  },
  {
    input: 'public/lovable-uploads/sahadhyayi-logo-digital-reading.png',
    output: 'sahadhyayi-brand-logo.webp',
    width: 512,
    height: 512,
    quality: 80,
  },
  {
    input: 'src/assets/library-hero-bg.jpg',
    output: 'library-hero-bg.webp',
    width: 1600,
    height: 1000,
    quality: 78,
  },
];

await mkdir(publicOutput, { recursive: true });

let originalBytes = 0;
let optimizedBytes = 0;

for (const job of jobs) {
  const inputPath = path.join(root, job.input);
  const outputPath = path.join(publicOutput, job.output);
  const before = await stat(inputPath);

  await sharp(inputPath, { failOn: 'error' })
    .rotate()
    .resize({
      width: job.width,
      height: job.height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: job.quality,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath);

  const after = await stat(outputPath);
  originalBytes += before.size;
  optimizedBytes += after.size;
  const reduction = before.size > 0 ? ((before.size - after.size) / before.size) * 100 : 0;

  console.log(
    '[performance-assets] ' +
      job.input +
      ' -> /optimized-assets/' +
      job.output +
      ': ' +
      Math.round(before.size / 1024) +
      ' KB -> ' +
      Math.round(after.size / 1024) +
      ' KB (' +
      reduction.toFixed(1) +
      '% smaller)'
  );
}

const totalReduction = originalBytes > 0 ? ((originalBytes - optimizedBytes) / originalBytes) * 100 : 0;
console.log(
  '[performance-assets] Total: ' +
    Math.round(originalBytes / 1024) +
    ' KB -> ' +
    Math.round(optimizedBytes / 1024) +
    ' KB (' +
    totalReduction.toFixed(1) +
    '% smaller).'
);
