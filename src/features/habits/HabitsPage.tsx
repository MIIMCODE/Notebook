import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { habitsRepo } from '../../db/repos/modules'
import { useI18n } from '../../i18n'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { EmptyState, inputClass, NOTE_COLORS } from '../../components/ui/Primitives'
import { Modal, Confirm } from '../../components/ui/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import MaterialIcon from '../../components/ui/MaterialIcon'
import { jalaliDayKey, toDigits } from '../../lib/jalali'
import type { Habit } from '../../db/types'

export function HabitsPage() {
  const { t, locale } = useI18n()
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8B5CF6')
  const [target, setTarget] = useState(1)
  const [confirmDel, setConfirmDel] = useState<Habit | null>(null)

  const habits = useLiveQuery(() => db.habits.toArray(), [], undefined)
  const entries = useLiveQuery(() => db.habitEntries.toArray(), [], undefined)
  const today = jalaliDayKey()

  const visible = useMemo(
    () => (habits ?? []).filter((h) => !h.deletedAt).sort((a, b) => a.position - b.position),
    [habits],
  )

  const valueOn = (habitId: string, day: string) =>
    entries?.find((e) => e.habitId === habitId && e.entryDate === day)?.value ?? 0

  const streakOf = (habitId: string) => {
    const days = new Set(
      (entries ?? []).filter((e) => e.habitId === habitId && e.value > 0).map((e) => e.entryDate),
    )
    const d = new Date()
    if (!days.has(isoKey(d))) d.setDate(d.getDate() - 1)
    let streak = 0
    for (;;) {
      if (!days.has(isoKey(d))) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const add = async () => {
    const v = name.trim()
    if (!v) return
    await habitsRepo.create(v, { color, target })
    setName('')
    setTarget(1)
    setAddOpen(false)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold sm:text-2xl">{t('habits.title')}</h1>
        <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>
          {t('action.new')}
        </Button>
      </div>

      {habits === undefined ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="target"
          title={t('habits.empty')}
          description={t('habits.emptyDesc')}
          action={
            <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>
              {t('action.new')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {visible.map((habit) => {
              const value = valueOn(habit.id, today)
              const done = value >= habit.target
              const pct = Math.min(100, (value / Math.max(1, habit.target)) * 100)
              const streak = streakOf(habit.id)
              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="glass relative overflow-hidden rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => void habitsRepo.bump(habit, today)}
                      aria-label={habit.name}
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-extrabold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${habit.color}, ${habit.color}AA)`,
                        boxShadow: done ? `0 0 18px ${habit.color}88` : undefined,
                      }}
                    >
                      {done ? (
                        <Icon name="check" size={22} />
                      ) : (
                        <span className="text-sm">{toDigits(value, locale)}</span>
                      )}
                    </motion.button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-bold" dir="auto">
                          {habit.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {streak > 0 && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <MaterialIcon
                                name="local_fire_department"
                                size={13}
                                className="text-amber-400"
                              />
                              {toDigits(streak, locale)} {t('habits.streak')}
                            </span>
                          )}
                          <button
                            onClick={() => setConfirmDel(habit)}
                            aria-label={t('action.delete')}
                            className="rounded p-1 text-white/25 hover:text-red-300"
                          >
                            <Icon name="close" size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${habit.color}, ${habit.color}66)`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-white/40">
                        {t('habits.target')}: {toDigits(habit.target, locale)} ·{' '}
                        {t(`habits.${habit.frequency}`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* افزودن عادت */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('habits.add')}>
        <div className="flex flex-col gap-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void add()}
            className={inputClass}
            placeholder={t('habits.add')}
            dir="auto"
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-white/55">{t('notes.color')}</p>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.filter((c) => c.value).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                  className={`h-7 w-7 rounded-full border-2 ${color === c.value ? 'border-white scale-110' : 'border-white/15'}`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/55">{t('habits.target')}</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setTarget(n)}
                  className={`h-9 w-9 rounded-xl text-sm font-bold transition ${
                    target === n
                      ? 'bg-gradient-to-br from-brand-500 to-rose-accent text-white'
                      : 'bg-white/8 text-white/60'
                  }`}
                >
                  {toDigits(n, locale)}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="lg" onClick={() => void add()}>
            {t('action.create')}
          </Button>
        </div>
      </Modal>

      <Confirm
        open={!!confirmDel}
        title={t('action.delete')}
        confirmLabel={t('action.delete')}
        onCancel={() => setConfirmDel(null)}
        onConfirm={async () => {
          if (confirmDel) await habitsRepo.remove(confirmDel.id)
          setConfirmDel(null)
        }}
      />
    </div>
  )
}

function isoKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default HabitsPage
