import { GLYPHS, type GlyphName } from './glyphs'

/** آیکون رسمی Google Material Symbols (بدون فونت — SVG درون‌خطی) */
export function MaterialIcon({
  name,
  size = 20,
  className,
  filled = false,
}: {
  name: GlyphName
  size?: number
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      fillOpacity={filled ? 1 : 0.92}
      aria-hidden
      focusable="false"
      className={`shrink-0 ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] }}
    />
  )
}

export default MaterialIcon
