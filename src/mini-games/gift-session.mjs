import { GIFT_DURATION_MS, giftDeck, scoreGiftMatch } from './gift-match.mjs'

export class GiftMatchSession {
  constructor(seed) {
    this.seed = Number(seed) >>> 0
    this.durationMs = GIFT_DURATION_MS
    this.state = 'idle'
    this.deck = []
    this.moves = []
    this.matched = new Set()
    this.revealed = new Set()
    this.first = -1
    this.mistakes = 0
    this.startAt = 0
    this.deadline = 0
    this.pausedAt = 0
    this.lockUntil = 0
    this.score = null
  }

  initialize() {
    if (this.state !== 'idle') return false
    this.deck = giftDeck(this.seed)
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
    if (this.state !== 'playing') return this.state
    if (now >= this.deadline) { this.state = 'failed'; return this.state }
    if (this.lockUntil && now >= this.lockUntil) {
      this.revealed.clear()
      this.first = -1
      this.lockUntil = 0
    }
    return this.state
  }

  flip(index, now) {
    if (this.update(now) !== 'playing' || !Number.isInteger(index) || index < 0 || index >= this.deck.length ||
      this.lockUntil || this.matched.has(index) || this.first === index) return false
    this.moves.push({ index, at: Math.round(now - this.startAt) })
    this.revealed.add(index)
    if (this.first < 0) { this.first = index; return true }
    if (this.deck[this.first] === this.deck[index]) {
      this.matched.add(this.first)
      this.matched.add(index)
      this.revealed.clear()
      this.first = -1
      if (this.matched.size === this.deck.length) {
        this.score = scoreGiftMatch(this.mistakes, this.deadline - now)
        this.state = 'completed'
      }
    } else {
      this.mistakes++
      this.lockUntil = now + 650
    }
    return true
  }

  pause(now) {
    if (this.update(now) !== 'playing') return false
    this.pausedAt = now
    this.state = 'paused'
    return true
  }

  resume(now) {
    if (this.state !== 'paused') return false
    const elapsed = Math.max(0, now - this.pausedAt)
    this.deadline += elapsed
    if (this.lockUntil) this.lockUntil += elapsed
    this.pausedAt = 0
    this.state = 'playing'
    return true
  }

  cancel() { if (['completed', 'failed', 'cancelled'].includes(this.state)) return false; this.state = 'cancelled'; return true }
  cleanup() { this.moves = []; this.matched.clear(); this.revealed.clear() }
  remaining(now) { return Math.max(0, this.deadline - (this.state === 'paused' ? this.pausedAt : now)) }
}
