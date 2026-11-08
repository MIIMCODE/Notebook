import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Logo from './Logo'

type Props = {
  /** وقتی انیمیشن تمام شد فراخوانی می‌شود */
  onDone: () => void
  /** مدت نمایش (میلی‌ثانیه) */
  duration?: number
}

/**
 * اسپلش انیمیت‌شده یادچه:
 * 1) ظاهر شدن نرم لوگو (مقیاس + محوشدگی + بلور)
 * 2) درخشش نور روی لوگو (shine sweep)
 * 3) محو شدن روان به سمت اپ
 * طبق prefers-reduced-motion ساده می‌شود.
 */
export function SplashScreen({ onDone, duration = 1900 }: Props) {
  const reduce = useReducedMotion()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = window.setTimeout(() => setLeaving(true), duration - 450)
    const t2 = window.setTimeout(onDone, duration)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [duration, onDone])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduce ? 0.15 : 0.45, ease: 'easeInOut' }}
      aria-label="یادچه"
    >
      {/* هاله‌ی پس‌زمینه */}
      <motion.div
        className="absolute h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.35),transparent_65%)] blur-2xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduce ? 0.01 : 1.1, ease: 'easeOut' }}
      />

      <div className="relative">
        <motion.div
          className="relative overflow-hidden rounded-[24%]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.72, filter: 'blur(14px)' }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={
            reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 210, damping: 17, mass: 0.9 }
          }
        >
          <Logo className="h-36 w-36 drop-shadow-[0_18px_50px_rgba(124,58,237,0.55)] sm:h-44 sm:w-44" />

          {/* درخشش روی لوگو */}
          {!reduce && (
            <motion.span
              className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              initial={{ x: '-160%', opacity: 0 }}
              animate={{ x: [' -160%', '420%'], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, delay: 0.55, ease: 'easeInOut' }}
            />
          )}
        </motion.div>

        <motion.h1
          className="mt-7 text-center text-4xl font-extrabold tracking-tight text-gradient sm:text-5xl"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: reduce ? 0 : 0.45, duration: 0.6, ease: 'easeOut' }}
        >
          یادچه
        </motion.h1>

        <motion.p
          className="mt-3 text-center text-sm text-white/60 sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0.05 : 0.75, duration: 0.5 }}
        >
          هر چیزی که باید بماند، اینجاست.
        </motion.p>
      </div>

      {/* نقطه‌های بارگذاری */}
      {!reduce && (
        <div className="absolute bottom-16 flex gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-brand-400"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -4, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default SplashScreen
