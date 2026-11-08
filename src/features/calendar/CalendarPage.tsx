import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { journalRepo } from '../../db/repos/modules'
import { useI18n } from '../../i18n'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import MaterialIcon from '../../components/ui/MaterialIcon'
import type { GlyphName } from '../../components/ui/glyphs'
import {
  formatJDate,
  jalaliDayKey,
  jalaliMonthLength,
  toDigits,
  toJalali,
  fromJalali,
} from '../../lib/jalali'

const WEEKDAYS_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] // شنبه اول
const WEEKDAYS_EN = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr']

interface DayEvents {
  notes: number
  tasks: number
  journalMood: number | null
  habitHits: number
}

export function CalendarPage() {
  const { t, locale } = useI18n()
  const today = new Date()
  const [cursor, setCursor] = useState(() => {
    const j = toJalali(today)
    return { y: j.jy, m: j.jm }
  })
  const [selected, setSelected] = useState<string>(jalaliDayKey(today))

  const notes = useLiveQuery(() => db.notes.toArray(), [], undefined)
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], undefined)
  const entries = useLiveQuery(() => db.habitEntries.toArray(), [], undefined)
  const journals = useLiveQuery(() => journalRepo.all(), [], [])

  const monthLen = jalaliMonthLength(cursor.y, cursor.m)

  // اولین روز ماه شمسی → روز هفته (0=شنبه)
  const firstWeekday = useMemo(() => {
    const d = fromJalali(cursor.y, cursor.m, 1)
    // getDay(): 0=یکشنبه … 6=شنبه → تبدیل به 0=شنبه
    return (d.getDay() + 1) % 7
  }, [cursor])

  const eventsFor = useMemo(() => {
    const map = new Map<string, DayEvents>()
    const get = (key: string): DayEvents => {
      if (!map.has(key)) map.set(key, { notes: 0, tasks: 0, journalMood: null, habitHits: 0 })
      return map.get(key)!
    }
    for (const n of notes ?? []) {
      if (n.isDeleted) continue
      const key = keyOf(new Date(n.updatedAt))
      get(key).notes++
      if (n.reminderAt) get(keyOf(new Date(n.reminderAt))).notes++
    }
    for (const task of tasks ?? []) {
      if (task.dueAt) get(keyOf(new Date(task.dueAt))).tasks++
    }
    for (const j of journals ?? []) {
      get(j.day).journalMood = j.mood
    }
    for (const e of entries ?? []) {
      if (e.value > 0) get(e.entryDate).habitHits++
    }
    return map
  }, [notes, tasks, journals, entries])

  const selectedNotes = (notes ?? []).filter(
    (n) =>
      !n.isDeleted &&
      (keyOf(new Date(n.updatedAt)) === selected ||
        (n.reminderAt && keyOf(new Date(n.reminderAt)) === selected)),
  )
  const selectedTasks = (tasks ?? []).filter(
    (x) => x.dueAt && keyOf(new Date(x.dueAt)) === selected,
  )
  const selectedJournal = journals.find((j) => j.day === selected)

  const weekdays = locale === 'fa' ? WEEKDAYS_FA : WEEKDAYS_EN

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold sm:text-2xl">{t('calendar.title')}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="icon"
            icon="chevronRight"
            aria-label="ماه قبل"
            onClick={() =>
              setCursor((c) => (c.m === 1 ? { y: c.y - 1, m: 12 } : { ...c, m: c.m - 1 }))
            }
            className="rotate-180 rtl:rotate-0"
          />
          <span className="min-w-40 text-center text-sm font-bold">
            {toDigits(cursor.y, locale)} · {toDigits(cursor.m, locale)}
          </span>
          <Button
            variant="glass"
            size="icon"
            icon="chevronRight"
            aria-label="ماه بعد"
            onClick={() =>
              setCursor((c) => (c.m === 12 ? { y: c.y + 1, m: 1 } : { ...c, m: c.m + 1 }))
            }
            className="rtl:rotate-180"
          />
        </div>
      </div>

      {/* شبکه‌ی ماه */}
      <div className="glass rounded-3xl p-3 sm:p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-white/45">
          {weekdays.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: monthLen }).map((_, i) => {
            const dayNum = i + 1
            const key = jalaliDayKey(fromJalali(cursor.y, cursor.m, dayNum))
            const ev = eventsFor.get(key)
            const isToday = key === jalaliDayKey(today)
            const isSelected = key === selected
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition ${
                  isSelected
                    ? 'bg-gradient-to-br from-brand-500 to-rose-accent text-white shadow-[0_6px_18px_-8px_rgba(236,72,153,0.9)]'
                    : isToday
                      ? 'bg-white/12 text-white ring-1 ring-brand-400/50'
                      : 'text-white/70 hover:bg-white/8'
                }`}
              >
                {toDigits(dayNum, locale)}
                {ev &&
                  (ev.notes > 0 || ev.tasks > 0 || ev.journalMood !== null || ev.habitHits > 0) && (
                    <span className="absolute bottom-1 flex gap-0.5" aria-hidden>
                      {ev.notes > 0 && <i className="h-1 w-1 rounded-full bg-brand-400" />}
                      {ev.tasks > 0 && <i className="h-1 w-1 rounded-full bg-amber-400" />}
                      {ev.journalMood !== null && (
                        <i className="h-1 w-1 rounded-full bg-pink-400" />
                      )}
                      {ev.habitHits > 0 && <i className="h-1 w-1 rounded-full bg-emerald-400" />}
                    </span>
                  )}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 border-t border-white/8 pt-3 text-[10px] text-white/45">
          <Legend color="bg-brand-400" label={t('calendar.notes')} />
          <Legend color="bg-amber-400" label={t('calendar.tasks')} />
          <Legend color="bg-pink-400" label={t('calendar.journal')} />
          <Legend color="bg-emerald-400" label={t('calendar.habits')} />
        </div>
      </div>

      {/* رویدادهای روز انتخاب‌شده */}
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">{formatJDate(selectedDate(selected), locale)}</h2>
          <span className="text-[11px] text-white/40">
            {toDigits(selectedNotes.length + selectedTasks.length, locale)}
          </span>
        </div>

        {selectedNotes.length === 0 && selectedTasks.length === 0 && !selectedJournal ? (
          <p className="py-4 text-center text-sm text-white/40">{t('calendar.noEvents')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedJournal && (
              <div className="flex items-center gap-2 rounded-xl bg-pink-400/10 px-3 py-2 text-sm">
                <MaterialIcon
                  name={MOOD_ICON[selectedJournal.mood ?? 3]}
                  size={18}
                  className="text-pink-300"
                />
                <span className="truncate text-white/75" dir="auto">
                  {selectedJournal.text || t('journal.title')}
                </span>
              </div>
            )}
            {selectedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-sm"
              >
                <Icon name="checklist" size={14} className="text-amber-300" />
                <span
                  className={`truncate ${task.done ? 'line-through text-white/40' : 'text-white/80'}`}
                  dir="auto"
                >
                  {task.title}
                </span>
              </div>
            ))}
            {selectedNotes.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2 rounded-xl bg-brand-400/10 px-3 py-2 text-sm"
              >
                <Icon name="book" size={14} className="text-brand-300" />
                <span className="truncate text-white/80" dir="auto">
                  {n.title || t('notes.untitled')}
                </span>
                {n.reminderAt && keyOf(new Date(n.reminderAt)) === selected && (
                  <Icon name="bell" size={12} className="text-amber-300" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const MOOD_ICON: Record<number, GlyphName> = {
  1: 'sentiment_very_dissatisfied',
  2: 'sentiment_dissatisfied',
  3: 'sentiment_neutral',
  4: 'sentiment_satisfied',
  5: 'sentiment_very_satisfied',
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <i className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

function selectedDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function keyOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default CalendarPage
