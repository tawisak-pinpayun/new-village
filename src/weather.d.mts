export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'thunderstorm' | 'windy' | 'fog' | 'snow' | 'blizzard'
export type Weather = { type: WeatherType; label: string; season: 'spring' | 'summer' | 'autumn' | 'winter'; day: number; slot: number; nextAt: number }
export const WEATHER_TYPES: WeatherType[]
export const WEATHER_LABELS: Record<WeatherType, string>
export const WEATHER_SLOTS_PER_DAY: number
export const WEATHER_DAY_MS: number
export function isRainWeather(type: WeatherType): boolean
export function weatherAt(day: number, slot: number): Omit<Weather, 'nextAt'>
export function weatherAtTime(now: number, epochMs: number): Weather
