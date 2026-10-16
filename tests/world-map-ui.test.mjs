import test from 'node:test'
import assert from 'node:assert/strict'
import { WORLD_MAP_LOCATIONS, renderWorldMap } from '../src/world-map.ts'
import { MAPS } from '../src/maps.ts'
import { initialState, validate } from '../src/domain.ts'

test('world map exposes nine distinct playable destinations', () => {
  assert.equal(WORLD_MAP_LOCATIONS.length, 9)
  assert.equal(new Set(WORLD_MAP_LOCATIONS.map(location => location.id)).size, 9)
  for (const location of WORLD_MAP_LOCATIONS) {
    assert.ok(MAPS[location.destination], `${location.destination} is playable`)
    assert.ok(location.x >= 0 && location.x <= 100)
    assert.ok(location.y >= 0 && location.y <= 100)
  }
  const save = initialState()
  save.player.mapId = 'city'
  save.player.x = MAPS.city.spawn.x
  save.player.y = MAPS.city.spawn.y
  assert.equal(validate(save), true)
})

test('map markers remain separate from the illustrated background', () => {
  const html = renderWorldMap('village', [{ name: 'เพื่อน', mapId: 'farm' }], 'ผู้เล่น')
  assert.match(html, /world-map-art/)
  assert.equal((html.match(/data-world-location=/g) ?? []).length, 9)
  assert.match(html, /world-person-self/)
  assert.match(html, /world-person-friend/)
})

test('fast travel is available only from the magic city altar', () => {
  const altars = Object.values(MAPS).flatMap(map => map.interactions.filter(interaction => interaction.kind === 'warp').map(interaction => ({ map: map.id, interaction })))
  assert.equal(altars.length, 1)
  assert.equal(altars[0].map, 'magic_city')
  assert.equal(altars[0].interaction.id, 'grand-warp-altar')
})
