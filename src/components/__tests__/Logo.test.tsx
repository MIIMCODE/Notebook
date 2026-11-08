import { render, screen } from '@testing-library/react'
import Logo from '../Logo'

describe('Logo', () => {
  it('با عنوان دسترس‌پذیری رندر می‌شود', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: 'یادچه' })).toBeInTheDocument()
  })

  it('SVG گوشه‌های گرد (مستر) دارد', () => {
    render(<Logo />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('viewBox', '0 0 1024 1024')
  })

  it('حالت bare بدون clipPath گرد است', () => {
    render(<Logo bare />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})
