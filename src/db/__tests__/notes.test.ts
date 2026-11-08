import 'fake-indexeddb/auto'
import { db } from '../schema'
import { notesRepo } from '../repos/notes'
import { tagsRepo } from '../repos/tags'
import { foldersRepo } from '../repos/folders'
import { docToPlain } from '../../features/notes/editor/doc'

beforeEach(async () => {
  await db.notes.clear()
  await db.tags.clear()
  await db.noteTags.clear()
  await db.folders.clear()
})

describe('notesRepo', () => {
  it('یادداشت می‌سازد با پیش‌فرض‌ها', async () => {
    const n = await notesRepo.create({ title: 'سلام' })
    expect(n.id).toBeTruthy()
    expect(n.title).toBe('سلام')
    expect(n.type).toBe('text')
    expect(n.isDeleted).toBe(false)
    expect(n.version).toBe(1)
    expect(await notesRepo.get(n.id)).toMatchObject({ title: 'سلام' })
  })

  it('به‌روزرسانی version و updatedAt را بالا می‌برد', async () => {
    const n = await notesRepo.create()
    await new Promise((r) => setTimeout(r, 5))
    await notesRepo.update(n.id, { title: 'ویرایش' })
    const after = await notesRepo.get(n.id)
    expect(after?.version).toBe(2)
    expect(after!.updatedAt).toBeGreaterThanOrEqual(n.updatedAt)
    expect(after?.title).toBe('ویرایش')
  })

  it('trash → restore → purge', async () => {
    const n = await notesRepo.create({ title: 'برای حذف' })
    await notesRepo.trash(n.id)
    let all = await notesRepo.live()
    expect(all.find((x) => x.id === n.id)).toBeUndefined()

    await notesRepo.restore(n.id)
    all = await notesRepo.live()
    expect(all.find((x) => x.id === n.id)).toBeTruthy()

    await notesRepo.purge(n.id)
    expect(await notesRepo.get(n.id)).toBeUndefined()
  })

  it('سنجاق و بایگانی', async () => {
    const n = await notesRepo.create()
    await notesRepo.togglePin(n.id)
    expect((await notesRepo.get(n.id))?.isPinned).toBe(true)
    await notesRepo.toggleArchive(n.id)
    expect((await notesRepo.get(n.id))?.isArchived).toBe(true)
  })

  it('جستجوی سریع', async () => {
    await notesRepo.create({ title: 'خرید شیر' })
    await notesRepo.create({ title: 'ایده برنامه‌نویسی', content: null })
    await notesRepo.update((await notesRepo.search('شیر'))[0]?.id ?? '', { plainText: 'شیر و نان' })
    const r1 = await notesRepo.search('شیر')
    expect(r1.length).toBeGreaterThanOrEqual(1)
    expect(r1[0].title).toContain('خرید')
  })

  it('تاریخچه نسخه و بازگردانی', async () => {
    const n = await notesRepo.create({ title: 'نسخه ۱' })
    await notesRepo.saveVersion(n.id)
    await notesRepo.update(n.id, { title: 'نسخه ۲' })
    const versions = await notesRepo.versions(n.id)
    expect(versions.length).toBe(1)
    await notesRepo.restoreVersion(n.id, versions[0].id)
    expect((await notesRepo.get(n.id))?.title).toBe('نسخه ۱')
  })

  it('خالی کردن سطل زباله', async () => {
    const a = await notesRepo.create({ title: 'a' })
    const b = await notesRepo.create({ title: 'b' })
    await notesRepo.trash(a.id)
    await notesRepo.trash(b.id)
    await notesRepo.emptyTrash()
    expect((await db.notes.toArray()).length).toBe(0)
  })
})

describe('tags و folders', () => {
  it('تگ یکتا می‌سازد و attach/detach', async () => {
    const tag = await tagsRepo.create('کار')
    const tag2 = await tagsRepo.create('کار')
    expect(tag2.id).toBe(tag.id)
    const n = await notesRepo.create()
    await tagsRepo.attach(n.id, tag.id)
    expect((await tagsRepo.forNote(n.id)).length).toBe(1)
    await tagsRepo.detach(n.id, tag.id)
    expect((await tagsRepo.forNote(n.id)).length).toBe(0)
  })

  it('حذف پوشه یادداشت‌ها را بی‌پوشه می‌کند', async () => {
    const f = await foldersRepo.create('کاری')
    const n = await notesRepo.create({ folderId: f.id })
    await foldersRepo.remove(f.id)
    expect((await notesRepo.get(n.id))?.folderId).toBeNull()
  })
})

describe('docToPlain', () => {
  it('متن سند را استخراج می‌کند', () => {
    const plain = docToPlain({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'سلام' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'دنیا' }] },
      ],
    })
    expect(plain).toContain('سلام')
    expect(plain).toContain('دنیا')
  })

  it('سند خالی را خالی می‌دهد', () => {
    expect(docToPlain(null)).toBe('')
  })
})
