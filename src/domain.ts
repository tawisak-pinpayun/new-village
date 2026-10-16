import { isRainWeather, weatherAt } from './weather.mjs'
export type PlotState = 'EMPTY' | 'TILLED' | 'PLANTED' | 'GROWING' | 'READY' | 'WITHERED'
export type CropId = 'radish' | 'carrot' | 'tomato'
export type ToolItemId = 'hoe' | 'watering_can' | 'axe' | 'pickaxe' | 'sickle'
export type FishingItemId = 'fishing_bait' | 'fishing_rod_1' | 'fishing_rod_2' | 'fishing_rod_3' | 'sea_shell' | 'sea_glass'
export type FishItemId = 'silver_sardine' | 'sunny_mullet' | 'moon_shrimp' | 'rain_eel' | 'coral_fish' | 'wreck_perch' | 'pearl_ray' | 'storm_tuna' | 'thunder_marlin' | 'ghost_cod' | 'captains_crown' | 'spring_koi' | 'autumn_snapper' | 'winter_icefish' | 'island_mackerel' | 'lighthouse_bream' | 'moonlight_grouper' | 'cave_angler' | 'sea_star_legend'
export type ItemId = ToolItemId | FishingItemId | FishItemId | 'radish_seed' | 'radish' | 'carrot_seed' | 'carrot' | 'tomato_seed' | 'tomato' | 'wood' | 'stone' | 'fiber' | 'sword' | 'bow' | 'meat' | 'hide' | 'copper' | 'iron' | 'moonstone' | 'arcane_sword' | 'wand' | 'broom' | 'rice_meal' | 'stew' | 'mana_potion' | 'animal_feed' | 'pet_basket' | 'carved_chair' | 'flower_table'
export type MapId = 'village' | 'farm' | 'home' | 'market' | 'magic_city' | 'riverside' | 'city' | 'mine' | 'mine2' | 'mine3' | 'beach'
export type CharacterId = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export const CHARACTER_IDS: CharacterId[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
export const STARTER_CHARACTERS: CharacterId[] = ['a', 'b']
export const CHARACTER_QUESTS: Partial<Record<CharacterId, { title: string; description: string; location: string; steps: string[]; goal: number }>> = {
  c: { title: 'เมล็ดพันธุ์แห่งมิตรภาพ', description: 'ปลูก Radish แล้วนำไปมอบให้ไกด์หมู่บ้าน', location: 'หมู่บ้านและฟาร์ม', steps: ['ปลูกและเก็บเกี่ยว Radish 1 ชิ้น', 'กลับไปหาไกด์บริเวณกลางหมู่บ้าน', 'ยืนใกล้ไกด์แล้วกด E หรือ Space เพื่อส่งของ'], goal: 1 },
  d: { title: 'ทุนของนักบัญชี', description: 'หาเงินจากการทำฟาร์มและออกสำรวจให้ครบ 120 Coins', location: 'ร้านค้าและตลาด', steps: ['ขาย Radish ที่ร้านหมู่บ้าน', 'ขายแครอท มะเขือเทศ หรือแร่ที่ตลาด', 'ถือเงินให้ครบ 120 Coins เพื่อปลดล็อกทันที'], goal: 120 },
  e: { title: 'บทเรียนของนักผจญภัย', description: 'สะสม XP และเพิ่มตัวละครให้ถึงเลเวล 3', location: 'ฟาร์ม ริมน้ำ และเหมือง', steps: ['เก็บเกี่ยวผลผลิตหรือทำกิจกรรมในโลก', 'ต่อสู้กับมอนสเตอร์ในเหมืองเพื่อรับ XP', 'เพิ่มระดับให้ถึงเลเวล 3'], goal: 3 },
  f: { title: 'ความลับหลังฟาร์ม', description: 'ค้นหาและเปิดประตูไม้ของสวนที่อยู่ด้านบนของแผนที่ฟาร์ม', location: 'บ้านและฟาร์ม', steps: ['เดินทางไปแผนที่ “บ้านและฟาร์ม”', 'จากจุดเกิด เดินขึ้นเหนือไปยังประตูไม้ตรงกลางรั้วสวน', 'ยืนชิดประตูจนขึ้นข้อความ “เปิดประตูสวน”', 'กด E หรือ Space หนึ่งครั้ง ไม่ต้องใช้ไอเทม'], goal: 1 },
  g: { title: 'คมดาบแห่งจันทรา', description: 'รวบรวมแร่และหลอมดาบจันทราที่เตาหลอม', location: 'เหมืองชั้น 1–3', steps: ['ขุดแร่เหล็กให้ได้ 2 ชิ้น', 'หาจันทราศิลา 1 ชิ้นจากเหมืองชั้นลึก', 'ไปที่เตาหลอมในเหมืองชั้น 1 แล้วหลอมดาบจันทรา'], goal: 1 },
  h: { title: 'ดาวเด่นแห่งเทศกาล', description: 'นำผลผลิตเข้าร่วมงานเทศกาลจนครบเป้าหมาย', location: 'ตลาด', steps: ['ปลูกและเก็บ Radish แครอท หรือมะเขือเทศ', 'ไปยังงานเทศกาลเก็บเกี่ยวบริเวณกลางตลาด', 'บริจาคผลผลิตรวม 3 ชิ้นให้งานสำเร็จ'], goal: 1 }
}
export type OutfitId = 'default' | 'forest' | 'royal' | 'mage' | 'explorer' | 'starlight' | 'ceremonial'
export const OUTFIT_IDS: OutfitId[] = ['default', 'forest', 'royal', 'mage', 'explorer', 'starlight', 'ceremonial']
export type GearId = 'flower_hat' | 'wizard_hat' | 'silver_necklace' | 'moon_amulet' | 'leather_boots' | 'cloud_boots' | 'gold_bracelet' | 'star_bracelet' | 'lucky_charm' | 'crystal_charm'
export type GearSlot = 'hat' | 'necklace' | 'bracelet' | 'boots' | 'charm'
export const GEAR: Record<GearId, { name: string; icon: string; slot: GearSlot; price: number; hp?: number; mana?: number; attack?: number; defense?: number; speed?: number }> = {
  flower_hat: { name: 'หมวกดอกไม้', icon: '🌸', slot: 'hat', price: 20, hp: 5 },
  wizard_hat: { name: 'หมวกจอมเวท', icon: '🧙', slot: 'hat', price: 65, mana: 15 },
  silver_necklace: { name: 'สร้อยเงิน', icon: '📿', slot: 'necklace', price: 30, defense: 1 },
  moon_amulet: { name: 'จี้จันทรา', icon: '🌙', slot: 'necklace', price: 90, attack: 1, mana: 10 },
  leather_boots: { name: 'รองเท้าหนัง', icon: '🥾', slot: 'boots', price: 35, defense: 1 },
  cloud_boots: { name: 'รองเท้าเมฆ', icon: '☁️', slot: 'boots', price: 80, speed: 35 },
  gold_bracelet: { name: 'กำไลทอง', icon: '🟡', slot: 'bracelet', price: 38, hp: 8 },
  star_bracelet: { name: 'กำไลดาว', icon: '✨', slot: 'bracelet', price: 75, mana: 8, attack: 1 },
  lucky_charm: { name: 'เครื่องรางโชคดี', icon: '🍀', slot: 'charm', price: 45, hp: 5, defense: 1 },
  crystal_charm: { name: 'เครื่องรางคริสตัล', icon: '🔮', slot: 'charm', price: 95, mana: 15, speed: 15 }
}
export const GEAR_IDS = Object.keys(GEAR) as GearId[]
export const TOOL_ITEM_IDS: ToolItemId[] = ['hoe', 'watering_can', 'axe', 'pickaxe', 'sickle']
export const FISHING_ITEM_IDS: FishingItemId[] = ['fishing_bait', 'fishing_rod_1', 'fishing_rod_2', 'fishing_rod_3', 'sea_shell', 'sea_glass']
export const FISH_ITEM_IDS: FishItemId[] = ['silver_sardine', 'sunny_mullet', 'moon_shrimp', 'rain_eel', 'coral_fish', 'wreck_perch', 'pearl_ray', 'storm_tuna', 'thunder_marlin', 'ghost_cod', 'captains_crown', 'spring_koi', 'autumn_snapper', 'winter_icefish', 'island_mackerel', 'lighthouse_bream', 'moonlight_grouper', 'cave_angler', 'sea_star_legend']
export const ITEM_IDS: ItemId[] = [...TOOL_ITEM_IDS, ...FISHING_ITEM_IDS, ...FISH_ITEM_IDS, 'radish_seed', 'radish', 'carrot_seed', 'carrot', 'tomato_seed', 'tomato', 'wood', 'stone', 'fiber', 'sword', 'bow', 'meat', 'hide', 'copper', 'iron', 'moonstone', 'arcane_sword', 'wand', 'broom', 'rice_meal', 'stew', 'mana_potion', 'animal_feed', 'pet_basket', 'carved_chair', 'flower_table']
export const MAX_INVENTORY_SLOTS = 48
export const DEFAULT_HOTBAR: (ItemId | null)[] = ['hoe', 'watering_can', 'axe', 'pickaxe', 'sickle', 'radish_seed', 'radish', null, null, null]
export const itemStackLimit = (itemId: ItemId) => TOOL_ITEM_IDS.includes(itemId as ToolItemId) || itemId.startsWith('fishing_rod_') ? 1 : itemId === 'fishing_bait' ? 999 : 99
export type Slot = { slot: number; itemId: ItemId; quantity: number; favorite?: boolean; locked?: boolean }
export type Plot = { id: string; state: PlotState; cropId: CropId | null; readyAt: number | null; dryDays?: number; wateredDay?: number | null }
export type Save = {
  schemaVersion: 2
  savedAt: number
  player: { x: number; y: number; mapId: MapId; coins: number; energy: number; hp?: number; mana?: number; xp?: number; level?: number }
  inventory: Slot[]
  plots: Plot[]
  questDone: boolean
  character?: CharacterId
  unlockedCharacters?: CharacterId[]
  recipeUnlocked?: boolean
  water?: number
  dayStartedAt?: number
  calendarVersion?: 2 | 3
  lastProcessedDay?: number
  selectedSlot?: number
  hotbar?: (ItemId | null)[]
  hotbarExtras?: (ItemId | null)[]
  nodeHp?: Record<string, number>
  outfit?: OutfitId
  ownedOutfits?: OutfitId[]
  ownedGear?: GearId[]
  equipped?: Partial<Record<GearSlot, GearId>>
  festival?: { day: number; donated: number; completed: boolean }
  mounted?: boolean
  gardenGateOpen?: boolean
  campfires?: { mapId: MapId; x: number; y: number }[]
  fishing?: { xp: number; rod: 1 | 2 | 3; bait?: number; caught: Record<string, number>; inventory?: Record<string, number>; shells?: number; seaGlass?: number; inventoryMigrated?: boolean; foraged?: Record<string, number> }
}

export const KEY = 'new-village.save.v2'
export const GROW_MS = 60_000
export const DAY_MS = 24 * 60_000
const LEGACY_DAY_MS = 120_000
export const MAX_ENERGY = 100
export const MAX_WATER = 10
export const PLOT_COUNT = 6
export const initialState = (): Save => ({
  schemaVersion: 2,
  savedAt: Date.now(),
  player: { x: 768, y: 800, mapId: 'village', coins: 50, energy: 100, hp: 100, mana: 50, xp: 0, level: 1 },
  inventory: [
    ...TOOL_ITEM_IDS.map((itemId, slot) => ({ slot, itemId, quantity: 1 })),
    { slot: 5, itemId: 'radish_seed', quantity: 3 }
  ],
  plots: Array.from({ length: PLOT_COUNT }, (_, i) => ({ id: `plot-${i + 1}`, state: 'EMPTY', cropId: null, readyAt: null, dryDays: 0, wateredDay: null })),
  questDone: false,
  character: 'a',
  unlockedCharacters: [...STARTER_CHARACTERS],
  recipeUnlocked: false,
  water: MAX_WATER,
  dayStartedAt: Date.now(),
  calendarVersion: 3,
  lastProcessedDay: 1,
  selectedSlot: 0,
  hotbar: [...DEFAULT_HOTBAR],
  hotbarExtras: [null, null, null],
  nodeHp: {},
  outfit: 'default',
  ownedOutfits: ['default'],
  ownedGear: [],
  equipped: {},
  festival: { day: 1, donated: 0, completed: false },
  mounted: false,
  gardenGateOpen: false,
  campfires: []
})

export function equipmentStats(save: Save) {
  const stats = { hp: 0, mana: 0, attack: 0, defense: 0, speed: 0 }
  const outfit: Partial<typeof stats> = { default: {}, forest: { hp: 10 }, royal: { defense: 1 }, mage: { mana: 12 }, explorer: { speed: 18 }, starlight: { mana: 18 }, ceremonial: { defense: 2 } }[save.outfit ?? 'default']
  for (const key of Object.keys(stats) as (keyof typeof stats)[]) stats[key] += outfit[key] ?? 0
  for (const id of Object.values(save.equipped ?? {})) {
    if (!id || !GEAR[id]) continue
    for (const key of Object.keys(stats) as (keyof typeof stats)[]) stats[key] += GEAR[id][key] ?? 0
  }
  return stats
}
export const maxHp = (save: Save) => 100 + ((save.player.level ?? 1) - 1) * 15 + equipmentStats(save).hp
export const maxMana = (save: Save) => 50 + ((save.player.level ?? 1) - 1) * 8 + equipmentStats(save).mana
export const xpNeeded = (level: number) => 40 + level * 20
export function gainXp(save: Save, amount: number): boolean {
  save.player.xp = (save.player.xp ?? 0) + amount
  let leveled = false
  while (save.player.xp >= xpNeeded(save.player.level ?? 1)) {
    save.player.xp -= xpNeeded(save.player.level ?? 1)
    save.player.level = (save.player.level ?? 1) + 1
    save.player.hp = maxHp(save)
    save.player.mana = maxMana(save)
    leveled = true
  }
  return leveled
}
export function eat(save: Save, item: ItemId): boolean {
  const effects: Partial<Record<ItemId, [number, number, number]>> = { radish: [8, 0, 10], rice_meal: [28, 0, 30], stew: [45, 5, 40], mana_potion: [0, 30, 0] }
  const effect = effects[item]
  if (!effect || !count(save, item)) return false
  if ((effect[0] === 0 || (save.player.hp ?? 100) >= maxHp(save)) && (effect[1] === 0 || (save.player.mana ?? 50) >= maxMana(save)) && (effect[2] === 0 || save.player.energy >= MAX_ENERGY)) return false
  remove(save, item)
  save.player.hp = Math.min(maxHp(save), (save.player.hp ?? 100) + effect[0])
  save.player.mana = Math.min(maxMana(save), (save.player.mana ?? 50) + effect[1])
  save.player.energy = Math.min(MAX_ENERGY, save.player.energy + effect[2])
  return true
}
export function craftArcaneSword(save: Save): boolean {
  if (count(save, 'iron') < 2 || count(save, 'moonstone') < 1 || !canAdd(save, 'arcane_sword')) return false
  remove(save, 'iron'); remove(save, 'iron'); remove(save, 'moonstone'); add(save, 'arcane_sword')
  return true
}
export function rareDrop(floor: number, roll: number): boolean { return roll < [0, .07, .16, .3][Math.max(1, Math.min(3, floor))] }

export function characterQuestProgress(save: Save, id: CharacterId): number {
  if (id === 'c') return save.questDone ? 1 : 0
  if (id === 'd') return Math.min(120, save.player.coins)
  if (id === 'e') return Math.min(3, save.player.level ?? 1)
  if (id === 'f') return save.gardenGateOpen ? 1 : 0
  if (id === 'g') return count(save, 'arcane_sword') > 0 ? 1 : 0
  if (id === 'h') return save.festival?.completed ? 1 : 0
  return 1
}

export function unlockCompletedCharacters(save: Save): CharacterId[] {
  save.unlockedCharacters ??= [...STARTER_CHARACTERS]
  for (const id of STARTER_CHARACTERS) if (!save.unlockedCharacters.includes(id)) save.unlockedCharacters.push(id)
  const unlocked: CharacterId[] = []
  for (const id of CHARACTER_IDS.slice(2)) {
    const quest = CHARACTER_QUESTS[id]!
    if (!save.unlockedCharacters.includes(id) && characterQuestProgress(save, id) >= quest.goal) {
      save.unlockedCharacters.push(id)
      unlocked.push(id)
    }
  }
  return unlocked
}

// คืนราคาสัตว์ที่ถูกซื้อก่อนยกเลิกระบบสัตว์เลี้ยง โดยลบรายการเดิมเพื่อไม่ให้คืนซ้ำ
function refundRetiredPets(save: Save): number {
  const legacy = save as Save & { pets?: unknown; activePetId?: unknown }
  if (!Array.isArray(legacy.pets) || legacy.pets.length > 2) return 0
  const prices: Record<string, number> = { dog: 90, cat: 100, chicken: 80, cow: 130, goat: 120, magic_dog: 180, bird: 95 }
  const ids = new Set<string>()
  let refund = 0
  for (const pet of legacy.pets) {
    if (!pet || typeof pet !== 'object' || typeof pet.id !== 'string' || !/^[a-z_]+-\d{10,15}-[0-9a-f]{4}$/.test(pet.id) || ids.has(pet.id) || !Object.hasOwn(prices, pet.species)) return 0
    ids.add(pet.id)
    refund += prices[pet.species]
  }
  if (!Number.isSafeInteger(save.player.coins + refund)) return 0
  save.player.coins += refund
  delete legacy.pets
  delete legacy.activePetId
  return refund
}

// เซฟช่วงที่มีสัตว์เลี้ยงอาจมีไข่/นม ซึ่งเกมหลังย้อนเวอร์ชันไม่รู้จักแล้ว
export function migrateRetiredPetSave(value: unknown): { data: unknown; refundedCoins: number; changed: boolean } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { data: value, refundedCoins: 0, changed: false }
  const data = structuredClone(value) as Partial<Save>
  if (!data.player || !Number.isSafeInteger(data.player.coins) || data.player.coins < 0 || !Array.isArray(data.inventory)) return { data: value, refundedCoins: 0, changed: false }
  const save = data as Save
  let refundedCoins = refundRetiredPets(save)
  let changed = refundedCoins > 0
  const legacy = save as Save & { pets?: unknown }
  if (Array.isArray(legacy.pets) && legacy.pets.length === 0) { delete legacy.pets; changed = true }
  const products = { egg: 12, milk: 18 } as const
  const retained: Slot[] = []
  for (const slot of save.inventory) {
    const price = products[(slot as Slot).itemId as keyof typeof products]
    if (price === undefined) { retained.push(slot); continue }
    if (!Number.isInteger(slot.quantity) || slot.quantity < 1 || slot.quantity > 99 || !Number.isSafeInteger(save.player.coins + price * slot.quantity)) return { data: value, refundedCoins: 0, changed: false }
    refundedCoins += price * slot.quantity
    save.player.coins += price * slot.quantity
    changed = true
  }
  if (changed) save.inventory = retained
  return { data: save, refundedCoins, changed }
}

