export const DAYS_PER_SEASON = 7

export const SEASONS = [
  { name: 'ใบไม้ผลิ', icon: '🌸', tint: 0xffeaf2, wash: 0xffd8e7, washAlpha: .045 },
  { name: 'ร้อน', icon: '☀️', tint: 0xffffff, wash: 0xffffff, washAlpha: 0 },
  { name: 'ใบไม้ร่วง', icon: '🍂', tint: 0xffd7ac, wash: 0xffa652, washAlpha: .085 },
  { name: 'หนาว', icon: '❄️', tint: 0xc9e0ff, wash: 0xe5f3ff, washAlpha: .13 }
] as const

export type Calendar = {
  season: typeof SEASONS[number]
  dayInSeason: number
  hour: number
  minute: number
  darkness: number
  night: boolean
}

export function calendarAt(day: number, progress: number): Calendar {
  const safeDay = Math.max(1, Math.floor(day))
  const safeProgress = Math.min(1, Math.max(0, progress))
  const season = SEASONS[Math.floor(((safeDay - 1) % (DAYS_PER_SEASON * SEASONS.length)) / DAYS_PER_SEASON)]
  const dayInSeason = (safeDay - 1) % DAYS_PER_SEASON + 1
  const hourValue = (6 + safeProgress * 24) % 24
  const totalMinutes = Math.floor(hourValue * 60)
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const darkness = hourValue < 4 ? .58
    : hourValue < 7 ? .58 * (7 - hourValue) / 3
      : hourValue < 17 ? 0
        : hourValue < 20 ? .58 * (hourValue - 17) / 3
          : .58
  return { season, dayInSeason, hour, minute, darkness, night: hourValue < 6 || hourValue >= 19 }
}
