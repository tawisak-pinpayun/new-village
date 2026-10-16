export const DAYS_PER_WEEK = 7
export const DAYS_PER_SEASON = 28
export const DAYS_PER_YEAR = DAYS_PER_SEASON * 4
export const CALENDAR_VERSION = 3
export const WEEKDAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'] as const

// Keep the existing map palette while allowing map-specific seasonal art later.
export const SEASONS = [
  { id: 'spring', name: 'ใบไม้ผลิ', icon: '🌸', tint: 0xffeaf2, wash: 0xffd8e7, washAlpha: .045, sunrise: 5.5, sunset: 19 },
  { id: 'summer', name: 'ร้อน', icon: '☀️', tint: 0xffffff, wash: 0xffffff, washAlpha: 0, sunrise: 5, sunset: 19.5 },
  { id: 'autumn', name: 'ใบไม้ร่วง', icon: '🍂', tint: 0xffd7ac, wash: 0xffa652, washAlpha: .085, sunrise: 6, sunset: 18 },
  { id: 'winter', name: 'หนาว', icon: '❄️', tint: 0xc9e0ff, wash: 0xe5f3ff, washAlpha: .13, sunrise: 6.5, sunset: 17.5 }
] as const
export type SeasonId = typeof SEASONS[number]['id']
export type DayPeriod = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night'
export type Calendar = {
  absoluteDay: number
  year: number
  season: typeof SEASONS[number]
  dayInSeason: number
  dayOfWeek: number
  weekday: typeof WEEKDAYS[number]
  hour: number
  minute: number
  period: DayPeriod
  darkness: number
  night: boolean
}

export function calendarAt(day: number, progress: number): Calendar {
  const absoluteDay = Math.max(1, Math.floor(day))
  const safeProgress = Math.min(1 - Number.EPSILON, Math.max(0, progress))
  const dayOfYear = (absoluteDay - 1) % DAYS_PER_YEAR
  const season = SEASONS[Math.floor(dayOfYear / DAYS_PER_SEASON)]
  const dayInSeason = dayOfYear % DAYS_PER_SEASON + 1
  const dayOfWeek = (absoluteDay - 1) % DAYS_PER_WEEK
  const hourValue = (6 + safeProgress * 24) % 24
  const totalMinutes = Math.floor(hourValue * 60)
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const period: DayPeriod = hourValue < 5 ? 'night' : hourValue < 7 ? 'dawn' : hourValue < 12 ? 'morning' : hourValue < 17 ? 'afternoon' : hourValue < 20 ? 'evening' : 'night'
  const darkness = hourValue < season.sunrise - 2 ? .58
    : hourValue < season.sunrise + 1 ? .58 * (season.sunrise + 1 - hourValue) / 3
      : hourValue < season.sunset - 2 ? 0
        : hourValue < season.sunset + 1 ? .58 * (hourValue - (season.sunset - 2)) / 3
          : .58
  return { absoluteDay, year: Math.floor((absoluteDay - 1) / DAYS_PER_YEAR) + 1, season, dayInSeason, dayOfWeek, weekday: WEEKDAYS[dayOfWeek], hour, minute, period, darkness, night: darkness >= .4 }
}
