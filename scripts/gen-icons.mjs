/**
 * تولید همه‌ی خروجی‌های گرافیکی از SVGهای برند (assets/*.svg)
 * اجرا: npm run icons
 */
import sharp from 'sharp'
import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const A = (p) => path.join(root, 'assets', p)
const P = (p) => path.join(root, 'public', p)

const svgToPng = (svgPath, size, outPath, density = 300) =>
  sharp(A(svgPath), { density })
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(outPath)

async function main() {
  await mkdir(P('icons'), { recursive: true })

  // ── منابع @capacitor/assets (Android/iOS + PWA) ──────────────────────────
  await svgToPng('logo.svg', 1024, A('icon.png'))
  await svgToPng('icon-foreground.svg', 1024, A('icon-foreground.png'))
  await svgToPng('icon-background.svg', 1024, A('icon-background.png'))
  await svgToPng('icon-monochrome.svg', 1024, A('icon-monochrome.png'))
  await svgToPng('splash.svg', 2732, A('splash.png'))
  console.log('✓ assets/icon*.png + splash.png')

  // ── آیکون‌های PWA ────────────────────────────────────────────────────────
  await svgToPng('logo.svg', 192, P('icons/icon-192.png'))
  await svgToPng('logo.svg', 512, P('icons/icon-512.png'))
  // ماسک‌بل: محتوا داخل Safe Zone 80% است → همان مستر
  await svgToPng('logo.svg', 512, P('icons/icon-maskable-512.png'))
  await svgToPng('logo.svg', 32, P('favicon-32.png'), 600)
  await svgToPng('logo.svg', 180, P('apple-touch-icon.png'))
  console.log('✓ public/icons/* + favicon-32 + apple-touch-icon')

  // ── favicon.svg ──────────────────────────────────────────────────────────
  await copyFile(A('logo.svg'), P('favicon.svg'))

  // ── تصویر OG برای README / شبکه‌های اجتماعی ─────────────────────────────
  await composeOg()
  console.log('✓ public/og.png')
}

async function composeOg() {
  const W = 1200
  const H = 630

  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="gv" cx="0.5" cy="0.18" r="0.75">
      <stop offset="0" stop-color="#7C3AED" stop-opacity="0.5"/>
      <stop offset="0.55" stop-color="#7C3AED" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#7C3AED" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gp" cx="0.08" cy="0.95" r="0.7">
      <stop offset="0" stop-color="#DB2777" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#DB2777" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ga" cx="0.94" cy="0.9" r="0.65">
      <stop offset="0" stop-color="#F59E0B" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.5" fill="#FFFFFF" fill-opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#0B0B14"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" fill="url(#gv)"/>
  <rect width="${W}" height="${H}" fill="url(#gp)"/>
  <rect width="${W}" height="${H}" fill="url(#ga)"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#FFFFFF" stroke-opacity="0.10" rx="0"/>
</svg>`

  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer()
  const logo = await sharp(A('icon.png')).resize(200, 200).png().toBuffer()

  const composed = await sharp({
    create: { width: W, height: H, channels: 4, background: '#0B0B14' },
  })
    .composite([
      { input: bg, left: 0, top: 0 },
      { input: logo, left: (W - 200) / 2, top: 58 },
      { input: path.join(root, 'scripts', 'og-text.png'), left: 0, top: 0 },
    ])
    .png()
    .toFile(P('og.png'))
  return composed
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
