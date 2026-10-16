import { GIFT_DURATION_MS, giftDeck, replayGiftMoves, scoreGiftMatch } from '../src/mini-games/gift-match.mjs'
import { rankFor } from '../src/mini-games/session.mjs'
import { worldDay, worldProgress } from './world-clock.mjs'

export function activeFriendshipOccurrence(now, epochMs) {
  const day = worldDay(now, epochMs)
  const dayOfYear = (day - 1) % 112
  const hour = (6 + worldProgress(now, epochMs) * 24) % 24
  if (dayOfYear !== 13 || hour < 9 || hour >= 20) return null
  return `friendship:${Math.floor((day - 1) / 112) + 1}`
}

export function validateGiftResult(session, moves, now) {
  if (!session || !Number.isFinite(session.start_at_ms) || !Number.isFinite(session.deadline_ms) ||
    now < session.start_at_ms || now > session.deadline_ms + 3_000 || !Array.isArray(moves) || moves.length > 48) return null
  if (moves.some(move => !Number.isInteger(move?.at) || move.at < 0 || move.at > GIFT_DURATION_MS || move.at > now - session.start_at_ms + 2_000)) return null
  const replay = replayGiftMoves(giftDeck(session.seed), moves)
  if (!replay || replay.matched !== 12 || replay.pending) return null
  const score = scoreGiftMatch(replay.mistakes, Math.max(0, session.deadline_ms - now))
  const rank = rankFor(score)
  return { score, rank: rank.rank, tokens: 0, festivalExp: 0, friendshipExp: rank.exp }
}
