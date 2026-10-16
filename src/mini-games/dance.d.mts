export type DanceNote = { index: number; lane: number; at: number }
export type DanceHit = { lane: number; at: number }
export type DanceResult = { score: number; counts: Record<'Perfect' | 'Great' | 'Good' | 'Miss', number>; maxCombo: number }
export type DanceState = 'ready' | 'countdown' | 'playing' | 'paused' | 'completed' | 'cancelled'
export const DANCE_LANES: string[]
export const DANCE_NOTE_COUNT: number
export const DANCE_BEAT_MS: number
export const DANCE_LEAD_MS: number
export const DANCE_DURATION_MS: number
export const DANCE_HIT_WINDOW_MS: number
export function danceChart(seed: number): DanceNote[]
export function danceJudgment(offsetMs: number): 'Perfect' | 'Great' | 'Good' | 'Miss'
export function scoreDance(chart: DanceNote[], hits: Record<number, DanceHit>): DanceResult
export class DanceSession {
  constructor(seed: number)
  chart: DanceNote[]
  state: DanceState
  startAt: number
  pausedAt: number
  hits: Record<number, DanceHit>
  combo: number
  lastJudgment: string
  result: DanceResult | null
  start(now: number, scheduledAt?: number): boolean
  update(now: number): DanceState
  hit(lane: number, now: number): { noteIndex: number; judgment: string } | null
  pause(now: number): boolean
  resume(now: number): boolean
  cancel(): boolean
}
