export const WEATHER_TYPES = ['clear', 'cloudy', 'rain', 'heavy_rain', 'thunderstorm', 'windy', 'fog', 'snow', 'blizzard']
export const WEATHER_LABELS = { clear: 'ฟ้าใส', cloudy: 'เมฆมาก', rain: 'ฝน', heavy_rain: 'ฝนหนัก', thunderstorm: 'พายุฝน', windy: 'ลมแรง', fog: 'หมอก', snow: 'หิมะ', blizzard: 'พายุหิมะ' }
const WEIGHTS = {
  spring: [35, 20, 20, 6, 2, 9, 8, 0, 0],
  summer: [44, 18, 12, 8, 6, 9, 3, 0, 0],
  autumn: [28, 23, 17, 7, 4, 10, 11, 0, 0],
  winter: [18, 25, 0, 0, 0, 10, 14, 27, 6]
}
export const WEATHER_SLOTS_PER_DAY = 4
export const WEATHER_DAY_MS = 24 * 60_000
export const isRainWeather = type => ['rain', 'heavy_rain', 'thunderstorm'].includes(type)

// The same pure rule runs on server and client; no client-submitted weather is accepted.
export function weatherAt(day, slot) {
  const safeDay = Math.max(1, Math.floor(day))
  const safeSlot = Math.max(0, Math.min(WEATHER_SLOTS_PER_DAY - 1, Math.floor(slot)))
  const season = ['spring', 'summer', 'autumn', 'winter'][Math.floor((safeDay - 1) % 112 / 28)]
  let seed = (Math.imul(safeDay, 1664525) ^ Math.imul(safeSlot + 1, 1013904223) ^ 0x71a42b) >>> 0
  seed ^= seed >>> 16
  seed = Math.imul(seed, 0x7feb352d) >>> 0
  seed ^= seed >>> 15
  const weights = WEIGHTS[season]
  let pick = seed % weights.reduce((sum, weight) => sum + weight, 0)
  const index = weights.findIndex(weight => (pick -= weight) < 0)
  const type = WEATHER_TYPES[index]
  return { type, label: WEATHER_LABELS[type], season, day: safeDay, slot: safeSlot }
}

export function weatherAtTime(now, epochMs) {
  const elapsed = Math.max(0, now - epochMs)
  const day = Math.floor(elapsed / WEATHER_DAY_MS) + 1
  const withinDay = elapsed % WEATHER_DAY_MS
  const slotDuration = WEATHER_DAY_MS / WEATHER_SLOTS_PER_DAY
  const slot = Math.floor(withinDay / slotDuration)
  return { ...weatherAt(day, slot), nextAt: epochMs + (day - 1) * WEATHER_DAY_MS + (slot + 1) * slotDuration }
}
