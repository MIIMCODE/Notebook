import { AnimatePresence, motion } from 'framer-motion'
import { useUi } from '../../stores/ui'
import Icon from './Icon'

export function ToastHost() {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismissToast)

  return (
    <div
      dir="rtl"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={`glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-2xl ${
              t.tone === 'error'
                ? 'border-red-400/30 text-red-100'
                : t.tone === 'success'
                  ? 'border-emerald-400/30 text-emerald-100'
                  : 'text-white'
            }`}
          >
            <Icon
              name={t.tone === 'error' ? 'x' : t.tone === 'success' ? 'check' : 'sparkle'}
              size={16}
              className={
                t.tone === 'error'
                  ? 'text-red-400'
                  : t.tone === 'success'
                    ? 'text-emerald-400'
                    : 'text-amber-300'
              }
            />
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20"
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastHost
