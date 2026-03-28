/**
 * Generate Low Quality Image Placeholders (LQIP) for all gallery images.
 * Outputs a JSON map of image paths → tiny base64 data URIs.
 *
 * Usage: node scripts/generate-lqip.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public/images');
const folders = ['Music', 'Portraits', 'Wedding', 'Food', 'Sport', 'Travel'];

const lqip = {};

for (const folder of folders) {
  const dir = path.join(publicDir, folder);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();

  for (const file of files) {
    const filePath = path.join(dir, file);
    const buffer = await sharp(filePath)
      .resize(20)
      .jpeg({ quality: 20 })
      .toBuffer();

    const key = `/images/${folder}/${file}`;
    lqip[key] = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }
}

const outPath = path.join(root, 'src/data/lqip.json');
fs.writeFileSync(outPath, JSON.stringify(lqip, null, 2));
console.log(`Generated LQIP for ${Object.keys(lqip).length} images → src/data/lqip.json`);
