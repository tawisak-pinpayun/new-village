import test from 'node:test'
import assert from 'node:assert/strict'
import { GIFT_TYPES, giftDeck, replayGiftMoves, scoreGiftMatch } from '../src/mini-games/gift-match.mjs'
import { GiftMatchSession } from '../src/mini-games/gift-session.mjs'
import { activeFriendshipOccurrence, validateGiftResult } from '../server/gift-match.mjs'
import { WORLD_DAY_MS } from '../server/world-clock.mjs'

const epoch = Date.UTC(2026, 0, 1)
const friendMorning = epoch + 13 * WORLD_DAY_MS + 4 * 60_000

function perfectMoves(deck) {
  const moves = []
  for (let pair = 0; pair < GIFT_TYPES.length; pair++) {
    const indices = deck.map((id, index) => id === GIFT_TYPES[pair].id ? index : -1).filter(index => index >= 0)
    moves.push({ index: indices[0], at: pair * 1000 + 100 }, { index: indices[1], at: pair * 1000 + 200 })
  }
  return moves
}

test('gift deck has six deterministic pairs', () => {
  const first = giftDeck(123)
  assert.deepEqual(first, giftDeck(123))
  assert.notDeepEqual(first, giftDeck(124))
  for (const gift of GIFT_TYPES) assert.equal(first.filter(id => id === gift.id).length, 2)
})

test('gift replay rejects premature flips and scores completed pairs', () => {
  const deck = giftDeck(123)
  const moves = perfectMoves(deck)
  assert.deepEqual(replayGiftMoves(deck, moves), { matched: 12, mistakes: 0, pending: false })
  assert.equal(replayGiftMoves(deck, [{ index: 0, at: 100 }, { index: 0, at: 200 }]), null)
  const different = deck.findIndex(id => id !== deck[0])
  assert.equal(replayGiftMoves(deck, [{ index: 0, at: 100 }, { index: different, at: 200 }, { index: 1, at: 300 }]), null)
  assert.equal(scoreGiftMatch(0, 45_000), 1000)
  assert.ok(scoreGiftMatch(3, 20_000) < 1000)
  const game = { seed: 123, start_at_ms: 1000, deadline_ms: 46_000 }
  assert.equal(validateGiftResult(game, moves, 8000)?.rank, 'S')
  assert.equal(validateGiftResult(game, moves, 8000)?.tokens, 0)
  assert.equal(validateGiftResult(game, moves.slice(0, -2), 8000), null)
  assert.equal(validateGiftResult(game, moves, 50_000), null)
})

test('friendship reward window uses the server clock', () => {
  assert.equal(activeFriendshipOccurrence(friendMorning, epoch), 'friendship:1')
  assert.equal(activeFriendshipOccurrence(epoch + 13 * WORLD_DAY_MS, epoch), null)
  assert.equal(activeFriendshipOccurrence(epoch + 14 * WORLD_DAY_MS, epoch), null)
  assert.equal(activeFriendshipOccurrence(friendMorning + 112 * WORLD_DAY_MS, epoch), 'friendship:2')
})

test('gift session pauses practice, hides mismatches and completes all pairs', () => {
  const game = new GiftMatchSession(123)
  game.initialize()
  game.start(0)
  assert.equal(game.flip(0, 2000), false)
  game.update(3000)
  assert.equal(game.pause(3500), true)
  assert.equal(game.flip(0, 4000), false)
  assert.equal(game.resume(4500), true)
  let now = 5000
  for (const move of perfectMoves(game.deck)) {
    now += 50
    assert.equal(game.flip(move.index, now), true)
  }
  assert.equal(game.state, 'completed')
  assert.equal(game.matched.size, 12)
  assert.ok(game.score > 0)
})
