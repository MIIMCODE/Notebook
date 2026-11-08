import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { notesRepo } from '../../db/repos/notes'
import { useI18n } from '../../i18n'
import { useUi } from '../../stores/ui'
import NoteCard from './NoteCard'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Primitives'
import { Confirm } from '../../components/ui/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import type { Note } from '../../db/types'

function useTrashed() {
  return useLiveQuery(
    async () => (await db.notes.toArray()).filter((n) => n.isDeleted),
    [],
    undefined,
  )
}

export function TrashPage() {
  const { t } = useI18n()
  const toast = useUi((s) => s.toast)
  const trashed = useTrashed()
  const [confirmEmpty, setConfirmEmpty] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold sm:text-2xl">{t('nav.trash')}</h1>
        {(trashed?.length ?? 0) > 0 && (
          <Button variant="danger" size="sm" icon="trash" onClick={() => setConfirmEmpty(true)}>
            {t('notes.emptyTrash')}
          </Button>
        )}
      </div>

      {trashed === undefined ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : trashed.length === 0 ? (
        <EmptyState icon="trash" title={t('notes.trashEmpty')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {trashed.map((n: Note) => (
              <motion.div key={n.id} layout className="relative">
                <NoteCard note={n} />
                <div className="absolute inset-x-3 bottom-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="glass"
                    className="flex-1"
                    onClick={async () => {
                      await notesRepo.restore(n.id)
                      toast(t('notes.restore'), 'success')
                    }}
                  >
                    {t('notes.restore')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await notesRepo.purge(n.id)
                      toast(t('common.deleted'), 'success')
                    }}
                  >
                    {t('action.deleteForever')}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Confirm
        open={confirmEmpty}
        title={t('notes.confirmEmptyTrash')}
        confirmLabel={t('notes.emptyTrash')}
        onCancel={() => setConfirmEmpty(false)}
        onConfirm={async () => {
          await notesRepo.emptyTrash()
          setConfirmEmpty(false)
          toast(t('common.deleted'), 'success')
        }}
      />
    </div>
  )
}

export function ArchivePage() {
  const { t } = useI18n()
  const toast = useUi((s) => s.toast)
  const archived = useLiveQuery(
    async () => (await db.notes.toArray()).filter((n) => n.isArchived && !n.isDeleted),
    [],
    undefined,
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold sm:text-2xl">{t('nav.archive')}</h1>
      {archived === undefined ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : archived.length === 0 ? (
        <EmptyState icon="archive" title={t('notes.archiveEmpty')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {archived.map((n: Note) => (
              <motion.div key={n.id} layout className="relative group">
                <NoteCard note={n} />
                <button
                  onClick={async () => {
                    await notesRepo.archive(n.id, false)
                    toast(t('notes.unarchive'), 'success')
                  }}
                  className="absolute inset-x-3 bottom-3 hidden rounded-xl bg-white/10 py-2 text-xs font-bold backdrop-blur hover:bg-white/20 group-hover:block"
                >
                  <Icon name="archive" size={13} className="mx-auto" />
                  {t('notes.unarchive')}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default TrashPage
