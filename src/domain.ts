export type PlotState = 'EMPTY' | 'TILLED' | 'PLANTED' | 'GROWING' | 'READY' | 'WITHERED'
export type CropId = 'radish' | 'carrot' | 'tomato'
export type ItemId = 'radish_seed' | 'radish' | 'carrot_seed' | 'carrot' | 'tomato_seed' | 'tomato' | 'wood' | 'stone' | 'fiber' | 'sword' | 'bow' | 'meat' | 'hide' | 'copper' | 'iron' | 'moonstone' | 'arcane_sword' | 'wand' | 'broom' | 'rice_meal' | 'stew' | 'mana_potion'
export type MapId = 'village' | 'farm' | 'home' | 'market' | 'magic_city' | 'riverside' | 'mine' | 'mine2' | 'mine3'
export type OutfitId = 'default' | 'forest' | 'royal' | 'mage'
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
export const ITEM_IDS: ItemId[] = ['radish_seed', 'radish', 'carrot_seed', 'carrot', 'tomato_seed', 'tomato', 'wood', 'stone', 'fiber', 'sword', 'bow', 'meat', 'hide', 'copper', 'iron', 'moonstone', 'arcane_sword', 'wand', 'broom', 'rice_meal', 'stew', 'mana_potion']
export type Slot = { slot: number; itemId: ItemId; quantity: number }
export type Plot = { id: string; state: PlotState; cropId: CropId | null; readyAt: number | null; dryDays?: number; wateredDay?: number | null }
export type Save = {
  schemaVersion: 2
  savedAt: number
  player: { x: number; y: number; mapId: MapId; coins: number; energy: number; hp?: number; mana?: number; xp?: number; level?: number }
  inventory: Slot[]
  plots: Plot[]
  questDone: boolean
  character?: 'a' | 'b'
  recipeUnlocked?: boolean
  water?: number
  dayStartedAt?: number
  calendarVersion?: 2
  lastProcessedDay?: number
  selectedSlot?: number
  hotbarExtras?: (ItemId | null)[]
  nodeHp?: Record<string, number>
  outfit?: OutfitId
  ownedOutfits?: OutfitId[]
  ownedGear?: GearId[]
  equipped?: Partial<Record<GearSlot, GearId>>
  festival?: { day: number; donated: number; completed: boolean }
  mounted?: boolean
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
  inventory: [{ slot: 0, itemId: 'radish_seed', quantity: 3 }],
  plots: Array.from({ length: PLOT_COUNT }, (_, i) => ({ id: `plot-${i + 1}`, state: 'EMPTY', cropId: null, readyAt: null, dryDays: 0, wateredDay: null })),
  questDone: false,
  character: 'a',
  recipeUnlocked: false,
  water: MAX_WATER,
  dayStartedAt: Date.now(),
  calendarVersion: 2,
  lastProcessedDay: 1,
  selectedSlot: 0,
  hotbarExtras: [null, null, null],
  nodeHp: {},
  outfit: 'default',
  ownedOutfits: ['default'],
  ownedGear: [],
  equipped: {},
  festival: { day: 1, donated: 0, completed: false },
  mounted: false
})

