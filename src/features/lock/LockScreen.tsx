import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n'
import Icon from '../../components/ui/Icon'
import {
  biometricsAvailable,
  biometricUnlock,
  verifyPin,
  markSessionUnlocked,
} from '../../lib/lock'

interface LockState {
  locked: boolean
  lock: () => void
  unlock: () => void
}

export const useLock = create<LockState>((set) => ({
  locked: false,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}))

export function LockScreen() {
  const { t } = useI18n()
  const locked = useLock((s) => s.locked)
  const unlock = useLock((s) => s.unlock)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [bioReady, setBioReady] = useState(false)

  useEffect(() => {
    if (!locked) return
    setPin('')
    setError(false)
    void (async () => {
      const ok = await biometricsAvailable()
      setBioReady(ok)
      if (ok && (await biometricUnlock())) {
        markSessionUnlocked()
        unlock()
      }
    })()
  }, [locked, unlock])

  const tryBio = async () => {
    if (await biometricUnlock()) {
      markSessionUnlocked()
      unlock()
    }
  }

  const submit = async (value: string) => {
    if (await verifyPin(value)) {
      markSessionUnlocked()
      unlock()
    } else {
      setError(true)
      setPin('')
      window.setTimeout(() => setError(false), 900)
    }
  }

  const tap = (d: string) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) void submit(next)
  }

  if (!locked) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-8 bg-ink-950/97 backdrop-blur-2xl"
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-rose-accent shadow-[0_12px_40px_-10px_rgba(236,72,153,0.8)]"
          >
            <Icon name="lock" size={28} className="text-white" />
          </motion.div>
          <h1 className="text-lg font-extrabold">{t('lock.title')}</h1>
          <p className={`text-xs font-semibold ${error ? 'text-red-400' : 'text-white/45'}`}>
            {error ? t('lock.wrongPin') : t('lock.enterPin')}
          </p>
        </div>

        {/* نقطه‌های PIN */}
        <motion.div
          animate={error ? { x: [0, -10, 10, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-4"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full border-2 transition ${
                i < pin.length
                  ? 'border-transparent bg-gradient-to-br from-brand-400 to-rose-accent'
                  : 'border-white/30'
              }`}
            />
          ))}
        </motion.div>

        {/* کیبورد */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <KeyButton key={d} onClick={() => tap(d)} label={d} />
          ))}
          <button
            onClick={() => void (bioReady && tryBio())}
            disabled={!bioReady}
            aria-label={t('lock.useFingerprint')}
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/8 disabled:opacity-25"
          >
            <Icon name="fingerprint" size={26} />
          </button>
          <KeyButton onClick={() => tap('0')} label="0" />
          <button
            onClick={() => setPin((p) => p.slice(0, -1))}
            aria-label="⌫"
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white/60 transition hover:bg-white/8"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function KeyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/6 text-xl font-bold text-white transition hover:bg-white/12 active:bg-brand-500/40"
    >
      {label}
    </motion.button>
  )
}

export default LockScreen
