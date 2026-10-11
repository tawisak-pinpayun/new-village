import test from 'node:test'
import assert from 'node:assert/strict'
import { add, canAdd, count, DAY_MS, initialState, isRaining, refreshGrowth, remove, validate } from '../src/domain.ts'
import { collisionTiles, MAPS, TILE } from '../src/maps.ts'

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

test('market seeds and crops survive save validation and market has return route', () => {
  const save = initialState()
  save.player.mapId = 'market'
  assert.equal(add(save, 'carrot_seed'), true)
  assert.equal(add(save, 'tomato_seed'), true)
  assert.equal(count(save, 'carrot_seed'), 1)
  assert.equal(save.hotbarExtras.includes('carrot_seed'), true)
  save.plots[0].state = 'READY'
  save.plots[0].cropId = 'carrot'
  assert.equal(validate(save), true)
  assert.equal(MAPS.village.interactions.find(i => i.id === 'market').destination, 'market')
  assert.equal(MAPS.market.interactions.find(i => i.id === 'to-village').destination, 'village')
})

test('market entrance, stalls and exit are reachable on walkable tiles', () => {
  const grid = collisionTiles(MAPS.market)
  const start = [Math.floor(1280 / TILE), Math.floor(520 / TILE)]
  const queue = [start]
  const seen = new Set([start.join(',')])
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index]
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nextX = x + dx, nextY = y + dy, key = `${nextX},${nextY}`
      if (grid[nextY]?.[nextX] !== 0 || seen.has(key)) continue
      seen.add(key); queue.push([nextX, nextY])
    }
  }
  for (const point of [[1385, 520], [555, 285], [1050, 380]]) {
    assert.equal(seen.has(`${Math.floor(point[0] / TILE)},${Math.floor(point[1] / TILE)}`), true)
  }
})

test('riverside and mine doors connect, equipment and loot survive saves', () => {
  const save = initialState()
  for (const item of ['sword', 'bow', 'meat', 'copper']) assert.equal(add(save, item), true)
  save.player.mapId = 'mine'
  assert.equal(validate(save), true)
  assert.equal(MAPS.village.interactions.find(i => i.id === 'river').destination, 'riverside')
  assert.equal(MAPS.riverside.interactions.find(i => i.id === 'to-mine').destination, 'mine')
  assert.equal(MAPS.mine.interactions.find(i => i.id === 'to-riverside').destination, 'riverside')
  save.nodeHp['river-rabbit-1'] = 0
  save.dayStartedAt = 1_000; save.lastProcessedDay = 1
  refreshGrowth(save, 1_000 + DAY_MS)
  assert.equal(save.nodeHp['river-rabbit-1'], undefined)
})

test('riverside cave and mine ores can be reached by walking', () => {
  for (const [mapId, points] of [
    ['riverside', [[1320, 155], [355, 530], [535, 250], [675, 740]]],
    ['mine', [[770, 895], [390, 410], [1140, 690], [625, 580], [1125, 370], [360, 715]]]
  ]) {
    const map = MAPS[mapId], grid = collisionTiles(map)
    const start = [Math.floor(map.spawn.x / TILE), Math.floor(map.spawn.y / TILE)]
    const queue = [start], seen = new Set([start.join(',')])
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i]
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, key = `${nx},${ny}`
        if (grid[ny]?.[nx] !== 0 || seen.has(key)) continue
        seen.add(key); queue.push([nx, ny])
      }
    }
    for (const [x, y] of points) {
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE)
      let reachable = false
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (seen.has(`${tx + dx},${ty + dy}`)) reachable = true
      assert.equal(reachable, true, `${mapId} ${x},${y}`)
    }
  }
})