export function count(save: Save, itemId: ItemId): number {
  return save.inventory.reduce((total, slot) => total + (slot.itemId === itemId ? slot.quantity : 0), 0)
}

export function canAdd(save: Save, itemId: ItemId, quantity = 1): boolean {
  if (!Number.isInteger(quantity) || quantity < 1) return false
  const limit = itemStackLimit(itemId)
  const room = save.inventory.filter(slot => slot.itemId === itemId).reduce((total, slot) => total + limit - slot.quantity, 0)
    + (MAX_INVENTORY_SLOTS - save.inventory.length) * limit
  return room >= quantity
}

export function add(save: Save, itemId: ItemId, quantity = 1): boolean {
  if (!canAdd(save, itemId, quantity)) return false
  const limit = itemStackLimit(itemId)
  for (const stack of save.inventory.filter(slot => slot.itemId === itemId && slot.quantity < limit)) {
    const moved = Math.min(quantity, limit - stack.quantity)
    stack.quantity += moved; quantity -= moved
    if (!quantity) break
  }
  while (quantity > 0) {
    const slot = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, i) => i).find(i => !save.inventory.some(s => s.slot === i))!
    const moved = Math.min(quantity, limit)
    save.inventory.push({ slot, itemId, quantity: moved }); quantity -= moved
  }
  if (['sword', 'bow', 'arcane_sword', 'wand', 'broom', 'rice_meal', 'stew', 'mana_potion', 'carrot_seed', 'tomato_seed', 'fishing_rod_1', 'fishing_rod_2', 'fishing_rod_3'].includes(itemId) && save.hotbar && !save.hotbar.includes(itemId)) {
    const empty = save.hotbar.indexOf(null)
    if (empty >= 0) save.hotbar[empty] = itemId
  }
  return true
}

