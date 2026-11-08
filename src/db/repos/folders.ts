import { db, emitDbChange } from '../index'
import type { Folder } from '../types'
import { uid } from '../../lib/ids'

export const foldersRepo = {
  async create(name: string, opts: Partial<Folder> = {}): Promise<Folder> {
    const t = Date.now()
    const count = await db.folders.count()
    const folder: Folder = {
      id: uid(),
      name,
      color: opts.color ?? null,
      icon: opts.icon ?? null,
      parentId: opts.parentId ?? null,
      position: opts.position ?? count,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.folders.put(folder)
    emitDbChange('folders')
    return folder
  },

  async update(id: string, patch: Partial<Folder>): Promise<void> {
    const cur = await db.folders.get(id)
    if (!cur) return
    await db.folders.put({ ...cur, ...patch, id, updatedAt: Date.now() })
    emitDbChange('folders')
  },

  async rename(id: string, name: string): Promise<void> {
    await this.update(id, { name })
  },

  async remove(id: string): Promise<void> {
    // یادداشت‌های داخل پوشه بی‌پوشه می‌شوند (پوشه‌های فرزند هم حذف)
    const children = await db.folders.where('parentId').equals(id).toArray()
    await db.transaction('rw', db.folders, db.notes, async () => {
      for (const c of children) await this.remove(c.id)
      await db.notes.where('folderId').equals(id).modify({ folderId: null })
      await db.folders.delete(id)
    })
    emitDbChange('folders')
  },

  all(): Promise<Folder[]> {
    return db.folders.toArray()
  },
}
