import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { foldersRepo } from '../../db/repos/folders'
import { useI18n } from '../../i18n'
import { Modal } from '../../components/ui/Modal'
import { toDigits } from '../../lib/jalali'
import type { Folder, Note } from '../../db/types'

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(value > 0 ? 6 : 0, Math.round((value / Math.max(1, max)) * 100))
  return (
    <div className="yc-bar-row">
      <span className="truncate text-white/65" dir="auto">
        {label}
      </span>
      <div className="yc-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <b className="text-start text-sm tabular-nums">{value}</b>
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: [string, number][] }) {
  const nonZero = rows.filter(([, v]) => v > 0)
  if (nonZero.length === 0) return null
  const max = Math.max(1, ...nonZero.map(([, v]) => v))
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-white/80">{title}</h3>
      <div className="flex flex-col gap-2">
        {nonZero.map(([l, v]) => (
          <Bar key={l} label={l} value={v} max={max} />
        ))}
      </div>
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = {
  text: 'type.text',
  checklist: 'type.checklist',
  table: 'type.table',
  code: 'type.code',
  image: 'type.image',
  audio: 'type.audio',
  drawing: 'type.drawing',
}

export function DashboardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useI18n()
  const notes = useLiveQuery(() => db.notes.toArray(), [], [] as Note[])
  const folders = useLiveQuery<Folder[], Folder[]>(() => foldersRepo.all(), [], [])

  const live = useMemo(() => (notes ?? []).filter((n) => !n.isDeleted && !n.isArchived), [notes])

  const total = live.length
  const pinned = live.filter((n) => n.isPinned).length
  const words = live.reduce(
    (s, n) => s + (n.title + ' ' + n.plainText).trim().split(/\s+/).filter(Boolean).length,
    0,
  )

  const weekRows: [string, number][] = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'short' })
    const out: [string, number][] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const start = d.getTime()
      const end = start + 86400000
      out.push([
        fmt.format(d),
        live.filter((n) => n.createdAt >= start && n.createdAt < end).length,
      ])
    }
    return out
  }, [live, locale])

  const typeRows: [string, number][] = Object.entries(TYPE_LABEL).map(([type, key]) => [
    t(key),
    live.filter((n) => n.type === type).length,
  ])

  const folderRows: [string, number][] = (folders ?? []).map((f) => [
    f.name,
    live.filter((n) => n.folderId === f.id).length,
  ])

  const stats = [
    { label: t('dashboard.total'), value: total },
    { label: t('dashboard.pinned'), value: pinned },
    { label: t('dashboard.words'), value: words },
  ]

  return (
    <Modal open={open} onClose={onClose} title={t('dashboard.title')}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="yc-stat rounded-2xl bg-white/6">
              <div>
                <b className="text-gradient">{toDigits(s.value, locale)}</b>
                <small>{s.label}</small>
              </div>
            </div>
          ))}
        </div>
        <Section title={t('dashboard.week')} rows={weekRows} />
        <Section title={t('dashboard.byType')} rows={typeRows} />
        {folderRows.length > 0 && <Section title={t('dashboard.byFolder')} rows={folderRows} />}
      </div>
    </Modal>
  )
}

export default DashboardModal
