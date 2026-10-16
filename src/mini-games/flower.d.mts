export type FlowerPick = { color: string; shape: string }
export const FLOWER_COLORS: { id: string; label: string; color: string }[]
export const FLOWER_SHAPES: { id: string; label: string }[]
export const FLOWER_SLOTS: number
export const FLOWER_DURATION_MS: number
export function flowerTarget(seed: number): FlowerPick[]
export function scoreFlowers(target: FlowerPick[], picks: (FlowerPick | null)[], remainingMs: number, durationMs?: number): number
