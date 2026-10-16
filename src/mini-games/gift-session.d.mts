import type { GiftMove } from './gift-match.mjs'
export type GiftState = 'idle' | 'ready' | 'countdown' | 'playing' | 'paused' | 'completed' | 'failed' | 'cancelled'
export class GiftMatchSession {
  constructor(seed: number)
  seed: number
  durationMs: number
  state: GiftState
  deck: string[]
  moves: GiftMove[]
  matched: Set<number>
  revealed: Set<number>
  first: number
  mistakes: number
  startAt: number
  deadline: number
  pausedAt: number
  lockUntil: number
  score: number | null
  initialize(): boolean
  start(now: number): boolean
  update(now: number): GiftState
  flip(index: number, now: number): boolean
  pause(now: number): boolean
  resume(now: number): boolean
  cancel(): boolean
  cleanup(): void
  remaining(now: number): number
}
