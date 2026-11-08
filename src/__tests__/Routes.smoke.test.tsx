import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ??
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList)
  globalThis.ResizeObserver =
    globalThis.ResizeObserver ??
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
})

const ROUTES: [path: string, expected: string][] = [
  ['/', 'یادداشت‌ها'],
  ['/', 'هنوز یادداشتی نداری'],
  ['/search', 'جستجو'],
  ['/trash', 'سطل زباله'],
  ['/archive', 'بایگانی'],
  ['/settings', 'تنظیمات'],
  ['/login', 'حساب کاربری'],
  ['/tasks', 'لیست کارها'],
  ['/kanban', 'کانبان'],
  ['/habits', 'عادت‌ها'],
  ['/journal', 'خاطره روز'],
  ['/calendar', 'تقویم'],
  ['/pomodoro', 'پومودورو'],
  ['/expenses', 'هزینه‌ها'],
]

describe('همه‌ی بخش‌های اپ فعال‌اند', () => {
  it('مسیر به مسیر رندر می‌شود', async () => {
    render(<App />)
    // اسپلش تمام شود → پوسته
    await waitFor(() => expect(screen.getAllByText('یادداشت‌ها').length).toBeGreaterThan(0), {
      timeout: 6000,
    })

    for (const [path, expected] of ROUTES) {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
      await waitFor(
        () => {
          expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
        },
        { timeout: 5000 },
      )
    }
  }, 60000)
})