export function remove(save: Save, itemId: ItemId, quantity = 1): boolean {
  if (!Number.isInteger(quantity) || quantity < 1 || count(save, itemId) < quantity) return false
  for (const stack of save.inventory.filter(slot => slot.itemId === itemId).sort((a, b) => Number(a.locked) - Number(b.locked))) {
    const moved = Math.min(quantity, stack.quantity)
    stack.quantity -= moved; quantity -= moved
    if (stack.quantity === 0) save.inventory = save.inventory.filter(slot => slot !== stack)
    if (!quantity) break
  }
  if (!count(save, itemId)) {
    if (save.hotbar) save.hotbar = save.hotbar.map(id => id === itemId && !TOOL_ITEM_IDS.includes(itemId as ToolItemId) ? null : id)
  }
  return true
}

export function moveInventorySlot(save: Save, from: number, to: number): boolean {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= MAX_INVENTORY_SLOTS || to >= MAX_INVENTORY_SLOTS || from === to) return false
  const source = save.inventory.find(slot => slot.slot === from)
  if (!source) return false
  const target = save.inventory.find(slot => slot.slot === to)
  if (target?.itemId === source.itemId) {
    const moved = Math.min(source.quantity, itemStackLimit(source.itemId) - target.quantity)
    if (!moved) return false
    target.quantity += moved; source.quantity -= moved
    if (!source.quantity) save.inventory = save.inventory.filter(slot => slot !== source)
    return true
  }
  source.slot = to
  if (target) target.slot = from
  return true
}

