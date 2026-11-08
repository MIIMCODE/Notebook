import Dexie, { type Table } from 'dexie'
import type {
  Attachment,
  Board,
  BoardCard,
  BoardColumn,
  Expense,
  Folder,
  Habit,
  HabitEntry,
  JournalDay,
  LocalSettings,
  Note,
  NoteTag,
  NoteVersion,
  PomodoroSession,
  SyncState,
  Tag,
  Task,
} from './types'

export class YadcheDB extends Dexie {
  notes!: Table<Note, string>
  folders!: Table<Folder, string>
  tags!: Table<Tag, string>
  noteTags!: Table<NoteTag, [string, string]>
  noteVersions!: Table<NoteVersion, string>
  attachments!: Table<Attachment, string>
  tasks!: Table<Task, string>
  boards!: Table<Board, string>
  boardColumns!: Table<BoardColumn, string>
  boardCards!: Table<BoardCard, string>
  habits!: Table<Habit, string>
  habitEntries!: Table<HabitEntry, string>
  journalDays!: Table<JournalDay, string>
  expenses!: Table<Expense, string>
  pomodoros!: Table<PomodoroSession, string>
  settings!: Table<LocalSettings | SyncState, string>

  constructor() {
    super('yadche')
    this.version(1).stores({
      notes: 'id, updatedAt, folderId, type, title',
      folders: 'id, parentId, updatedAt',
      tags: 'id, name, updatedAt',
      noteTags: '[noteId+tagId], noteId, tagId',
      noteVersions: 'id, noteId, createdAt',
      attachments: 'id, noteId, createdAt',
      tasks: 'id, updatedAt, dueAt, listName',
      boards: 'id, updatedAt',
      boardColumns: 'id, boardId, position',
      boardCards: 'id, columnId, position, updatedAt',
      habits: 'id, updatedAt',
      habitEntries: 'id, habitId, entryDate, updatedAt',
      journalDays: 'id, day, updatedAt',
      expenses: 'id, paidAt, updatedAt',
      pomodoros: 'id, startedAt',
      settings: 'key',
    })
  }
}

export const db = new YadcheDB()
