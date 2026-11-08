type LogoProps = {
  className?: string
  /** بدون گوشه‌های گرد (برای اسپلش/سربرگ) */
  bare?: boolean
}

/** لوگوی برند یادچه — همان SVG وکتور assets/logo.svg به صورت کامپوننت */
export function Logo({ className, bare = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      className={className}
      role="img"
      aria-label="یادچه"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="yc-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="0.45" stopColor="#DB2777" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="yc-light" cx="0.28" cy="0.16" r="0.95">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.06" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="yc-vig" cx="0.5" cy="0.44" r="0.8">
          <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#1E0B4B" stopOpacity="0.42" />
        </radialGradient>
        <linearGradient id="yc-page" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F5F3FF" />
        </linearGradient>
        <linearGradient id="yc-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F472B6" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <filter id="yc-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="26" stdDeviation="30" floodColor="#3B0764" floodOpacity="0.5" />
        </filter>
        <filter id="yc-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="yc-clip">
          <rect width="1024" height="1024" rx={bare ? 0 : 224} />
        </clipPath>
      </defs>
      <g clipPath="url(#yc-clip)">
        <rect width="1024" height="1024" fill="url(#yc-bg)" />
        <rect width="1024" height="1024" fill="url(#yc-light)" />
        <rect width="1024" height="1024" fill="url(#yc-vig)" />
        <g filter="url(#yc-shadow)">
          <path
            d="M404 236 H656 A56 56 0 0 1 712 292 V732 A56 56 0 0 1 656 788 H368 A56 56 0 0 1 312 732 V324 Z"
            fill="url(#yc-page)"
          />
          <path d="M312 324 L404 236 L404 324 Z" fill="#E9D5FF" />
          <rect x="372" y="404" width="188" height="36" rx="18" fill="#C4B5FD" />
          <rect x="372" y="480" width="132" height="36" rx="18" fill="#F9A8D4" />
          <rect x="372" y="556" width="76" height="36" rx="18" fill="#FCD34D" />
          <path d="M580 236 H656 V560 L618 518 L580 560 Z" fill="url(#yc-ribbon)" />
        </g>
        <g filter="url(#yc-glow)">
          <path
            d="M800 636 Q804 668 836 676 Q804 684 800 716 Q796 684 764 676 Q796 668 800 636 Z"
            fill="#FFFFFF"
          />
          <circle cx="764" cy="612" r="10" fill="#FFFFFF" opacity="0.85" />
        </g>
      </g>
    </svg>
  )
}

export default Logo
