import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { openDb, db } from '../index'
import {
  tasksRepo,
  boardsRepo,
  habitsRepo,
  journalRepo,
  expensesRepo,
  pomodoroRepo,
} from '../repos/modules'

beforeEach(async () => {
  await openDb()
  await Promise.all([
    db.tasks.clear(),
    db.boards.clear(),
    db.boardColumns.clear(),
    db.boardCards.clear(),
    db.habits.clear(),
    db.habitEntries.clear(),
    db.journalDays.clear(),
    db.expenses.clear(),
    db.pomodoros.clear(),
  ])
})

describe('tasksRepo', () => {
  it('create → toggle → clearDone', async () => {
    const a = await tasksRepo.create('خرید نان')
    const b = await tasksRepo.create('تمیزکاری')
    expect((await tasksRepo.all()).length).toBe(2)
    await tasksRepo.toggle(a.id)
    expect((await tasksRepo.all()).find((x) => x.id === a.id)?.done).toBe(true)
    expect(await tasksRepo.clearDone()).toBe(1)
    expect((await tasksRepo.all()).map((x) => x.id)).toEqual([b.id])
  })
})

describe('boardsRepo', () => {
  it('default board with 3 columns + move card', async () => {
    const board = await boardsRepo.ensureDefault()
    const cols = await db.boardColumns.where('boardId').equals(board.id).sortBy('position')
    expect(cols.length).toBe(3)
    const card = await boardsRepo.addCard(cols[0].id, 'طراحی لوگو')
    await boardsRepo.moveCard(card.id, cols[1].id, 0)
    const after = await db.boardCards.get(card.id)
    expect(after?.columnId).toBe(cols[1].id)
    // ایدمپوتنت
    const again = await boardsRepo.ensureDefault()
    expect(again.id).toBe(board.id)
  })
})

describe('habitsRepo', () => {
  it('bump → streak → backfill از دیروز', async () => {
    const h = await habitsRepo.create('آب خوردن', { target: 2 })
    const today = new Date().toISOString().slice(0, 10)
    await habitsRepo.bump(h, today) // 1/2 → امروز ثبت شد
    expect(await habitsRepo.streak(h.id)).toBe(1)
    await habitsRepo.bump(h, today) // 2/2
    expect(await habitsRepo.valueOn(h.id, today)).toBe(2)
    expect(await habitsRepo.streak(h.id)).toBe(1)
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    await habitsRepo.bump(h, y)
    await habitsRepo.bump(h, y)
    expect(await habitsRepo.streak(h.id)).toBe(2)
  })
})

describe('journalRepo', () => {
  it('save و get با کلید روز', async () => {
    await journalRepo.save('1404-08-17', { text: 'روز خوبی بود', mood: 5, weather: 'sunny' })
    const r = await journalRepo.get('1404-08-17')
    expect(r?.mood).toBe(5)
    expect(r?.text).toContain('خوب')
    expect((await journalRepo.all()).length).toBe(1)
  })
})

describe('expensesRepo + pomodoroRepo', () => {
  it('بازه‌ی ماه و شمارش جلسات', async () => {
    await expensesRepo.create({ amount: 150000, category: 'food', description: 'ناهار' })
    await expensesRepo.create({ amount: 80000, category: 'transport' })
    const all = await expensesRepo.all()
    expect(all.length).toBe(2)
    const range = await expensesRepo.between('0000-01-01', '9999-12-31')
    expect(range.length).toBe(2)
    await pomodoroRepo.log('focus', 25, true)
    await pomodoroRepo.log('focus', 25, true)
    expect(await pomodoroRepo.todayCount()).toBe(2)
    expect((await pomodoroRepo.recent(10)).length).toBe(2)
  })
})
