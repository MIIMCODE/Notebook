import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useI18n, type Locale } from '../../i18n'
import { useUi, type Accent, type Theme } from '../../stores/ui'
import { getSettings, saveSettings } from '../../db'
import { downloadJson, exportBackup, restoreBackup } from '../../lib/backup'
import { notesRepo } from '../../db/repos/notes'
import Icon, { type IconName } from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Confirm, Modal } from '../../components/ui/Modal'
import { Switch } from '../../components/ui/Primitives'
import { useSession } from '../auth/useSession'
import { signOut, forceSync } from '../auth/auth'
import { useSyncStatus } from '../../sync/useSyncStatus'
import { isSupabaseConfigured } from '../../sync/client'
import { enablePin, disableLock, registerBiometric, biometricsAvailable } from '../../lib/lock'
import { relativeTime } from '../../lib/jalali'

const ACCENTS: { id: Accent; color: string }[] = [
  { id: 'violet', color: '#8B5CF6' },
  { id: 'pink', color: '#EC4899' },
  { id: 'amber', color: '#F59E0B' },
  { id: 'emerald', color: '#10B981' },
  { id: 'sky', color: '#0EA5E9' },
]

export function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const navigate = useNavigate()
  const { theme, setTheme, accent, setAccent, toast } = useUi()
  const [lockEnabled, setLockEnabled] = useState(false)
  const [pinModal, setPinModal] = useState<null | {
    step: 'first' | 'confirm'
    first: string
    value: string
    error: boolean
  }>(null)
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioOn, setBioOn] = useState(false)
  const session = useSession()
  const { status, lastSyncAt } = useSyncStatus()
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmLockOff, setConfirmLockOff] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void getSettings().then((s) => {
      setLockEnabled(s.lockEnabled)
      setBioOn(!!s.bioId)
    })
    void biometricsAvailable().then(setBioAvailable)
  }, [])

  const doBackup = async () => {
    const data = await exportBackup()
    downloadJson(data, `yadche-backup-${new Date().toISOString().slice(0, 10)}.json`)
    toast(t('settings.exported'), 'success')
  }

  const doRestore = async (file: File) => {
    try {
      const n = await restoreBackup(file)
      await saveSettings({ onboarded: true })
      toast(`${t('settings.restored')} (${n})`, 'success')
    } catch {
      toast(t('error.generic'), 'error')
    }
  }

  const exportMarkdown = async () => {
    const notes = await notesRepo.live()
    const md = notes
      .map((n) => `# ${n.title || t('notes.untitled')}\n\n${n.plainText}\n\n---\n`)
      .join('\n')
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yadche-notes-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast(t('settings.exported'), 'success')
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-extrabold sm:text-2xl">{t('settings.title')}</h1>

      {/* حساب و همگام‌سازی */}
      <Section icon="cloud" title={t('settings.sync')}>
        {isSupabaseConfigured() ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      status === 'syncing'
                        ? 'animate-pulse bg-amber-400'
                        : status === 'error'
                          ? 'bg-red-400'
                          : status === 'offline'
                            ? 'bg-white/40'
                            : session
                              ? 'bg-emerald-400'
                              : 'bg-white/30'
                    }`}
                  />
                  {session ? session.user.email : t('settings.notLoggedIn')}
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">
                  {status === 'syncing'
                    ? '…'
                    : status === 'error'
                      ? t('error.network')
                      : lastSyncAt > 0
                        ? t('settings.lastSync', { t: relativeTime(lastSyncAt, locale) })
                        : t('settings.sync')}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {session ? (
                  <>
                    <Button
                      size="sm"
                      variant="glass"
                      icon="refresh"
                      onClick={async () => {
                        await forceSync()
                        toast(t('common.saved'), 'success')
                      }}
                    >
                      {t('settings.syncNow')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="logout"
                      onClick={async () => {
                        await signOut()
                        toast(t('auth.signOut'), 'default')
                      }}
                    >
                      {t('auth.signOut')}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    icon="login"
                    onClick={() => navigate('/login')}
                  >
                    {t('auth.signIn')}
                  </Button>
                )}
              </div>
            </div>
            {session && (
              <p className="rounded-lg bg-white/5 px-3 py-2 text-[11px] leading-5 text-white/45">
                {t('settings.backupDesc')} — داده‌ها اول محلی ذخیره می‌شوند و سپس به‌صورت خودکار با
                Supabase همگام می‌شوند.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/50">{t('error.network')}</p>
        )}
      </Section>

      {/* ظاهر */}
      <Section icon="palette" title={t('settings.appearance')}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">{t('settings.theme')}</span>
            <div className="glass flex rounded-xl p-1">
              {(
                [
                  { id: 'dark', icon: 'moon', label: t('settings.themeDark') },
                  { id: 'light', icon: 'sun', label: t('settings.themeLight') },
                  { id: 'auto', icon: 'sparkle', label: t('settings.themeAuto') },
                ] as const
              ).map((x) => (
                <button
                  key={x.id}
                  onClick={() => setTheme(x.id as Theme)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    theme === x.id
                      ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white'
                      : 'text-white/55'
                  }`}
                >
                  <Icon name={x.icon} size={14} />
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">{t('settings.accent')}</span>
            <div className="flex gap-2">
              {ACCENTS.map((a) => (
                <motion.button
                  key={a.id}
                  whileTap={{ scale: 0.85 }}
                  aria-label={a.id}
                  onClick={() => setAccent(a.id)}
                  className={`h-7 w-7 rounded-full border-2 transition ${accent === a.id ? 'border-white scale-110' : 'border-white/15'}`}
                  style={{
                    background: a.color,
                    boxShadow: accent === a.id ? `0 0 14px ${a.color}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">{t('settings.language')}</span>
            <div className="glass flex rounded-xl p-1">
              {(
                [
                  { id: 'fa', label: 'فارسی' },
                  { id: 'en', label: 'English' },
                ] as const
              ).map((x) => (
                <button
                  key={x.id}
                  onClick={() => {
                    setLocale(x.id as Locale)
                    void saveSettings({ locale: x.id })
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    locale === x.id
                      ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white'
                      : 'text-white/55'
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* داده */}
      <Section icon="download" title={t('settings.data')}>
        <div className="flex flex-col gap-2.5">
          <SettingRow
            icon="download"
            title={t('settings.backup')}
            desc={t('settings.backupDesc')}
            action={
              <Button size="sm" variant="glass" onClick={() => void doBackup()}>
                {t('action.export')}
              </Button>
            }
          />
          <SettingRow
            icon="upload"
            title={t('settings.restore')}
            desc={t('settings.restoreDesc')}
            action={
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void doRestore(f)
                    e.target.value = ''
                  }}
                />
                <Button size="sm" variant="glass" onClick={() => fileRef.current?.click()}>
                  {t('action.import')}
                </Button>
              </>
            }
          />
          <SettingRow
            icon="book"
            title={t('settings.exportMd')}
            desc=".md"
            action={
              <Button size="sm" variant="glass" onClick={() => void exportMarkdown()}>
                {t('action.export')}
              </Button>
            }
          />
          <SettingRow
            icon="trash"
            title={t('settings.clearData')}
            desc={t('settings.clearConfirm')}
            danger
            action={
              <Button size="sm" variant="danger" onClick={() => setConfirmClear(true)}>
                {t('action.delete')}
              </Button>
            }
          />
        </div>
      </Section>

      {/* امنیت */}
      <Section icon="lock" title={t('settings.security')}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{t('settings.lock')}</div>
            <div className="text-xs text-white/45">{t('settings.lockDesc')}</div>
          </div>
          <Switch
            checked={lockEnabled}
            onChange={(v) => {
              if (v) {
                setPinModal({ step: 'first', first: '', value: '', error: false })
              } else {
                setConfirmLockOff(true)
              }
            }}
            label={t('settings.lock')}
          />
        </div>
        {lockEnabled && bioAvailable && (
          <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
            <div className="flex items-center gap-2">
              <Icon name="fingerprint" size={18} className="text-brand-300" />
              <div className="text-sm font-semibold">{t('lock.useFingerprint')}</div>
            </div>
            <Switch
              checked={bioOn}
              onChange={(v) => {
                if (v) {
                  void registerBiometric().then((ok) => {
                    setBioOn(ok)
                    if (ok) toast(t('lock.pinSet'), 'success')
                    else toast(t('error.generic'), 'error')
                  })
                } else {
                  void saveSettings({ bioId: null })
                  setBioOn(false)
                }
              }}
              label={t('lock.useFingerprint')}
            />
          </div>
        )}
      </Section>

      {/* مودال ساخت PIN */}
      <Modal
        open={!!pinModal}
        onClose={() => setPinModal(null)}
        title={pinModal?.step === 'first' ? t('lock.setup') : t('lock.confirmPin')}
      >
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-white/50">
            {pinModal?.step === 'first' ? t('lock.enterPin') : t('lock.confirmPin')}
          </p>
          <input
            autoFocus
            inputMode="numeric"
            type="password"
            maxLength={4}
            value={pinModal?.value ?? ''}
            onChange={(e) =>
              setPinModal(
                pinModal
                  ? {
                      ...pinModal,
                      value: e.target.value.replace(/\D/g, '').slice(0, 4),
                      error: false,
                    }
                  : null,
              )
            }
            placeholder="••••"
            className="w-40 rounded-2xl border border-white/15 bg-white/6 px-4 py-3 text-center text-2xl font-black tracking-[0.4em] outline-none focus:border-brand-400"
            dir="ltr"
          />
          {pinModal?.error && (
            <p className="text-xs font-semibold text-red-400">{t('lock.pinMismatch')}</p>
          )}
          <Button
            variant="primary"
            className="mt-2 w-full"
            onClick={async () => {
              if (!pinModal) return
              const v = pinModal.value
              if (!/^\d{4}$/.test(v)) {
                setPinModal({ ...pinModal, error: true, value: '' })
                return
              }
              if (pinModal.step === 'first') {
                setPinModal({ step: 'confirm', first: v, value: '', error: false })
                return
              }
              if (v !== pinModal.first) {
                setPinModal({ ...pinModal, step: 'first', first: '', value: '', error: true })
                return
              }
              await enablePin(v)
              setLockEnabled(true)
              setPinModal(null)
              toast(t('lock.pinSet'), 'success')
            }}
          >
            {t('action.create')}
          </Button>
        </div>
      </Modal>

      <Confirm
        open={confirmLockOff}
        title={t('settings.lock')}
        confirmLabel={t('action.delete')}
        onCancel={() => setConfirmLockOff(false)}
        onConfirm={async () => {
          await disableLock()
          setLockEnabled(false)
          setBioOn(false)
          setConfirmLockOff(false)
          toast(t('common.deleted'), 'default')
        }}
      />

      {/* درباره */}
      <Section icon="sparkle" title={t('settings.about')}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-rose-accent to-amber-accent text-2xl">
            📓
          </div>
          <div>
            <div className="font-extrabold">{t('appName')}</div>
            <div className="text-xs text-white/50">{t('tagline')}</div>
            <div className="mt-1 text-[11px] text-white/35">
              {t('settings.version')} 0.1.0
              {lastSyncAt > 0 &&
                ` · ${t('settings.lastSync', { t: relativeTime(lastSyncAt, locale) })}`}
            </div>
          </div>
        </div>
      </Section>

      <Confirm
        open={confirmClear}
        title={t('settings.clearConfirm')}
        confirmLabel={t('action.delete')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          await dbClear()
          setConfirmClear(false)
          toast(t('common.deleted'), 'success')
        }}
      />
    </div>
  )
}

async function dbClear() {
  const { db } = await import('../../db')
  await db.notes.clear()
  await db.folders.clear()
  await db.tags.clear()
  await db.noteTags.clear()
  await db.noteVersions.clear()
  await db.tasks.clear()
  await db.boards.clear()
  await db.boardColumns.clear()
  await db.boardCards.clear()
  await db.habits.clear()
  await db.habitEntries.clear()
  await db.journalDays.clear()
  await db.expenses.clear()
  await db.pomodoros.clear()
}

function Section({
  icon,
  title,
  children,
}: {
  icon: IconName
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="glass overflow-hidden rounded-2xl"
    >
      <h2 className="flex items-center gap-2 border-b border-white/8 px-4 py-3 text-sm font-bold">
        <Icon name={icon} size={16} className="text-brand-300" />
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </motion.section>
  )
}

function SettingRow({
  icon,
  title,
  desc,
  action,
  danger,
}: {
  icon: IconName
  title: string
  desc?: string
  action: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 p-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-red-500/15 text-red-300' : 'bg-white/8 text-white/70'}`}
      >
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        {desc && <div className="truncate text-[11px] text-white/45">{desc}</div>}
      </div>
      {action}
    </div>
  )
}
export default SettingsPage
