import { memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Note, Tag } from '../../db/types'
import { formatJDate, relativeTime, toDigits } from '../../lib/jalali'
import { useI18n } from '../../i18n'
import Icon, { type IconName } from '../../components/ui/Icon'
import type { NoteType } from '../../db/types'

const TYPE_ICON: Record<NoteType, IconName> = {
  text: 'book',
  checklist: 'checklist',
  table: 'table',
  code: 'code',
  image: 'image',
  audio: 'mic',
  drawing: 'pen',
}

interface Props {
  note: Note
  tags?: Tag[]
  onMore?: (note: Note) => void
}

export const NoteCard = memo(function NoteCard({ note, tags = [], onMore }: Props) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()

  const snippet = note.plainText.replace(/\s+/g, ' ').slice(0, 140)
  const accent = note.color ?? 'transparent'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onClick={() => navigate(`/note/${note.id}`)}
      className="glass group relative cursor-pointer overflow-hidden rounded-2xl p-4 text-start transition-shadow hover:shadow-[0_12px_36px_-16px_rgba(139,92,246,0.55)]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/note/${note.id}`)}
      aria-label={note.title || t('notes.untitled')}
    >
      {/* نوار رنگ */}
      {note.color && (
        <span
          className="absolute inset-y-0 start-0 w-1"
          style={{ background: accent }}
          aria-hidden
        />
      )}

      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: note.color ? `${note.color}33` : 'rgba(255,255,255,0.07)',
              color: note.color ?? 'rgba(255,255,255,0.6)',
            }}
          >
            <Icon name={TYPE_ICON[note.type]} size={14} />
          </span>
          <h3 className="truncate text-sm font-bold text-white/95">
            {note.title || t('notes.untitled')}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {note.isPinned && <Icon name="pin" size={14} className="text-amber-300" />}
          {onMore && (
            <button
              aria-label={t('action.more')}
              onClick={(e) => {
                e.stopPropagation()
                onMore(note)
              }}
              className="rounded-md p-1 text-white/35 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white focus:opacity-100"
            >
              <Icon name="more" size={15} />
            </button>
          )}
        </div>
      </div>

      {snippet && (
        <p dir="auto" className="line-clamp-3 text-xs leading-5 text-white/55">
          {snippet}
        </p>
      )}

      {(tags.length > 0 || note.reminderAt) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {note.reminderAt && (
            <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
              <Icon name="bell" size={10} />
              {formatJDate(new Date(note.reminderAt), locale)}
            </span>
          )}
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: tag.color ? `${tag.color}2A` : 'rgba(255,255,255,0.08)',
                color: tag.color ?? 'rgba(255,255,255,0.6)',
              }}
            >
              #{tag.name}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-white/40">+{toDigits(tags.length - 3, locale)}</span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[10px] text-white/35">
        <span>{relativeTime(note.updatedAt, locale)}</span>
        <span className="opacity-0 transition group-hover:opacity-100">{t('notes.open')} →</span>
      </div>
    </motion.article>
  )
})

export default NoteCard
