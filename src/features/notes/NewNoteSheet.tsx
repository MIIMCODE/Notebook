import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { notesRepo } from '../../db/repos/notes'
import { useI18n } from '../../i18n'
import Icon, { type IconName } from '../../components/ui/Icon'
import type { NoteType } from '../../db/types'

const TYPES: { type: NoteType; icon: IconName; color: string; desc: string }[] = [
  { type: 'text', icon: 'book', color: '#8B5CF6', desc: 'text' },
  { type: 'checklist', icon: 'checklist', color: '#EC4899', desc: 'checklist' },
  { type: 'table', icon: 'table', color: '#F59E0B', desc: 'table' },
  { type: 'code', icon: 'code', color: '#10B981', desc: 'code' },
  { type: 'image', icon: 'image', color: '#0EA5E9', desc: 'image' },
  { type: 'audio', icon: 'mic', color: '#F43F5E', desc: 'audio' },
  { type: 'drawing', icon: 'pen', color: '#A78BFA', desc: 'drawing' },
]

export function NewNoteSheet({
  open,
  onClose,
  folderId,
}: {
  open: boolean
  onClose: () => void
  folderId?: string | null
}) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const create = async (type: NoteType) => {
    const note = await notesRepo.create({ type, folderId: folderId ?? null })
    onClose()
    navigate(`/note/${note.id}`, { state: { fresh: true } })
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glass-strong relative z-10 w-full rounded-t-3xl p-5 pb-8 sm:max-w-md sm:rounded-3xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 330, damping: 32 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <h2 className="mb-4 text-center text-base font-bold">{t('action.newNote')}</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {TYPES.map((item, i) => (
                <motion.button
                  key={item.type}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => void create(item.type)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/5 p-3 transition hover:border-white/20 hover:bg-white/10"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}, ${item.color}AA)`,
                      boxShadow: `0 6px 18px -8px ${item.color}`,
                    }}
                  >
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className="text-[11px] font-semibold text-white/75">
                    {t(`type.${item.type}`)}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default NewNoteSheet
