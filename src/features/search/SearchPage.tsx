import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { foldersRepo } from '../../db/repos/folders'
import { tagsRepo } from '../../db/repos/tags'
import { useI18n } from '../../i18n'
import NoteCard from '../notes/NoteCard'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Primitives'
import type { Note, NoteType } from '../../db/types'
import { motion, AnimatePresence } from 'framer-motion'

type DateFilter = 'any' | 'today' | 'week' | 'month'
const TYPES: NoteType[] = ['text', 'checklist', 'table', 'code', 'image', 'audio', 'drawing']

export function SearchPage() {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // راه‌اندازی از URL: /search?q=…
  useEffect(() => {
    const urlQ = searchParams.get('q')
    if (urlQ) {
      setQ(urlQ)
      const next = new URLSearchParams(searchParams)
      next.delete('q')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [folder, setFolder] = useState<string | ''>('')
  const [type, setType] = useState<NoteType | ''>('')
  const [tag, setTag] = useState<string | ''>('')
  const [date, setDate] = useState<DateFilter>('any')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [inTitle, setInTitle] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  const notes = useLiveQuery(() => db.notes.toArray(), [], undefined)
  const folders = useLiveQuery(() => foldersRepo.all(), [], [])
  const allTags = useLiveQuery(() => tagsRepo.all(), [], [])
  const noteTags = useLiveQuery(
    async () => {
      const all = await db.notes.toArray()
      return tagsRepo.forNotes(all.map((n) => n.id))
    },
    [notes],
    undefined,
  )

  const results = useMemo(() => {
    if (!notes) return []
    const query = q.trim().toLowerCase()
    const now = Date.now()
    const since =
      date === 'today'
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : date === 'week'
          ? now - 7 * 86400000
          : date === 'month'
            ? now - 30 * 86400000
            : 0

    return notes
      .filter((n) => !n.isDeleted && !n.isArchived)
      .filter((n) => (folder ? n.folderId === folder : true))
      .filter((n) => (type ? n.type === type : true))
      .filter((n) => (pinnedOnly ? n.isPinned : true))
      .filter((n) => (since ? n.updatedAt >= since : true))
      .filter((n) => {
        if (!tag) return true
        const tags = noteTags?.get(n.id) ?? []
        return tags.some((x) => x.id === tag)
      })
      .filter((n) => {
        if (!query) return true
        if (inTitle) return n.title.toLowerCase().includes(query)
        return n.title.toLowerCase().includes(query) || n.plainText.toLowerCase().includes(query)
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, q, folder, type, tag, date, pinnedOnly, inTitle, noteTags])

  const hasFilter = q || folder || type || tag || date !== 'any' || pinnedOnly || inTitle

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold sm:text-2xl">{t('search.title')}</h1>

      {/* جستجوی سریع */}
      <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
        <Icon name="search" size={18} className="shrink-0 text-white/45" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          dir="auto"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            aria-label={t('action.clear')}
            className="text-white/40 hover:text-white"
          >
            <Icon name="close" size={16} />
          </button>
        )}
        <button
          onClick={() => setAdvanced((v) => !v)}
          aria-label={t('search.advanced')}
          className={`rounded-lg p-1.5 transition ${advanced ? 'bg-brand-500/30 text-brand-200' : 'text-white/45 hover:bg-white/10'}`}
        >
          <Icon name="filter" size={16} />
        </button>
      </div>

      {/* فیلتر پیشرفته */}
      <AnimatePresence>
        {advanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-3">
              <FilterSelect label={t('notes.folder')} value={folder} onChange={setFolder}>
                <option value="">{t('notes.all')}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label={t('notes.type')}
                value={type}
                onChange={(v) => setType(v as NoteType | '')}
              >
                <option value="">{t('notes.all')}</option>
                {TYPES.map((x) => (
                  <option key={x} value={x}>
                    {t(`type.${x}`)}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect label={t('nav.tags')} value={tag} onChange={setTag}>
                <option value="">{t('notes.all')}</option>
                {allTags.map((x) => (
                  <option key={x.id} value={x.id}>
                    #{x.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label={t('notes.updated')}
                value={date}
                onChange={(v) => setDate(v as DateFilter)}
              >
                <option value="any">{t('search.anyDate')}</option>
                <option value="today">{t('search.today')}</option>
                <option value="week">{t('search.week')}</option>
                <option value="month">{t('search.month')}</option>
              </FilterSelect>
              <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-white/65 sm:col-span-1">
                <input
                  type="checkbox"
                  checked={pinnedOnly}
                  onChange={(e) => setPinnedOnly(e.target.checked)}
                  className="h-4 w-4 accent-brand-500"
                />
                {t('search.pinnedOnly')}
              </label>
              <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-white/65 sm:col-span-1">
                <input
                  type="checkbox"
                  checked={inTitle}
                  onChange={(e) => setInTitle(e.target.checked)}
                  className="h-4 w-4 accent-brand-500"
                />
                {t('search.inTitle')}
              </label>
              {hasFilter && (
                <div className="col-span-full flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="x"
                    onClick={() => {
                      setQ('')
                      setFolder('')
                      setType('')
                      setTag('')
                      setDate('any')
                      setPinnedOnly(false)
                      setInTitle(false)
                    }}
                  >
                    {t('action.clear')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* نتایج */}
      {q || hasFilter ? (
        notes === undefined ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('search.noResults')}
            description={t('search.noResultsDesc')}
          />
        ) : (
          <>
            <p className="text-xs font-semibold text-white/45">
              {t('search.results', { n: results.length })}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map((n: Note) => (
                  <NoteCard key={n.id} note={n} tags={noteTags?.get(n.id) ?? []} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )
      ) : (
        <EmptyState
          icon="search"
          title={t('search.placeholder')}
          description={t('search.advanced')}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-white/45">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-ink-800 px-3 py-2 text-xs text-white outline-none focus:border-brand-400/60"
      >
        {children}
      </select>
    </label>
  )
}

export default SearchPage
