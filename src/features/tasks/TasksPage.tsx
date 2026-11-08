import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { tasksRepo } from '../../db/repos/modules'
import { useI18n } from '../../i18n'
import { useUi } from '../../stores/ui'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Primitives'
import { motion, AnimatePresence } from 'framer-motion'
import { formatJDate, toDigits } from '../../lib/jalali'
import type { Task } from '../../db/types'

type Filter = 'all' | 'active' | 'done'

const PRIORITY_STYLE = [
  'bg-white/10 text-white/55',
  'bg-sky-400/15 text-sky-300',
  'bg-amber-400/15 text-amber-300',
  'bg-red-400/15 text-red-300',
]
const PRIORITY_LABEL = ['tasks.noPriority', 'tasks.low', 'tasks.med', 'tasks.high']

export function TasksPage() {
  const { t, locale } = useI18n()
  const toast = useUi((s) => s.toast)
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const tasks = useLiveQuery(() => db.tasks.toArray(), [], undefined)

  const filtered = useMemo(() => {
    if (!tasks) return []
    const sorted = [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      if (a.priority !== b.priority) return b.priority - a.priority
      return a.position - b.position
    })
    if (filter === 'active') return sorted.filter((x) => !x.done)
    if (filter === 'done') return sorted.filter((x) => x.done)
    return sorted
  }, [tasks, filter])

  const doneCount = tasks?.filter((x) => x.done).length ?? 0

  const add = async () => {
    const v = title.trim()
    if (!v) return
    await tasksRepo.create(v)
    setTitle('')
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{t('tasks.title')}</h1>
          <p className="mt-0.5 text-xs text-white/45">
            {toDigits(doneCount, locale)} / {toDigits(tasks?.length ?? 0, locale)}
          </p>
        </div>
        {doneCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            icon="trash"
            onClick={async () => {
              const n = await tasksRepo.clearDone()
              toast(`${t('common.deleted')} (${toDigits(n, locale)})`, 'success')
            }}
          >
            {t('tasks.clearDone')}
          </Button>
        )}
      </div>

      {/* افزودن */}
      <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-rose-accent text-white">
          <Icon name="plus" size={16} />
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void add()}
          placeholder={t('tasks.add')}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
          dir="auto"
        />
        {title && (
          <Button size="sm" variant="primary" onClick={() => void add()}>
            {t('action.add')}
          </Button>
        )}
      </div>

      {/* فیلتر */}
      <div className="flex gap-2">
        {(
          [
            { id: 'all', label: t('notes.all') },
            { id: 'active', label: t('tasks.active') },
            { id: 'done', label: t('tasks.done') },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              filter === f.id
                ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white'
                : 'bg-white/6 text-white/55 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* لیست */}
      {tasks === undefined ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="checklist" title={t('tasks.empty')} description={t('tasks.emptyDesc')} />
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((task) => (
              <TaskRow key={task.id} task={task} locale={locale} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

function TaskRow({ task, locale }: { task: Task; locale: 'fa' | 'en' }) {
  const { t } = useI18n()
  const checked = task.done

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="glass group flex items-center gap-3 rounded-2xl px-4 py-3"
    >
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => void tasksRepo.toggle(task.id)}
        aria-label={task.title}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
          checked
            ? 'border-transparent bg-gradient-to-br from-brand-500 to-rose-accent text-white'
            : 'border-white/25 hover:border-brand-400'
        }`}
      >
        {checked && <Icon name="check" size={13} />}
      </motion.button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold transition ${
            checked ? 'text-white/35 line-through' : 'text-white/90'
          }`}
          dir="auto"
        >
          {task.title}
        </p>
        {(task.dueAt || task.priority > 0) && (
          <div className="mt-1 flex items-center gap-2 text-[10px]">
            {task.dueAt && (
              <span className="flex items-center gap-1 text-white/45">
                <Icon name="clock" size={10} />
                {formatJDate(new Date(task.dueAt), locale)}
              </span>
            )}
            {task.priority > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-semibold ${PRIORITY_STYLE[task.priority]}`}
              >
                {t(PRIORITY_LABEL[task.priority])}
              </span>
            )}
          </div>
        )}
      </div>

      {/* اولویت چرخه‌ای */}
      <button
        onClick={() =>
          void tasksRepo.update(task.id, {
            priority: ((task.priority + 1) % 4) as Task['priority'],
          })
        }
        aria-label={t('tasks.priority')}
        className={`rounded-lg px-1.5 py-1 text-[10px] font-bold opacity-0 transition group-hover:opacity-100 ${PRIORITY_STYLE[task.priority]}`}
      >
        P{task.priority}
      </button>
      <button
        onClick={() => void tasksRepo.remove(task.id)}
        aria-label={t('action.delete')}
        className="rounded-lg p-1.5 text-white/30 opacity-0 transition hover:text-red-300 group-hover:opacity-100"
      >
        <Icon name="close" size={14} />
      </button>
    </motion.li>
  )
}

export default TasksPage
