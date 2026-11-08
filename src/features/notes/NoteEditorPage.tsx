import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { db } from '../../db'
import { notesRepo } from '../../db/repos/notes'
import { tagsRepo } from '../../db/repos/tags'
import { useI18n } from '../../i18n'
import { useUi } from '../../stores/ui'
import TipTapEditor from './editor/TipTapEditor'
import DrawingCanvas from './editor/DrawingCanvas'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Modal, Confirm } from '../../components/ui/Modal'
import { ColorPicker, inputClass } from '../../components/ui/Primitives'
import { relativeTime } from '../../lib/jalali'
import type { JSONContent } from '@tiptap/core'
import type { Note } from '../../db/types'

export function NoteEditorPage() {
  const { id = '' } = useParams()
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const toast = useUi((s) => s.toast)

  // آرایه: null=در حال بارگذاری، []=پیدا نشد
  const noteList = useLiveQuery(() => db.notes.where('id').equals(id).toArray(), [id], null)
  const note = noteList === null ? undefined : (noteList[0] as Note | undefined)
  const missing = noteList !== null && noteList.length === 0

  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<Awaited<ReturnType<typeof tagsRepo.forNote>>>([])
  const [tagModal, setTagModal] = useState(false)
  const [allTags, setAllTags] = useState<Awaited<ReturnType<typeof tagsRepo.all>>>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [versions, setVersions] = useState<Awaited<ReturnType<typeof notesRepo.versions>>>([])
  const [colorOpen, setColorOpen] = useState(false)
  const [confirmTrash, setConfirmTrash] = useState(false)
  const [newTag, setNewTag] = useState('')
  const saveTimer = useRef<number | null>(null)
  const loadedId = useRef<string | null>(null)

  // بارگذاری اولیه‌ی عنوان/تگ‌ها
  useEffect(() => {
    if (!note || loadedId.current === note.id) return
    loadedId.current = note.id
    setTitle(note.title)
    void tagsRepo.forNote(note.id).then(setTags)
  }, [note])

  const persist = useCallback(
    async (patch: Partial<Note>) => {
      if (!note) return
      setSaving(true)
      await notesRepo.update(note.id, patch)
      window.setTimeout(() => setSaving(false), 350)
    },
    [note],
  )

  const onTitleChange = (value: string) => {
    setTitle(value)
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => void persist({ title: value }), 500)
  }

  const onBodyChange = useCallback(
    (json: JSONContent, plain: string) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(
        () => void persist({ content: json, plainText: plain }),
        700,
      )
    },
    [persist],
  )

  const onDrawingChange = useCallback(
    (dataUrl: string | null) => {
      void persist({ content: dataUrl ? { image: dataUrl } : null, plainText: '' })
    },
    [persist],
  )

  const openTags = async () => {
    setAllTags(await tagsRepo.all())
    setTagModal(true)
  }

  const openHistory = async () => {
    setVersions(await notesRepo.versions(id))
    setHistoryOpen(true)
  }

  if (note === undefined) {
    return <div className="h-72 animate-pulse rounded-2xl bg-white/5" />
  }

  if (missing || note.isDeleted) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
        <Icon name="trash" size={30} className="text-white/40" />
        <p className="font-bold">{t('error.notFound')}</p>
        <Button onClick={() => navigate('/')} variant="primary">
          {t('nav.home')}
        </Button>
      </div>
    )
  }

  const isDrawing = note.type === 'drawing'
  const initialContent =
    note.content && typeof note.content === 'object' && 'type' in (note.content as object)
      ? (note.content as JSONContent)
      : null

  return (
    <div className="flex flex-col pb-16">
      {/* هدر ویرایشگر */}
      <div className="sticky top-0 z-30 -mx-4 mb-2 flex items-center gap-1 border-b border-white/8 bg-ink-950/85 px-3 py-2.5 backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          icon="arrowLeft"
          aria-label={t('action.back')}
          onClick={() => navigate(-1)}
          className="rotate-180 rtl:rotate-0"
        />
        <div className="min-w-0 flex-1 px-1">
          <div className="flex items-center gap-2 text-[11px] text-white/45">
            <span className="flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 font-semibold">
              <Icon name="clock" size={10} />
              {relativeTime(note.updatedAt, locale)}
            </span>
            {saving && <span className="text-brand-300">{t('editor.saving')}</span>}
            {!saving && <span className="opacity-60">{t('editor.autoSaved')}</span>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          icon="pin"
          aria-label={t('notes.pin')}
          className={note.isPinned ? 'text-amber-300' : ''}
          onClick={() => void notesRepo.togglePin(note.id)}
        />
        <Button
          variant="ghost"
          size="icon"
          icon="history"
          aria-label={t('notes.versionHistory')}
          onClick={() => void openHistory()}
        />
        <Button
          variant="ghost"
          size="icon"
          icon="tag"
          aria-label={t('notes.tags')}
          onClick={() => void openTags()}
        />
        <Button
          variant="ghost"
          size="icon"
          icon="palette"
          aria-label={t('notes.color')}
          onClick={() => setColorOpen(true)}
        />
        <Button
          variant="ghost"
          size="icon"
          icon="trash"
          aria-label={t('notes.moveToTrash')}
          className="hover:text-red-300"
          onClick={() => setConfirmTrash(true)}
        />
      </div>

      {/* نوار رنگ یادداشت */}
      {note.color && (
        <div
          className="mb-3 h-1 rounded-full"
          style={{ background: `linear-gradient(90deg, ${note.color}, transparent)` }}
        />
      )}

      {/* عنوان */}
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t('editor.titlePlaceholder')}
        aria-label={t('editor.titlePlaceholder')}
        className="mb-2 w-full bg-transparent text-2xl font-extrabold text-white outline-none placeholder:text-white/25 sm:text-3xl"
        dir="auto"
      />

      {/* تگ‌ها */}
      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() =>
                void tagsRepo
                  .detach(note.id, tag.id)
                  .then(() => setTags((prev) => prev.filter((x) => x.id !== tag.id)))
              }
              className="group flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition"
              style={{
                background: tag.color ? `${tag.color}2A` : 'rgba(255,255,255,0.08)',
                color: tag.color ?? 'rgba(255,255,255,0.7)',
              }}
              title={t('action.remove')}
            >
              #{tag.name}
              <span className="hidden group-hover:inline">×</span>
            </button>
          ))}
        </div>
      )}

      {/* بدنه */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isDrawing ? 'drawing' : 'editor'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDrawing ? (
            <DrawingCanvas
              initialImage={
                typeof note.content === 'object' &&
                note.content &&
                'image' in (note.content as object)
                  ? String((note.content as { image: string }).image)
                  : null
              }
              onChange={onDrawingChange}
            />
          ) : (
            <TipTapEditor
              key={note.id}
              initialContent={initialContent}
              onChange={onBodyChange}
              placeholder={t('editor.bodyPlaceholder')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* مودال تگ‌ها */}
      <Modal open={tagModal} onClose={() => setTagModal(false)} title={t('notes.tags')}>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  const tag = await tagsRepo.create(newTag)
                  await tagsRepo.attach(note.id, tag.id)
                  setTags(await tagsRepo.forNote(note.id))
                  setNewTag('')
                  setAllTags(await tagsRepo.all())
                }
              }}
              className={inputClass}
              placeholder={t('tags.new')}
            />
            <Button
              variant="primary"
              onClick={async () => {
                if (!newTag.trim()) return
                const tag = await tagsRepo.create(newTag)
                await tagsRepo.attach(note.id, tag.id)
                setTags(await tagsRepo.forNote(note.id))
                setNewTag('')
                setAllTags(await tagsRepo.all())
              }}
            >
              {t('action.add')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = tags.some((x) => x.id === tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={async () => {
                    await tagsRepo.toggle(note.id, tag.id)
                    setTags(await tagsRepo.forNote(note.id))
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white' : 'bg-white/8 text-white/65 hover:bg-white/14'}`}
                >
                  #{tag.name}
                </button>
              )
            })}
            {allTags.length === 0 && <p className="text-sm text-white/40">{t('tags.empty')}</p>}
          </div>
        </div>
      </Modal>

      {/* تاریخچه نسخه‌ها */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={t('notes.versionHistory')}
      >
        {versions.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/45">{t('notes.noVersions')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {versions.map((v) => (
              <li key={v.id}>
                <button
                  onClick={async () => {
                    await notesRepo.restoreVersion(note.id, v.id)
                    setHistoryOpen(false)
                    toast(t('common.saved'), 'success')
                    loadedId.current = null
                  }}
                  className="glass flex w-full items-center justify-between rounded-xl px-4 py-3 text-start transition hover:bg-white/12"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {v.title || t('notes.untitled')}
                    </span>
                    <span className="text-[11px] text-white/45">
                      {t('notes.version')} {v.version} · {relativeTime(v.createdAt, locale)}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-brand-300">
                    {t('notes.restoreVersion')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* رنگ */}
      <Modal open={colorOpen} onClose={() => setColorOpen(false)} title={t('notes.color')}>
        <ColorPicker value={note.color} onChange={(v) => void persist({ color: v })} />
      </Modal>

      <Confirm
        open={confirmTrash}
        title={t('notes.confirmTrash')}
        confirmLabel={t('notes.moveToTrash')}
        onCancel={() => setConfirmTrash(false)}
        onConfirm={async () => {
          await notesRepo.trash(note.id)
          navigate('/')
          toast(t('common.deleted'), 'success')
        }}
      />
    </div>
  )
}

export default NoteEditorPage