export function splitInventorySlot(save: Save, from: number, to: number): boolean {
  const source = save.inventory.find(slot => slot.slot === from)
  if (!source || source.quantity < 2 || save.inventory.some(slot => slot.slot === to) || to < 0 || to >= MAX_INVENTORY_SLOTS) return false
  const amount = Math.floor(source.quantity / 2)
  source.quantity -= amount
  save.inventory.push({ slot: to, itemId: source.itemId, quantity: amount, favorite: source.favorite, locked: source.locked })
  return true
}

export function sortInventory(save: Save): void {
  save.inventory.sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.itemId.localeCompare(b.itemId))
  save.inventory.forEach((slot, index) => { slot.slot = index })
}

export function dayNumber(save: Save, now = Date.now()): number {
  return Math.max(1, Math.floor((now - (save.dayStartedAt ?? now)) / DAY_MS) + 1)
}

export function isRaining(day: number, slot?: number): boolean {
  return slot === undefined ? [0, 1, 2, 3].some(index => isRainWeather(weatherAt(day, index).type)) : isRainWeather(weatherAt(day, slot).type)
}

export function refreshGrowth(save: Save, now = Date.now()): boolean {
  let changed = false
  const day = dayNumber(save, now)
  const currentSlot = Math.floor((Math.max(0, now - (save.dayStartedAt ?? now)) % DAY_MS) / (DAY_MS / 4))
  const rainOnDay = (candidate: number) => candidate === day ? isRaining(candidate, currentSlot) : isRaining(candidate)
  const lastDay = save.lastProcessedDay ?? day
  if (day > lastDay) {
    for (const id of Object.keys(save.nodeHp ?? {})) if (id.startsWith('river-') || id.startsWith('mine-') || id.startsWith('monster-')) delete save.nodeHp![id]
    for (const plot of save.plots) {
      if (plot.state !== 'PLANTED') continue
      let firstRain = lastDay + 1
      while (firstRain <= day && !rainOnDay(firstRain)) firstRain++
      const rainBeforeWither = firstRain <= day && firstRain - lastDay <= 3 - (plot.dryDays ?? 0)
      if (rainBeforeWither) {
        plot.state = 'GROWING'
        plot.readyAt = firstRain === day ? now + GROW_MS : (save.dayStartedAt ?? now) + (firstRain - 1) * DAY_MS + GROW_MS
        plot.wateredDay = firstRain
        plot.dryDays = 0
      } else {
        plot.dryDays = Math.min(3, (plot.dryDays ?? 0) + day - lastDay)
        if (plot.dryDays >= 3) { plot.state = 'WITHERED'; plot.cropId = null; plot.readyAt = null }
      }
      changed = true
    }
    save.lastProcessedDay = day
    changed = true
  }
  for (const plot of save.plots) {
    if (plot.state === 'GROWING' && plot.readyAt !== null && now >= plot.readyAt) {
      plot.state = 'READY'
      plot.readyAt = null
      changed = true
    }
    if (rainOnDay(day) && plot.state === 'PLANTED') {
      plot.state = 'GROWING'; plot.readyAt = now + GROW_MS; plot.wateredDay = day; plot.dryDays = 0
      changed = true
    }
  }
  return changed
}

