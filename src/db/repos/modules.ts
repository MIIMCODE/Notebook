import { db, emitDbChange } from '../index'
import type {
  Board,
  BoardCard,
  BoardColumn,
  Expense,
  Habit,
  HabitEntry,
  JournalDay,
  PomodoroSession,
  Task,
} from '../types'
import { uid } from '../../lib/ids'

const now = () => Date.now()

// ── لیست کارها ──────────────────────────────────────────────────────────────
export const tasksRepo = {
  async create(title: string, opts: Partial<Task> = {}): Promise<Task> {
    const t = now()
    const count = await db.tasks.count()
    const task: Task = {
      id: uid(),
      noteId: opts.noteId ?? null,
      listName: opts.listName ?? 'default',
      title: title.trim(),
      done: false,
      priority: opts.priority ?? 0,
      dueAt: opts.dueAt ?? null,
      position: opts.position ?? count,
      version: 1,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.tasks.put(task)
    emitDbChange('tasks')
    return task
  },

  async update(id: string, patch: Partial<Task>): Promise<void> {
    const cur = await db.tasks.get(id)
    if (!cur) return
    await db.tasks.put({ ...cur, ...patch, id, version: cur.version + 1, updatedAt: now() })
    emitDbChange('tasks')
  },

  async toggle(id: string): Promise<void> {
    const cur = await db.tasks.get(id)
    if (cur) await this.update(id, { done: !cur.done })
  },

  async remove(id: string): Promise<void> {
    await db.tasks.delete(id)
    emitDbChange('tasks')
  },

  async clearDone(): Promise<number> {
    const done = await db.tasks.filter((t) => t.done).toArray()
    await db.tasks.bulkDelete(done.map((t) => t.id))
    emitDbChange('tasks')
    return done.length
  },

  all(): Promise<Task[]> {
    return db.tasks.toArray()
  },
}

// ── کانبان ──────────────────────────────────────────────────────────────────
export const boardsRepo = {
  async ensureDefault(): Promise<Board> {
    const existing = await db.boards.filter((b) => !b.deletedAt).first()
    if (existing) return existing
    const t = now()
    const board: Board = {
      id: uid(),
      name: 'تابلوی من',
      position: 0,
      version: 1,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.boards.put(board)
    const defaults: { name: string; color: string }[] = [
      { name: 'برای انجام', color: '#8B5CF6' },
      { name: 'در حال انجام', color: '#F59E0B' },
      { name: 'انجام شد', color: '#10B981' },
    ]
    for (let i = 0; i < defaults.length; i++) {
      const col: BoardColumn = {
        id: uid(),
        boardId: board.id,
        name: defaults[i].name,
        color: defaults[i].color,
        position: i,
        version: 1,
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
      }
      await db.boardColumns.put(col)
    }
    emitDbChange('boards')
    return board
  },

  columns(boardId: string): Promise<BoardColumn[]> {
    return db.boardColumns.where('boardId').equals(boardId).sortBy('position')
  },

  cards(columnId: string): Promise<BoardCard[]> {
    return db.boardCards.where('columnId').equals(columnId).sortBy('position')
  },

  async addCard(columnId: string, title: string): Promise<BoardCard> {
    const t = now()
    const count = await db.boardCards.where('columnId').equals(columnId).count()
    const card: BoardCard = {
      id: uid(),
      columnId,
      title: title.trim(),
      body: null,
      dueAt: null,
      position: count,
      version: 1,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.boardCards.put(card)
    emitDbChange('boardCards')
    return card
  },

  async updateCard(id: string, patch: Partial<BoardCard>): Promise<void> {
    const cur = await db.boardCards.get(id)
    if (!cur) return
    await db.boardCards.put({ ...cur, ...patch, id, version: cur.version + 1, updatedAt: now() })
    emitDbChange('boardCards')
  },

  async moveCard(id: string, columnId: string, position: number): Promise<void> {
    await this.updateCard(id, { columnId, position })
  },

  async removeCard(id: string): Promise<void> {
    await db.boardCards.delete(id)
    emitDbChange('boardCards')
  },

  async addColumn(boardId: string, name: string): Promise<BoardColumn> {
    const t = now()
    const count = await db.boardColumns.where('boardId').equals(boardId).count()
    const col: BoardColumn = {
      id: uid(),
      boardId,
      name: name.trim(),
      color: '#8B5CF6',
      position: count,
      version: 1,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.boardColumns.put(col)
    emitDbChange('boardColumns')
    return col
  },

  async removeColumn(id: string): Promise<void> {
    const cards = await db.boardCards.where('columnId').equals(id).toArray()
    await db.boardCards.bulkDelete(cards.map((c) => c.id))
    await db.boardColumns.delete(id)
    emitDbChange('boardColumns')
  },
}

// ── ردیاب عادت ──────────────────────────────────────────────────────────────
export const habitsRepo = {
  async create(
    name: string,
    opts: Partial<Pick<Habit, 'color' | 'frequency' | 'target'>> = {},
  ): Promise<Habit> {
    const t = now()
    const habit: Habit = {
      id: uid(),
      name: name.trim(),
      color: opts.color ?? '#8B5CF6',
      icon: null,
      frequency: opts.frequency ?? 'daily',
      target: opts.target ?? 1,
      archived: false,
      position: 0,
      version: 1,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.habits.put(habit)
    emitDbChange('habits')
    return habit
  },

  async update(id: string, patch: Partial<Habit>): Promise<void> {
    const cur = await db.habits.get(id)
    if (!cur) return
    await db.habits.put({ ...cur, ...patch, id, version: cur.version + 1, updatedAt: now() })
    emitDbChange('habits')
  },

  async remove(id: string): Promise<void> {
    const entries = await db.habitEntries.where('habitId').equals(id).toArray()
    await db.habitEntries.bulkDelete(entries.map((e) => e.id))
    await db.habits.delete(id)
    emitDbChange('habits')
  },

  /** ثبت/افزایش امروز */
  async bump(habit: Habit, dateKey: string): Promise<void> {
    const existing = await db.habitEntries
      .where('habitId')
      .equals(habit.id)
      .and((e) => e.entryDate === dateKey)
      .first()
    const t = now()
    if (!existing) {
      const entry: HabitEntry = {
        id: uid(),
        habitId: habit.id,
        entryDate: dateKey,
        value: 1,
        version: 1,
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
      }
      await db.habitEntries.put(entry)
    } else {
      const done = existing.value >= habit.target
      await db.habitEntries.put({
        ...existing,
        value: done ? 0 : existing.value + 1,
        version: existing.version + 1,
        updatedAt: t,
      })
    }
    emitDbChange('habitEntries')
  },

  entries(habitId: string): Promise<HabitEntry[]> {
    return db.habitEntries.where('habitId').equals(habitId).toArray()
  },

  async valueOn(habitId: string, dateKey: string): Promise<number> {
    const e = await db.habitEntries
      .where('habitId')
      .equals(habitId)
      .and((x) => x.entryDate === dateKey)
      .first()
    return e?.value ?? 0
  },

  /** محاسبه‌ی streak فعلی (روزهای متوالی با value>0) */
  async streak(habitId: string): Promise<number> {
    const entries = await this.entries(habitId)
    const days = new Set(entries.filter((e) => e.value > 0).map((e) => e.entryDate))
    let streak = 0
    const d = new Date()
    // اگر امروز ثبت نشده، از دیروز شروع کن
    if (!days.has(keyOf(d))) d.setDate(d.getDate() - 1)
    for (;;) {
      if (!days.has(keyOf(d))) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  },

  all(): Promise<Habit[]> {
    return db.habits.toArray()
  },

  allEntries(): Promise<HabitEntry[]> {
    return db.habitEntries.toArray()
  },
}

function keyOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ── خاطره روز ───────────────────────────────────────────────────────────────
export const journalRepo = {
  async get(day: string): Promise<JournalDay | undefined> {
    return db.journalDays.where('day').equals(day).first()
  },

  async save(day: string, patch: Partial<JournalDay>): Promise<JournalDay> {
    const existing = await this.get(day)
    const t = now()
    const rec: JournalDay = existing
      ? { ...existing, ...patch, version: existing.version + 1, updatedAt: t }
      : {
          id: uid(),
          day,
          mood: patch.mood ?? null,
          weather: patch.weather ?? null,
          text: patch.text ?? '',
          noteId: patch.noteId ?? null,
          version: 1,
          createdAt: t,
          updatedAt: t,
          deletedAt: null,
        }
    await db.journalDays.put(rec)
    emitDbChange('journalDays')
    return rec
  },

  between(from: string, to: string): Promise<JournalDay[]> {
    return db.journalDays.where('day').between(from, to, true, true).toArray()
  },

  all(): Promise<JournalDay[]> {
    return db.journalDays.toArray()
  },
}

// ── هزینه‌ها ─────────────────────────────────────────────────────────────────
export const expensesRepo = {
  async create(input: {
    amount: number
    category?: string
    description?: string
    paidAt?: string
    currency?: string
  }): Promise<Expense> {
    const t = now()
    const expense: Expense = {
      id: uid(),
      amount: input.amount,
      currency: input.currency ?? 'IRR',
      category: input.category ?? null,
      description: input.description ?? null,
      paidAt: input.paidAt ?? keyOf(new Date()),
      version: 1,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    }
    await db.expenses.put(expense)
    emitDbChange('expenses')
    return expense
  },

  async remove(id: string): Promise<void> {
    await db.expenses.delete(id)
    emitDbChange('expenses')
  },

  between(from: string, to: string): Promise<Expense[]> {
    return db.expenses.where('paidAt').between(from, to, true, true).sortBy('paidAt')
  },

  all(): Promise<Expense[]> {
    return db.expenses.toArray()
  },
}

// ── پومودورو ────────────────────────────────────────────────────────────────
export const pomodoroRepo = {
  async log(
    mode: PomodoroSession['mode'],
    durationMin: number,
    completed: boolean,
  ): Promise<PomodoroSession> {
    const session: PomodoroSession = {
      id: uid(),
      mode,
      durationMin,
      startedAt: now() - durationMin * 60_000,
      completed,
      noteId: null,
      createdAt: now(),
    }
    await db.pomodoros.put(session)
    emitDbChange('pomodoros')
    return session
  },

  todayCount(): Promise<number> {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return db.pomodoros
      .where('startedAt')
      .aboveOrEqual(start.getTime())
      .and((s) => s.mode === 'focus' && s.completed)
      .count()
  },

  recent(limit = 10): Promise<PomodoroSession[]> {
    return db.pomodoros.orderBy('startedAt').reverse().limit(limit).toArray()
  },
}
