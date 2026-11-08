import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { notesRepo } from '../../db/repos/notes'
import { foldersRepo } from '../../db/repos/folders'
import { tagsRepo } from '../../db/repos/tags'
import { useI18n } from '../../i18n'
import { useUi } from '../../stores/ui'
import NoteCard from './NoteCard'
import NewNoteSheet from './NewNoteSheet'
import { NoteSkeletonGrid, EmptyState } from '../../components/ui/Primitives'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { Modal, Confirm } from '../../components/ui/Modal'
import { ColorPicker, Field, inputClass } from '../../components/ui/Primitives'
import type { Note } from '../../db/types'
import { formatJDate } from '../../lib/jalali'

export function NotesPage() {
  const { t, locale } = useI18n()
  const toast = useUi((s) => s.toast)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [menuNote, setMenuNote] = useState<Note | null>(null)
  const [colorFor, setColorFor] = useState<Note | null>(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [confirmTrash, setConfirmTrash] = useState<Note | null>(null)

  const notes = useLiveQuery(() => db.notes.toArray(), [], undefined)
  const folders = useLiveQuery(() => foldersRepo.all(), [], [])
  const noteTagsMap = useLiveQuery(
    async () => {
      const all = await db.notes.toArray()
      return tagsRepo.forNotes(all.map((n) => n.id))
    },
    [notes],
    undefined,
  )

  const loading = notes === undefined

  const visible = useMemo(() => {
    if (!notes) return []
    return notes
      .filter((n) => (showArchived ? n.isArchived : !n.isArchived))
      .filter((n) => !n.isDeleted)
      .filter((n) => (folderFilter ? n.folderId === folderFilter : true))
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        return b.updatedAt - a.updatedAt
      })
  }, [notes, showArchived, folderFilter])

  const pinned = visible.filter((n) => n.isPinned)
  const rest = visible.filter((n) => !n.isPinned)

  const createFolder = async () => {
    const name = folderName.trim()
    if (!name) return
    await foldersRepo.create(name)
    setFolderName('')
    setNewFolderOpen(false)
    toast(t('common.saved'), 'success')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* هدر */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{t('notes.title')}</h1>
          <p className="mt-0.5 text-xs text-white/45">
            {t('notes.count', { n: visible.length })} · {formatJDate(new Date(), locale)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="icon"
            icon={showArchived ? 'archive' : 'grid'}
            aria-label={t('nav.archive')}
            onClick={() => setShowArchived((v) => !v)}
            className={showArchived ? 'text-amber-300' : ''}
          />
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setSheetOpen(true)}
            className="hidden sm:inline-flex"
          >
            {t('action.new')}
          </Button>
        </div>
      </div>

      {/* چیپ‌های پوشه */}
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        <FolderChip
          active={folderFilter === null && !showArchived}
          label={t('notes.all')}
          icon="home"
          onClick={() => {
            setFolderFilter(null)
            setShowArchived(false)
          }}
        />
        {folders.map((f) => (
          <FolderChip
            key={f.id}
            active={folderFilter === f.id}
            label={f.name}
            color={f.color}
            icon="folder"
            onClick={() => {
              setFolderFilter(f.id)
              setShowArchived(false)
            }}
          />
        ))}
        <button
          onClick={() => setNewFolderOpen(true)}
          className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-dashed border-white/20 px-3 text-xs text-white/55 transition hover:border-brand-400/60 hover:text-white"
          aria-label={t('folders.new')}
        >
          <Icon name="plus" size={13} />
          {t('folders.new')}
        </button>
      </div>

      {/* محتوا */}
      {loading ? (
        <NoteSkeletonGrid />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={showArchived ? 'archive' : 'book'}
          title={showArchived ? t('notes.archiveEmpty') : t('notes.empty')}
          description={showArchived ? undefined : t('notes.emptyDesc')}
          action={
            !showArchived && (
              <Button variant="primary" icon="plus" onClick={() => setSheetOpen(true)}>
                {t('action.newNote')}
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {pinned.length > 0 && (
            <Section title={t('notes.pinned')} icon="pin">
              <NoteGrid notes={pinned} noteTagsMap={noteTagsMap} onMore={setMenuNote} />
            </Section>
          )}
          {rest.length > 0 && (
            <Section title={showArchived ? t('notes.archived') : t('notes.recent')} icon="clock">
              <NoteGrid notes={rest} noteTagsMap={noteTagsMap} onMore={setMenuNote} />
            </Section>
          )}
        </div>
      )}

      {/* FAB موبایل */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setSheetOpen(true)}
        aria-label={t('action.newNote')}
        className="fixed bottom-24 end-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-rose-accent to-amber-accent text-white shadow-[0_12px_32px_-8px_rgba(236,72,153,0.7)] sm:hidden"
      >
        <Icon name="plus" size={26} />
      </motion.button>

      <NewNoteSheet open={sheetOpen} onClose={() => setSheetOpen(false)} folderId={folderFilter} />

      {/* منوی یادداشت */}
      <AnimatePresence>
        {menuNote && (
          <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuNote(null)}
            />
            <motion.div
              className="glass-strong relative z-10 w-full rounded-t-3xl p-4 pb-7 sm:max-w-sm sm:rounded-3xl"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
              <p className="mb-3 truncate px-2 text-sm font-bold">
                {menuNote.title || t('notes.untitled')}
              </p>
              <div className="flex flex-col gap-1">
                <MenuAction
                  icon={menuNote.isPinned ? 'pinOff' : 'pin'}
                  label={menuNote.isPinned ? t('notes.unpin') : t('notes.pin')}
                  onClick={async () => {
                    await notesRepo.togglePin(menuNote.id)
                    setMenuNote(null)
                  }}
                />
                <MenuAction
                  icon="archive"
                  label={menuNote.isArchived ? t('notes.unarchive') : t('notes.archive')}
                  onClick={async () => {
                    await notesRepo.toggleArchive(menuNote.id)
                    setMenuNote(null)
                    toast(
                      menuNote.isArchived ? t('notes.unarchive') : t('notes.archive'),
                      'success',
                    )
                  }}
                />
                <MenuAction
                  icon="palette"
                  label={t('notes.color')}
                  onClick={() => {
                    setColorFor(menuNote)
                    setMenuNote(null)
                  }}
                />
                <MenuAction
                  icon="trash"
                  label={t('notes.moveToTrash')}
                  danger
                  onClick={() => {
                    setConfirmTrash(menuNote)
                    setMenuNote(null)
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* انتخاب رنگ */}
      <Modal open={!!colorFor} onClose={() => setColorFor(null)} title={t('notes.color')}>
        <div className="py-2">
          <ColorPicker
            value={colorFor?.color ?? null}
            onChange={async (v) => {
              if (colorFor) await notesRepo.update(colorFor.id, { color: v })
              setColorFor(null)
            }}
          />
        </div>
      </Modal>

      {/* پوشه جدید */}
      <Modal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} title={t('folders.new')}>
        <Field label={t('folders.name')}>
          <input
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void createFolder()}
            className={inputClass}
            placeholder={t('folders.name')}
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>
            {t('action.cancel')}
          </Button>
          <Button variant="primary" onClick={() => void createFolder()}>
            {t('action.create')}
          </Button>
        </div>
      </Modal>

      <Confirm
        open={!!confirmTrash}
        title={t('notes.confirmTrash')}
        confirmLabel={t('notes.moveToTrash')}
        onCancel={() => setConfirmTrash(null)}
        onConfirm={async () => {
          if (confirmTrash) await notesRepo.trash(confirmTrash.id)
          setConfirmTrash(null)
          toast(t('common.deleted'), 'success')
        }}
      />
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: 'pin' | 'clock'
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/45">
        <Icon name={icon} size={13} />
        {title}
      </h2>
      {children}
    </section>
  )
}

function NoteGrid({
  notes,
  noteTagsMap,
  onMore,
}: {
  notes: Note[]
  noteTagsMap: Map<string, import('../../db/types').Tag[]> | undefined
  onMore: (n: Note) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} tags={noteTagsMap?.get(n.id) ?? []} onMore={onMore} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function FolderChip({
  active,
  label,
  icon,
  color,
  onClick,
}: {
  active: boolean
  label: string
  icon?: 'home' | 'folder'
  color?: string | null
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white shadow-[0_6px_18px_-8px_rgba(236,72,153,0.8)]'
          : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color ?? (active ? '#fff' : 'rgba(255,255,255,0.35)') }}
        />
      )}
      {label}
    </motion.button>
  )
}

function MenuAction({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={() => void onClick()}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-white/10 ${
        danger ? 'text-red-300' : 'text-white/85'
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </button>
  )
}

export default NotesPage
