import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating PWA icons from public/icon.svg...');

  // 1. Standard 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');

  // 2. Standard 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');

  // 3. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  // 4. Maskable 512x512 (adds 15% safe padding around the icon)
  const innerSize = Math.round(512 * 0.75); // 384px inside 512px
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#FEF3C7',
    },
  })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toFile('public/pwa-maskable-512x512.png');

  // 5. Favicon 48x48 PNG (named favicon.ico)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile('public/favicon.ico');

  console.log('All PWA icons generated successfully in public/');
}

generate().catch(console.error);
