import { FISHING_DURATION_MS, FISHING_ROUNDS, scoreTournament } from '../src/mini-games/fishing-tournament.mjs'
import { rankFor } from '../src/mini-games/session.mjs'
import { worldDay, worldProgress } from './world-clock.mjs'

export function activeBeachOccurrence(now, epochMs) {
  const day = worldDay(now, epochMs)
  const dayOfYear = (day - 1) % 112
  const hour = (6 + worldProgress(now, epochMs) * 24) % 24
  if (dayOfYear !== 34 || hour < 8 || hour >= 18) return null
  return `beach:${Math.floor((day - 1) / 112) + 1}`
}

export function validFishingHit(session, round, now) {
  if (!session || !Number.isInteger(round) || round < 0 || round >= FISHING_ROUNDS || !Number.isFinite(session.start_at_ms)) return null
  const elapsed = now - session.start_at_ms
  if (elapsed < round * 4_000 || elapsed >= (round + 1) * 4_000 || now > session.deadline_ms) return null
  return { at: elapsed }
}

export function validateFishingResult(session, now) {
  if (!session || !Number.isFinite(session.start_at_ms) || now < session.start_at_ms + FISHING_DURATION_MS || now > session.deadline_ms + 30_000) return null
  if (Object.keys(session.hits ?? {}).length < 2) return null
  const score = scoreTournament(session.hits)
  if (score < 200) return null
  const rank = rankFor(score)
  return { score, rank: rank.rank, tokens: rank.tokens, festivalExp: rank.exp }
}
