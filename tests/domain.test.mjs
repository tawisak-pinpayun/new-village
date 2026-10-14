import test from 'node:test'
import assert from 'node:assert/strict'
import { add, canAdd, CHARACTER_IDS, characterQuestProgress, count, craftArcaneSword, DAY_MS, eat, equipmentStats, gainXp, initialState, isRaining, maxHp, maxMana, OUTFIT_IDS, rareDrop, refreshGrowth, remove, unlockCompletedCharacters, validate } from '../src/domain.ts'

test('characters C through H unlock from their own quests and stay unlocked', () => {
  const save = initialState()
  assert.deepEqual(save.unlockedCharacters, ['a', 'b'])
  save.questDone = true
  save.player.coins = 120
  save.player.level = 3
  save.gardenGateOpen = true
  add(save, 'arcane_sword')
  save.festival.completed = true
  assert.equal(characterQuestProgress(save, 'd'), 120)
  assert.deepEqual(unlockCompletedCharacters(save), ['c', 'd', 'e', 'f', 'g', 'h'])
  save.player.coins = 0
  remove(save, 'arcane_sword')
  assert.deepEqual(unlockCompletedCharacters(save), [])
  assert.deepEqual(save.unlockedCharacters, CHARACTER_IDS)
  assert.equal(validate(save), true)
})

test('new characters and outfits survive save validation', () => {
  for (const character of CHARACTER_IDS) {
    const save = initialState()
    save.character = character
    assert.equal(validate(save), true)
  }
  for (const outfit of OUTFIT_IDS) {
    const save = initialState()
    save.outfit = outfit
    save.ownedOutfits.push(outfit)
    assert.equal(validate(save), true)
  }
  const save = initialState()
  save.outfit = 'explorer'
  assert.equal(equipmentStats(save).speed, 18)
  save.outfit = 'starlight'
  assert.equal(maxMana(save), 68)
  save.outfit = 'ceremonial'
  assert.equal(equipmentStats(save).defense, 2)
})

test('new animal and furniture products survive save validation', () => {
  const save = initialState()
  for (const item of ['animal_feed', 'pet_basket', 'carved_chair', 'flower_table']) add(save, item)
  assert.equal(validate(JSON.parse(JSON.stringify(save))), true)
  for (const item of ['animal_feed', 'pet_basket', 'carved_chair', 'flower_table']) assert.equal(count(save, item), 1)
})

test('owned clothing and accessories change stats and survive save validation', () => {
  const save = initialState()
  save.ownedOutfits.push('mage')
  save.outfit = 'mage'
  save.ownedGear.push('wizard_hat', 'moon_amulet', 'cloud_boots')
  save.equipped = { hat: 'wizard_hat', necklace: 'moon_amulet', boots: 'cloud_boots' }
  assert.deepEqual(equipmentStats(save), { hp: 0, mana: 37, attack: 1, defense: 0, speed: 35 })
  assert.equal(maxMana(save), 87)
  assert.equal(validate(save), true)
  save.equipped.hat = 'flower_hat'
  assert.equal(validate(save), false)
})

test('bracelet and charm occupy separate slots and add their bonuses', () => {
  const save = initialState()
  save.ownedGear.push('gold_bracelet', 'crystal_charm')
  save.equipped = { bracelet: 'gold_bracelet', charm: 'crystal_charm' }
  assert.equal(maxHp(save), 108)
  assert.equal(maxMana(save), 65)
  assert.equal(equipmentStats(save).speed, 15)
  assert.equal(validate(save), true)
  save.equipped.bracelet = 'crystal_charm'
  assert.equal(validate(save), false)
})
import { collisionTiles, MAPS, TILE } from '../src/maps.ts'
import { monstersFor } from '../src/monsters.ts'

test('save from a player touching the world edge remains recoverable', () => {
  const save = initialState()
  save.player.mapId = 'riverside'
  save.player.x = 11.96
  save.player.level = 3
  save.player.coins = 307
  assert.equal(validate(save), true)
  save.player.x = -1
  assert.equal(validate(save), false)
})

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

test('magic city connects below the market and its shops are walkable', () => {
  assert.equal(MAPS.market.interactions.find(i => i.id === 'to-magic-city').destination, 'magic_city')
  assert.equal(MAPS.magic_city.interactions.find(i => i.id === 'to-market').destination, 'market')
  const map = MAPS.magic_city, grid = collisionTiles(map)
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
  for (const [x, y] of [[635, 290], [905, 290], [770, 850]]) {
    assert.equal(seen.has(`${Math.floor(x / TILE)},${Math.floor(y / TILE)}`), true)
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

test('levels, health, mana, food and crafting work with saved inventory', () => {
  const save = initialState()
  assert.equal(gainXp(save, 60), true)
  assert.equal(save.player.level, 2)
  assert.equal(save.player.hp, maxHp(save))
  assert.equal(save.player.mana, maxMana(save))
  save.player.hp -= 35; save.player.mana -= 25; save.player.energy -= 40
  add(save, 'rice_meal'); add(save, 'mana_potion')
  assert.equal(eat(save, 'rice_meal'), true)
  assert.equal(save.player.hp, maxHp(save) - 7)
  assert.equal(save.player.energy, 90)
  assert.equal(eat(save, 'mana_potion'), true)
  assert.equal(save.player.mana, maxMana(save))
  add(save, 'iron'); add(save, 'iron'); add(save, 'moonstone')
  assert.equal(craftArcaneSword(save), true)
  assert.equal(count(save, 'arcane_sword'), 1)
  assert.equal(count(save, 'moonstone'), 0)
  assert.equal(validate(save), true)
})

test('saves made before the new stats remain valid', () => {
  const oldSave = initialState()
  delete oldSave.player.hp; delete oldSave.player.mana; delete oldSave.player.xp; delete oldSave.player.level
  delete oldSave.outfit; delete oldSave.ownedOutfits; delete oldSave.mounted
  assert.equal(validate(oldSave), true)
})

test('three mine floors have doors, resources and reproducible random monsters', () => {
  for (const mapId of ['mine', 'mine2', 'mine3']) {
    assert.ok(MAPS[mapId].resources.length)
    const monsters = monstersFor(mapId, 12345)
    assert.equal(monsters.length, mapId === 'mine3' ? 5 : mapId === 'mine2' ? 4 : 3)
    assert.deepEqual(monsters, monstersFor(mapId, 12345))
    assert.ok(monsters.every(monster => monster.hp <= 9))
  }
  assert.equal(MAPS.mine.interactions.find(i => i.id === 'to-mine2').destination, 'mine2')
  assert.equal(MAPS.mine2.interactions.find(i => i.id === 'to-mine3').destination, 'mine3')
  assert.equal(rareDrop(1, .06), true)
  assert.equal(rareDrop(3, .29), true)
  assert.equal(rareDrop(3, .31), false)
  assert.equal(MAPS.market.interactions.some(i => i.kind === 'tailor'), true)
  assert.equal(MAPS.market.interactions.some(i => i.kind === 'magic_shop'), true)
})

test('mine objects and monsters line up with reachable collision tiles on every floor', () => {
  for (const mapId of ['mine', 'mine2', 'mine3']) {
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
    for (const target of [...map.resources, ...map.interactions, ...monstersFor(mapId, 12345)]) {
      const tx = Math.floor(target.x / TILE), ty = Math.floor(target.y / TILE)
      let reachable = false
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (seen.has(`${tx + dx},${ty + dy}`)) reachable = true
      assert.equal(reachable, true, `${mapId} ${target.id}`)
    }
  }
})
