import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { dicts, type Locale } from './dicts'

export type { Locale }

type Params = Record<string, string | number>

interface I18nCtx {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: (key: string, params?: Params) => string
  setLocale: (l: Locale) => void
}

const Ctx = createContext<I18nCtx | null>(null)

const STORAGE_KEY = 'yadche_locale'

function detectInitialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'fa' || saved === 'en') return saved
  return 'fa'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  const apply = useCallback((l: Locale) => {
    const html = document.documentElement
    html.lang = l
    html.dir = l === 'fa' ? 'rtl' : 'ltr'
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  useEffect(() => {
    apply(locale)
  }, [locale, apply])

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l)
      apply(l)
      // ذخیره در تنظیمات محلی (اگر در دسترس باشد)
      import('../db').then(({ saveSettings }) => saveSettings({ locale: l }).catch(() => {}))
    },
    [apply],
  )

  const t = useCallback(
    (key: string, params?: Params) => {
      let text = dicts[locale][key] ?? dicts.fa[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replaceAll(`{${k}}`, String(v))
        }
      }
      return text
    },
    [locale],
  )

  const value = useMemo<I18nCtx>(
    () => ({ locale, dir: locale === 'fa' ? 'rtl' : 'ltr', t, setLocale }),
    [locale, t, setLocale],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
