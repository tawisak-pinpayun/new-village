export const DANCE_LANES = ['A', 'S', 'D', 'F']
export const DANCE_NOTE_COUNT = 24
export const DANCE_BEAT_MS = 650
export const DANCE_LEAD_MS = 1_800
export const DANCE_DURATION_MS = DANCE_LEAD_MS + (DANCE_NOTE_COUNT - 1) * DANCE_BEAT_MS + 900
export const DANCE_HIT_WINDOW_MS = 300

// The chart is derived from the server-issued seed, so practice and competition use the same rules.
export function danceChart(seed) {
  let value = (Number(seed) >>> 0) || 1
  const chart = []
  for (let index = 0; index < DANCE_NOTE_COUNT; index++) {
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5; value >>>= 0
    chart.push({ index, lane: value % DANCE_LANES.length, at: DANCE_LEAD_MS + index * DANCE_BEAT_MS })
  }
  return chart
}

export function danceJudgment(offsetMs) {
  const difference = Math.abs(offsetMs)
  return difference <= 85 ? 'Perfect' : difference <= 165 ? 'Great' : difference <= DANCE_HIT_WINDOW_MS ? 'Good' : 'Miss'
}

export function scoreDance(chart, hits) {
  const points = { Perfect: 45, Great: 30, Good: 15, Miss: 0 }
  const counts = { Perfect: 0, Great: 0, Good: 0, Miss: 0 }
  let combo = 0, maxCombo = 0
  for (const note of chart) {
    const hit = hits[note.index]
    const judgment = hit?.lane === note.lane ? danceJudgment(hit.at - note.at) : 'Miss'
    counts[judgment]++
    combo = judgment === 'Miss' ? 0 : combo + 1
    maxCombo = Math.max(combo, maxCombo)
  }
  const score = Math.round((counts.Perfect * points.Perfect + counts.Great * points.Great + counts.Good * points.Good) / (chart.length * points.Perfect) * 1000)
  return { score, counts, maxCombo }
}

export class DanceSession {
  constructor(seed) {
    this.chart = danceChart(seed)
    this.state = 'ready'
    this.startAt = 0
    this.pausedAt = 0
    this.hits = {}
    this.combo = 0
    this.lastJudgment = ''
    this.result = null
  }

  start(now, scheduledAt = now + 3_000) {
    if (this.state !== 'ready') return false
    this.startAt = scheduledAt
    this.state = 'countdown'
    return true
  }

  update(now) {
    if (this.state === 'countdown' && now >= this.startAt) this.state = 'playing'
    if (this.state === 'playing' && now >= this.startAt + DANCE_DURATION_MS) {
      this.result = scoreDance(this.chart, this.hits)
      this.state = 'completed'
    }
    return this.state
  }

  hit(lane, now) {
    if (this.update(now) !== 'playing' || !Number.isInteger(lane) || lane < 0 || lane >= DANCE_LANES.length) return null
    const elapsed = now - this.startAt
    const candidates = this.chart.filter(note => this.hits[note.index] === undefined && Math.abs(note.at - elapsed) <= DANCE_HIT_WINDOW_MS)
    if (!candidates.length) return null
    const note = candidates.reduce((closest, item) => Math.abs(item.at - elapsed) < Math.abs(closest.at - elapsed) ? item : closest)
    const judgment = lane === note.lane ? danceJudgment(elapsed - note.at) : 'Miss'
    this.hits[note.index] = { lane, at: elapsed }
    this.combo = judgment === 'Miss' ? 0 : this.combo + 1
    this.lastJudgment = judgment
    return { noteIndex: note.index, judgment }
  }

  pause(now) {
    if (this.update(now) !== 'playing') return false
    this.pausedAt = now
    this.state = 'paused'
    return true
  }

  resume(now) {
    if (this.state !== 'paused') return false
    this.startAt += Math.max(0, now - this.pausedAt)
    this.pausedAt = 0
    this.state = 'playing'
    return true
  }

  cancel() { if (this.state === 'completed') return false; this.state = 'cancelled'; return true }
}
