import { DANCE_DURATION_MS, DANCE_HIT_WINDOW_MS, danceChart, scoreDance } from '../src/mini-games/dance.mjs'
import { rankFor } from '../src/mini-games/session.mjs'
import { worldDay, worldProgress } from './world-clock.mjs'

export function activeDanceOccurrence(now, epochMs) {
  const day = worldDay(now, epochMs)
  const dayOfYear = (day - 1) % 112
  const hour = (6 + worldProgress(now, epochMs) * 24) % 24
  if (dayOfYear !== 27 || hour < 17 || hour >= 23) return null
  return `spring_dance:${Math.floor((day - 1) / 112) + 1}`
}

export function validDanceHit(session, noteIndex, lane, now) {
  if (!session || !Number.isInteger(noteIndex) || !Number.isInteger(lane) || lane < 0 || lane > 3 ||
    !Number.isFinite(session.start_at_ms) || now < session.start_at_ms || now > session.deadline_ms) return null
  const note = danceChart(session.seed)[noteIndex]
  if (!note || Math.abs(now - session.start_at_ms - note.at) > DANCE_HIT_WINDOW_MS) return null
  return { lane, at: now - session.start_at_ms }
}

export function validateDanceResult(session, now) {
  if (!session || !Number.isFinite(session.start_at_ms) || !Number.isFinite(session.deadline_ms) ||
    now < session.start_at_ms + DANCE_DURATION_MS || now > session.deadline_ms + 30_000) return null
  const result = scoreDance(danceChart(session.seed), session.hits ?? {})
  // Empty sessions cannot farm the baseline rank reward.
  if (Object.keys(session.hits ?? {}).length < 8 || result.score < 200) return null
  const rank = rankFor(result.score)
  return { ...result, rank: rank.rank, tokens: rank.tokens, festivalExp: rank.exp }
}
