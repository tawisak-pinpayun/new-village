import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarAt, DAYS_PER_SEASON, DAYS_PER_YEAR } from '../src/calendar.ts'
import { DAY_MS, KEY, dayNumber, initialState, isRaining, load } from '../src/domain.ts'
import { advanceWorld, makeWorld, publicWorld } from '../server/world.mjs'
import { DEFAULT_WORLD_EPOCH_MS, worldDay, worldProgress } from '../server/world-clock.mjs'

test('a day lasts 24 minutes; four 28-day seasons form a 112-day year', () => {
  assert.equal(DAY_MS, 24 * 60_000)
  assert.equal(DAYS_PER_SEASON, 28)
  assert.equal(DAYS_PER_YEAR, 112)
  assert.deepEqual([1, 28, 29, 56, 57, 85, 113].map(day => calendarAt(day, 0).season.name),
    ['ใบไม้ผลิ', 'ใบไม้ผลิ', 'ร้อน', 'ร้อน', 'ใบไม้ร่วง', 'หนาว', 'ใบไม้ผลิ'])
  assert.deepEqual([calendarAt(28, 0).dayInSeason, calendarAt(29, 0).dayInSeason, calendarAt(112, 0).year, calendarAt(113, 0).year], [28, 1, 1, 2])
  assert.equal(calendarAt(8, 0).weekday, 'จันทร์')
  assert.equal(isRaining(15), true)
  assert.equal(isRaining(16), false)
})

test('sunlight fades at sunset and returns before morning', () => {
  const morning = calendarAt(1, 0)
  const sunset = calendarAt(1, .5)
  const night = calendarAt(1, .75)
  assert.equal(morning.hour, 6)
  assert.equal(morning.minute, 0)
  assert.ok(morning.darkness > 0 && morning.darkness < .58)
  assert.equal(sunset.hour, 18)
  assert.ok(sunset.darkness > 0 && sunset.darkness < night.darkness)
  assert.equal(night.hour, 0)
  assert.equal(night.darkness, .58)
  assert.equal(night.night, true)
})

test('old saves retain their day and progress when moved to 24-minute days', () => {
  const now = Date.now()
  const oldSave = initialState()
  delete oldSave.calendarVersion
  oldSave.dayStartedAt = now - (3 * 120_000 + 60_000)
  const previousStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: key => key === KEY ? JSON.stringify(oldSave) : null }
  try {
    const { state, error } = load()
    assert.equal(error, undefined)
    assert.equal(state.calendarVersion, 3)
    assert.equal(dayNumber(state, now), 4)
    const progress = (now - state.dayStartedAt) % DAY_MS / DAY_MS
    assert.ok(Math.abs(progress - .5) < .001)
  } finally { globalThis.localStorage = previousStorage }
})

test('shared world changes day after exactly 24 minutes and includes durable epoch', () => {
  const epoch = DEFAULT_WORLD_EPOCH_MS
  const world = makeWorld(epoch + 3 * DAY_MS - 1, epoch)
  const boundary = epoch + 3 * DAY_MS
  world.lastTick = boundary - 1
  advanceWorld(world, boundary - 1)
  assert.equal(world.day, 3)
  advanceWorld(world, boundary)
  assert.equal(world.day, 4)
  assert.ok(Number.isFinite(publicWorld(world).serverNow))
  assert.equal(publicWorld(world).clock.epochMs, epoch)
  assert.equal(worldDay(boundary, epoch), 4)
  assert.equal(worldProgress(boundary, epoch), 0)
  assert.equal(makeWorld(boundary, epoch).day, 4)
})

test('version-two saves retain their day, character and coins on calendar migration', () => {
  const oldSave = initialState()
  oldSave.calendarVersion = 2
  oldSave.player.coins = 777
  oldSave.character = 'b'
  oldSave.dayStartedAt = Date.now() - 32 * DAY_MS
  const previousStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: key => key === KEY ? JSON.stringify(oldSave) : null }
  try {
    const { state, error } = load()
    assert.equal(error, undefined)
    assert.equal(state.calendarVersion, 3)
    assert.equal(state.player.coins, 777)
    assert.equal(state.character, 'b')
    assert.equal(dayNumber(state), 33)
    assert.equal(calendarAt(33, 0).season.name, 'ร้อน')
  } finally { globalThis.localStorage = previousStorage }
})
