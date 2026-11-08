/** کنفتی کانواسی — شبیه دفترچه من (بدون وابستگی) */
const COLORS = ['#a855f7', '#22d3ee', '#f472b6', '#fbbf24', '#34d399']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  s: number
  c: string
  r: number
  l: number
}

export function confetti(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = document.createElement('canvas')
  cv.setAttribute('aria-hidden', 'true')
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:300'
  document.body.append(cv)
  const ctx = cv.getContext('2d')
  if (!ctx) {
    cv.remove()
    return
  }
  const w = (cv.width = window.innerWidth)
  const h = (cv.height = window.innerHeight)
  const ps: Particle[] = Array.from({ length: 110 }, () => ({
    x: w / 2,
    y: h * 0.6,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 4,
    s: 4 + Math.random() * 6,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
    r: Math.random() * 6,
    l: 1,
  }))
  const frame = () => {
    ctx.clearRect(0, 0, w, h)
    let alive = false
    for (const p of ps) {
      p.vy += 0.35
      p.x += p.vx
      p.y += p.vy
      p.r += 0.2
      p.l -= 0.011
      if (p.l <= 0) continue
      alive = true
      ctx.save()
      ctx.globalAlpha = p.l
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6)
      ctx.restore()
    }
    if (alive) {
      requestAnimationFrame(frame)
    } else {
      ctx.clearRect(0, 0, w, h)
      cv.remove()
    }
  }
  requestAnimationFrame(frame)
}

export default confetti
