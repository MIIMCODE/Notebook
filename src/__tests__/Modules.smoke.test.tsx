import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../i18n'
import TasksPage from '../features/tasks/TasksPage'
import KanbanPage from '../features/kanban/KanbanPage'
import HabitsPage from '../features/habits/HabitsPage'
import JournalPage from '../features/journal/JournalPage'
import CalendarPage from '../features/calendar/CalendarPage'
import PomodoroPage from '../features/pomodoro/PomodoroPage'
import ExpensesPage from '../features/expenses/ExpensesPage'

const wrap = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>)

describe('ماژول‌های مرحله ۵', () => {
  it('TasksPage', () => {
    wrap(<TasksPage />)
    expect(screen.getAllByText('لیست کارها').length).toBeGreaterThan(0)
  })
  it('KanbanPage', async () => {
    wrap(<KanbanPage />)
    expect(await screen.findByText('کانبان')).toBeTruthy()
  })
  it('HabitsPage', () => {
    wrap(<HabitsPage />)
    expect(screen.getAllByText('عادت‌ها').length).toBeGreaterThan(0)
  })
  it('JournalPage', () => {
    wrap(<JournalPage />)
    expect(screen.getAllByText('خاطره روز').length).toBeGreaterThan(0)
  })
  it('CalendarPage', () => {
    wrap(<CalendarPage />)
    expect(screen.getAllByText('تقویم').length).toBeGreaterThan(0)
  })
  it('PomodoroPage', () => {
    wrap(<PomodoroPage />)
    expect(screen.getAllByText('پومودورو').length).toBeGreaterThan(0)
  })
  it('ExpensesPage', () => {
    wrap(<ExpensesPage />)
    expect(screen.getAllByText('هزینه‌ها').length).toBeGreaterThan(0)
  })
})
