import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { journalRepo } from '../../db/repos/modules'
import { useI18n } from '../../i18n'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { inputClass } from '../../components/ui/Primitives'
import { motion } from 'framer-motion'
import { formatJDateFull, jalaliDayKey, toDigits } from '../../lib/jalali'

const MOODS = [
  { v: 1, emoji: '😞', key: 'journal.mood1' },
  { v: 2, emoji: '😕', key: 'journal.mood2' },
  { v: 3, emoji: '😐', key: 'journal.mood3' },
  { v: 4, emoji: '🙂', key: 'journal.mood4' },
  { v: 5, emoji: '🤩', key: 'journal.mood5' },
]

const WEATHERS = [
  { id: 'sunny', emoji: '☀️' },
  { id: 'cloudy', emoji: '☁️' },
  { id: 'rainy', emoji: '🌧️' },
  { id: 'snowy', emoji: '❄️' },
  { id: 'windy', emoji: '💨' },
  { id: 'stormy', emoji: '⛈️' },
]

/** کلید روز از یک date میلادی (برای ناوبری) */
function keyFrom(d: Date): string {
  return jalaliDayKey(d)
}

export function JournalPage() {
  const { t, locale } = useI18n()
  const [day, setDay] = useState(() => keyFrom(new Date()))
  const [text, setText] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [weather, setWeather] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const record = useLiveQuery(() => journalRepo.get(day), [day], undefined)

  useEffect(() => {
    if (record !== undefined) {
      setText(record?.text ?? '')
      setMood(record?.mood ?? null)
      setWeather(record?.weather ?? null)
    }
  }, [record, day])

  const save = async (patch: { text?: string; mood?: number | null; weather?: string | null }) => {
    setSaving(true)
    await journalRepo.save(day, patch)
    window.setTimeout(() => setSaving(false), 300)
  }

  const shiftDay = (delta: number) => {
    const [y, m, d] = day.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + delta)
    setDay(keyFrom(date))
  }

  const todayKey = keyFrom(new Date())
  const displayDate = (() => {
    const [y, m, d] = day.split('-').map(Number)
    return formatJDateFull(new Date(y, m - 1, d), locale)
  })()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold sm:text-2xl">{t('journal.title')}</h1>
        <div className="flex items-center gap-1.5">
          <Button
            variant="glass"
            size="icon"
            icon="chevronRight"
            aria-label={t('journal.next')}
            onClick={() => shiftDay(-1)}
            className="rotate-180 rtl:rotate-0"
          />
          <Button variant="glass" size="sm" onClick={() => setDay(todayKey)}>
            {t('calendar.today')}
          </Button>
          <Button
            variant="glass"
            size="icon"
            icon="chevronRight"
            aria-label={t('journal.prev')}
            onClick={() => shiftDay(1)}
            className="rtl:rotate-180"
          />
        </div>
      </div>

      <motion.div
        key={day}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-white/85">{displayDate}</p>
          <span className="text-[11px] text-white/40">
            {saving ? '…' : record ? t('common.saved') : ''}
          </span>
        </div>

        {/* حال‌وهوا */}
        <p className="mb-2 text-xs font-semibold text-white/55">{t('journal.mood')}</p>
        <div className="mb-4 flex gap-2">
          {MOODS.map((m) => (
            <motion.button
              key={m.v}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                const next = mood === m.v ? null : m.v
                setMood(next)
                void save({ mood: next })
              }}
              aria-label={t(m.key)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition ${
                mood === m.v
                  ? 'bg-gradient-to-br from-brand-500/50 to-rose-accent/40 shadow-[0_0_16px_rgba(236,72,153,0.4)]'
                  : 'bg-white/6 hover:bg-white/10'
              }`}
            >
              {m.emoji}
            </motion.button>
          ))}
        </div>

        {/* هوا */}
        <p className="mb-2 text-xs font-semibold text-white/55">{t('journal.weather')}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {WEATHERS.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                const next = weather === w.id ? null : w.id
                setWeather(next)
                void save({ weather: next })
              }}
              aria-label={t(`journal.${w.id}`)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${
                weather === w.id ? 'bg-white/16 ring-2 ring-brand-400/60' : 'bg-white/6'
              }`}
            >
              {w.emoji}
            </button>
          ))}
        </div>

        {/* متن */}
        <p className="mb-2 text-xs font-semibold text-white/55">{t('journal.text')}</p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          onBlur={() => void save({ text })}
          rows={7}
          placeholder={t('journal.text')}
          dir="auto"
          className={`${inputClass} resize-none leading-7`}
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="primary" icon="check" onClick={() => void save({ text })}>
            {t('action.save')}
          </Button>
        </div>
      </motion.div>

      {/* روزهای اخیر با خاطره */}
      <RecentStrip current={day} onPick={setDay} />
    </div>
  )
}

function RecentStrip({ current, onPick }: { current: string; onPick: (d: string) => void }) {
  const { t, locale } = useI18n()
  const all = useLiveQuery(() => journalRepo.all(), [], [])

  const days: { key: string; date: Date }[] = []
  const base = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    days.push({ key: keyFrom(d), date: d })
  }

  const withRecord = days.filter((d) => all.some((r) => r.day === d.key))
  if (withRecord.length === 0) return null

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/45">
        <Icon name="history" size={13} />
        {t('journal.title')}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {withRecord.map((d) => {
          const rec = all.find((r) => r.day === d.key)!
          const emoji = MOODS.find((m) => m.v === rec.mood)?.emoji ?? '·'
          return (
            <button
              key={d.key}
              onClick={() => onPick(d.key)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2 transition ${
                current === d.key
                  ? 'border-brand-400/60 bg-brand-500/15'
                  : 'border-white/8 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[10px] font-bold text-white/55">
                {toDigits(d.date.getDate(), locale)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default JournalPage
