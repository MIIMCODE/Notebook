import { useEffect, useRef } from 'react'

/** پس‌زمینه‌ی چندلایه: mesh متحرک +۳ کره + شبکه + نویز + هاله‌ی موس */
export function Backdrop() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    const glow = glowRef.current
    if (!glow) return
    let mx = 0
    let my = 0
    let gx = 0
    let gy = 0
    let running = false
    const loop = () => {
      gx += (mx - gx) * 0.15
      gy += (my - gy) * 0.15
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`
      if (Math.abs(mx - gx) > 0.5 || Math.abs(my - gy) > 0.5) {
        requestAnimationFrame(loop)
      } else {
        running = false
      }
    }
    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      glow.classList.add('on')
      if (!running) {
        running = true
        requestAnimationFrame(loop)
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      <div className="yc-backdrop" aria-hidden>
        <div className="bg-mesh" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="bg-grid" />
        <div className="bg-noise" />
      </div>
      <div ref={glowRef} className="yc-cursor-glow" aria-hidden />
    </>
  )
}

export default Backdrop
