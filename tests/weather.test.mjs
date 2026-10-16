import test from 'node:test'
import assert from 'node:assert/strict'
import { isRainWeather, WEATHER_TYPES, weatherAt, weatherAtTime } from '../src/weather.mjs'
import { DEFAULT_WORLD_EPOCH_MS, WORLD_DAY_MS } from '../server/world-clock.mjs'
import { actPlot, advanceWorld, makeWorld } from '../server/world.mjs'

test('weather is deterministic, seasonal and advances every six real minutes', () => {
  for (const day of [1, 29, 57, 85, 113]) {
    assert.deepEqual(weatherAt(day, 0), weatherAt(day, 0))
    assert.ok(WEATHER_TYPES.includes(weatherAt(day, 2).type))
  }
  assert.equal(weatherAt(1, 0).season, 'spring')
  assert.equal(weatherAt(29, 0).season, 'summer')
  assert.equal(weatherAt(57, 0).season, 'autumn')
  assert.equal(weatherAt(85, 0).season, 'winter')
  const before = weatherAtTime(DEFAULT_WORLD_EPOCH_MS + WORLD_DAY_MS / 4 - 1, DEFAULT_WORLD_EPOCH_MS)
  const after = weatherAtTime(DEFAULT_WORLD_EPOCH_MS + WORLD_DAY_MS / 4, DEFAULT_WORLD_EPOCH_MS)
  assert.equal(before.slot, 0)
  assert.equal(after.slot, 1)
  assert.equal(before.nextAt, DEFAULT_WORLD_EPOCH_MS + WORLD_DAY_MS / 4)
})

test('shared crop receives water at an authoritative rain transition', () => {
  const epoch = DEFAULT_WORLD_EPOCH_MS
  const rain = [0, 1, 2, 3].find(slot => isRainWeather(weatherAt(2, slot).type))
  assert.equal(rain, 3)
  const start = epoch + WORLD_DAY_MS + (rain - 1) * WORLD_DAY_MS / 4
  const world = makeWorld(start)
  const player = { mapId: 'farm', x: 610, y: 540 }
  assert.equal(actPlot(world, player, 0, 'till', undefined, start).ok, true)
  assert.equal(actPlot(world, player, 0, 'plant', 'radish', start).ok, true)
  assert.equal(world.plots[0].state, 'PLANTED')
  advanceWorld(world, epoch + WORLD_DAY_MS + rain * WORLD_DAY_MS / 4)
  assert.equal(world.plots[0].state, 'GROWING')
  assert.equal(world.weather.slot, rain)
})
