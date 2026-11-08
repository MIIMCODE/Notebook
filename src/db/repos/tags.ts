import { db, emitDbChange } from '../index'
import type { Tag } from '../types'
import { uid } from '../../lib/ids'

export const tagsRepo = {
  async create(name: string, color: string | null = null): Promise<Tag> {
    const trimmed = name.trim()
    const existing = await db.tags.where('name').equals(trimmed).first()
    if (existing) return existing
    const t = Date.now()
    const tag: Tag = {
      id: uid(),
      name: trimmed,
      color,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.tags.put(tag)
    emitDbChange('tags')
    return tag
  },

  async remove(id: string): Promise<void> {
    await db.transaction('rw', db.tags, db.noteTags, async () => {
      await db.noteTags.where('tagId').equals(id).delete()
      await db.tags.delete(id)
    })
    emitDbChange('tags')
  },

  async update(id: string, patch: Partial<Tag>): Promise<void> {
    const cur = await db.tags.get(id)
    if (!cur) return
    await db.tags.put({ ...cur, ...patch, id, updatedAt: Date.now() })
    emitDbChange('tags')
  },

  all(): Promise<Tag[]> {
    return db.tags.toArray()
  },

  async forNote(noteId: string): Promise<Tag[]> {
    const links = await db.noteTags.where('noteId').equals(noteId).toArray()
    const ids = links.map((l) => l.tagId)
    if (!ids.length) return []
    return db.tags.where('id').anyOf(ids).toArray()
  },

  async attach(noteId: string, tagId: string): Promise<void> {
    await db.noteTags.put({ noteId, tagId })
    emitDbChange('noteTags')
  },

  async detach(noteId: string, tagId: string): Promise<void> {
    await db.noteTags.delete([noteId, tagId])
    emitDbChange('noteTags')
  },

  async toggle(noteId: string, tagId: string): Promise<void> {
    const key: [string, string] = [noteId, tagId]
    const exists = await db.noteTags.get(key)
    if (exists) await this.detach(noteId, tagId)
    else await this.attach(noteId, tagId)
  },

  async forNotes(noteIds: string[]): Promise<Map<string, Tag[]>> {
    const links = await db.noteTags.where('noteId').anyOf(noteIds).toArray()
    const tagIds = [...new Set(links.map((l) => l.tagId))]
    const tags = tagIds.length ? await db.tags.where('id').anyOf(tagIds).toArray() : []
    const byId = new Map(tags.map((t) => [t.id, t]))
    const result = new Map<string, Tag[]>()
    for (const l of links) {
      const tag = byId.get(l.tagId)
      if (!tag) continue
      const arr = result.get(l.noteId) ?? []
      arr.push(tag)
      result.set(l.noteId, arr)
    }
    return result
  },
}
