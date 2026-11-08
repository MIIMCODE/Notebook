import { db, getDeviceId, getSyncState, saveSyncState, onDbChange } from '../db'
import { getSupabase, isSupabaseConfigured } from './client'
import { SYNC_TABLES, fromRemote, toRemote } from './mapping'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

type Listener = (status: SyncStatus) => void
const statusListeners = new Set<Listener>()
let status: SyncStatus = 'idle'

function setStatus(s: SyncStatus): void {
  status = s
  statusListeners.forEach((fn) => fn(s))
  void saveSyncState({ status: s })
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function onSyncStatus(fn: Listener): () => void {
  statusListeners.add(fn)
  return () => statusListeners.delete(fn)
}

const PUSH_BATCH = 300
const PULL_BATCH = 500

let running = false
let debounceTimer: number | null = null
let lastRunAt = 0

/** همگام‌سازی کامل (push سپس pull) */
export async function syncNow(): Promise<void> {
  if (!isSupabaseConfigured()) return
  const sb = getSupabase()
  if (!sb) return
  const { data } = await sb.auth.getSession()
  if (!data.session) return
  if (running) return

  running = true
  const wasOffline = typeof navigator !== 'undefined' && !navigator.onLine
  setStatus(wasOffline ? 'offline' : 'syncing')
  const startedAt = Date.now()

  try {
    await pushAll(sb, data.session.user.id)
    await pullAll(sb)
    const state = await getSyncState()
    await saveSyncState({ lastPushAt: startedAt, lastPullAt: state.lastPullAt, status: 'idle' })
    setStatus('idle')
    lastRunAt = Date.now()
  } catch (e) {
    console.warn('sync failed', e)
    setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error')
  } finally {
    running = false
  }
}

// ── PUSH ────────────────────────────────────────────────────────────────────
async function pushAll(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  userId: string,
): Promise<void> {
  const cursor = (await getSyncState()).lastPushAt

  for (const table of SYNC_TABLES) {
    const dexie = db.table(table.local)
    let changed: Record<string, unknown>[]

    if (table.appendOnly) {
      // فقط ردیف‌های جدید (بدون updatedAt): با انتخاب idهای موجود در سرور
      changed = (await dexie.toArray()) as unknown as Record<string, unknown>[]
      if (changed.length === 0) continue
      const ids = changed.map((r) => r.id as string)
      const existing = new Set<string>()
      for (let i = 0; i < ids.length; i += PUSH_BATCH) {
        const chunk = ids.slice(i, i + PUSH_BATCH)
        const { data } = await sb.from(table.remote).select('id').in('id', chunk)
        ;(data ?? []).forEach((r) => existing.add(String(r.id)))
      }
      changed = changed.filter((r) => !existing.has(String(r.id)))
    } else {
      changed = ((await dexie.toArray()) as unknown as Record<string, unknown>[]).filter(
        (r) => typeof r.updatedAt === 'number' && r.updatedAt > cursor,
      )
    }

    if (changed.length === 0) continue

    // LWW: ردیف‌هایی که سرور جدیدتر است را رد می‌کنیم
    const ids = changed.map((r) => r.id as string)
    const serverTimes = new Map<string, number>()
    for (let i = 0; i < ids.length; i += PUSH_BATCH) {
      const chunk = ids.slice(i, i + PUSH_BATCH)
      const { data } = await sb
        .from(table.remote)
        .select('id, updated_at')
        .in('id', chunk)
        .not('updated_at', 'is', null)
      ;(data ?? []).forEach((r) => serverTimes.set(String(r.id), Date.parse(String(r.updated_at))))
    }

    const toWrite = changed.filter((r) => {
      const serverT = serverTimes.get(String(r.id))
      if (serverT === undefined) return true // جدید
      return serverT < (r.updatedAt as number) // کلاینت جدیدتر
    })
    if (toWrite.length === 0) continue

    const rows = toWrite.map((r) => ({ ...toRemote(r), user_id: userId }))
    for (let i = 0; i < rows.length; i += PUSH_BATCH) {
      const chunk = rows.slice(i, i + PUSH_BATCH)
      const { error } = await sb.from(table.remote).upsert(chunk, { onConflict: 'id' })
      if (error) throw new Error(`${table.remote}: ${error.message}`)
    }
  }

  // noteTags: آشتی‌دادن لینک‌های یادداشت‌های تغییریافته
  await pushNoteTags(sb, userId, cursor)
}

async function pushNoteTags(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  userId: string,
  cursor: number,
): Promise<void> {
  const changedNotes = (await db.notes.toArray()).filter((n) => n.updatedAt > cursor)
  if (changedNotes.length === 0) return
  const noteIds = changedNotes.map((n) => n.id)

  // حذف لینک‌های فعلی سرور برای این یادداشت‌ها و بازسازی از محلی
  for (let i = 0; i < noteIds.length; i += PULL_BATCH) {
    const chunk = noteIds.slice(i, i + PULL_BATCH)
    const { error: delErr } = await sb.from('note_tags').delete().in('note_id', chunk)
    if (delErr) throw new Error(`note_tags: ${delErr.message}`)
  }

  const links = await db.noteTags.where('noteId').anyOf(noteIds).toArray()
  if (links.length === 0) return
  const rows = links.map((l) => ({
    note_id: l.noteId,
    tag_id: l.tagId,
    user_id: userId,
  }))
  for (let i = 0; i < rows.length; i += PULL_BATCH) {
    const chunk = rows.slice(i, i + PULL_BATCH)
    const { error } = await sb.from('note_tags').upsert(chunk, {
      onConflict: 'note_id,tag_id',
      ignoreDuplicates: true,
    })
    if (error) throw new Error(`note_tags: ${error.message}`)
  }
}

// ── PULL ────────────────────────────────────────────────────────────────────
async function pullAll(sb: NonNullable<ReturnType<typeof getSupabase>>): Promise<void> {
  const state = await getSyncState()
  let cursor = state.lastPullAt
  const myDevice = getDeviceId()

  for (const table of SYNC_TABLES) {
    let more = true
    let tableMax = cursor
    let lastKey: string | number | null = null
    const timeCol = table.appendOnly ? 'created_at' : 'updated_at'

    while (more) {
      let query = sb
        .from(table.remote)
        .select('*')
        .gt(timeCol, new Date(cursor).toISOString())
        .order(timeCol, { ascending: true })
        .limit(PULL_BATCH)
      if (lastKey !== null) query = query.gt(timeCol, lastKey)

      const { data, error } = await query
      if (error) throw new Error(`${table.remote}: ${error.message}`)
      const rows = data ?? []
      if (rows.length === 0) break

      const records = rows.map((r) => fromRemote(r as Record<string, unknown>))
      // ردیف‌های خودی با دستگاه خودمان را نادیده می‌گیریم (اکو)
      const filtered = records.filter(
        (r) => !(r.deviceId && r.deviceId === myDevice && r.updatedAt !== undefined),
      )

      if (!table.appendOnly && filtered.length > 0) {
        // فقط زمانی بازنویسی کن که دوردست جدیدتر است
        const ids = filtered.map((r) => r.id as string)
        const locals = await db.table(table.local).where('id').anyOf(ids).toArray()
        const localById = new Map(locals.map((l) => [l.id, l]))
        const toPut = filtered.filter((r) => {
          const local = localById.get(r.id as string)
          if (!local) return true
          return ((r.updatedAt as number) ?? 0) > ((local.updatedAt as number) ?? 0)
        })
        if (toPut.length > 0) {
          await db.table(table.local).bulkPut(toPut)
        }
      } else if (table.appendOnly) {
        await db.table(table.local).bulkPut(filtered)
      }

      for (const r of records) {
        const t = (table.appendOnly ? r.createdAt : r.updatedAt) as number | null
        if (typeof t === 'number' && t > tableMax) tableMax = t
      }

      lastKey = rows.length
        ? String((rows[rows.length - 1] as Record<string, unknown>)[timeCol])
        : null
      more = rows.length === PULL_BATCH
      if (rows.length < PULL_BATCH) break
    }

    if (tableMax > cursor) cursor = tableMax
  }

  // noteTags: لینک‌های یادداشت‌هایی که از سرور آمده‌اند را تازه می‌کنیم
  await pullNoteTags(sb)

  await saveSyncState({ lastPullAt: cursor })
}

let lastTagsPullAt = 0

async function pullNoteTags(sb: NonNullable<ReturnType<typeof getSupabase>>): Promise<void> {
  // یادداشت‌هایی که اخیراً از سرور آمده‌اند (updated_at جدید)
  const since = Math.max(lastTagsPullAt, (await getSyncState()).lastPullAt - 60_000)
  const { data, error } = await sb
    .from('note_tags')
    .select('note_id, tag_id, created_at')
    .gt('created_at', new Date(since).toISOString())
    .limit(PULL_BATCH)
  if (error) return // جدول خالی/خطا مهلت نمی‌دهد
  const rows = data ?? []
  if (rows.length === 0) return

  const noteIds = [...new Set(rows.map((r) => String(r.note_id)))]
  // لینک‌های محلی این یادداشت‌ها را با سرور هم‌تراز می‌کنیم
  const { data: remoteLinks } = await sb
    .from('note_tags')
    .select('note_id, tag_id')
    .in('note_id', noteIds)
    .limit(PULL_BATCH)

  const remoteSet = new Set((remoteLinks ?? []).map((r) => `${r.note_id}:${r.tag_id}`))
  const localLinks = await db.noteTags.where('noteId').anyOf(noteIds).toArray()
  const localSet = new Set(localLinks.map((l) => `${l.noteId}:${l.tagId}`))

  const toInsert = [...remoteSet]
    .filter((k) => !localSet.has(k))
    .map((k) => {
      const [noteId, tagId] = k.split(':')
      return { noteId, tagId }
    })
  const toDelete = localLinks.filter((l) => !remoteSet.has(`${l.noteId}:${l.tagId}`))

  if (toInsert.length) await db.noteTags.bulkPut(toInsert)
  if (toDelete.length) await db.noteTags.bulkDelete(toDelete.map((l) => [l.noteId, l.tagId]))
  lastTagsPullAt = Date.now()
}

// ── چرخه‌ی حیات ──────────────────────────────────────────────────────────────
let stopDbListener: (() => void) | null = null
let intervalId: number | null = null

function scheduleSync(delay = 1500): void {
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    void syncNow()
  }, delay)
}

