/**
 * Generate optimized WebP versions of all gallery images + a dimensions manifest.
 * Outputs WebP files alongside originals and a JSON manifest with width/height.
 *
 * Usage: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public/images');
const folders = ['Music', 'Portraits', 'Wedding', 'Food', 'Sport', 'Travel'];

const manifest = {};
let converted = 0;
let skipped = 0;

for (const folder of folders) {
  const dir = path.join(publicDir, folder);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png)$/i.test(f))
    .sort();

  for (const file of files) {
    const filePath = path.join(dir, file);
    const webpName = file.replace(/\.(jpe?g|png)$/i, '.webp');
    const webpPath = path.join(dir, webpName);
    const key = `/images/${folder}/${file}`;
    const webpKey = `/images/${folder}/${webpName}`;

    // Get dimensions from original
    const metadata = await sharp(filePath).metadata();
    manifest[key] = {
      width: metadata.width,
      height: metadata.height,
      webp: webpKey,
    };

    // Skip if WebP already exists and is newer than source
    if (fs.existsSync(webpPath)) {
      const srcStat = fs.statSync(filePath);
      const webpStat = fs.statSync(webpPath);
      if (webpStat.mtimeMs > srcStat.mtimeMs) {
        skipped++;
        continue;
      }
    }

    // Generate WebP — cap width at 1600px for gallery use
    const maxWidth = 1600;
    let pipeline = sharp(filePath);
    if (metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth);
    }
    await pipeline.webp({ quality: 82 }).toFile(webpPath);
    converted++;
  }
}

const outPath = path.join(root, 'src/data/image-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Optimized ${converted} images (${skipped} cached) → src/data/image-manifest.json`);
