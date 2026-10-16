import type { FlowerPick } from './flower.mjs'
export type MiniGameState = 'idle' | 'ready' | 'countdown' | 'playing' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type MiniGameMove = { index: number; color: string; shape: string; at: number }
export const MINI_GAME_RANKS: { rank: string; minScore: number; tokens: number; exp: number }[]
export function rankFor(score: number): { rank: string; minScore: number; tokens: number; exp: number } | undefined
export class MiniGameSession {
  constructor(seed: number, durationMs?: number)
  seed: number
  durationMs: number
  state: MiniGameState
  target: FlowerPick[]
  picks: (FlowerPick | null)[]
  moves: MiniGameMove[]
  startAt: number
  deadline: number
  pausedAt: number
  score: number | null
  initialize(): boolean
  start(now: number): boolean
  update(now: number): MiniGameState
  pause(now: number): boolean
  resume(now: number): boolean
  select(index: number, pick: FlowerPick, now: number): boolean
  finish(now: number): boolean
  cancel(): boolean
  cleanup(): void
  remaining(now: number): number
}
