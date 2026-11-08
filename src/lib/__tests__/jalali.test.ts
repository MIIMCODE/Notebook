import {
  formatJDate,
  fromJalali,
  jalaliMonthLength,
  relativeTime,
  toDigits,
  toJalali,
} from '../jalali'

describe('jalali', () => {
  it('تاریخ‌های شناخته‌شده را درست تبدیل می‌کند', () => {
    // 1 فروردین 1400 = 21 مارس 2021
    expect(toJalali(new Date(2021, 2, 21))).toEqual({ jy: 1400, jm: 1, jd: 1 })
    // 1 فروردین 1404 = 21 مارس 2025
    expect(toJalali(new Date(2025, 2, 21))).toEqual({ jy: 1404, jm: 1, jd: 1 })
    // 30 شهریور 1404 = 21 سپتامبر 2025
    expect(toJalali(new Date(2025, 8, 21))).toEqual({ jy: 1404, jm: 6, jd: 30 })
  })

  it('برعکس (شمسی → میلادی) هم درست است', () => {
    const d = fromJalali(1404, 1, 1)
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(2)
    expect(d.getDate()).toBe(21)
  })

  it('ماه‌های ۳۱، ۳۰ و ۲۹/۳۰ روزه', () => {
    expect(jalaliMonthLength(1404, 1)).toBe(31)
    expect(jalaliMonthLength(1404, 7)).toBe(30)
    expect(jalaliMonthLength(1403, 12)).toBe(30) // 1403 کبیسه است
    expect(jalaliMonthLength(1404, 12)).toBe(29) // 1404 کبیسه نیست
    expect(jalaliMonthLength(1399, 12)).toBe(30) // 1399 کبیسه است
  })

  it('قالب‌بندی و اعداد فارسی', () => {
    expect(formatJDate(new Date(2025, 10, 8), 'fa')).toContain('آبان')
    expect(toDigits(1404)).toBe('۱۴۰۴')
    expect(toDigits(1404, 'en')).toBe('1404')
  })

  it('زمان نسبی فارسی', () => {
    const now = Date.now()
    expect(relativeTime(now - 30_000, 'fa', now)).toBe('همین حالا')
    expect(relativeTime(now - 5 * 60_000, 'fa', now)).toBe('۵ دقیقه پیش')
    expect(relativeTime(now - 3 * 3600_000, 'en', now)).toBe('3h ago')
  })
})
