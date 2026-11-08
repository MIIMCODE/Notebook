import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { boardsRepo } from '../../db/repos/modules'
import { useI18n } from '../../i18n'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { inputClass } from '../../components/ui/Primitives'
import { motion, AnimatePresence } from 'framer-motion'
import { relativeTime } from '../../lib/jalali'
import type { BoardCard, BoardColumn } from '../../db/types'

export function KanbanPage() {
  const { t, locale } = useI18n()
  const [ready, setReady] = useState(false)
  const [newCardFor, setNewCardFor] = useState<string | null>(null)
  const [cardTitle, setCardTitle] = useState('')
  const [editing, setEditing] = useState<BoardCard | null>(null)
  const [addColumnOpen, setAddColumnOpen] = useState(false)
  const [columnName, setColumnName] = useState('')
  const [dragOver, setDragOver] = useState<string | null>(null)

  useEffect(() => {
    void boardsRepo.ensureDefault().then(() => setReady(true))
  }, [])

  const boards = useLiveQuery(() => db.boards.toArray(), [ready], [])
  const board = boards.find((b) => !b.deletedAt) ?? null
  const columns = useLiveQuery(
    async (): Promise<BoardColumn[]> =>
      board ? db.boardColumns.where('boardId').equals(board.id).sortBy('position') : [],
    [board?.id],
    [],
  )
  const cards = useLiveQuery(() => db.boardCards.toArray(), [ready], [])

  if (!board) return <div className="h-40 animate-pulse rounded-2xl bg-white/5" />

  const addCard = async () => {
    const v = cardTitle.trim()
    if (!v || !newCardFor) return
    await boardsRepo.addCard(newCardFor, v)
    setCardTitle('')
    setNewCardFor(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">{t('kanban.title')}</h1>
          <p className="mt-0.5 text-xs text-white/45">{board.name}</p>
        </div>
        <Button size="sm" variant="glass" icon="plus" onClick={() => setAddColumnOpen(true)}>
          {t('kanban.addColumn')}
        </Button>
      </div>

      {/* ستون‌ها — اسکرول افقی */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3" dir="ltr">
        <AnimatePresence initial={false}>
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={(cards ?? []).filter((c) => c.columnId === col.id)}
              locale={locale}
              dragOver={dragOver === col.id}
              onDragOver={() => setDragOver(col.id)}
              onDragLeave={() => setDragOver((v) => (v === col.id ? null : v))}
              onDrop={async (cardId) => {
                setDragOver(null)
                if (cardId) {
                  const pos = (cards ?? []).filter((c) => c.columnId === col.id).length
                  await boardsRepo.moveCard(cardId, col.id, pos)
                }
              }}
              onAdd={() => {
                setNewCardFor(col.id)
                setCardTitle('')
              }}
              onEdit={setEditing}
              onDeleteColumn={() => void boardsRepo.removeColumn(col.id)}
            />
          ))}
        </AnimatePresence>

        {/* افزودن ستون */}
        <button
          onClick={() => setAddColumnOpen(true)}
          className="flex h-fit w-56 shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-6 text-sm text-white/45 transition hover:border-brand-400/50 hover:text-white"
          dir="rtl"
        >
          <Icon name="plus" size={16} />
          {t('kanban.addColumn')}
        </button>
      </div>

      {/* کارت جدید */}
      <Modal open={!!newCardFor} onClose={() => setNewCardFor(null)} title={t('kanban.addCard')}>
        <input
          autoFocus
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void addCard()}
          className={inputClass}
          placeholder={t('kanban.addCard')}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNewCardFor(null)}>
            {t('action.cancel')}
          </Button>
          <Button variant="primary" onClick={() => void addCard()}>
            {t('action.add')}
          </Button>
        </div>
      </Modal>

      {/* ویرایش کارت */}
      <CardEditModal card={editing} onClose={() => setEditing(null)} />

      {/* ستون جدید */}
      <Modal
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
        title={t('kanban.addColumn')}
      >
        <input
          autoFocus
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && columnName.trim()) {
              await boardsRepo.addColumn(board.id, columnName)
              setColumnName('')
              setAddColumnOpen(false)
            }
          }}
          className={inputClass}
          placeholder={t('kanban.addColumn')}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAddColumnOpen(false)}>
            {t('action.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (!columnName.trim()) return
              await boardsRepo.addColumn(board.id, columnName)
              setColumnName('')
              setAddColumnOpen(false)
            }}
          >
            {t('action.create')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function KanbanColumn({
  column,
  cards,
  locale,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onAdd,
  onEdit,
  onDeleteColumn,
}: {
  column: BoardColumn
  cards: BoardCard[]
  locale: 'fa' | 'en'
  dragOver: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (cardId: string | null) => void
  onAdd: () => void
  onEdit: (c: BoardCard) => void
  onDeleteColumn: () => void
}) {
  const { t } = useI18n()
  const [dragId, setDragId] = useState<string | null>(null)

  return (
    <motion.div
      layout
      dir="rtl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver()
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(dragId)
        setDragId(null)
      }}
      className={`glass flex w-72 shrink-0 flex-col rounded-2xl p-3 transition-colors ${
        dragOver ? 'border-brand-400/60 bg-brand-500/10' : ''
      }`}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: column.color ?? '#8B5CF6' }}
        />
        <h2 className="flex-1 truncate text-sm font-bold">{column.name}</h2>
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-white/50">
          {cards.length}
        </span>
        <button
          onClick={onDeleteColumn}
          aria-label={t('kanban.deleteColumn')}
          className="rounded p-1 text-white/30 hover:text-red-300"
        >
          <Icon name="close" size={13} />
        </button>
      </div>

      <div className="flex min-h-24 flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              draggable
              onDragStart={() => setDragId(card.id)}
              onDragEnd={() => setDragId(null)}
              onClick={() => onEdit(card)}
              className="cursor-grab rounded-xl border border-white/10 bg-white/8 p-3 transition hover:border-white/20 hover:bg-white/12 active:cursor-grabbing"
            >
              <p className="text-sm font-semibold leading-6" dir="auto">
                {card.title}
              </p>
              {card.body && (
                <p className="mt-1 line-clamp-2 text-[11px] text-white/45" dir="auto">
                  {card.body}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
                <span>{relativeTime(card.updatedAt, locale)}</span>
                <span className="flex gap-1">
                  <Icon name="more" size={12} />
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/12 py-2.5 text-xs text-white/45 transition hover:border-brand-400/50 hover:text-white"
        >
          <Icon name="plus" size={14} />
          {t('kanban.addCard')}
        </button>
      </div>
    </motion.div>
  )
}

function CardEditModal({ card, onClose }: { card: BoardCard | null; onClose: () => void }) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setBody(card.body ?? '')
    }
  }, [card])

  if (!card) return null

  const save = async () => {
    await boardsRepo.updateCard(card.id, {
      title: title.trim() || card.title,
      body: body.trim() || null,
    })
    onClose()
  }

  return (
    <Modal open={!!card} onClose={onClose} title={t('action.edit')}>
      <div className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          dir="auto"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className={inputClass}
          placeholder="..."
          dir="auto"
        />
        <div className="flex justify-between">
          <Button
            variant="danger"
            onClick={async () => {
              await boardsRepo.removeCard(card.id)
              onClose()
            }}
          >
            {t('action.delete')}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" onClick={() => void save()}>
              {t('action.save')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default KanbanPage
