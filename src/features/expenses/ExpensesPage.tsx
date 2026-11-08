import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { expensesRepo } from '../../db/repos/modules'
import { useI18n } from '../../i18n'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { Modal, Confirm } from '../../components/ui/Modal'
import { EmptyState, inputClass } from '../../components/ui/Primitives'
import { motion, AnimatePresence } from 'framer-motion'
import { formatJDate, toDigits, toJalali } from '../../lib/jalali'
import type { Expense } from '../../db/types'

type ExpenseCategory = 'food' | 'transport' | 'home' | 'health' | 'fun' | 'other'

const CATEGORY_META: Record<ExpenseCategory, { emoji: string; key: string; color: string }> = {
  food: { emoji: '🍽️', key: 'expenses.catFood', color: '#F59E0B' },
  transport: { emoji: '🚌', key: 'expenses.catTransport', color: '#38BDF8' },
  home: { emoji: '🏠', key: 'expenses.catHome', color: '#34D399' },
  health: { emoji: '💊', key: 'expenses.catHealth', color: '#F472B6' },
  fun: { emoji: '🎮', key: 'expenses.catFun', color: '#A78BFA' },
  other: { emoji: '📦', key: 'expenses.catOther', color: '#94A3B8' },
}
const CATEGORIES = Object.keys(CATEGORY_META) as ExpenseCategory[]

function fmtAmount(n: number, locale: 'fa' | 'en'): string {
  if (locale === 'fa') return new Intl.NumberFormat('fa-IR').format(n)
  return new Intl.NumberFormat('en-US').format(n)
}

function currentMonthRange(): { start: string; end: string } {
  const { jy, jm } = toJalali(new Date())
  const start = new Date(jy, jm - 1, 1)
  const end = new Date(jy, jm, 0) // آخرین روز ماه
  const p = (d: Date) => {
    const k = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${k(d.getMonth() + 1)}-${k(d.getDate())}`
  }
  return { start: p(start), end: p(end) }
}

export function ExpensesPage() {
  const { t, locale } = useI18n()
  const [addOpen, setAddOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [description, setDescription] = useState('')
  const [confirmDel, setConfirmDel] = useState<Expense | null>(null)

  const { start, end } = useMemo(() => currentMonthRange(), [])
  const monthItems = useLiveQuery(() => expensesRepo.between(start, end), [start, end], undefined)

  const total = monthItems?.reduce((s, e) => s + e.amount, 0) ?? 0
  const byCat = useMemo(() => {
    const map = new Map<ExpenseCategory, number>()
    for (const c of CATEGORIES) map.set(c, 0)
    for (const e of monthItems ?? []) {
      const c = (e.category ?? 'other') as ExpenseCategory
      map.set(c, (map.get(c) ?? 0) + e.amount)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [monthItems])
  const maxCat = Math.max(1, ...byCat.map(([, v]) => v))

  const add = async () => {
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) return
    await expensesRepo.create({
      amount: n,
      category,
      currency: locale === 'fa' ? 'IRR' : 'EUR',
      description: description.trim() || undefined,
    })
    setAmount('')
    setDescription('')
    setAddOpen(false)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold sm:text-2xl">{t('expenses.title')}</h1>
        <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>
          {t('expenses.add')}
        </Button>
      </div>

      {/* جمع ماه */}
      <div className="glass relative overflow-hidden rounded-3xl p-5">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-brand-500/30 to-rose-accent/20 blur-2xl" />
        <p className="relative text-xs font-semibold text-white/50">{t('expenses.monthTotal')}</p>
        <p className="relative mt-1 flex items-baseline gap-1.5" dir="ltr">
          <span className="text-gradient text-4xl font-black tabular-nums">
            {fmtAmount(total, locale)}
          </span>
          <span className="text-xs font-bold text-white/45">
            {monthItems?.[0]?.currency ?? (locale === 'fa' ? 'IRR' : 'EUR')}
          </span>
        </p>
        <p className="relative mt-1 text-[11px] text-white/40">
          {t('expenses.count', { n: toDigits(monthItems?.length ?? 0, locale) })}
        </p>
      </div>

      {/* نوار دسته‌ها */}
      <div className="glass flex flex-col gap-3 rounded-2xl p-4">
        {byCat.map(([cat, value]) => {
          const meta = CATEGORY_META[cat]
          return (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-6 text-center">{meta.emoji}</span>
              <span className="w-20 shrink-0 truncate text-[11px] font-semibold text-white/60">
                {t(meta.key)}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/6">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}77)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(value / maxCat) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                />
              </div>
              <span
                className="w-24 shrink-0 text-left text-[11px] font-bold tabular-nums text-white/70"
                dir="ltr"
              >
                {fmtAmount(value, locale)}
              </span>
            </div>
          )
        })}
      </div>

      {/* لیست */}
      {monthItems === undefined ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : monthItems.length === 0 ? (
        <EmptyState
          icon="wallet"
          title={t('expenses.empty')}
          description={t('expenses.emptyDesc')}
          action={
            <Button variant="primary" icon="plus" onClick={() => setAddOpen(true)}>
              {t('expenses.add')}
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {monthItems.map((exp) => {
              const meta = CATEGORY_META[(exp.category ?? 'other') as ExpenseCategory]
              return (
                <motion.li
                  key={exp.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="glass group flex items-center gap-3 rounded-2xl px-4 py-3"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                    style={{ background: `${meta.color}22` }}
                  >
                    {meta.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold" dir="auto">
                      {exp.description || t(meta.key)}
                    </p>
                    <p className="text-[10px] text-white/40">
                      {formatJDate(new Date(exp.paidAt), locale)}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold tabular-nums text-white/85" dir="ltr">
                    {fmtAmount(exp.amount, locale)}
                  </span>
                  <button
                    onClick={() => setConfirmDel(exp)}
                    aria-label={t('action.delete')}
                    className="rounded p-1 text-white/25 opacity-0 hover:text-red-300 group-hover:opacity-100"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* افزودن */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('expenses.add')}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/55">
              {t('expenses.amount')}
            </label>
            <input
              autoFocus
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              className={inputClass}
              placeholder="0"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/55">
              {t('expenses.category')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const meta = CATEGORY_META[c]
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-[11px] font-semibold transition ${
                      category === c
                        ? 'border-brand-400/70 bg-brand-500/15 text-white'
                        : 'border-white/10 bg-white/5 text-white/55'
                    }`}
                  >
                    <span className="text-lg">{meta.emoji}</span>
                    {t(meta.key)}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/55">
              {t('expenses.description')}
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void add()}
              className={inputClass}
              dir="auto"
            />
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
          if (confirmDel) await expensesRepo.remove(confirmDel.id)
          setConfirmDel(null)
        }}
      />
    </div>
  )
}

export default ExpensesPage
