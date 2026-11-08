import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signIn, signUp } from './auth'
import { useI18n } from '../../i18n'
import { useUi } from '../../stores/ui'
import Logo from '../../components/Logo'
import Button from '../../components/ui/Button'
import { Field, inputClass } from '../../components/ui/Primitives'

export function AuthPage() {
  const { t } = useI18n()
  const toast = useUi((s) => s.toast)
  const navigate = useNavigate()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNeedsConfirm(false)
    if (!email.includes('@') || password.length < 6) {
      setError(t('auth.invalid'))
      return
    }
    setBusy(true)
    try {
      const result =
        mode === 'in'
          ? await signIn(email, password)
          : await signUp(email, password, name.trim() || email.split('@')[0])
      if (!result.ok) {
        setError(result.message ?? t('auth.invalid'))
      } else if (result.needsConfirm) {
        setNeedsConfirm(true)
      } else {
        toast(t('auth.welcome', { name: name || email.split('@')[0] }), 'success')
        navigate('/')
      }
    } finally {
      setBusy(false)
    }
  }

  if (needsConfirm) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex max-w-sm flex-col items-center gap-4 rounded-3xl p-8 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-rose-accent">
            ✉️
          </span>
          <h1 className="text-lg font-extrabold">{t('auth.checkEmail')}</h1>
          <p className="text-sm text-white/55">{email}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            {t('action.back')}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-2">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="glass w-full max-w-sm rounded-3xl p-6 sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo className="h-16 w-16" />
          <h1 className="text-xl font-extrabold text-gradient">{t('auth.title')}</h1>
          <p className="text-xs text-white/50">{t('tagline')}</p>
        </div>

        <div className="glass mb-5 flex rounded-xl p-1">
          {(
            [
              { id: 'in', label: t('auth.signIn') },
              { id: 'up', label: t('auth.signUp') },
            ] as const
          ).map((x) => (
            <button
              key={x.id}
              onClick={() => setMode(x.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                mode === x.id
                  ? 'bg-gradient-to-r from-brand-500 to-rose-accent text-white'
                  : 'text-white/55'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3.5">
          {mode === 'up' && (
            <Field label={t('auth.displayName')}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="علی"
              />
            </Field>
          )}
          <Field label={t('auth.email')}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
              dir="ltr"
            />
          </Field>
          <Field label={t('auth.password')}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              dir="ltr"
            />
          </Field>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={busy}>
            {busy ? '…' : mode === 'in' ? t('auth.signIn') : t('auth.signUp')}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] text-white/35">
          <span className="h-px flex-1 bg-white/10" />
          {t('auth.guest')}
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <Button variant="glass" className="w-full" onClick={() => navigate('/')}>
          {t('auth.guest')}
        </Button>
        <p className="mt-3 text-center text-[11px] text-white/40">{t('auth.guestHint')}</p>
      </motion.div>
    </div>
  )
}

export default AuthPage
