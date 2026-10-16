export const GIFT_TYPES = [
  { id: 'flower', label: 'ดอกไม้', color: '#ce5c68' },
  { id: 'cake', label: 'ขนม', color: '#d59a56' },
  { id: 'book', label: 'หนังสือ', color: '#7a9abf' },
  { id: 'ribbon', label: 'ริบบิ้น', color: '#b681b5' },
  { id: 'tea', label: 'น้ำชา', color: '#80a578' },
  { id: 'charm', label: 'เครื่องราง', color: '#bcaa64' }
]
export const GIFT_DURATION_MS = 45_000

export function giftDeck(seed) {
  let value = (Number(seed) >>> 0) || 1
  const next = () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; value >>>= 0; return value }
  const deck = GIFT_TYPES.flatMap(gift => [gift.id, gift.id])
  for (let index = deck.length - 1; index > 0; index--) {
    const other = next() % (index + 1)
    ;[deck[index], deck[other]] = [deck[other], deck[index]]
  }
  return deck
}

export function replayGiftMoves(deck, moves) {
  if (!Array.isArray(deck) || deck.length !== 12 || !Array.isArray(moves)) return null
  const matched = new Set()
  let first = -1, mistakes = 0
  let previousAt = -1, mismatchAt = -1
  for (const move of moves) {
    if (!move || !Number.isInteger(move.index) || move.index < 0 || move.index >= deck.length ||
      !Number.isInteger(move.at) || move.at < previousAt || (mismatchAt >= 0 && move.at < mismatchAt + 500) ||
      matched.has(move.index) || move.index === first) return null
    previousAt = move.at
    if (first < 0) { first = move.index; continue }
    if (deck[first] === deck[move.index]) { matched.add(first); matched.add(move.index) }
    else { mistakes++; mismatchAt = move.at }
    first = -1
  }
  return { matched: matched.size, mistakes, pending: first >= 0 }
}

export function scoreGiftMatch(mistakes, remainingMs, durationMs = GIFT_DURATION_MS) {
  return Math.max(0, Math.min(1000, 600 + Math.max(0, 200 - mistakes * 25) + Math.round(Math.max(0, Math.min(durationMs, remainingMs)) / durationMs * 200)))
}
