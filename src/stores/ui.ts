import { create } from 'zustand'
import type { Locale } from '../i18n/dicts'

export type Accent = 'violet' | 'pink' | 'amber' | 'emerald' | 'sky'
export type Theme = 'dark' | 'light' | 'auto'

export interface Toast {
  id: string
  message: string
  tone: 'default' | 'success' | 'error'
  action?: { label: string; onClick: () => void }
}

interface UiState {
  theme: Theme
  accent: Accent
  locale: Locale
  sidebarOpen: boolean
  moduleSheetOpen: boolean
  toasts: Toast[]
  searchOpen: boolean
  setTheme: (t: Theme) => void
  setAccent: (a: Accent) => void
  setLocale: (l: Locale) => void
  setSidebar: (open: boolean) => void
  setModuleSheet: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  toast: (message: string, tone?: Toast['tone'], action?: Toast['action']) => void
  dismissToast: (id: string) => void
}

const ACCENTS: Record<Accent, { base: string; glow: string }> = {
  violet: { base: '#8B5CF6', glow: 'rgba(139,92,246,0.45)' },
  pink: { base: '#EC4899', glow: 'rgba(236,72,153,0.45)' },
  amber: { base: '#F59E0B', glow: 'rgba(245,158,11,0.45)' },
  emerald: { base: '#10B981', glow: 'rgba(16,185,129,0.45)' },
  sky: { base: '#0EA5E9', glow: 'rgba(14,165,233,0.45)' },
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches
let autoListener: (() => void) | null = null

export function applyTheme(theme: Theme, accent: Accent): void {
  const html = document.documentElement
  const resolved = theme === 'auto' ? (systemDark() ? 'dark' : 'light') : theme
  html.dataset.theme = resolved
  html.dataset.accent = accent
  const a = ACCENTS[accent]
  html.style.setProperty('--accent', a.base)
  html.style.setProperty('--accent-glow', a.glow)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0B0B14' : '#F6F4FF')

  if (autoListener) {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', autoListener)
    autoListener = null
  }
  if (theme === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    autoListener = () => applyTheme('auto', accent)
    mq.addEventListener('change', autoListener)
  }
}

let toastCounter = 0

export const useUi = create<UiState>((set, get) => ({
  theme: 'dark',
  accent: 'violet',
  locale: 'fa',
  sidebarOpen: false,
  moduleSheetOpen: false,
  searchOpen: false,
  toasts: [],

  setTheme: (theme) => {
    set({ theme })
    applyTheme(theme, get().accent)
    import('../db').then(({ saveSettings }) => saveSettings({ theme }).catch(() => {}))
  },
  setAccent: (accent) => {
    set({ accent })
    applyTheme(get().theme, accent)
    import('../db').then(({ saveSettings }) => saveSettings({ accent }).catch(() => {}))
  },
  setLocale: (locale) => set({ locale }),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  setModuleSheet: (moduleSheetOpen) => set({ moduleSheetOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),

  toast: (message, tone = 'default', action) => {
    const id = `toast-${++toastCounter}`
    set((s) => ({ toasts: [...s.toasts, { id, message, tone, action }] }))
    window.setTimeout(() => get().dismissToast(id), action ? 7000 : 3800)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
