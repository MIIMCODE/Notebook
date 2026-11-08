/**
 * تبدیل رکوردهای کلاینت (camelCase) ↔ ردیف‌های Postgres (snake_case)
 */

const TIMESTAMP_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
  'reminderAt',
  'dueAt',
  'startedAt',
])

const JSON_FIELDS = new Set(['content'])

/** فیلدهایی که در Postgres نیستند (فقط محلی) */
const SKIP_FIELDS = new Set(['key'])

export function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function toRemoteValue(field: string, value: unknown): unknown {
  if (value === undefined) return null
  if (value === null) return null
  if (TIMESTAMP_FIELDS.has(field)) {
    if (typeof value === 'number') return new Date(value).toISOString()
    return value
  }
  // jsonb: شیء همان‌طور ارسال می‌شود (PostgREST)
  return value
}

function fromRemoteValue(field: string, value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (TIMESTAMP_FIELDS.has(field)) {
    if (typeof value === 'string') {
      const t = Date.parse(value)
      return Number.isNaN(t) ? null : t
    }
    return value
  }
  if (JSON_FIELDS.has(field)) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }
    return value
  }
  return value
}

/** رکورد کلاینت → ردیف سرور */
export function toRemote(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(record)) {
    if (SKIP_FIELDS.has(field)) continue
    if (field === 'id') {
      out.id = value
      continue
    }
    out[toSnake(field)] = toRemoteValue(field, value)
  }
  return out
}

/** ردیف سرور → رکورد کلاینت */
export function fromRemote(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [col, value] of Object.entries(row)) {
    const field = toCamel(col)
    out[field] = fromRemoteValue(field, value)
  }
  return out
}

/** جدول‌های همگام‌شونده (کلاینت ↔ سرور) با کلید اصلی */
export interface SyncTable {
  local: string
  remote: string
  /** ستون‌های بدون updatedAt: فقط append (push = ردیف‌های جدید) */
  appendOnly?: boolean
}

export const SYNC_TABLES: SyncTable[] = [
  { local: 'notes', remote: 'notes' },
  { local: 'folders', remote: 'folders' },
  { local: 'tags', remote: 'tags' },
  { local: 'noteVersions', remote: 'note_versions', appendOnly: true },
  { local: 'tasks', remote: 'tasks' },
  { local: 'boards', remote: 'boards' },
  { local: 'boardColumns', remote: 'board_columns' },
  { local: 'boardCards', remote: 'board_cards' },
  { local: 'habits', remote: 'habits' },
  { local: 'habitEntries', remote: 'habit_entries' },
  { local: 'journalDays', remote: 'journal_days' },
  { local: 'expenses', remote: 'expenses' },
  { local: 'pomodoros', remote: 'pomodoro_sessions', appendOnly: true },
]

/** نام به‌روزرسانی‌شده در هر تغییر (برای noteTags وابسته به یادداشت) */
export const NOTE_TABLES = new Set(['notes', 'noteTags', 'noteVersions'])
