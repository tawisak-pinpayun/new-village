import type { Calendar } from './calendar'
import { add, count, MAX_INVENTORY_SLOTS, type FishItemId, type ItemId, type Save } from './domain'

export type FishingSpotId = 'beginner-pier' | 'coral-reef' | 'shipwreck' | 'small-island' | 'lighthouse-pier' | 'cave-pool'
export type FishRarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type Fish = { id: string; name: string; rarity: FishRarity; spots: FishingSpotId[]; value: number; xp: number; night?: boolean; rain?: boolean; storm?: boolean; season?: string }

export const FISH: Fish[] = [
  { id: 'silver_sardine', name: 'ปลาซาร์ดีนเงิน', rarity: 'common', spots: ['beginner-pier'], value: 8, xp: 8 },
  { id: 'sunny_mullet', name: 'ปลากระบอกแดดอุ่น', rarity: 'common', spots: ['beginner-pier'], value: 10, xp: 9 },
  { id: 'moon_shrimp', name: 'กุ้งแสงจันทร์', rarity: 'uncommon', spots: ['beginner-pier', 'coral-reef'], value: 18, xp: 15, night: true },
  { id: 'rain_eel', name: 'ปลาไหลสายฝน', rarity: 'uncommon', spots: ['beginner-pier', 'shipwreck'], value: 22, xp: 18, rain: true },
  { id: 'coral_fish', name: 'ปลาปะการังรุ้ง', rarity: 'uncommon', spots: ['coral-reef'], value: 24, xp: 20 },
  { id: 'wreck_perch', name: 'ปลากะพงซากเรือ', rarity: 'uncommon', spots: ['shipwreck'], value: 26, xp: 22 },
  { id: 'pearl_ray', name: 'กระเบนไข่มุก', rarity: 'rare', spots: ['coral-reef'], value: 48, xp: 35, night: true },
  { id: 'storm_tuna', name: 'ทูน่าพายุ', rarity: 'rare', spots: ['coral-reef', 'shipwreck'], value: 52, xp: 38, rain: true },
  { id: 'thunder_marlin', name: 'ปลากระโทงสายฟ้า', rarity: 'legendary', spots: ['shipwreck'], value: 125, xp: 80, storm: true },
  { id: 'ghost_cod', name: 'ปลาค็อดวิญญาณ', rarity: 'rare', spots: ['shipwreck'], value: 58, xp: 40, night: true },
  { id: 'captains_crown', name: 'ปลามงกุฎกัปตัน', rarity: 'legendary', spots: ['shipwreck'], value: 110, xp: 70, season: 'summer' },
  { id: 'spring_koi', name: 'ปลาคาร์ปบุปผา', rarity: 'rare', spots: ['coral-reef'], value: 50, xp: 35, season: 'spring' },
  { id: 'autumn_snapper', name: 'ปลากะพงใบไม้ทอง', rarity: 'rare', spots: ['coral-reef'], value: 50, xp: 35, season: 'autumn' },
  { id: 'winter_icefish', name: 'ปลาแก้วเหมันต์', rarity: 'rare', spots: ['shipwreck'], value: 55, xp: 40, season: 'winter' },
  { id: 'island_mackerel', name: 'ปลาแมคเคอเรลเกาะเล็ก', rarity: 'uncommon', spots: ['small-island'], value: 28, xp: 23 },
  { id: 'lighthouse_bream', name: 'ปลาทรายแดงประภาคาร', rarity: 'uncommon', spots: ['lighthouse-pier'], value: 29, xp: 23 },
  { id: 'moonlight_grouper', name: 'ปลาเก๋าแสงจันทร์', rarity: 'rare', spots: ['lighthouse-pier', 'cave-pool'], value: 59, xp: 43, night: true },
  { id: 'cave_angler', name: 'ปลาตะเกียงถ้ำ', rarity: 'rare', spots: ['cave-pool'], value: 63, xp: 45 },
  { id: 'sea_star_legend', name: 'ปลาดาวทะเลในตำนาน', rarity: 'legendary', spots: ['cave-pool'], value: 140, xp: 90, storm: true }
]

export const FISHING_SPOTS: Record<FishingSpotId, { name: string; level: number; rod: 1 | 2 | 3 }> = {
  'beginner-pier': { name: 'ท่าเรือเริ่มต้น', level: 1, rod: 1 },
  'coral-reef': { name: 'แนวปะการัง', level: 2, rod: 2 },
  shipwreck: { name: 'ซากเรือ', level: 3, rod: 3 },
  'small-island': { name: 'เกาะเล็ก', level: 2, rod: 2 },
  'lighthouse-pier': { name: 'เชิงประภาคาร', level: 2, rod: 2 },
  'cave-pool': { name: 'แอ่งน้ำถ้ำลับ', level: 3, rod: 3 }
}

export function fishingProgress(save: Save): NonNullable<Save['fishing']> {
  const progress = save.fishing ?? (save.fishing = { xp: 0, rod: 1, bait: 5, caught: {} })
  if (!progress.inventoryMigrated) {
    const transfers = new Map<ItemId, number>()
    const transfer = (id: ItemId, amount = 1) => { if (amount > 0) transfers.set(id, (transfers.get(id) ?? 0) + amount) }
    transfer(`fishing_rod_${progress.rod}` as ItemId)
    transfer('fishing_bait', progress.bait ?? 0)
    transfer('sea_shell', progress.shells ?? 0)
    transfer('sea_glass', progress.seaGlass ?? 0)
    for (const [id, amount] of Object.entries(progress.inventory ?? {})) if (FISH.some(fish => fish.id === id)) transfer(id as FishItemId, amount)
    const newSlots = [...transfers.keys()].filter(id => count(save, id) === 0).length
    const fits = save.inventory.length + newSlots <= MAX_INVENTORY_SLOTS && [...transfers].every(([id, amount]) => count(save, id) + amount <= (id === 'fishing_bait' ? 999 : id.startsWith('fishing_rod_') ? 1 : 99))
    if (fits) {
      for (const [id, amount] of transfers) add(save, id, amount)
      progress.bait = 0; progress.shells = 0; progress.seaGlass = 0; progress.inventory = {}
      progress.inventoryMigrated = true
    }
  }
  return progress
}

export function fishingLevel(xp: number) { return xp >= 180 ? 3 : xp >= 60 ? 2 : 1 }

export function availableFish(spot: FishingSpotId, calendar: Calendar, weatherType: string): Fish[] {
  const wet = ['rain', 'heavy_rain', 'thunderstorm'].includes(weatherType)
  return FISH.filter(fish => fish.spots.includes(spot) && (!fish.night || calendar.night) && (!fish.rain || wet) && (!fish.storm || weatherType === 'thunderstorm') && (!fish.season || fish.season === calendar.season.id))
}

export function selectFish(spot: FishingSpotId, calendar: Calendar, weatherType: string, random = Math.random): Fish {
  const pool = availableFish(spot, calendar, weatherType)
  const weights: Record<FishRarity, number> = { common: 10, uncommon: 5, rare: 2, legendary: 1 }
  const total = pool.reduce((sum, fish) => sum + weights[fish.rarity], 0)
  let roll = random() * total
  return pool.find(fish => (roll -= weights[fish.rarity]) < 0) ?? pool[0]
}