export function validate(value: unknown): value is Save {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<Save>
  const p = s.player
  if (s.schemaVersion !== 2 || !p || !Number.isFinite(s.savedAt) ||
    !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x! < 0 || p.x! > 1536 || p.y! < 0 || p.y! > 1024 ||
    !['village', 'farm', 'home', 'market', 'magic_city', 'riverside', 'city', 'mine', 'mine2', 'mine3', 'beach'].includes(p.mapId) || typeof s.questDone !== 'boolean' ||
    (p.hp !== undefined && (!Number.isInteger(p.hp) || p.hp < 0 || p.hp > maxHp(s as Save))) ||
    (p.mana !== undefined && (!Number.isInteger(p.mana) || p.mana < 0 || p.mana > maxMana(s as Save))) ||
    (p.level !== undefined && (!Number.isInteger(p.level) || p.level < 1 || p.level > 100)) ||
    (p.xp !== undefined && (!Number.isInteger(p.xp) || p.xp < 0 || p.xp > 10000)) ||
    (s.outfit !== undefined && !OUTFIT_IDS.includes(s.outfit)) ||
    (s.ownedOutfits !== undefined && (!Array.isArray(s.ownedOutfits) || s.ownedOutfits.some(v => !OUTFIT_IDS.includes(v)))) ||
    (s.ownedGear !== undefined && (!Array.isArray(s.ownedGear) || s.ownedGear.some(v => !GEAR_IDS.includes(v)))) ||
    (s.equipped !== undefined && (typeof s.equipped !== 'object' || s.equipped === null || Object.entries(s.equipped).some(([slot, id]) => !['hat', 'necklace', 'bracelet', 'boots', 'charm'].includes(slot) || !GEAR_IDS.includes(id as GearId) || GEAR[id as GearId].slot !== slot || !s.ownedGear?.includes(id as GearId)))) ||
    (s.mounted !== undefined && typeof s.mounted !== 'boolean') ||
    (s.gardenGateOpen !== undefined && typeof s.gardenGateOpen !== 'boolean') ||
    (s.campfires !== undefined && (!Array.isArray(s.campfires) || s.campfires.length > 20 || s.campfires.some(fire => !fire || !['village', 'farm', 'market', 'magic_city', 'riverside', 'beach'].includes(fire.mapId) || !Number.isFinite(fire.x) || !Number.isFinite(fire.y) || fire.x < 32 || fire.x > 1504 || fire.y < 32 || fire.y > 992))) ||
    (s.fishing !== undefined && (!s.fishing || typeof s.fishing !== 'object' || !Number.isInteger(s.fishing.xp) || s.fishing.xp < 0 || s.fishing.xp > 1000000 || ![1, 2, 3].includes(s.fishing.rod) || (s.fishing.bait !== undefined && (!Number.isInteger(s.fishing.bait) || s.fishing.bait < 0 || s.fishing.bait > 999)) || !s.fishing.caught || typeof s.fishing.caught !== 'object' || Object.entries(s.fishing.caught).length > 30 || Object.values(s.fishing.caught).some(n => !Number.isInteger(n) || n < 0 || n > 100000) || (s.fishing.inventory !== undefined && (typeof s.fishing.inventory !== 'object' || s.fishing.inventory === null || Object.entries(s.fishing.inventory).length > 30 || Object.values(s.fishing.inventory).some(n => !Number.isInteger(n) || n < 0 || n > 999))) || (s.fishing.shells !== undefined && (!Number.isInteger(s.fishing.shells) || s.fishing.shells < 0 || s.fishing.shells > 999)) || (s.fishing.seaGlass !== undefined && (!Number.isInteger(s.fishing.seaGlass) || s.fishing.seaGlass < 0 || s.fishing.seaGlass > 999)) || (s.fishing.inventoryMigrated !== undefined && typeof s.fishing.inventoryMigrated !== 'boolean') || (s.fishing.foraged !== undefined && (typeof s.fishing.foraged !== 'object' || s.fishing.foraged === null || Object.entries(s.fishing.foraged).length > 8 || Object.values(s.fishing.foraged).some(n => !Number.isInteger(n) || n < 0))))) ||
    (s.festival !== undefined && (!Number.isInteger(s.festival.day) || s.festival.day < 1 || !Number.isInteger(s.festival.donated) || s.festival.donated < 0 || s.festival.donated > 3 || typeof s.festival.completed !== 'boolean')) ||
    (s.character !== undefined && !CHARACTER_IDS.includes(s.character)) ||
    (s.unlockedCharacters !== undefined && (!Array.isArray(s.unlockedCharacters) || s.unlockedCharacters.some(id => !CHARACTER_IDS.includes(id)) || new Set(s.unlockedCharacters).size !== s.unlockedCharacters.length)) ||
    (s.recipeUnlocked !== undefined && typeof s.recipeUnlocked !== 'boolean') ||
    (s.water !== undefined && (!Number.isInteger(s.water) || s.water < 0 || s.water > MAX_WATER)) ||
    (s.dayStartedAt !== undefined && !Number.isFinite(s.dayStartedAt)) ||
    (s.calendarVersion !== undefined && s.calendarVersion !== 2 && s.calendarVersion !== 3) ||
    (s.lastProcessedDay !== undefined && (!Number.isInteger(s.lastProcessedDay) || s.lastProcessedDay < 1)) ||
    (s.selectedSlot !== undefined && (!Number.isInteger(s.selectedSlot) || s.selectedSlot < 0 || s.selectedSlot > 9)) ||
    (s.hotbar !== undefined && (!Array.isArray(s.hotbar) || s.hotbar.length !== 10 || s.hotbar.some(item => item !== null && !ITEM_IDS.includes(item)))) ||
    (s.hotbarExtras !== undefined && (!Array.isArray(s.hotbarExtras) || s.hotbarExtras.length !== 3 || s.hotbarExtras.some(item => item !== null && !ITEM_IDS.includes(item)))) ||
    (s.nodeHp !== undefined && (typeof s.nodeHp !== 'object' || s.nodeHp === null || Object.values(s.nodeHp).some(hp => !Number.isInteger(hp) || hp < 0 || hp > 9))) ||
    !Number.isInteger(p.coins) || p.coins! < 0 || !Number.isInteger(p.energy) || p.energy! < 0 || p.energy! > 100) return false
  if (!Array.isArray(s.inventory) || s.inventory.length > MAX_INVENTORY_SLOTS || !Array.isArray(s.plots) || s.plots.length !== PLOT_COUNT) return false
  const slots = new Set<number>()
  for (const item of s.inventory) {
    if (!item || !Number.isInteger(item.slot) || item.slot < 0 || item.slot >= MAX_INVENTORY_SLOTS || slots.has(item.slot) ||
      !ITEM_IDS.includes(item.itemId) ||
      !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > itemStackLimit(item.itemId) ||
      (item.favorite !== undefined && typeof item.favorite !== 'boolean') || (item.locked !== undefined && typeof item.locked !== 'boolean')) return false
    slots.add(item.slot)
  }
  for (let i = 0; i < PLOT_COUNT; i++) {
    const plot = s.plots[i]
    if (!plot || plot.id !== `plot-${i + 1}` || !['EMPTY', 'TILLED', 'PLANTED', 'GROWING', 'READY', 'WITHERED'].includes(plot.state)) return false
    if (['EMPTY', 'TILLED', 'WITHERED'].includes(plot.state) ? plot.cropId !== null || plot.readyAt !== null : !['radish', 'carrot', 'tomato'].includes(plot.cropId ?? '')) return false
    if (plot.state === 'GROWING' ? !Number.isFinite(plot.readyAt) || plot.readyAt! < 0 :
      plot.state === 'READY' ? plot.readyAt !== null && (!Number.isFinite(plot.readyAt) || plot.readyAt < 0) : plot.readyAt !== null) return false
    if (plot.dryDays !== undefined && (!Number.isInteger(plot.dryDays) || plot.dryDays < 0 || plot.dryDays > 3)) return false
    if (plot.wateredDay !== undefined && plot.wateredDay !== null && (!Number.isInteger(plot.wateredDay) || plot.wateredDay < 1)) return false
  }
  return true
}

