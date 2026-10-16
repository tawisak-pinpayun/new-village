import { FLOWER_COLORS, FLOWER_DURATION_MS, FLOWER_SHAPES, FLOWER_SLOTS, flowerTarget, scoreFlowers } from './flower.mjs'

export const MINI_GAME_RANKS = [
  { rank: 'S', minScore: 900, tokens: 100, exp: 200 },
  { rank: 'A', minScore: 750, tokens: 70, exp: 140 },
  { rank: 'B', minScore: 500, tokens: 40, exp: 80 },
  { rank: 'C', minScore: 0, tokens: 20, exp: 40 }
]
export const rankFor = score => MINI_GAME_RANKS.find(entry => score >= entry.minScore)

export class MiniGameSession {
  constructor(seed, durationMs = FLOWER_DURATION_MS) {
    this.seed = Number(seed) >>> 0
    this.durationMs = durationMs
    this.state = 'idle'
    this.target = []
    this.picks = Array(FLOWER_SLOTS).fill(null)
    this.moves = []
    this.startAt = 0
    this.deadline = 0
    this.pausedAt = 0
    this.score = null
  }

  initialize() {
    if (this.state !== 'idle') return false
    this.target = flowerTarget(this.seed)
    this.state = 'ready'
    return true
  }

  start(now) {
    if (this.state !== 'ready') return false
    this.startAt = now + 3000
    this.deadline = this.startAt + this.durationMs
    this.state = 'countdown'
    return true
  }

  update(now) {
    if (this.state === 'countdown' && now >= this.startAt) this.state = 'playing'
    if (this.state === 'playing' && now >= this.deadline) this.finish(this.deadline)
    return this.state
  }

  pause(now) {
    if (this.update(now) !== 'playing') return false
    this.pausedAt = now
    this.state = 'paused'
    return true
  }

  resume(now) {
    if (this.state !== 'paused') return false
    this.deadline += Math.max(0, now - this.pausedAt)
    this.pausedAt = 0
    this.state = 'playing'
    return true
  }

  select(index, pick, now) {
    if (this.update(now) !== 'playing' || !Number.isInteger(index) || index < 0 || index >= FLOWER_SLOTS) return false
    if (!FLOWER_COLORS.some(color => color.id === pick?.color) || !FLOWER_SHAPES.some(shape => shape.id === pick?.shape)) return false
    this.picks[index] = { color: pick.color, shape: pick.shape }
    this.moves.push({ index, color: pick.color, shape: pick.shape, at: Math.round(now - this.startAt) })
    return true
  }

  finish(now) {
    if (this.updateStateForFinish(now) !== 'playing') return false
    this.score = scoreFlowers(this.target, this.picks, this.deadline - Math.min(now, this.deadline), this.durationMs)
    this.state = 'completed'
    return true
  }

  updateStateForFinish(now) {
    if (this.state === 'countdown' && now >= this.startAt) this.state = 'playing'
    return this.state
  }

  cancel() {
    if (['completed', 'cancelled', 'failed'].includes(this.state)) return false
    this.state = 'cancelled'
    return true
  }

  cleanup() { this.moves = []; this.picks = Array(FLOWER_SLOTS).fill(null) }
  remaining(now) { return Math.max(0, this.deadline - (this.state === 'paused' ? this.pausedAt : now)) }
}
