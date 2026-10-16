const RESOURCE_ROWS = [
  ['farm', 'farm-tree-1', 315, 705, 'tree', 3], ['farm', 'farm-tree-2', 1250, 735, 'tree', 3],
  ['farm', 'farm-rock-1', 345, 855, 'rock', 2], ['farm', 'farm-rock-2', 1175, 840, 'rock', 2],
  ['farm', 'farm-grass-1', 425, 845, 'grass', 1], ['farm', 'farm-grass-2', 1075, 850, 'grass', 1],
  ['riverside', 'river-rabbit-1', 355, 530, 'rabbit', 1], ['riverside', 'river-rabbit-2', 675, 740, 'rabbit', 1],
  ['riverside', 'river-boar-1', 535, 250, 'boar', 3], ['riverside', 'river-boar-2', 390, 755, 'boar', 3],
  ['mine', 'mine-copper-1', 350, 305, 'copper', 2], ['mine', 'mine-copper-2', 1270, 730, 'copper', 2],
  ['mine', 'mine-copper-3', 635, 175, 'copper', 2], ['mine', 'mine-iron-1', 1230, 375, 'iron', 3],
  ['mine', 'mine-iron-2', 250, 555, 'iron', 3], ['mine2', 'mine2-copper-1', 340, 310, 'copper', 3],
  ['mine2', 'mine2-iron-1', 1230, 390, 'iron', 3], ['mine2', 'mine2-iron-2', 250, 560, 'iron', 3],
  ['mine2', 'mine2-iron-3', 1260, 735, 'iron', 3], ['mine3', 'mine3-iron-1', 340, 310, 'iron', 3],
  ['mine3', 'mine3-iron-2', 1230, 390, 'iron', 3], ['mine3', 'mine3-iron-3', 250, 560, 'iron', 3],
  ['mine3', 'mine3-iron-4', 1260, 735, 'iron', 3]
]
export const RESOURCES = new Map(RESOURCE_ROWS.map(([mapId, id, x, y, kind, hp]) => [id, { mapId, id, x, y, kind, hp }]))
const POINTS = [[700, 300], [950, 350], [760, 565], [1030, 670], [710, 720], [940, 560], [1140, 550]]
const floors = { mine: 1, mine2: 2, mine3: 3 }
import { DEFAULT_WORLD_EPOCH_MS, WORLD_CALENDAR_VERSION, WORLD_DAY_MS, worldDay } from './world-clock.mjs'
import { isRainWeather, weatherAtTime } from '../src/weather.mjs'
function monstersFor(mapId, day) {
  const floor = floors[mapId]
  let seed = (day * 48271 + floor * 69621) >>> 0
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const points = [...POINTS]
  return Array.from({ length: floor + 2 }, (_, i) => {
    const index = Math.floor(random() * points.length)
    const [baseX, baseY] = points.splice(index, 1)[0]
    const x = baseX + Math.round((random() - .5) * 32), y = baseY + Math.round((random() - .5) * 32)
    const kind = floor === 3 && i === floor + 1 ? 'golem' : random() < (floor === 1 ? .7 : .4) ? 'slime' : 'bat'
    return { id: `monster-${floor}-${day}-${i}`, mapId, x, y, homeX: x, homeY: y, targetX: x, targetY: y, nextTurn: 0, kind, hp: kind === 'golem' ? 7 : kind === 'bat' ? 2 : 3, maxHp: kind === 'golem' ? 7 : kind === 'bat' ? 2 : 3, damage: kind === 'golem' ? 13 : kind === 'bat' ? 7 : 5, xp: kind === 'golem' ? 40 : kind === 'bat' ? 12 : 9 }
  })
}
export function makeWorld(now = Date.now(), epochMs = DEFAULT_WORLD_EPOCH_MS) {
  const day = worldDay(now, epochMs)
  return { day, clock: { epochMs, dayLengthMs: WORLD_DAY_MS, calendarVersion: WORLD_CALENDAR_VERSION }, weather: weatherAtTime(now, epochMs), nodeHp: {}, plots: Array.from({ length: 6 }, (_, i) => ({ id: `plot-${i + 1}`, state: 'EMPTY', cropId: null, readyAt: null, dryDays: 0, wateredDay: null })), monsters: Object.fromEntries(Object.keys(floors).map(mapId => [mapId, monstersFor(mapId, day)])), quest: { stage: 0, harvested: 0, mined: 0, completed: false }, festival: { day, donated: 0, goal: 3, completed: false }, gardenGateOpen: false, campfires: [], lastTick: now }
}
export function publicWorld(world) {
  return { type: 'world-state', day: world.day, serverNow: Date.now(), clock: world.clock, weather: world.weather, nodeHp: world.nodeHp, plots: world.plots, monsters: Object.fromEntries(Object.entries(world.monsters).map(([id, list]) => [id, list.map(({ homeX, homeY, targetX, targetY, nextTurn, maxHp, ...monster }) => ({ ...monster, hp: maxHp, remaining: monster.hp }))])), quest: world.quest, festival: world.festival, gardenGateOpen: world.gardenGateOpen, campfires: world.campfires }
}
export function advanceWorld(world, now = Date.now()) {
  let changed = false
  const day = worldDay(now, world.clock.epochMs)
  const weather = weatherAtTime(now, world.clock.epochMs)
  if (!world.weather || weather.day !== world.weather.day || weather.slot !== world.weather.slot) {
    world.weather = weather
    if (isRainWeather(weather.type)) for (const plot of world.plots) if (plot.state === 'PLANTED') Object.assign(plot, { state: 'GROWING', readyAt: now + 60_000 })
    changed = true
  }
  if (day !== world.day) {
    world.day = day; world.nodeHp = {}
    world.monsters = Object.fromEntries(Object.keys(floors).map(mapId => [mapId, monstersFor(mapId, day)]))
    world.festival = { day, donated: 0, goal: 3, completed: false }
    changed = true
  }
  for (const plot of world.plots) if (plot.state === 'GROWING' && plot.readyAt <= now) { plot.state = 'READY'; plot.readyAt = null; changed = true }
  const step = Math.min(.25, Math.max(0, (now - world.lastTick) / 1000))
  world.lastTick = now
  for (const list of Object.values(world.monsters)) for (const monster of list) {
    if (monster.hp <= 0) continue
    if (now > monster.nextTurn || Math.hypot(monster.targetX - monster.x, monster.targetY - monster.y) < 8) {
      monster.nextTurn = now + 1000 + Math.random() * 2600
      const a = Math.random() * Math.PI * 2, radius = 25 + Math.random() * 45
      monster.targetX = monster.homeX + Math.cos(a) * radius
      monster.targetY = monster.homeY + Math.sin(a) * radius
    }
    const dx = monster.targetX - monster.x, dy = monster.targetY - monster.y, length = Math.hypot(dx, dy)
    if (length > 2) {
      const travel = Math.min(length, (monster.kind === 'bat' ? 65 : monster.kind === 'golem' ? 30 : 45) * step)
      monster.x += dx / length * travel; monster.y += dy / length * travel
    }
  }
  return changed
}
export function hitResource(world, player, id, damage) {
  const node = RESOURCES.get(id)
  if (!node || player.mapId !== node.mapId || Math.hypot(player.x - node.x, player.y - node.y) > 155) return { ok: false, message: 'อยู่ไกลจากวัตถุเกินไป' }
  const before = world.nodeHp[id] ?? node.hp
  if (before <= 0) return { ok: false, message: 'วัตถุนี้ถูกเก็บไปแล้ว' }
  const remaining = Math.max(0, before - Math.max(1, Math.min(4, Number(damage) || 1)))
  world.nodeHp[id] = remaining
  return { ok: true, id, remaining, defeated: remaining === 0, node }
}
export function hitMonster(world, player, id, damage) {
  const monster = Object.values(world.monsters).flat().find(item => item.id === id)
  if (!monster || monster.hp <= 0 || player.mapId !== monster.mapId || Math.hypot(player.x - monster.x, player.y - monster.y) > 175) return { ok: false, message: 'มอนสเตอร์อยู่ไกลหรือถูกปราบแล้ว' }
  monster.hp = Math.max(0, monster.hp - Math.max(1, Math.min(5, Number(damage) || 1)))
  return { ok: true, monster, defeated: monster.hp === 0 }
}
export function actPlot(world, player, index, action, cropId, now = Date.now()) {
  const plot = world.plots[index], positions = [[610, 540], [770, 540], [925, 540], [610, 655], [770, 655], [925, 655]]
  if (!plot || player.mapId !== 'farm' || Math.hypot(player.x - positions[index][0], player.y - positions[index][1]) > 145) return { ok: false, message: 'อยู่ไกลจากแปลงเกินไป' }
  if (action === 'till' && ['EMPTY', 'WITHERED'].includes(plot.state)) Object.assign(plot, { state: 'TILLED', cropId: null, readyAt: null })
  else if (action === 'plant' && plot.state === 'TILLED' && ['radish', 'carrot', 'tomato'].includes(cropId)) Object.assign(plot, { state: isRainWeather(world.weather.type) ? 'GROWING' : 'PLANTED', cropId, readyAt: isRainWeather(world.weather.type) ? now + 60_000 : null })
  else if (action === 'water' && plot.state === 'PLANTED') Object.assign(plot, { state: 'GROWING', readyAt: now + 60000 })
  else if (action === 'harvest' && plot.state === 'READY') { const crop = plot.cropId; Object.assign(plot, { state: 'TILLED', cropId: null, readyAt: null }); return { ok: true, plot, crop } }
  else return { ok: false, message: 'แปลงนี้เปลี่ยนไปแล้ว ลองอีกครั้ง' }
  return { ok: true, plot }
}
