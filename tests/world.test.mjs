import test from 'node:test'
import assert from 'node:assert/strict'
import { actPlot, advanceWorld, hitMonster, hitResource, makeWorld, publicWorld, RESOURCES } from '../server/world.mjs'
import { MAPS } from '../src/maps.ts'
import { DEFAULT_WORLD_EPOCH_MS, WORLD_DAY_MS } from '../server/world-clock.mjs'

test('server resource definitions match every illustrated resource', () => {
  for (const map of Object.values(MAPS)) for (const node of map.resources ?? []) {
    const shared = RESOURCES.get(node.id)
    assert.deepEqual([shared?.mapId, shared?.x, shared?.y, shared?.kind, shared?.hp], [map.id, node.x, node.y, node.kind, node.hp])
  }
})

test('two players cannot collect the same shared resource twice', () => {
  const world = makeWorld(), player = { mapId: 'farm', x: 425, y: 845 }
  const first = hitResource(world, player, 'farm-grass-1', 1)
  const second = hitResource(world, player, 'farm-grass-1', 1)
  assert.equal(first.defeated, true)
  assert.equal(second.ok, false)
  assert.equal(publicWorld(world).nodeHp['farm-grass-1'], 0)
})

test('farm plots have one authoritative growth and harvest state', () => {
  const now = DEFAULT_WORLD_EPOCH_MS + WORLD_DAY_MS + 120_000
  const world = makeWorld(now), player = { mapId: 'farm', x: 610, y: 540 }
  assert.equal(actPlot(world, player, 0, 'till', undefined, now).ok, true)
  assert.equal(actPlot(world, player, 0, 'till', undefined, now).ok, false)
  assert.equal(actPlot(world, player, 0, 'plant', 'radish', now).ok, true)
  assert.equal(actPlot(world, player, 0, 'water', undefined, now).ok, true)
  advanceWorld(world, now + 60_001)
  assert.equal(world.plots[0].state, 'READY')
  assert.equal(actPlot(world, player, 0, 'harvest', undefined, now + 60_001).crop, 'radish')
  assert.equal(actPlot(world, player, 0, 'harvest', undefined, now + 60_001).ok, false)
})

test('a shared monster can be defeated only once', () => {
  const world = makeWorld(), monster = world.monsters.mine[0]
  const player = { mapId: 'mine', x: monster.x, y: monster.y }
  assert.equal(hitMonster(world, player, monster.id, 5).defeated, true)
  assert.equal(hitMonster(world, player, monster.id, 5).ok, false)
})

test('shared world exposes the garden gate and campfires', () => {
  const world = makeWorld()
  assert.equal(publicWorld(world).gardenGateOpen, false)
  assert.deepEqual(publicWorld(world).campfires, [])
  world.gardenGateOpen = true
  world.campfires.push({ mapId: 'farm', x: 600, y: 820 })
  assert.equal(publicWorld(world).gardenGateOpen, true)
  assert.deepEqual(publicWorld(world).campfires, [{ mapId: 'farm', x: 600, y: 820 }])
})

test('a rainy day waters crops planted in a shared room', () => {
  const now = DEFAULT_WORLD_EPOCH_MS + WORLD_DAY_MS + 18 * 60_000
  const world = makeWorld(now), player = { mapId: 'farm', x: 610, y: 540 }
  assert.equal(actPlot(world, player, 0, 'till', undefined, now).ok, true)
  assert.equal(actPlot(world, player, 0, 'plant', 'radish', now).ok, true)
  assert.equal(world.plots[0].state, 'GROWING')
  assert.equal(world.plots[0].readyAt, now + 60_000)
})