export function equipmentStats(save: Save) {
  const stats = { hp: 0, mana: 0, attack: 0, defense: 0, speed: 0 }
  const outfit: Partial<typeof stats> = { default: {}, forest: { hp: 10 }, royal: { defense: 1 }, mage: { mana: 12 } }[save.outfit ?? 'default']
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

export function count(save: Save, itemId: ItemId): number {
  return save.inventory.find(s => s.itemId === itemId)?.quantity ?? 0
}

export function canAdd(save: Save, itemId: ItemId): boolean {
  const stack = save.inventory.find(s => s.itemId === itemId)
  return stack ? stack.quantity < 99 : save.inventory.length < 24
}

export function add(save: Save, itemId: ItemId): boolean {
  if (!canAdd(save, itemId)) return false
  const stack = save.inventory.find(s => s.itemId === itemId)
  if (stack) stack.quantity++
  else {
    const slot = Array.from({ length: 24 }, (_, i) => i).find(i => !save.inventory.some(s => s.slot === i))!
    save.inventory.push({ slot, itemId, quantity: 1 })
  }
  if (['sword', 'bow', 'arcane_sword', 'wand', 'broom', 'rice_meal', 'stew', 'mana_potion', 'carrot_seed', 'tomato_seed'].includes(itemId) && save.hotbarExtras && !save.hotbarExtras.includes(itemId)) {
    const empty = save.hotbarExtras.indexOf(null)
    if (empty >= 0) save.hotbarExtras[empty] = itemId
  }
  return true
}

export function remove(save: Save, itemId: ItemId): boolean {
  const stack = save.inventory.find(s => s.itemId === itemId)
  if (!stack) return false
  if (--stack.quantity === 0) save.inventory = save.inventory.filter(s => s !== stack)
  return true
}

export function dayNumber(save: Save, now = Date.now()): number {
  return Math.max(1, Math.floor((now - (save.dayStartedAt ?? now)) / DAY_MS) + 1)
}

export function isRaining(day: number): boolean { return day % 5 === 0 }

export function refreshGrowth(save: Save, now = Date.now()): boolean {
  let changed = false
  const day = dayNumber(save, now)
  const lastDay = save.lastProcessedDay ?? day
  if (day > lastDay) {
    for (const id of Object.keys(save.nodeHp ?? {})) if (id.startsWith('river-') || id.startsWith('mine-') || id.startsWith('monster-')) delete save.nodeHp![id]
    for (const plot of save.plots) {
      if (plot.state !== 'PLANTED') continue
      const firstRain = lastDay + ((5 - lastDay % 5) % 5 || 5)
      const rainBeforeWither = firstRain <= day && firstRain - lastDay <= 3 - (plot.dryDays ?? 0)
      if (rainBeforeWither) {
        plot.state = 'GROWING'
        plot.readyAt = (save.dayStartedAt ?? now) + (firstRain - 1) * DAY_MS + GROW_MS
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
    if (isRaining(day) && plot.state === 'PLANTED') {
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
    !['village', 'farm', 'home', 'market', 'magic_city', 'riverside', 'mine', 'mine2', 'mine3'].includes(p.mapId) || typeof s.questDone !== 'boolean' ||
    (p.hp !== undefined && (!Number.isInteger(p.hp) || p.hp < 0 || p.hp > maxHp(s as Save))) ||
    (p.mana !== undefined && (!Number.isInteger(p.mana) || p.mana < 0 || p.mana > maxMana(s as Save))) ||
    (p.level !== undefined && (!Number.isInteger(p.level) || p.level < 1 || p.level > 100)) ||
    (p.xp !== undefined && (!Number.isInteger(p.xp) || p.xp < 0 || p.xp > 10000)) ||
    (s.outfit !== undefined && !['default', 'forest', 'royal', 'mage'].includes(s.outfit)) ||
    (s.ownedOutfits !== undefined && (!Array.isArray(s.ownedOutfits) || s.ownedOutfits.some(v => !['default', 'forest', 'royal', 'mage'].includes(v)))) ||
    (s.ownedGear !== undefined && (!Array.isArray(s.ownedGear) || s.ownedGear.some(v => !GEAR_IDS.includes(v)))) ||
    (s.equipped !== undefined && (typeof s.equipped !== 'object' || s.equipped === null || Object.entries(s.equipped).some(([slot, id]) => !['hat', 'necklace', 'bracelet', 'boots', 'charm'].includes(slot) || !GEAR_IDS.includes(id as GearId) || GEAR[id as GearId].slot !== slot || !s.ownedGear?.includes(id as GearId)))) ||
    (s.mounted !== undefined && typeof s.mounted !== 'boolean') ||
    (s.festival !== undefined && (!Number.isInteger(s.festival.day) || s.festival.day < 1 || !Number.isInteger(s.festival.donated) || s.festival.donated < 0 || s.festival.donated > 3 || typeof s.festival.completed !== 'boolean')) ||
    (s.character !== undefined && !['a', 'b'].includes(s.character)) ||
    (s.recipeUnlocked !== undefined && typeof s.recipeUnlocked !== 'boolean') ||
    (s.water !== undefined && (!Number.isInteger(s.water) || s.water < 0 || s.water > MAX_WATER)) ||
    (s.dayStartedAt !== undefined && !Number.isFinite(s.dayStartedAt)) ||
    (s.calendarVersion !== undefined && s.calendarVersion !== 2) ||
    (s.lastProcessedDay !== undefined && (!Number.isInteger(s.lastProcessedDay) || s.lastProcessedDay < 1)) ||
    (s.selectedSlot !== undefined && (!Number.isInteger(s.selectedSlot) || s.selectedSlot < 0 || s.selectedSlot > 9)) ||
    (s.hotbarExtras !== undefined && (!Array.isArray(s.hotbarExtras) || s.hotbarExtras.length !== 3 || s.hotbarExtras.some(item => item !== null && !ITEM_IDS.includes(item)))) ||
    (s.nodeHp !== undefined && (typeof s.nodeHp !== 'object' || s.nodeHp === null || Object.values(s.nodeHp).some(hp => !Number.isInteger(hp) || hp < 0 || hp > 9))) ||
    !Number.isInteger(p.coins) || p.coins! < 0 || !Number.isInteger(p.energy) || p.energy! < 0 || p.energy! > 100) return false
  if (!Array.isArray(s.inventory) || s.inventory.length > 24 || !Array.isArray(s.plots) || s.plots.length !== PLOT_COUNT) return false
  const slots = new Set<number>(), items = new Set<string>()
  for (const item of s.inventory) {
    if (!item || !Number.isInteger(item.slot) || item.slot < 0 || item.slot >= 24 || slots.has(item.slot) ||
      !ITEM_IDS.includes(item.itemId) || items.has(item.itemId) ||
      !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return false
    slots.add(item.slot); items.add(item.itemId)
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
    const parsed: unknown = JSON.parse(raw)
    if (!validate(parsed)) throw new Error('invalid save')
    parsed.player.x = Math.max(16, Math.min(1520, parsed.player.x))
    parsed.player.y = Math.max(16, Math.min(1008, parsed.player.y))
    parsed.water ??= MAX_WATER
    parsed.dayStartedAt ??= Date.now()
    if (parsed.calendarVersion !== 2) {
      const now = Date.now()
      const oldElapsed = Math.max(0, now - parsed.dayStartedAt)
      parsed.dayStartedAt = now - Math.floor(oldElapsed / LEGACY_DAY_MS) * DAY_MS
        - Math.floor((oldElapsed % LEGACY_DAY_MS) / LEGACY_DAY_MS * DAY_MS)
      parsed.calendarVersion = 2
    }
    parsed.lastProcessedDay ??= dayNumber(parsed)
    parsed.selectedSlot ??= 0
    parsed.hotbarExtras ??= [null, null, null]
    parsed.nodeHp ??= {}
    parsed.player.level ??= 1
    parsed.player.xp ??= 0
    parsed.player.hp ??= maxHp(parsed)
    parsed.player.mana ??= maxMana(parsed)
    parsed.outfit ??= 'default'
    parsed.ownedOutfits ??= ['default']
    parsed.ownedGear ??= []
    parsed.equipped ??= {}
    parsed.festival ??= { day: dayNumber(parsed), donated: 0, completed: false }
    parsed.mounted ??= false
    for (const plot of parsed.plots) { plot.dryDays ??= 0; plot.wateredDay ??= null; if (plot.state === 'READY') plot.readyAt = null }
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