/** شروع موتور سینک (بعد از login) */
export function startSyncEngine(): void {
  if (stopDbListener) return
  stopDbListener = onDbChange((table) => {
    if (table === 'settings') return
    scheduleSync()
  })
  intervalId = window.setInterval(() => {
    if (Date.now() - lastRunAt > 30_000) void syncNow()
  }, 30_000)
  window.addEventListener('online', () => scheduleSync(300))
  void syncNow()
}

/** توقف (logout) */
export function stopSyncEngine(): void {
  stopDbListener?.()
  stopDbListener = null
  if (intervalId) window.clearInterval(intervalId)
  intervalId = null
  if (debounceTimer) window.clearTimeout(debounceTimer)
  setStatus('idle')
}

/** داده‌ی مهمان را به حساب جاری نسبت بده (merge) */
export async function claimLocalData(userId: string): Promise<void> {
  const tables = SYNC_TABLES.map((t) => t.local).filter(
    (n) => n !== 'noteVersions' && n !== 'pomodoros',
  )
  for (const name of tables) {
    const rows = (await db.table(name).toArray()) as unknown as Record<string, unknown>[]
    const mine = rows.filter((r) => !r.userId)
    if (mine.length === 0) continue
    await db.table(name).bulkPut(mine.map((r) => ({ ...r, userId })))
  }
  const links = await db.noteTags.toArray()
  if (links.length) {
    // noteTags به کاربر وابسته نیست (از طریق note) — نیازی نیست
  }
}

/** پاک‌سازی داده‌های حساب قبلی هنگام ورود با حساب دیگر */
export async function clearSyncedData(): Promise<void> {
  const names = ['noteTags', ...SYNC_TABLES.map((t) => t.local)]
  await db.transaction('rw', names, async () => {
    for (const name of names) await db.table(name).clear()
  })
}
