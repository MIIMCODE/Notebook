import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n, type Locale } from '../../i18n'
import { useUi } from '../../stores/ui'
import Icon, { type IconName } from '../../components/ui/Icon'
import Logo from '../../components/Logo'
import { getSettings } from '../../db'
import { getSyncState } from '../../db'

interface NavItem {
  to: string
  labelKey: string
  icon: IconName
}

const MAIN_NAV: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: 'home' },
  { to: '/search', labelKey: 'nav.search', icon: 'search' },
  { to: '/archive', labelKey: 'nav.archive', icon: 'archive' },
  { to: '/trash', labelKey: 'nav.trash', icon: 'trash' },
]

export const MODULE_NAV: NavItem[] = [
  { to: '/tasks', labelKey: 'nav.tasks', icon: 'checklist' },
  { to: '/kanban', labelKey: 'nav.kanban', icon: 'kanban' },
  { to: '/habits', labelKey: 'nav.habits', icon: 'target' },
  { to: '/journal', labelKey: 'nav.journal', icon: 'book' },
  { to: '/calendar', labelKey: 'nav.calendar', icon: 'calendar' },
  { to: '/pomodoro', labelKey: 'nav.pomodoro', icon: 'clock' },
  { to: '/expenses', labelKey: 'nav.expenses', icon: 'wallet' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useI18n()
  const { sidebarOpen, setSidebar, moduleSheetOpen, setModuleSheet } = useUi()
  const location = useLocation()
  const [online, setOnline] = useState(navigator.onLine)

  // همگام‌سازی تنظیمات محلی در اولین بارگذاری
  useEffect(() => {
    let alive = true
    void getSettings()
      .then((s) => {
        if (!alive) return
        const ui = useUi.getState()
        ui.setTheme(s.theme)
        ui.setAccent(s.accent as never)
        if (s.locale !== locale) setLocale(s.locale as Locale)
      })
      .catch(() => {})
    void getSyncState()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // وضعیت آنلاین
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  // بستن سایدبار با تغییر مسیر
  useEffect(() => {
    setSidebar(false)
    setModuleSheet(false)
  }, [location.pathname, setSidebar, setModuleSheet])

  return (
    <div className="min-h-dvh">
      {/* پس‌زمینه‌ی زنده (گرادیان‌های متحرک) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-28 -right-24 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-rose-accent/12 blur-3xl"
        />
      </div>
      {/* نوار آفلاین */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-1.5 text-xs font-bold text-black"
          >
            <Icon name="cloudOff" size={14} />
            {t('error.offline')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── سایدبار دسکتاپ ── */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-white/8 bg-ink-900/70 backdrop-blur-2xl md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Logo className="h-9 w-9" />
          <div className="min-w-0">
            <div className="text-base font-extrabold leading-none text-gradient">
              {t('appName')}
            </div>
            <div className="mt-1 truncate text-[10px] text-white/40">{t('tagline')}</div>
          </div>
          <button
            onClick={() => setLocale(locale === 'fa' ? 'en' : 'fa')}
            aria-label={locale === 'fa' ? 'English' : 'فارسی'}
            className="ms-auto shrink-0 rounded-lg border border-white/10 bg-white/6 px-2 py-1 text-[11px] font-bold text-white/65 transition hover:bg-white/12 hover:text-white"
          >
            {locale === 'fa' ? 'EN' : 'فا'}
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {MAIN_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-5 px-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35">
          {t('nav.modules')}
        </div>
        <nav className="flex flex-col gap-0.5 overflow-y-auto px-3 pb-3">
          {MODULE_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-auto border-t border-white/8 p-3">
          <SidebarLink item={{ to: '/settings', labelKey: 'nav.settings', icon: 'settings' }} />
        </div>
      </aside>

      {/* ── ناوبری پایین موبایل ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/85 backdrop-blur-2xl md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          <BottomLink to="/" icon="home" label={t('nav.home')} />
          <BottomLink to="/search" icon="search" label={t('nav.search')} />
          <span className="w-14" />
          <button
            onClick={() => setModuleSheet(true)}
            aria-label={t('nav.modules')}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-white/50"
          >
            <Icon name="grid" size={20} />
            <span className="text-[10px]">{t('nav.modules')}</span>
          </button>
          <BottomLink to="/settings" icon="settings" label={t('nav.settings')} />
        </div>
      </nav>

      {/* ── محتوا ── */}
      <main className="mx-auto min-h-dvh max-w-5xl px-4 pb-28 pt-6 md:ms-64 md:pb-10">
        {children}
      </main>

      {/* ── شیت ماژول‌ها (موبایل) ── */}
      <AnimatePresence>
        {moduleSheetOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModuleSheet(false)}
            />
            <motion.div
              className="glass-strong relative z-10 w-full rounded-t-3xl p-5 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 330, damping: 32 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
              <h2 className="mb-4 text-center text-base font-bold">{t('nav.modules')}</h2>
              <div className="grid grid-cols-4 gap-3">
                {MODULE_NAV.map((m) => (
                  <NavLink
                    key={m.to}
                    to={m.to}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/8 bg-white/5 p-3 text-[11px] font-semibold text-white/70"
                  >
                    <Icon name={m.icon} size={20} className="text-brand-300" />
                    {t(m.labelKey)}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* سایدبار اورلی موبایل (منو) */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebar(false)}
            />
            <motion.div
              className="absolute inset-y-0 start-0 w-72 border-e border-white/10 bg-ink-900/95 p-4 backdrop-blur-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 34 }}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <Logo className="h-9 w-9" />
                <span className="text-lg font-extrabold text-gradient">{t('appName')}</span>
              </div>
              <nav className="flex flex-col gap-0.5">
                {MAIN_NAV.map((item) => (
                  <SidebarLink key={item.to} item={item} />
                ))}
                <div className="mt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/35">
                  {t('nav.modules')}
                </div>
                {MODULE_NAV.map((item) => (
                  <SidebarLink key={item.to} item={item} />
                ))}
                <div className="mt-4 border-t border-white/8 pt-2">
                  <SidebarLink
                    item={{ to: '/settings', labelKey: 'nav.settings', icon: 'settings' }}
                  />
                </div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const { t } = useI18n()
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
          isActive
            ? 'bg-gradient-to-r from-brand-500/30 to-rose-accent/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
            : 'text-white/55 hover:bg-white/8 hover:text-white'
        }`
      }
    >
      <Icon name={item.icon} size={17} />
      {t(item.labelKey)}
    </NavLink>
  )
}

function BottomLink({ to, icon, label }: { to: string; icon: IconName; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 transition active:scale-90 ${
          isActive ? 'text-white' : 'text-white/45'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]' : ''}>
            <Icon name={icon} size={20} />
          </span>
          <span className="text-[10px] font-semibold">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default AppShell
