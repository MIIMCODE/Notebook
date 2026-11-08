import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect } from 'react'
import Icon from './Icon'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** کلاس محتوای وسط‌چین (مودال کوچک) */
  centered?: boolean
}

export function Modal({ open, onClose, title, children, centered = false }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`glass-strong relative z-10 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl sm:max-w-lg sm:rounded-3xl ${
              centered ? 'sm:my-auto' : ''
            }`}
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <h2 className="text-base font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="close"
                  className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** دیالوگ تأیید خطر */
export function Confirm({
  open,
  title,
  message,
  confirmLabel = 'تأیید',
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} centered>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <Icon
            name={danger ? 'trash' : 'check'}
            size={22}
            className={danger ? 'text-red-300' : 'text-emerald-300'}
          />
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        {message && <p className="mt-2 text-sm text-white/60">{message}</p>}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition ${
              danger
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:brightness-110'
                : 'bg-gradient-to-r from-brand-600 to-rose-accent hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default Modal
