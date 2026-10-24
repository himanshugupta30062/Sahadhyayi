import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDirectory = path.join(root, 'public', 'optimized-assets');

const assets = [
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

await mkdir(outputDirectory, { recursive: true });

let sourceBytes = 0;
let outputBytes = 0;

for (const asset of assets) {
  const sourcePath = path.join(root, asset.input);
  const outputPath = path.join(outputDirectory, asset.output);
  const sourceStats = await stat(sourcePath);

  await sharp(sourcePath, { failOn: 'error' })
    .rotate()
    .resize({
      width: asset.width,
      height: asset.height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: asset.quality,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath);

  const outputStats = await stat(outputPath);
  sourceBytes += sourceStats.size;
  outputBytes += outputStats.size;

  const savedPercent = sourceStats.size
    ? ((sourceStats.size - outputStats.size) / sourceStats.size) * 100
    : 0;

  console.log(
    '[performance-assets] ' +
      asset.input +
      ' -> /optimized-assets/' +
      asset.output +
      ': ' +
      Math.round(sourceStats.size / 1024) +
      ' KB -> ' +
      Math.round(outputStats.size / 1024) +
      ' KB (' +
      savedPercent.toFixed(1) +
      '% smaller)'
  );
}

const totalSavedPercent = sourceBytes
  ? ((sourceBytes - outputBytes) / sourceBytes) * 100
  : 0;
console.log(
  '[performance-assets] Combined source images: ' +
    Math.round(sourceBytes / 1024) +
    ' KB -> ' +
    Math.round(outputBytes / 1024) +
    ' KB (' +
    totalSavedPercent.toFixed(1) +
    '% smaller).'
);
