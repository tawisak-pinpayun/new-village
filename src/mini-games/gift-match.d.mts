export type GiftMove = { index: number; at: number }
export const GIFT_TYPES: { id: string; label: string; color: string }[]
export const GIFT_DURATION_MS: number
export function giftDeck(seed: number): string[]
export function replayGiftMoves(deck: string[], moves: GiftMove[]): { matched: number; mistakes: number; pending: boolean } | null
export function scoreGiftMatch(mistakes: number, remainingMs: number, durationMs?: number): number
