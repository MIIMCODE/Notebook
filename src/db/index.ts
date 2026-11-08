import { db } from './schema'
import type { LocalSettings, SyncState } from './types'

export { db }
export * from './types'

/** رویداد ساده‌ی تغییر داده — سینک (مرحله ۴) به آن گوش می‌دهد */
type Listener = (table: string) => void
const listeners = new Set<Listener>()

export function onDbChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function emitDbChange(table: string): void {
  listeners.forEach((fn) => fn(table))
}

const deviceIdKey = 'yadche_device_id'

export function getDeviceId(): string {
  let id = localStorage.getItem(deviceIdKey)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(deviceIdKey, id)
  }
  return id
}

export const DEFAULT_SETTINGS: LocalSettings = {
  key: 'settings',
  theme: 'dark',
  accent: 'violet',
  locale: 'fa',
  lockEnabled: false,
  pinHash: null,
  bioId: null,
  onboarded: false,
}

export async function getSettings(): Promise<LocalSettings> {
  const s = await db.settings.get('settings')
  return { ...DEFAULT_SETTINGS, ...(s as Partial<LocalSettings> | undefined) }
}

export async function saveSettings(patch: Partial<LocalSettings>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, key: 'settings' })
  emitDbChange('settings')
}

export async function getSyncState(): Promise<SyncState> {
  const s = await db.settings.get('sync')
  return (
    (s as SyncState | undefined) ?? {
      key: 'sync',
      lastPushAt: 0,
      lastPullAt: 0,
      status: 'idle',
      deviceId: getDeviceId(),
    }
  )
}

export async function saveSyncState(patch: Partial<SyncState>): Promise<void> {
  const current = await getSyncState()
  await db.settings.put({ ...current, ...patch, key: 'sync' })
}

/** باز کردن امن دیتابیس (در مرورگرهای قدیمی هم) */
export async function openDb(): Promise<void> {
  if (!db.isOpen()) await db.open()
}
