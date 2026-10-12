import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarAt } from '../src/calendar.ts'
import { DAY_MS, KEY, dayNumber, initialState, isRaining, load } from '../src/domain.ts'
import { advanceWorld, makeWorld, publicWorld } from '../server/world.mjs'

test('a day lasts 24 minutes and cycles through five seasons including rain', () => {
  assert.equal(DAY_MS, 24 * 60_000)
  assert.deepEqual([1, 7, 8, 15, 22, 29, 36].map(day => calendarAt(day, 0).season.name),
    ['ใบไม้ผลิ', 'ใบไม้ผลิ', 'ร้อน', 'ฝน', 'ใบไม้ร่วง', 'หนาว', 'ใบไม้ผลิ'])
  assert.equal(calendarAt(8, 0).dayInSeason, 1)
  assert.equal(isRaining(15), true)
  assert.equal(isRaining(16), true)
  assert.equal(isRaining(9), false)
})

test('sunlight fades at sunset and returns before morning', () => {
  const morning = calendarAt(1, 0)
  const sunset = calendarAt(1, .5)
  const night = calendarAt(1, .75)
  assert.deepEqual([morning.hour, morning.minute, morning.darkness], [6, 0, .58 / 3])
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
    assert.equal(state.calendarVersion, 2)
    assert.equal(dayNumber(state, now), 4)
    const progress = (now - state.dayStartedAt) % DAY_MS / DAY_MS
    assert.ok(Math.abs(progress - .5) < .001)
  } finally { globalThis.localStorage = previousStorage }
})

test('shared world changes day after exactly 24 minutes and includes server time', () => {
  const world = makeWorld()
  const boundary = (world.day + 1) * DAY_MS
  world.lastTick = boundary - 1
  advanceWorld(world, boundary - 1)
  assert.equal(world.day, Math.floor((boundary - 1) / DAY_MS))
  advanceWorld(world, boundary)
  assert.equal(world.day, Math.floor(boundary / DAY_MS))
  assert.ok(Number.isFinite(publicWorld(world).serverNow))
})
