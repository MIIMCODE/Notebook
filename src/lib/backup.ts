import { db } from '../db'

export interface BackupFile {
  app: 'yadche'
  version: 1
  exportedAt: string
  data: Record<string, unknown[]>
}

const TABLES = [
  'notes',
  'folders',
  'tags',
  'noteTags',
  'noteVersions',
  'attachments',
  'tasks',
  'boards',
  'boardColumns',
  'boardCards',
  'habits',
  'habitEntries',
  'journalDays',
  'expenses',
  'pomodoros',
] as const

/** خروجی کامل JSON از همه‌ی داده‌های محلی */
export async function exportBackup(): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {}
  for (const name of TABLES) {
    data[name] = await db.table(name).toArray()
  }
  return { app: 'yadche', version: 1, exportedAt: new Date().toISOString(), data }
}

export function downloadJson(obj: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** بازیابی از فایل پشتیبان (upsert با حفظ شناسه‌ها) */
export async function restoreBackup(file: File): Promise<number> {
  const text = await file.text()
  const parsed = JSON.parse(text) as BackupFile
  if (parsed.app !== 'yadche' || !parsed.data) throw new Error('invalid backup')
  let count = 0
  for (const name of TABLES) {
    const rows = parsed.data[name]
    if (!Array.isArray(rows)) continue
    await db.table(name).bulkPut(rows)
    count += rows.length
  }
  return count
}

/** خروجی Markdown از یک یادداشت */
export function noteToMarkdown(title: string, plain: string, type: string): string {
  const head = `# ${title || 'بی‌عنوان'}\n\n`
  const meta = `> نوع: ${type} · خروجی از یادچه\n\n`
  return head + meta + plain + '\n'
}

export function downloadText(text: string, filename: string, mime = 'text/markdown'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
