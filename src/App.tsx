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
import AuthPage from './features/auth/AuthPage'
import { watchAuth } from './features/auth/auth'
import TasksPage from './features/tasks/TasksPage'
import KanbanPage from './features/kanban/KanbanPage'
import HabitsPage from './features/habits/HabitsPage'
import JournalPage from './features/journal/JournalPage'
import CalendarPage from './features/calendar/CalendarPage'
import PomodoroPage from './features/pomodoro/PomodoroPage'
import ExpensesPage from './features/expenses/ExpensesPage'
import { openDb, getSettings } from './db'
import { rescheduleAllOnBoot } from './lib/reminders'
import LockScreen, { useLock } from './features/lock/LockScreen'
import { isSessionUnlocked } from './lib/lock'
import Button from './components/ui/Button'
import Logo from './components/Logo'

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
        <Route
          path="/login"
          element={
            <Page>
              <AuthPage />
            </Page>
          }
        />
        <Route
          path="/tasks"
          element={
            <Page>
              <TasksPage />
            </Page>
          }
        />
        <Route
          path="/kanban"
          element={
            <Page>
              <KanbanPage />
            </Page>
          }
        />
        <Route
          path="/habits"
          element={
            <Page>
              <HabitsPage />
            </Page>
          }
        />
        <Route
          path="/journal"
          element={
            <Page>
              <JournalPage />
            </Page>
          }
        />
        <Route
          path="/calendar"
          element={
            <Page>
              <CalendarPage />
            </Page>
          }
        />
        <Route
          path="/pomodoro"
          element={
            <Page>
              <PomodoroPage />
            </Page>
          }
        />
        <Route
          path="/expenses"
          element={
            <Page>
              <ExpensesPage />
            </Page>
          }
        />
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
    const unwatch = watchAuth()
    void (async () => {
      try {
        await openDb()
        const s = await getSettings()
        applyTheme(s.theme, s.accent as never)
        rescheduleAllOnBoot()
        if (s.lockEnabled && !isSessionUnlocked()) useLock.getState().lock()
        useUi.setState({ theme: s.theme, accent: s.accent as never, locale: s.locale })
      } catch (e) {
        console.error('boot failed', e)
        toast(t('error.generic'), 'error')
      } finally {
        setBooted(true)
      }
    })()
    return unwatch
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
      <LockScreen />
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
