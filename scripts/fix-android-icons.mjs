/**
 * تکمیل خروجی @capacitor/assets برای اندروید:
 * 1) حذف <inset> 16.7% از adaptive icon (چون محتوای ما خودش در Safe Zone است)
 * 2) افزودن لایه Monochrome برای Themed Icons اندروید 13+
 * بعد از `npx @capacitor/assets generate` اجرا شود.
 */
import sharp from 'sharp'
import { writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const res = path.join(root, 'android', 'app', 'src', 'main', 'res')

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  )

const XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>`

const DENSITIES = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
]

async function main() {
  if (!(await exists(res))) {
    console.warn('! پلتفرم android پیدا نشد — رد شد')
    return
  }

  // 1) XMLهای adaptive بدون inset + با monochrome
  for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
    const p = path.join(res, 'mipmap-anydpi-v26', name)
    if (await exists(p)) {
      await writeFile(p, XML + '\n')
      console.log('✓ patched', name)
    }
  }

  // 2) مونوکروم در همه‌ی densityها
  const monoSrc = path.join(root, 'assets', 'icon-monochrome.png')
  for (const [density, size] of DENSITIES) {
    const dir = path.join(res, `mipmap-${density}`)
    if (!(await exists(dir))) continue
    await sharp(monoSrc)
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(dir, 'ic_launcher_monochrome.png'))
  }
  console.log('✓ ic_launcher_monochrome.png ×', DENSITIES.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
