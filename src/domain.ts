export type PlotState = 'EMPTY' | 'TILLED' | 'PLANTED' | 'GROWING' | 'READY' | 'WITHERED'
export type CropId = 'radish' | 'carrot' | 'tomato'
export type ItemId = 'radish_seed' | 'radish' | 'carrot_seed' | 'carrot' | 'tomato_seed' | 'tomato' | 'wood' | 'stone' | 'fiber'
export type MapId = 'village' | 'farm' | 'home' | 'market'
export type Slot = { slot: number; itemId: ItemId; quantity: number }
export type Plot = { id: string; state: PlotState; cropId: CropId | null; readyAt: number | null; dryDays?: number; wateredDay?: number | null }
export type Save = {
  schemaVersion: 2
  savedAt: number
  player: { x: number; y: number; mapId: MapId; coins: number; energy: number }
  inventory: Slot[]
  plots: Plot[]
  questDone: boolean
  character?: 'a' | 'b'
  recipeUnlocked?: boolean
  water?: number
  dayStartedAt?: number
  lastProcessedDay?: number
  selectedSlot?: number
  hotbarExtras?: (ItemId | null)[]
  nodeHp?: Record<string, number>
}

export const KEY = 'new-village.save.v2'
export const GROW_MS = 60_000
export const DAY_MS = 120_000
export const MAX_ENERGY = 100
export const MAX_WATER = 10
export const PLOT_COUNT = 6
export const initialState = (): Save => ({
  schemaVersion: 2,
  savedAt: Date.now(),
  player: { x: 768, y: 800, mapId: 'village', coins: 50, energy: 100 },
  inventory: [{ slot: 0, itemId: 'radish_seed', quantity: 3 }],
  plots: Array.from({ length: PLOT_COUNT }, (_, i) => ({ id: `plot-${i + 1}`, state: 'EMPTY', cropId: null, readyAt: null, dryDays: 0, wateredDay: null })),
  questDone: false,
  character: 'a',
  recipeUnlocked: false,
  water: MAX_WATER,
  dayStartedAt: Date.now(),
  lastProcessedDay: 1,
  selectedSlot: 0,
  hotbarExtras: [null, null, null],
  nodeHp: {}
})

export function count(save: Save, itemId: ItemId): number {
  return save.inventory.find(s => s.itemId === itemId)?.quantity ?? 0
}

export function canAdd(save: Save, itemId: ItemId): boolean {
  const stack = save.inventory.find(s => s.itemId === itemId)
  return stack ? stack.quantity < 99 : save.inventory.length < 8
}

export function add(save: Save, itemId: ItemId): boolean {
  if (!canAdd(save, itemId)) return false
  const stack = save.inventory.find(s => s.itemId === itemId)
  if (stack) stack.quantity++
  else {
    const slot = Array.from({ length: 8 }, (_, i) => i).find(i => !save.inventory.some(s => s.slot === i))!
    save.inventory.push({ slot, itemId, quantity: 1 })
  }
  if (['wood', 'stone', 'fiber', 'carrot_seed', 'tomato_seed'].includes(itemId) && save.hotbarExtras && !save.hotbarExtras.includes(itemId)) {
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
    !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x! < 16 || p.x! > 1520 || p.y! < 16 || p.y! > 1008 ||
    !['village', 'farm', 'home', 'market'].includes(p.mapId) || typeof s.questDone !== 'boolean' ||
    (s.character !== undefined && !['a', 'b'].includes(s.character)) ||
    (s.recipeUnlocked !== undefined && typeof s.recipeUnlocked !== 'boolean') ||
    (s.water !== undefined && (!Number.isInteger(s.water) || s.water < 0 || s.water > MAX_WATER)) ||
    (s.dayStartedAt !== undefined && !Number.isFinite(s.dayStartedAt)) ||
    (s.lastProcessedDay !== undefined && (!Number.isInteger(s.lastProcessedDay) || s.lastProcessedDay < 1)) ||
    (s.selectedSlot !== undefined && (!Number.isInteger(s.selectedSlot) || s.selectedSlot < 0 || s.selectedSlot > 9)) ||
    (s.hotbarExtras !== undefined && (!Array.isArray(s.hotbarExtras) || s.hotbarExtras.length !== 3 || s.hotbarExtras.some(item => item !== null && !['radish_seed', 'radish', 'carrot_seed', 'carrot', 'tomato_seed', 'tomato', 'wood', 'stone', 'fiber'].includes(item)))) ||
    (s.nodeHp !== undefined && (typeof s.nodeHp !== 'object' || s.nodeHp === null || Object.values(s.nodeHp).some(hp => !Number.isInteger(hp) || hp < 0 || hp > 9))) ||
    !Number.isInteger(p.coins) || p.coins! < 0 || !Number.isInteger(p.energy) || p.energy! < 0 || p.energy! > 100) return false
  if (!Array.isArray(s.inventory) || s.inventory.length > 8 || !Array.isArray(s.plots) || s.plots.length !== PLOT_COUNT) return false
  const slots = new Set<number>(), items = new Set<string>()
  for (const item of s.inventory) {
    if (!item || !Number.isInteger(item.slot) || item.slot < 0 || item.slot >= 8 || slots.has(item.slot) ||
      !['radish_seed', 'radish', 'carrot_seed', 'carrot', 'tomato_seed', 'tomato', 'wood', 'stone', 'fiber'].includes(item.itemId) || items.has(item.itemId) ||
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
    parsed.water ??= MAX_WATER
    parsed.dayStartedAt ??= Date.now()
    parsed.lastProcessedDay ??= dayNumber(parsed)
    parsed.selectedSlot ??= 0
    parsed.hotbarExtras ??= [null, null, null]
    parsed.nodeHp ??= {}
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
