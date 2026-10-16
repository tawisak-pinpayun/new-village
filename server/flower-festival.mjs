import { FLOWER_COLORS, FLOWER_DURATION_MS, FLOWER_SHAPES, FLOWER_SLOTS, flowerTarget, scoreFlowers } from '../src/mini-games/flower.mjs'
import { rankFor } from '../src/mini-games/session.mjs'
import { worldDay, worldProgress } from './world-clock.mjs'

export function activeFlowerOccurrence(now, epochMs) {
  const day = worldDay(now, epochMs)
  const dayOfYear = (day - 1) % 112
  const hour = (6 + worldProgress(now, epochMs) * 24) % 24
  if (dayOfYear !== 4 || hour < 8 || hour >= 18) return null
  return `flower:${Math.floor((day - 1) / 112) + 1}`
}

export function validateFlowerResult(session, moves, now) {
  if (!session || !Number.isFinite(session.start_at_ms) || !Number.isFinite(session.deadline_ms) ||
    now < session.start_at_ms || now > session.deadline_ms + 3_000 || !Array.isArray(moves) || moves.length > 64) return null
  const picks = Array(FLOWER_SLOTS).fill(null)
  let previousAt = -1
  for (const move of moves) {
    if (!move || !Number.isInteger(move.index) || move.index < 0 || move.index >= FLOWER_SLOTS ||
      !Number.isInteger(move.at) || move.at < 0 || move.at > FLOWER_DURATION_MS ||
      move.at < previousAt || move.at > now - session.start_at_ms + 2_000 ||
      !FLOWER_COLORS.some(color => color.id === move.color) || !FLOWER_SHAPES.some(shape => shape.id === move.shape)) return null
    picks[move.index] = { color: move.color, shape: move.shape }
    previousAt = move.at
  }
  if (picks.some(pick => pick === null)) return null
  const score = scoreFlowers(flowerTarget(session.seed), picks, Math.max(0, session.deadline_ms - now))
  const rank = rankFor(score)
  return { score, rank: rank.rank, tokens: rank.tokens, festivalExp: rank.exp }
}
