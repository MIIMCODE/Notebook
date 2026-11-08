import { saveSettings, getSettings } from '../db'

/** قفل برنامه: PIN با SHA-256 + اثر انگشت از طریق WebAuthn */

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin: string): Promise<boolean> {
  const s = await getSettings()
  if (!s.pinHash) return false
  return (await sha256Hex(pin)) === s.pinHash
}

export async function enablePin(pin: string): Promise<void> {
  await saveSettings({ pinHash: await sha256Hex(pin), lockEnabled: true })
}

export async function disableLock(): Promise<void> {
  await saveSettings({ pinHash: null, bioId: null, lockEnabled: false })
}

/** آیا اثر انگشت سخت‌افزاری در دسترس است؟ */
export async function biometricsAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function randomChallenge() {
  return crypto.getRandomValues(new Uint8Array(32))
}

function b64url(bytes: Uint8Array<ArrayBufferLike>): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string) {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

/** ثبت credential اثر انگشت (بعد از فعال‌سازی PIN) */
export async function registerBiometric(): Promise<boolean> {
  try {
    if (!(await biometricsAvailable())) return false
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: 'Yadche' },
        user: {
          id: randomChallenge(),
          name: 'yadche-user',
          displayName: 'Yadche',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          userVerification: 'required',
          authenticatorAttachment: 'platform',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null
    if (!cred) return false
    await saveSettings({ bioId: b64url(new Uint8Array(cred.rawId)) })
    return true
  } catch (e) {
    console.warn('registerBiometric failed', e)
    return false
  }
}

/** باز کردن قفل با اثر انگشت */
export async function biometricUnlock(): Promise<boolean> {
  try {
    const s = await getSettings()
    if (!s.bioId) return false
    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{ id: b64urlDecode(s.bioId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential | null
    return !!cred
  } catch {
    return false
  }
}

/** آیا در این نشست قفل باز شده؟ (تا رفرش دوباره نپرسد) */
const SESSION_KEY = 'yadche_unlocked'
export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}
export function markSessionUnlocked(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}
export function resetSessionLock(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
