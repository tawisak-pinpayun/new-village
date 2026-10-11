import type { MapId } from './domain'

export type Monster = { id: string; x: number; y: number; kind: 'slime' | 'bat' | 'golem'; hp: number; damage: number; xp: number }
const POINTS = [[700, 300], [950, 350], [760, 565], [1030, 670], [710, 720], [940, 560], [1140, 550]]

export function mineFloor(mapId: MapId): number {
  return mapId === 'mine3' ? 3 : mapId === 'mine2' ? 2 : mapId === 'mine' ? 1 : 0
}

export function monstersFor(mapId: MapId, worldDay: number): Monster[] {
  const floor = mineFloor(mapId)
  if (!floor) return []
  let seed = (worldDay * 48271 + floor * 69621) >>> 0
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const points = [...POINTS]
  const count = floor + 2
  return Array.from({ length: count }, (_, i) => {
    const index = Math.floor(random() * points.length)
    const [baseX, baseY] = points.splice(index, 1)[0]
    const x = baseX + Math.round((random() - .5) * 32)
    const y = baseY + Math.round((random() - .5) * 32)
    const kind: Monster['kind'] = floor === 3 && i === count - 1 ? 'golem' : random() < (floor === 1 ? .7 : .4) ? 'slime' : 'bat'
    return { id: `monster-${floor}-${worldDay}-${i}`, x, y, kind, hp: kind === 'golem' ? 7 : kind === 'bat' ? 2 : 3, damage: kind === 'golem' ? 13 : kind === 'bat' ? 7 : 5, xp: kind === 'golem' ? 40 : kind === 'bat' ? 12 : 9 }
  })
}
