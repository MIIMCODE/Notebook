import { motion, type HTMLMotionProps } from 'framer-motion'
import { type ReactNode } from 'react'
import Icon, { type IconName } from './Icon'

type Variant = 'primary' | 'ghost' | 'glass' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface Props extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
  icon?: IconName
  children?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 via-rose-accent to-amber-accent text-white shadow-[0_8px_24px_-8px_rgba(236,72,153,0.6)] hover:brightness-110',
  ghost: 'text-white/75 hover:text-white hover:bg-white/10',
  glass: 'glass text-white/90 hover:bg-white/15',
  danger: 'bg-red-500/15 text-red-300 border border-red-400/25 hover:bg-red-500/25',
  subtle: 'bg-white/8 text-white/85 border border-white/10 hover:bg-white/14',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl gap-0',
}

export function Button({
  variant = 'subtle',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`yc-btn yc-btn-${variant} inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-brand-400 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </motion.button>
  )
}

export default Button
