import { fromRemote, toRemote, toSnake, toCamel } from '../mapping'

describe('sync mapping', () => {
  it('camel ↔ snake', () => {
    expect(toSnake('folderId')).toBe('folder_id')
    expect(toSnake('isPinned')).toBe('is_pinned')
    expect(toCamel('folder_id')).toBe('folderId')
    expect(toCamel('is_pinned')).toBe('isPinned')
  })

  it('رکورد کامل round-trip می‌شود', () => {
    const now = 1730000000000
    const record = {
      id: 'n1',
      folderId: 'f1',
      type: 'text',
      title: 'سلام',
      content: { type: 'doc', content: [] },
      plainText: 'سلام',
      color: '#8B5CF6',
      isPinned: true,
      isArchived: false,
      isDeleted: false,
      reminderAt: null,
      position: 0,
      version: 3,
      deviceId: 'dev-1',
      createdAt: now,
      updatedAt: now + 1000,
      deletedAt: null,
    }

    const remote = toRemote(record)
    expect(remote.folder_id).toBe('f1')
    expect(remote.is_pinned).toBe(true)
    expect(remote.updated_at).toBe(new Date(now + 1000).toISOString())
    expect(remote.content).toEqual({ type: 'doc', content: [] })
    expect(remote.reminder_at).toBeNull()

    const back = fromRemote(remote) as typeof record
    expect(back.id).toBe('n1')
    expect(back.folderId).toBe('f1')
    expect(back.isPinned).toBe(true)
    expect(back.updatedAt).toBe(now + 1000)
    expect(back.content).toEqual({ type: 'doc', content: [] })
    expect(back.reminderAt).toBeNull()
  })

  it('fیلدهای محلی (key) ارسال نمی‌شوند', () => {
    const remote = toRemote({ id: '1', key: 'settings', theme: 'dark' } as never)
    expect(remote.key).toBeUndefined()
    expect(remote.theme).toBe('dark')
  })
})
