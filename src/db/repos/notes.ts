import { db, emitDbChange } from '../index'
import type { Note, NoteType, NoteVersion } from '../types'
import { uid } from '../../lib/ids'

const DEVICE = () => localStorage.getItem('yadche_device_id') ?? 'unknown'

function now(): number {
  return Date.now()
}

export interface CreateNoteInput {
  type?: NoteType
  title?: string
  folderId?: string | null
  content?: unknown
  color?: string | null
}

export const notesRepo = {
  async create(input: CreateNoteInput = {}): Promise<Note> {
    const t = now()
    const note: Note = {
      id: uid(),
      folderId: input.folderId ?? null,
      type: input.type ?? 'text',
      title: input.title ?? '',
      content: input.content ?? null,
      plainText: '',
      color: input.color ?? null,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      reminderAt: null,
      position: 0,
      version: 1,
      deviceId: DEVICE(),
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.notes.put(note)
    emitDbChange('notes')
    return note
  },

  async update(id: string, patch: Partial<Note>): Promise<void> {
    const current = await db.notes.get(id)
    if (!current) return
    await db.notes.put({
      ...current,
      ...patch,
      id,
      version: current.version + 1,
      deviceId: DEVICE(),
      updatedAt: now(),
    })
    emitDbChange('notes')
  },

  async get(id: string): Promise<Note | undefined> {
    return db.notes.get(id)
  },

  /** همه‌ی یادداشت‌های زنده (بدون سطل زباله) */
  live(): Promise<Note[]> {
    return db.notes.filter((n) => !n.isDeleted).toArray()
  },

  async togglePin(id: string): Promise<void> {
    const n = await db.notes.get(id)
    if (n) await this.update(id, { isPinned: !n.isPinned })
  },

  async archive(id: string, archived = true): Promise<void> {
    await this.update(id, { isArchived: archived })
  },

  /** انتقال به سطل زباله */
  async trash(id: string): Promise<void> {
    await this.update(id, { isDeleted: true, deletedAt: now() })
  },

  async restore(id: string): Promise<void> {
    await this.update(id, { isDeleted: false, deletedAt: null })
  },

  /** حذف کامل */
  async purge(id: string): Promise<void> {
    await db.transaction('rw', db.notes, db.noteTags, db.noteVersions, async () => {
      await db.notes.delete(id)
      await db.noteTags.where('noteId').equals(id).delete()
      await db.noteVersions.where('noteId').equals(id).delete()
    })
    emitDbChange('notes')
  },

  /** خالی کردن سطل زباله */
  async emptyTrash(): Promise<void> {
    const trashed = await db.notes.filter((n) => n.isDeleted).toArray()
    for (const n of trashed) await this.purge(n.id)
  },

  /** ذخیره‌ی نسخه قبل از ویرایش بزرگ */
  async saveVersion(id: string): Promise<void> {
    const n = await db.notes.get(id)
    if (!n || (!n.title && !n.content)) return
    const last = await db.noteVersions.where('noteId').equals(id).sortBy('version')
    const lastVersion = last.length ? last[last.length - 1].version : 0
    // حفظ حداکثر ۲۰ نسخه
    if (last.length >= 20) {
      await db.noteVersions.delete(last[0].id)
    }
    const v: NoteVersion = {
      id: uid(),
      noteId: id,
      version: lastVersion + 1,
      title: n.title,
      content: n.content,
      createdAt: now(),
    }
    await db.noteVersions.put(v)
    emitDbChange('noteVersions')
  },

  async versions(noteId: string): Promise<NoteVersion[]> {
    const list = await db.noteVersions.where('noteId').equals(noteId).toArray()
    return list.sort((a, b) => b.createdAt - a.createdAt)
  },

  async restoreVersion(noteId: string, versionId: string): Promise<void> {
    const v = await db.noteVersions.get(versionId)
    if (!v) return
    await this.saveVersion(noteId)
    await this.update(noteId, { title: v.title, content: v.content })
  },

  /** بستن/باز کردن یادداشت (بایگانی) */
  async toggleArchive(id: string): Promise<void> {
    const n = await db.notes.get(id)
    if (n) await this.archive(id, !n.isArchived)
  },

  /** جستجوی سریع روی متن و عنوان */
  async search(query: string): Promise<Note[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const all = await this.live()
    return all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.plainText.toLowerCase().includes(q) ||
        n.color?.toLowerCase().includes(q) === true,
    )
  },

  /** به‌روزرسانی متن جستجو بعد از ویرایش */
  async setText(id: string, content: unknown, plainText: string): Promise<void> {
    await this.update(id, { content, plainText })
  },
}
