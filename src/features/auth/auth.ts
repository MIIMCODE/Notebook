import { getSupabase } from '../../sync/client'
import {
  claimLocalData,
  clearSyncedData,
  startSyncEngine,
  stopSyncEngine,
  syncNow,
} from '../../sync/engine'
import { saveSyncState } from '../../db'

const ACTIVE_USER_KEY = 'yadche_active_user'

export interface AuthResult {
  ok: boolean
  /** پیام برای نمایش به کاربر */
  message?: string
  needsConfirm?: boolean
}

/** مدیریت نشست: ادغام داده‌ی مهمان + شروع/توقف سینک */
export async function handleSession(userId: string | null): Promise<void> {
  if (!userId) {
    stopSyncEngine()
    localStorage.removeItem(ACTIVE_USER_KEY)
    return
  }
  const prev = localStorage.getItem(ACTIVE_USER_KEY)
  if (prev && prev !== userId) {
    // حساب دیگری وارد شد → داده‌ی حساب قبلی پاک می‌شود
    await clearSyncedData()
    await saveSyncState({ lastPushAt: 0, lastPullAt: 0 })
  } else if (!prev) {
    // اولین ورود: داده‌ی مهمان به حساب منتقل می‌شود
    await claimLocalData(userId)
    await saveSyncState({ lastPushAt: 0, lastPullAt: 0 })
  }
  localStorage.setItem(ACTIVE_USER_KEY, userId)
  startSyncEngine()
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, message: 'Supabase پیکربندی نشده است' }
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) {
    return {
      ok: false,
      message: error.message === 'Invalid login credentials' ? undefined : error.message,
    }
  }
  if (data.user) await handleSession(data.user.id)
  return { ok: true }
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, message: 'Supabase پیکربندی نشده است' }
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error) return { ok: false, message: error.message }
  if (data.session && data.user) {
    await handleSession(data.user.id)
    return { ok: true }
  }
  return { ok: true, needsConfirm: true }
}

export async function signOut(): Promise<void> {
  const sb = getSupabase()
  stopSyncEngine()
  if (sb) await sb.auth.signOut()
  localStorage.removeItem(ACTIVE_USER_KEY)
}

export async function getCurrentUserId(): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session?.user.id ?? null
}

export async function forceSync(): Promise<void> {
  await syncNow()
}

/** شنونده‌ی تغییر نشست — در App boot فراخوانی می‌شود */
export function watchAuth(): () => void {
  const sb = getSupabase()
  if (!sb) return () => {}
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    void handleSession(session?.user.id ?? null)
  })
  return () => data.subscription.unsubscribe()
}
