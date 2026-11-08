import { useEffect, useState } from 'react'
import { confetti } from '../../lib/confetti'
import { tap } from '../../lib/haptics'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { notesRepo } from '../../db/repos/notes'
import { useI18n } from '../../i18n'
import Icon, { type IconName } from '../../components/ui/Icon'
import type { NoteType } from '../../db/types'
import { TEMPLATES } from '../../lib/templates'
import MaterialIcon from '../../components/ui/MaterialIcon'

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
  initialTab,
}: {
  open: boolean
  onClose: () => void
  folderId?: string | null
  initialTab?: 'type' | 'templates'
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'type' | 'templates'>(initialTab ?? 'type')

  // باز شدن با تب دلخواه (مثلاً دکمه‌ی قالب‌ها)
  useEffect(() => {
    if (open) setTab(initialTab ?? 'type')
  }, [open, initialTab])

  const create = async (type: NoteType) => {
    tap(30)
    confetti()
    const note = await notesRepo.create({ type, folderId: folderId ?? null })
    onClose()
    navigate(`/note/${note.id}`, { state: { fresh: true } })
  }

  const createFromTemplate = async (tplId: string) => {
    const tpl = TEMPLATES.find((x) => x.id === tplId)
    if (!tpl) return
    tap(30)
    confetti()
    const { plain, tiptap } = tpl.make()
    const note = await notesRepo.create({
      type: 'text',
      folderId: folderId ?? null,
      title: t(tpl.titleKey),
      content: tiptap,
    })
    await notesRepo.update(note.id, { plainText: plain })
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
            <h2 className="mb-3 text-center text-base font-bold">{t('action.newNote')}</h2>

            {/* سربرگ‌ها */}
            <div className="mx-auto mb-4 flex w-fit gap-1 rounded-full bg-white/6 p-1">
              {(
                [
                  { id: 'type', label: t('new.type') },
                  { id: 'templates', label: t('templates.title') },
                ] as const
              ).map((x) => (
                <button
                  key={x.id}
                  onClick={() => setTab(x.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    tab === x.id
                      ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white'
                      : 'text-white/55'
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>

            {tab === 'templates' && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {TEMPLATES.map((tpl, i) => (
                  <motion.button
                    key={tpl.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => void createFromTemplate(tpl.id)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/8 bg-white/5 p-3 transition hover:border-brand-400/40 hover:bg-white/10"
                  >
                    <MaterialIcon name={tpl.icon} size={26} className="text-white/85" />
                    <span className="text-[11px] font-semibold text-white/75">
                      {t(tpl.titleKey)}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            <div
              className={`grid grid-cols-3 gap-3 sm:grid-cols-4 ${tab === 'templates' ? 'hidden' : ''}`}
            >
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
