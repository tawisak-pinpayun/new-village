export const FISHING_ROUNDS = 5
export const FISHING_ROUND_MS = 4_000
export const FISHING_DURATION_MS = FISHING_ROUNDS * FISHING_ROUND_MS
export const TOURNAMENT_FISH = ['ปลากระบอกแดดอุ่น', 'ปลาปะการังรุ้ง', 'ทูน่าพายุ', 'กระเบนไข่มุก', 'ปลามงกุฎกัปตัน']

export function tournamentFish(seed, round) {
  return TOURNAMENT_FISH[(Math.imul(seed >>> 0, 1664525) + round * 1013904223 >>> 0) % TOURNAMENT_FISH.length]
}

export function tournamentPosition(elapsed, round) {
  const withinRound = elapsed - round * FISHING_ROUND_MS
  return (Math.sin(withinRound / 420 + round * .65) + 1) * 50
}

export function tournamentPoints(elapsed, round) {
  if (!Number.isInteger(round) || round < 0 || round >= FISHING_ROUNDS || elapsed < round * FISHING_ROUND_MS || elapsed >= (round + 1) * FISHING_ROUND_MS) return 0
  const error = Math.abs(tournamentPosition(elapsed, round) - 50)
  return error <= 15 ? Math.round(200 - error * 8) : 0
}

export function scoreTournament(hits) {
  return Array.from({ length: FISHING_ROUNDS }, (_, round) => tournamentPoints(hits?.[round]?.at ?? -1, round)).reduce((sum, points) => sum + points, 0)
}
