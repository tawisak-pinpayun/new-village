export const FISHING_ROUNDS: number
export const FISHING_ROUND_MS: number
export const FISHING_DURATION_MS: number
export const TOURNAMENT_FISH: string[]
export function tournamentFish(seed: number, round: number): string
export function tournamentPosition(elapsed: number, round: number): number
export function tournamentPoints(elapsed: number, round: number): number
export function scoreTournament(hits: Record<number, { at: number }>): number
