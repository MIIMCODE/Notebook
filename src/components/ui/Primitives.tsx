import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import Icon, { type IconName } from './Icon'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/6 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

export function NoteSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-36" />
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-center rounded-3xl px-6 py-12 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-rose-accent/25 text-brand-200">
        <Icon name={icon} size={30} />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-white/55">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-gradient-to-r from-brand-500 to-rose-accent' : 'bg-white/12'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
        style={checked ? { left: 26 } : { left: 4 }}
      />
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-white/55">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/60 focus:bg-white/9 focus:ring-2 focus:ring-brand-500/25'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export const NOTE_COLORS = [
  { id: 'default', value: '', label: 'پیش‌فرض' },
  { id: 'violet', value: '#8B5CF6', label: 'بنفش' },
  { id: 'pink', value: '#EC4899', label: 'صورتی' },
  { id: 'amber', value: '#F59E0B', label: 'کهربایی' },
  { id: 'emerald', value: '#10B981', label: 'زمردی' },
  { id: 'sky', value: '#0EA5E9', label: 'آسمانی' },
  { id: 'red', value: '#EF4444', label: 'قرمز' },
]

export function ColorPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {NOTE_COLORS.map((c) => {
        const active = (value ?? '') === c.value
        return (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.85 }}
            aria-label={c.label}
            onClick={() => onChange(c.value || null)}
            className={`h-7 w-7 rounded-full border-2 transition ${
              active ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{
              background: c.value || 'linear-gradient(135deg,#374151,#111827)',
            }}
          />
        )
      })}
    </div>
  )
}
