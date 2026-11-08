import { useEffect, useRef, useState } from 'react'
import { pomodoroRepo } from '../../db/repos/modules'
import { useI18n } from '../../i18n'
import { useUi } from '../../stores/ui'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { motion, AnimatePresence } from 'framer-motion'
import { toDigits } from '../../lib/jalali'

type Phase = 'focus' | 'short' | 'long'
const DURATION: Record<Phase, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
const PHASE_ORDER: Phase[] = ['focus', 'short', 'focus', 'short', 'focus', 'long']

const RING = 2 * Math.PI * 118

/** بوق کوتاه با WebAudio (بدون فایل) */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 1)
    osc.onended = () => void ctx.close()
  } catch {
    /* بی‌صدا رد شو */
  }
}

export function PomodoroPage() {
  const { t, locale } = useI18n()
  const toast = useUi((s) => s.toast)
  const [phase, setPhase] = useState<Phase>('focus')
  const [remaining, setRemaining] = useState(DURATION.focus)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const startAtRef = useRef<number>(0)
  const remainedRef = useRef(DURATION.focus)

  useEffect(() => {
    void pomodoroRepo.todayCount().then(setSessions)
  }, [])

  // تیکر اصلی
  useEffect(() => {
    if (!running) return
    startAtRef.current = Date.now()
    remainedRef.current = remaining
    let raf = 0
    let lastSec = remaining
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startAtRef.current) / 1000)
      const left = Math.max(0, remainedRef.current - elapsed)
      if (left !== lastSec) {
        lastSec = left
        setRemaining(left)
      }
      if (left <= 0) {
        setRunning(false)
        beep()
        void finishPhase()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const finishPhase = async () => {
    if (phase === 'focus') {
      await pomodoroRepo.log('focus', 25, true)
      const n = await pomodoroRepo.todayCount()
      setSessions(n)
      toast(t('pomodoro.done'), 'success')
      // مرحله بعد
      const next = (phaseIdx + 1) % PHASE_ORDER.length
      setPhaseIdx(next)
      setPhase(PHASE_ORDER[next])
      setRemaining(DURATION[PHASE_ORDER[next]])
    } else {
      setPhaseIdx((i) => (i + 1) % PHASE_ORDER.length)
      setPhase('focus')
      setRemaining(DURATION.focus)
    }
  }

  const switchPhase = (p: Phase) => {
    setRunning(false)
    setPhase(p)
    setRemaining(DURATION[p])
  }

  const reset = () => {
    setRunning(false)
    setRemaining(DURATION[phase])
  }

  const pct = 1 - remaining / DURATION[phase]
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const phaseLabel =
    phase === 'focus'
      ? t('pomodoro.focus')
      : phase === 'short'
        ? t('pomodoro.shortBreak')
        : t('pomodoro.longBreak')

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6">
      <h1 className="self-start text-xl font-extrabold sm:text-2xl">{t('pomodoro.title')}</h1>

      {/* انتخاب فاز */}
      <div className="flex gap-2 rounded-full bg-white/6 p-1">
        {(['focus', 'short', 'long'] as const).map((p) => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              phase === p
                ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white'
                : 'text-white/55'
            }`}
          >
            {p === 'focus'
              ? t('pomodoro.focus')
              : p === 'short'
                ? t('pomodoro.shortBreak')
                : t('pomodoro.longBreak')}
          </button>
        ))}
      </div>

      {/* حلقه */}
      <div className="relative">
        <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
          <defs>
            <linearGradient id="pomoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="55%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <circle
            cx="140"
            cy="140"
            r="118"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="14"
          />
          <motion.circle
            cx="140"
            cy="140"
            r="118"
            fill="none"
            stroke="url(#pomoGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={RING}
            animate={{ strokeDashoffset: RING * (1 - pct) }}
            transition={{ duration: 0.4, ease: 'linear' }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.55))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${mm}:${ss}`}
              initial={{ opacity: 0.4, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-6xl font-black tracking-tight text-gradient"
              dir="ltr"
            >
              {toDigits(mm, locale)}:{toDigits(ss, locale).padStart(2, '0')}
            </motion.p>
          </AnimatePresence>
          <p className="mt-2 text-xs font-semibold text-white/50">{phaseLabel}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
            <Icon name="check" size={11} />
            {t('pomodoro.sessions')}: {toDigits(sessions, locale)}
          </p>
        </div>
      </div>

      {/* کنترل‌ها */}
      <div className="flex items-center gap-3">
        <Button
          variant="glass"
          size="icon"
          icon="history"
          aria-label={t('pomodoro.reset')}
          onClick={reset}
        />
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setRunning((r) => !r)}
          className="flex h-16 w-32 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-rose-accent text-sm font-extrabold text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.9)]"
        >
          <Icon name={running ? 'pause' : 'play'} size={18} />
          {running
            ? t('pomodoro.pause')
            : remaining < DURATION[phase]
              ? t('pomodoro.resume')
              : t('pomodoro.start')}
        </motion.button>
        <Button
          variant="glass"
          size="icon"
          icon="chevronRight"
          aria-label={t('pomodoro.done')}
          onClick={() => void finishPhase()}
          className="rtl:rotate-180"
        />
      </div>

      {/* تاریخچه اخیر */}
      <RecentSessions />
    </div>
  )
}

function RecentSessions() {
  const { t, locale } = useI18n()
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof pomodoroRepo.recent>>>([])

  useEffect(() => {
    void pomodoroRepo
      .recent(12)
      .then(setRecent)
      .catch(() => setRecent([]))
  }, [])

  if (recent.length === 0) return null

  return (
    <div className="w-full">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">
        {t('pomodoro.sessions')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {recent.map((s) => (
          <span
            key={s.id}
            className="rounded-xl bg-white/6 px-2.5 py-1.5 text-[10px] font-semibold text-white/55"
            dir="ltr"
          >
            {new Date(s.startedAt).toLocaleTimeString(locale === 'fa' ? 'fa-IR' : 'en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ))}
      </div>
    </div>
  )
}

export default PomodoroPage
