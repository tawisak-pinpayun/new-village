export const FLOWER_COLORS = [
  { id: 'rose', label: 'แดง', color: '#ce5c68' },
  { id: 'sun', label: 'เหลือง', color: '#e7bb55' },
  { id: 'sky', label: 'ฟ้า', color: '#77add0' },
  { id: 'violet', label: 'ม่วง', color: '#a786c6' }
]
export const FLOWER_SHAPES = [
  { id: 'round', label: 'กลม' },
  { id: 'star', label: 'ดาว' },
  { id: 'bell', label: 'ระฆัง' }
]
export const FLOWER_SLOTS = 4
export const FLOWER_DURATION_MS = 30_000

export function flowerTarget(seed) {
  let value = (Number(seed) >>> 0) || 1
  // Xorshift keeps successive color/shape draws independent of low-bit parity.
  const next = () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; value >>>= 0; return value }
  return Array.from({ length: FLOWER_SLOTS }, () => ({ color: FLOWER_COLORS[next() % FLOWER_COLORS.length].id, shape: FLOWER_SHAPES[next() % FLOWER_SHAPES.length].id }))
}

export function scoreFlowers(target, picks, remainingMs, durationMs = FLOWER_DURATION_MS) {
  if (!Array.isArray(target) || target.length !== FLOWER_SLOTS || !Array.isArray(picks) || picks.length !== FLOWER_SLOTS) throw new Error('invalid arrangement')
  let score = 0
  for (let index = 0; index < FLOWER_SLOTS; index++) {
    if (picks[index]?.color === target[index].color) score += 100
    if (picks[index]?.shape === target[index].shape) score += 100
  }
  const variety = new Set(picks.filter(Boolean).map(pick => `${pick.color}:${pick.shape}`)).size
  score += Math.round(variety / FLOWER_SLOTS * 100)
  score += Math.round(Math.max(0, Math.min(durationMs, remainingMs)) / durationMs * 100)
  return Math.max(0, Math.min(1000, score))
}
