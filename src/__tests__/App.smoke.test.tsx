import 'fake-indexeddb/auto'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'

// polyfillهای لازم jsdom
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

describe('App smoke', () => {
  it('اسپلش و سپس صفحه‌ی اصلی رندر می‌شود', async () => {
    render(<App />)
    // اسپلش
    expect(screen.getByText('یادچه')).toBeInTheDocument()
    expect(screen.getByText('هر چیزی که باید بماند، اینجاست.')).toBeInTheDocument()
    // بعد از اتمام اسپلش → پوسته‌ی اپ
    await waitFor(
      () => {
        expect(screen.getAllByText('یادداشت‌ها').length).toBeGreaterThan(0)
      },
      { timeout: 6000 },
    )
    // حالت خالی
    expect(await screen.findByText('هنوز یادداشتی نداری')).toBeInTheDocument()
  }, 10000)
})
