import { Component, type ErrorInfo, type ReactNode } from 'react'
import MaterialIcon from './ui/MaterialIcon'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/** مرز خطای سراسری — جلوی سفید شدن کل اپ را می‌گیرد */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Yadche error boundary:', error, info)
  }

  private reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          dir="rtl"
          className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center text-white"
        >
          <MaterialIcon name="error" size={48} className="text-red-300" />
          <h1 className="text-xl font-bold">یادچه از کار ایستاد</h1>
          <p className="max-w-md text-sm text-white/60">
            یک خطای غیرمنتظره رخ داد. داده‌های تو محلی و سالم‌اند؛ کافی است دوباره تلاش کنی.
          </p>
          <code className="glass max-w-full overflow-x-auto rounded-lg px-3 py-2 text-xs text-white/70">
            {this.state.error?.message}
          </code>
          <button
            onClick={this.reset}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-rose-accent px-6 py-3 font-semibold transition hover:brightness-110 active:scale-95"
          >
            تلاش دوباره
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
