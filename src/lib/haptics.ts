/** لرزش لمسی — تنظیم از settings.haptics */
let enabled = true

export function setHapticsEnabled(v: boolean): void {
  enabled = v
}

export function tap(ms = 8): void {
  try {
    if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms)
    }
  } catch {
    /* بی‌صدا */
  }
}