export function load(): { state: Save; error?: string } {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const oldRaw = localStorage.getItem('new-village.save.v1')
      if (!oldRaw) return { state: initialState() }
      const old: unknown = JSON.parse(oldRaw)
      if (!old || typeof old !== 'object') throw new Error('invalid old save')
      const o = old as Record<string, unknown>
      const migrated = initialState()
      if (o.player && typeof o.player === 'object') {
        const p = o.player as Record<string, unknown>
        if (Number.isInteger(p.coins) && Number(p.coins) >= 0) migrated.player.coins = Number(p.coins)
        if (Number.isInteger(p.energy) && Number(p.energy) >= 0 && Number(p.energy) <= 100) migrated.player.energy = Number(p.energy)
      }
      if (Array.isArray(o.inventory)) migrated.inventory = o.inventory as Slot[]
      if (Array.isArray(o.plots)) migrated.plots = o.plots as Plot[]
      if (!validate(migrated)) throw new Error('invalid old save')
      refreshGrowth(migrated)
      return { state: migrated }
    }
    const migration = migrateRetiredPetSave(JSON.parse(raw))
    const parsed: unknown = migration.data
    if (!validate(parsed)) throw new Error('invalid save')
    parsed.player.x = Math.max(16, Math.min(1520, parsed.player.x))
    parsed.player.y = Math.max(16, Math.min(1008, parsed.player.y))
    parsed.water ??= MAX_WATER
    parsed.dayStartedAt ??= Date.now()
    if (parsed.calendarVersion === undefined) {
      const now = Date.now()
      const oldElapsed = Math.max(0, now - parsed.dayStartedAt)
      parsed.dayStartedAt = now - Math.floor(oldElapsed / LEGACY_DAY_MS) * DAY_MS
        - Math.floor((oldElapsed % LEGACY_DAY_MS) / LEGACY_DAY_MS * DAY_MS)
    }
    parsed.calendarVersion = 3
    parsed.lastProcessedDay ??= dayNumber(parsed)
    parsed.selectedSlot ??= 0
    parsed.hotbarExtras ??= [null, null, null]
    parsed.hotbar ??= [...DEFAULT_HOTBAR.slice(0, 7), ...parsed.hotbarExtras]
    let inventoryMigrated = false
    for (const itemId of TOOL_ITEM_IDS) if (!count(parsed, itemId) && add(parsed, itemId)) inventoryMigrated = true
    parsed.nodeHp ??= {}
    parsed.player.level ??= 1
    parsed.player.xp ??= 0
    parsed.player.hp ??= maxHp(parsed)
    parsed.player.mana ??= maxMana(parsed)
    parsed.outfit ??= 'default'
    parsed.unlockedCharacters ??= [...STARTER_CHARACTERS]
    unlockCompletedCharacters(parsed)
    if (!parsed.unlockedCharacters.includes(parsed.character ?? 'a')) parsed.character = 'a'
    parsed.ownedOutfits ??= ['default']
    parsed.ownedGear ??= []
    parsed.equipped ??= {}
    parsed.festival ??= { day: dayNumber(parsed), donated: 0, completed: false }
    parsed.mounted ??= false
    parsed.gardenGateOpen ??= false
    parsed.campfires ??= []
    for (const plot of parsed.plots) { plot.dryDays ??= 0; plot.wateredDay ??= null; if (plot.state === 'READY') plot.readyAt = null }
    if (migration.changed || inventoryMigrated) { unlockCompletedCharacters(parsed); persist(parsed) }
    refreshGrowth(parsed)
    return { state: parsed }
  } catch {
    return { state: initialState(), error: 'ข้อมูลบันทึกไม่ถูกต้อง เกมใหม่ชั่วคราวเริ่มแล้ว ข้อมูลเดิมยังไม่ถูกลบ' }
  }
}

export function persist(state: Save): boolean {
  try {
    state.savedAt = Date.now()
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch { return false }
}
