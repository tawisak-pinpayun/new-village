import test from 'node:test'
import assert from 'node:assert/strict'
import { FLOWER_COLORS, FLOWER_DURATION_MS, FLOWER_SLOTS, flowerTarget, scoreFlowers } from '../src/mini-games/flower.mjs'
import { MiniGameSession, rankFor } from '../src/mini-games/session.mjs'

test('flower pattern is reproducible from a seed and always uses valid slots', () => {
  const first = flowerTarget(42)
  assert.deepEqual(first, flowerTarget(42))
  assert.equal(first.length, FLOWER_SLOTS)
  assert.notDeepEqual(first, flowerTarget(43))
  const seenColors = new Set(Array.from({ length: 64 }, (_, seed) => flowerTarget(seed + 1)).flat().map(pick => pick.color))
  assert.deepEqual(seenColors, new Set(FLOWER_COLORS.map(color => color.id)))
})

test('flower scoring rewards matching choices and stays within 0–1000', () => {
  const target = flowerTarget(808)
  const exact = scoreFlowers(target, target, FLOWER_DURATION_MS)
  const empty = scoreFlowers(target, Array(FLOWER_SLOTS).fill(null), 0)
  const wrong = target.map(pick => ({ color: pick.color === 'rose' ? 'sun' : 'rose', shape: pick.shape === 'round' ? 'star' : 'round' }))
  assert.equal(empty, 0)
  assert.ok(exact > scoreFlowers(target, wrong, FLOWER_DURATION_MS))
  assert.ok(exact <= 1000)
  assert.equal(rankFor(900)?.rank, 'S')
  assert.equal(rankFor(749)?.rank, 'B')
})

test('flower session counts down, accepts valid moves, pauses timer and finishes', () => {
  const game = new MiniGameSession(7)
  assert.equal(game.initialize(), true)
  assert.equal(game.start(1000), true)
  assert.equal(game.state, 'countdown')
  assert.equal(game.select(0, game.target[0], 2000), false)
  assert.equal(game.update(4000), 'playing')
  assert.equal(game.select(0, game.target[0], 4100), true)
  assert.equal(game.select(5, game.target[0], 4200), false)
  assert.equal(game.pause(5000), true)
  const pausedRemaining = game.remaining(10000)
  assert.equal(game.select(1, game.target[1], 10000), false)
  assert.equal(game.resume(10000), true)
  assert.equal(game.remaining(10000), pausedRemaining)
  assert.equal(game.select(1, game.target[1], 10100), true)
  assert.equal(game.finish(10200), true)
  assert.equal(game.state, 'completed')
  assert.equal(game.moves.length, 2)
  assert.equal(game.finish(10300), false)
  assert.ok(game.score > 0)
})

test('flower session times out and can be cancelled cleanly', () => {
  const timed = new MiniGameSession(99)
  timed.initialize()
  timed.start(0)
  assert.equal(timed.update(3000 + FLOWER_DURATION_MS), 'completed')
  assert.equal(timed.score, 0)
  const cancelled = new MiniGameSession(99)
  cancelled.initialize()
  assert.equal(cancelled.cancel(), true)
  assert.equal(cancelled.start(0), false)
  cancelled.cleanup()
  assert.equal(cancelled.moves.length, 0)
})
