import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { db, getSettings, saveSettings } from '../../db'
import { useI18n } from '../../i18n'
import { useUi, applyPalette, applyTheme, type Theme } from '../../stores/ui'
import { MODULE_NAV } from '../layout/AppShell'
import { useLock } from '../lock/LockScreen'
import { resetSessionLock } from '../../lib/lock'
import Icon, { type IconName } from '../../components/ui/Icon'
import type { Note } from '../../db/types'

interface Cmd {
  id: string
  label: string
  hint?: string
  icon: IconName
  run: () => void
}

const PALETTES = ['aurora', 'sunset', 'ocean', 'neon', 'mono'] as const

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const theme = useUi((s) => s.theme)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const notes = useLiveQuery<Note[], Note[]>(() => db.notes.toArray(), [open], [])

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  const commands: Cmd[] = useMemo(() => {
    const go = (path: string) => () => {
      onClose()
      navigate(path)
    }
    const list: Cmd[] = [
      { id: 'new', label: t('action.newNote'), icon: 'plus', run: go('/?new=1') },
      { id: 'search', label: t('nav.search'), icon: 'search', run: go('/search') },
      { id: 'home', label: t('nav.home'), icon: 'home', run: go('/') },
      { id: 'trash', label: t('nav.trash'), icon: 'trash', run: go('/trash') },
      { id: 'archive', label: t('nav.archive'), icon: 'archive', run: go('/archive') },
      { id: 'settings', label: t('nav.settings'), icon: 'settings', run: go('/settings') },
      ...MODULE_NAV.map((m) => ({
        id: m.to,
        label: t(m.labelKey),
        icon: m.icon,
        run: go(m.to),
      })),
      {
        id: 'theme',
        label: t('settings.theme'),
        hint: theme === 'dark' ? t('settings.themeLight') : t('settings.themeDark'),
        icon: theme === 'dark' ? ('sun' as IconName) : ('moon' as IconName),
        run: () => {
          onClose()
          const next: Theme = theme === 'dark' ? 'light' : 'dark'
          applyTheme(next, useUi.getState().accent)
          useUi.setState({ theme: next })
          void saveSettings({ theme: next })
        },
      },
      ...PALETTES.map((p) => ({
        id: `palette-${p}`,
        label: `${t('topbar.palette')}: ${t(`palette.${p}`)}`,
        icon: 'palette' as IconName,
        run: () => {
          onClose()
          applyPalette(p)
          void saveSettings({ palette: p })
        },
      })),
      {
        id: 'lock',
        label: t('lock.badge'),
        icon: 'lock' as IconName,
        run: () => {
          onClose()
          void getSettings().then((s) => {
            if (s.lockEnabled) {
              resetSessionLock()
              useLock.getState().lock()
            }
          })
        },
      },
    ]
    return list
  }, [t, theme, navigate, onClose])

  const query = q.trim().toLowerCase()
  const noteItems: Cmd[] = useMemo(() => {
    if (!query) return []
    return (notes ?? [])
      .filter((n) => !n.isDeleted && !n.isArchived)
      .filter((n) => `${n.title} ${n.plainText}`.toLowerCase().includes(query))
      .slice(0, 6)
      .map((n) => ({
        id: `note-${n.id}`,
        label: n.title || t('notes.untitled'),
        hint: t('cmd.notes'),
        icon: 'book' as IconName,
        run: () => {
          onClose()
          navigate(`/note/${n.id}`)
        },
      }))
  }, [notes, query, t, navigate, onClose])

  const items = useMemo(() => {
    const cmds = commands.filter((c) => !query || c.label.toLowerCase().includes(query))
    return [...cmds, ...noteItems]
  }, [commands, noteItems, query])

  useEffect(() => {
    setSel(0)
  }, [q])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSel((s) => (items.length ? (s + 1) % items.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSel((s) => (items.length ? (s - 1 + items.length) % items.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        items[sel]?.run()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, items, sel, onClose])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-[6px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="glass-strong w-full max-w-xl overflow-hidden rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-label={t('cmd.title')}
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <Icon name="search" size={18} className="text-white/50" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('cmd.placeholder')}
              aria-label={t('cmd.title')}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40 sm:text-base"
              dir="auto"
            />
            <kbd className="rounded-md border border-white/15 px-2 py-0.5 text-[10px] text-white/45">
              Esc
            </kbd>
          </div>
          <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-white/45">{t('cmd.noResults')}</li>
            )}
            {items.map((c, i) => (
              <li
                key={c.id}
                data-i={i}
                role="option"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={() => c.run()}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  i === sel
                    ? 'bg-gradient-to-r from-brand-500/40 to-rose-accent/25 text-white'
                    : 'text-white/75 hover:bg-white/8'
                }`}
              >
                <Icon
                  name={c.icon}
                  size={17}
                  className={i === sel ? 'text-white' : 'text-white/55'}
                />
                <span className="truncate" dir="auto">
                  {c.label}
                </span>
                {c.hint && (
                  <small className="ms-auto shrink-0 text-[11px] text-white/40">{c.hint}</small>
                )}
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CommandPalette
