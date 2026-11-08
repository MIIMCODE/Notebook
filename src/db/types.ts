export type NoteType = 'text' | 'checklist' | 'table' | 'code' | 'image' | 'audio' | 'drawing'

export interface Note {
  id: string
  userId?: string
  folderId: string | null
  type: NoteType
  title: string
  content: unknown | null
  plainText: string
  color: string | null
  isPinned: boolean
  isArchived: boolean
  isDeleted: boolean
  reminderAt: number | null
  position: number
  version: number
  deviceId?: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface Folder {
  id: string
  name: string
  color: string | null
  icon: string | null
  parentId: string | null
  position: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface Tag {
  id: string
  name: string
  color: string | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface NoteTag {
  noteId: string
  tagId: string
}

export interface NoteVersion {
  id: string
  noteId: string
  version: number
  title: string
  content: unknown | null
  createdAt: number
}

export interface Attachment {
  id: string
  noteId: string | null
  kind: 'image' | 'audio' | 'file'
  mimeType: string
  size: number
  data: Blob | string
  createdAt: number
}

export interface Task {
  id: string
  noteId: string | null
  listName: string
  title: string
  done: boolean
  priority: 0 | 1 | 2 | 3
  dueAt: number | null
  position: number
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface Board {
  id: string
  name: string
  position: number
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface BoardColumn {
  id: string
  boardId: string
  name: string
  color: string | null
  position: number
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface BoardCard {
  id: string
  columnId: string
  title: string
  body: string | null
  dueAt: number | null
  position: number
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface Habit {
  id: string
  name: string
  color: string | null
  icon: string | null
  frequency: 'daily' | 'weekly' | 'weekdays' | 'custom'
  target: number
  archived: boolean
  position: number
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface HabitEntry {
  id: string
  habitId: string
  entryDate: string
  value: number
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface JournalDay {
  id: string
  day: string
  mood: number | null
  weather: string | null
  text: string
  noteId: string | null
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface Expense {
  id: string
  amount: number
  currency: string
  category: string | null
  description: string | null
  paidAt: string
  version: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export interface PomodoroSession {
  id: string
  mode: 'focus' | 'short_break' | 'long_break'
  durationMin: number
  startedAt: number
  completed: boolean
  noteId: string | null
  createdAt: number
}

export interface SyncState {
  key: 'sync'
  lastPushAt: number
  lastPullAt: number
  status: 'idle' | 'syncing' | 'error' | 'offline'
  deviceId: string
}

export interface LocalSettings {
  key: 'settings'
  theme: 'dark' | 'light' | 'auto'
  accent: string
  locale: 'fa' | 'en'
  lockEnabled: boolean
  pinHash: string | null
  /** شناسه‌ی credential وب‌اوثنتیکیتور (اثر انگشت) — base64url */
  bioId: string | null
  onboarded: boolean
}
