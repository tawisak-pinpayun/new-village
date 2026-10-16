import type { Fish } from './fishing'

export type FishingPhase = 'idle' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'success' | 'failed'

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))

// The browser only supplies elapsed time and the held input. Results are settled once here.
export class FishingSession {
  phase: FishingPhase = 'idle'
  phaseAt = 0
  fishPosition = .5
  zonePosition = .5
  zoneSize = .24
  progress = .12
  tension = 0
  failure = ''
  private lastAt = 0
  private waitMs: number
  readonly fish: Fish
  readonly rod: number
  readonly level: number

  constructor(fish: Fish, rod: number, level: number, random = Math.random) {
    this.fish = fish; this.rod = rod; this.level = level
    this.waitMs = 850 + random() * 900
    const rarity = { common: 0, uncommon: 1, rare: 2, legendary: 3 }[fish.rarity]
    this.zoneSize = clamp(.30 + (rod - 1) * .035 + (level - 1) * .015 - rarity * .045, .15, .39)
  }

  cast(now: number) {
    if (this.phase !== 'idle') return false
    this.phase = 'casting'; this.phaseAt = now; this.lastAt = now
    return true
  }

  hook(now: number) {
    if (this.phase !== 'bite') return false
    this.phase = 'reeling'; this.phaseAt = now; this.lastAt = now
    return true
  }

  cancel() { if (this.phase !== 'success') { this.phase = 'failed'; this.failure = 'ยกเลิกการตกปลา' } }

  tick(now: number, held: boolean) {
    if (this.phase === 'casting' && now - this.phaseAt >= 450) { this.phase = 'waiting'; this.phaseAt = now }
    if (this.phase === 'waiting' && now - this.phaseAt >= this.waitMs) { this.phase = 'bite'; this.phaseAt = now }
    if (this.phase === 'bite' && now - this.phaseAt > 1350) { this.phase = 'failed'; this.failure = 'ปลากินเหยื่อแล้วหลุดไป' }
    if (this.phase !== 'reeling') { this.lastAt = now; return }
    const dt = clamp((now - this.lastAt) / 1000, 0, .08)
    this.lastAt = now
    const elapsed = (now - this.phaseAt) / 1000
    const rarity = { common: 0, uncommon: 1, rare: 2, legendary: 3 }[this.fish.rarity]
    const speed = 2 + rarity * .35
    this.fishPosition = clamp(.5 + Math.sin(elapsed * speed + rarity) * (.22 + rarity * .035) + Math.sin(elapsed * 1.17) * .09, .07, .93)
    this.zonePosition = clamp(this.zonePosition + (held ? .62 : -.43) * dt, this.zoneSize / 2, 1 - this.zoneSize / 2)
    const inside = Math.abs(this.fishPosition - this.zonePosition) <= this.zoneSize / 2
    this.progress = clamp(this.progress + dt * (inside ? .34 + this.rod * .045 : -.14 - rarity * .018))
    this.tension = clamp(this.tension + dt * (held ? .28 + rarity * .045 : -.43))
    if (this.tension >= 1) { this.phase = 'failed'; this.failure = 'สายเบ็ดตึงเกินไปและขาด' }
    else if (this.progress >= 1) this.phase = 'success'
    else if (elapsed > 25 || this.progress <= 0) { this.phase = 'failed'; this.failure = 'ปลาหลุดเบ็ด' }
  }
}
