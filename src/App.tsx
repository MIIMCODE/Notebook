import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SplashScreen from './components/SplashScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { I18nProvider, useI18n } from './i18n'
import { useUi, applyTheme } from './stores/ui'
import ToastHost from './components/ui/ToastHost'
import AppShell from './features/layout/AppShell'
import NotesPage from './features/notes/NotesPage'
import NoteEditorPage from './features/notes/NoteEditorPage'
import SearchPage from './features/search/SearchPage'
import { TrashPage, ArchivePage } from './features/notes/ListsPages'
import SettingsPage from './features/settings/SettingsPage'
import { openDb, getSettings } from './db'
import Icon, { type IconName } from './components/ui/Icon'
import Button from './components/ui/Button'
import Logo from './components/Logo'
import { MODULE_NAV } from './features/layout/AppShell'

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** صفحه‌ی در حال ساخت ماژول (در مرحله ۵ جایگزین می‌شود) */
function ModuleSoon({ icon, titleKey }: { icon: IconName; titleKey: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <Page>
      <div className="glass flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center">
        <motion.div
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500/40 to-rose-accent/30"
        >
          <Icon name={icon} size={38} className="text-brand-200" />
        </motion.div>
        <h1 className="text-2xl font-extrabold">{t(titleKey)}</h1>
        <p className="text-sm text-white/50">{t('module.soon')} ✨</p>
        <Button variant="glass" icon="home" onClick={() => navigate('/')}>
          {t('nav.home')}
        </Button>
      </div>
    </Page>
  )
}

function NotFound() {
  const { t } = useI18n()
  const navigate = useNavigate()
  return (
    <Page>
      <div className="glass flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center">
        <Logo className="h-20 w-20 opacity-40" />
        <h1 className="text-xl font-extrabold">{t('error.notFound')}</h1>
        <Button variant="primary" onClick={() => navigate('/')}>
          {t('nav.home')}
        </Button>
      </div>
    </Page>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Page>
              <NotesPage />
            </Page>
          }
        />
        <Route
          path="/note/:id"
          element={
            <Page>
              <NoteEditorPage />
            </Page>
          }
        />
        <Route
          path="/search"
          element={
            <Page>
              <SearchPage />
            </Page>
          }
        />
        <Route
          path="/trash"
          element={
            <Page>
              <TrashPage />
            </Page>
          }
        />
        <Route
          path="/archive"
          element={
            <Page>
              <ArchivePage />
            </Page>
          }
        />
        <Route
          path="/settings"
          element={
            <Page>
              <SettingsPage />
            </Page>
          }
        />
        {MODULE_NAV.map((m) => (
          <Route
            key={m.to}
            path={m.to}
            element={<ModuleSoon icon={m.icon} titleKey={m.labelKey} />}
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

function InnerApp() {
  const [splashDone, setSplashDone] = useState(false)
  const [booted, setBooted] = useState(false)
  const onSplashDone = useCallback(() => setSplashDone(true), [])
  const toast = useUi((s) => s.toast)
  const { t } = useI18n()

  // بوت: دیتابیس + تنظیمات
  useEffect(() => {
    void (async () => {
      try {
        await openDb()
        const s = await getSettings()
        applyTheme(s.theme, s.accent as never)
        useUi.setState({ theme: s.theme, accent: s.accent as never, locale: s.locale })
      } catch (e) {
        console.error('boot failed', e)
        toast(t('error.generic'), 'error')
      } finally {
        setBooted(true)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <AnimatePresence>{!splashDone && <SplashScreen onDone={onSplashDone} />}</AnimatePresence>
      {splashDone && booted && (
        <AppShell>
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </AppShell>
      )}
      <ToastHost />
    </>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <I18nProvider>
          <InnerApp />
        </I18nProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
