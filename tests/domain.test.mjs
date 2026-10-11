import test from 'node:test'
import assert from 'node:assert/strict'
import { add, canAdd, count, DAY_MS, initialState, isRaining, refreshGrowth, remove, validate } from '../src/domain.ts'

test('inventory never removes missing items or exceeds a full stack', () => {
  const save = initialState()
  assert.equal(remove(save, 'radish'), false)
  assert.equal(count(save, 'radish_seed'), 3)
  const seeds = save.inventory.find(item => item.itemId === 'radish_seed')
  seeds.quantity = 99
  assert.equal(canAdd(save, 'radish_seed'), false)
  assert.equal(add(save, 'radish_seed'), false)
  assert.equal(count(save, 'radish_seed'), 99)
})

test('rain waters a newly planted crop and offline time makes it ready', () => {
  const save = initialState()
  save.dayStartedAt = 1_000
  save.lastProcessedDay = 5
  save.plots[0].state = 'PLANTED'
  save.plots[0].cropId = 'radish'
  const rainTime = 1_000 + 4 * DAY_MS
  assert.equal(isRaining(5), true)
  assert.equal(refreshGrowth(save, rainTime), true)
  assert.equal(save.plots[0].state, 'GROWING')
  assert.equal(refreshGrowth(save, rainTime + 60_001), true)
  assert.equal(save.plots[0].state, 'READY')
  assert.equal(validate(save), true)
})

test('unwatered planted crop withers after three dry days', () => {
  const save = initialState()
  save.dayStartedAt = 1_000
  save.lastProcessedDay = 1
  save.plots[0].state = 'PLANTED'
  save.plots[0].cropId = 'radish'
  refreshGrowth(save, 1_000 + 3 * DAY_MS)
  assert.equal(save.plots[0].state, 'WITHERED')
  assert.equal(save.plots[0].cropId, null)
  assert.equal(validate(save), true)
})
