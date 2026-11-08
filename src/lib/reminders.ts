import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import type { Note } from '../db/types'
import { notesRepo } from '../db/repos/notes'

const STORAGE_KEY = 'yadche_reminders'
type Handle = number

/** زمان‌بند یادآور‌ها: نیتیو ← LocalNotifications؛ وب ← setTimeout + Notification */

interface Stored {
  noteId: string
  at: number
}

function readAll(): Stored[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Stored[]
  } catch {
    return []
  }
}

function writeAll(list: Stored[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const timers = new Map<string, Handle>()

function clearLocal(noteId: string) {
  const h = timers.get(noteId)
  if (h !== undefined) window.clearTimeout(h)
  timers.delete(noteId)
}

async function fire(note: Note) {
  const title = note.title || 'یادچه'
  try {
    if (Capacitor.isNativePlatform()) {
      // ( در نیتیو از طریق scheduleNotification رزرو می‌شود؛ اینجا فقط لرزش )
      await Haptics.impact({ style: ImpactStyle.Medium })
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body: note.plainText.slice(0, 120) || '⏰', icon: '/icon-192.png' })
    }
  } catch {
    /* بی‌صدا */
  }
}

/** رزرو/به‌روزرسانی یادآور برای یک یادداشت (at = epoch ms؛ null = حذف) */
export async function scheduleNoteReminder(noteId: string, at: number | null): Promise<void> {
  const all = readAll().filter((r) => r.noteId !== noteId)
  clearLocal(noteId)

  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    try {
      await LocalNotifications.cancel({ notifications: [] })
    } catch {
      /* noop */
    }
    if (at !== null) {
      all.push({ noteId, at })
      const notes = await notesRepo.get(noteId)
      const id = Math.abs(hash(noteId)) % 2147483647
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title: notes?.title || 'یادچه',
              body: notes?.plainText.slice(0, 120) || '⏰ یادآور',
              schedule: { at: new Date(at) },
              sound: 'beep.wav'.replace('.wav', ''),
              channelId: 'reminders',
              extra: { noteId },
            },
          ],
        })
      } catch (e) {
        console.warn('schedule failed', e)
      }
    }
    writeAll(all)
    return
  }

  // وب
  if (at !== null) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        /* رد شد */
      }
    }
    all.push({ noteId, at })
    const delay = Math.max(0, at - Date.now())
    if (delay < 2 ** 31 - 1) {
      const handle = window.setTimeout(() => {
        void (async () => {
          const n = await notesRepo.get(noteId)
          if (n) await fire(n)
          writeAll(readAll().filter((r) => r.noteId !== noteId))
        })()
      }, delay)
      timers.set(noteId, handle)
    }
  }
  writeAll(all)
}

/** فعال‌سازی دوباره‌ی همه‌ی یادآور‌ها بعد از باز شدن اپ */
export function rescheduleAllOnBoot(): void {
  const now = Date.now()
  for (const r of readAll()) {
    if (r.at <= now) {
      // سررسید گذشته → دیگر لازم نیست
      continue
    }
    void scheduleNoteReminder(r.noteId, r.at)
  }
}

export function getReminderFor(noteId: string): number | null {
  return readAll().find((r) => r.noteId === noteId)?.at ?? null
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
