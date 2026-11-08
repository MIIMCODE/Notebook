/**
 * تبدیل تقویم میلادی ↔ شمسی (الگوریتم استاندارد جلالی)
 * بدون وابستگی — بر پایهٔ محاسبات rata die.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export interface JDate {
  jy: number
  jm: number
  jd: number
}

function div(a: number, b: number): number {
  return Math.trunc(a / b)
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b
}

/** تعداد روز از ۱ فروردین سال jy */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
    2456, 3178,
  ]
  const bl = breaks.length
  const gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  if (jy < jp || jy >= breaks[bl - 1]) throw new Error('jalal out of range')
  let jump = 0
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = jy - jp
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn: number): JDate {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)
  let jd: number
  let jm: number
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31)
      jd = mod(k, 31) + 1
      return { jy, jm, jd }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  jm = 7 + div(k, 30)
  jd = mod(k, 30) + 1
  return { jy, jm, jd }
}

/** میلادی → شمسی */
export function toJalali(date: Date): JDate {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()))
}

/** شمسی → میلادی (ساعت ۰۰:۰۰) */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = d2g(j2d(jy, jm, jd))
  return new Date(gy, gm - 1, gd)
}

export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isLeapJalaliYear(jy) ? 30 : 29
}

const MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]
const MONTHS_EN = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
]
const DAYS_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** «۱۵ آبان ۱۴۰۴» */
export function formatJDate(date: Date, locale: 'fa' | 'en' = 'fa'): string {
  const { jy, jm, jd } = toJalali(date)
  if (locale === 'en') return `${jd} ${MONTHS_EN[jm - 1]} ${jy}`
  return `${toDigits(jd, locale)} ${MONTHS_FA[jm - 1]} ${toDigits(jy, locale)}`
}

/** «چهارشنبه ۱۵ آبان ۱۴۰۴» */
export function formatJDateFull(date: Date, locale: 'fa' | 'en' = 'fa'): string {
  const day = locale === 'fa' ? DAYS_FA[date.getDay()] : DAYS_EN[date.getDay()]
  return `${day} ${formatJDate(date, locale)}`
}

/** تبدیل اعداد به فارسی (در fa) */
export function toDigits(value: number | string, locale: 'fa' | 'en' = 'fa'): string {
  const s = String(value)
  if (locale !== 'fa') return s
  return s.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)])
}

/** نسبت‌زمانی: «۳ دقیقه پیش» */
export function relativeTime(ts: number, locale: 'fa' | 'en' = 'fa', now = Date.now()): string {
  const diff = Math.max(0, now - ts)
  const min = Math.floor(diff / 60000)
  const hour = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (locale === 'en') {
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    if (hour < 24) return `${hour}h ago`
    if (day < 30) return `${day}d ago`
    return new Date(ts).toLocaleDateString()
  }
  if (min < 1) return 'همین حالا'
  if (min < 60) return `${toDigits(min)} دقیقه پیش`
  if (hour < 24) return `${toDigits(hour)} ساعت پیش`
  if (day < 30) return `${toDigits(day)} روز پیش`
  return formatJDate(new Date(ts), 'fa')
}

/** کلید روز شمسی: «1404-08-15» */
export function jalaliDayKey(date: Date = new Date()): string {
  const { jy, jm, jd } = toJalali(date)
  return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`
}

export function todayJalali(locale: 'fa' | 'en' = 'fa'): string {
  return formatJDateFull(new Date(), locale)
}
