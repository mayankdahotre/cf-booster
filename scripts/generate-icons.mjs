import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 32, 48, 128];

function createSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1f8acb"/>
        <stop offset="100%" style="stop-color:#9b59b6"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#g)"/>
    <path d="M72 28 L48 68 H64 L56 100 L88 56 H70 Z" fill="white"/>
  </svg>`;
}

for (const size of sizes) {
  await sharp(Buffer.from(createSvg(size)))
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, `icon${size}.png`));
  console.log(`Generated icon${size}.png`);
}
