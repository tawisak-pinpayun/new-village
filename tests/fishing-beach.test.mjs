import test from 'node:test'
import assert from 'node:assert/strict'
import { MAPS, collisionTiles, TILE } from '../src/maps.ts'
import { initialState, validate } from '../src/domain.ts'
import { calendarAt } from '../src/calendar.ts'
import { FISH, availableFish, fishingLevel, fishingProgress } from '../src/fishing.ts'
import { activeBeachOccurrence, validFishingHit, validateFishingResult } from '../server/fishing-tournament.mjs'
import { FISHING_DURATION_MS, scoreTournament, tournamentPoints } from '../src/mini-games/fishing-tournament.mjs'
import { SHOPS, NPCS } from '../src/shops.ts'
import { FISHING_ITEM_ASSETS } from '../src/ui/item-assets.ts'

test('beach landmarks and fishing points are reachable from village entrance', () => {
  const beach = MAPS.beach
  assert.equal(MAPS.village.interactions.find(target => target.id === 'to-beach')?.destination, 'beach')
  const grid = collisionTiles(beach)
  const start = [Math.floor(beach.spawn.x / TILE), Math.floor(beach.spawn.y / TILE)]
  const queue = [start], seen = new Set([start.join(',')])
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i]
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`
      if (nx >= 0 && ny >= 0 && ny < grid.length && nx < grid[0].length && !grid[ny][nx] && !seen.has(key)) { seen.add(key); queue.push([nx, ny]) }
    }
  }
  for (const target of beach.interactions) assert.ok(seen.has(`${Math.floor(target.x / TILE)},${Math.floor(target.y / TILE)}`), `${target.id} is reachable`)
})

test('fish availability follows night, rain and season while progress remains saveable', () => {
  const summerDay = calendarAt(35, .1)
  const summerNight = calendarAt(35, .72)
  assert.ok(!availableFish('beginner-pier', summerDay, 'clear').some(fish => fish.id === 'moon_shrimp'))
  assert.ok(availableFish('beginner-pier', summerNight, 'clear').some(fish => fish.id === 'moon_shrimp'))
  assert.ok(availableFish('beginner-pier', summerDay, 'rain').some(fish => fish.id === 'rain_eel'))
  assert.ok(!availableFish('shipwreck', summerDay, 'clear').some(fish => fish.id === 'winter_icefish'))
  assert.ok(availableFish('shipwreck', summerDay, 'clear').some(fish => fish.id === 'captains_crown'))
  assert.ok(!availableFish('shipwreck', summerDay, 'rain').some(fish => fish.id === 'thunder_marlin'))
  assert.ok(availableFish('shipwreck', summerDay, 'thunderstorm').some(fish => fish.id === 'thunder_marlin'))
  assert.equal(FISH.length, 14)
  for (const day of [1, 35, 70, 105]) {
    for (const time of [.1, .72]) {
      for (const weather of ['clear', 'rain', 'thunderstorm']) {
        for (const spot of ['beginner-pier', 'coral-reef', 'shipwreck']) {
          assert.ok(availableFish(spot, calendarAt(day, time), weather).length > 0, `${spot} day ${day} time ${time} weather ${weather}`)
        }
      }
    }
  }
  const save = initialState(); save.player.mapId = 'beach'; save.player.x = 160; save.player.y = 365
  const progress = fishingProgress(save); progress.xp = 185; progress.rod = 3; progress.caught.coral_fish = 2
  assert.equal(fishingLevel(progress.xp), 3)
  assert.equal(validate(save), true)
})

test('Nava shop links its NPC, products, beach materials and unique art', () => {
  const shop = SHOPS.fishing_shop
  assert.equal(shop.npcId, NPCS.nava.id)
  assert.equal(NPCS.nava.shopId, shop.id)
  assert.equal(NPCS.nava.dailySchedule[0].mapId, 'beach')
  assert.deepEqual(shop.serviceStock.map(product => product.id), ['bait', 'rod2', 'rod3'])
  assert.deepEqual(shop.materialSellPrices, { shells: 12, seaGlass: 20 })
  for (const key of ['rod1', 'rod2', 'rod3', 'bait', 'shells', 'seaGlass']) assert.equal(FISHING_ITEM_ASSETS[key].status, 'production')
  assert.match(shop.bannerAsset, /fishing-shop-header\.png$/)
  assert.match(shop.npcPortrait, /nava-portraits\.png$/)
})

test('fishing tournament uses the summer server window and server recorded hits', () => {
  const epoch = 1_700_000_000_000
  const day35 = epoch + 34 * 24 * 60_000
  const start = day35 + 2 * 60_000 // 08:00 from a 06:00 world day start
  assert.equal(activeBeachOccurrence(start, epoch), 'beach:1')
  assert.equal(activeBeachOccurrence(start - 60_000, epoch), null)
  const session = { start_at_ms: start + 3_000, deadline_ms: start + 3_000 + FISHING_DURATION_MS, hits: {} }
  assert.equal(validFishingHit(session, 0, session.start_at_ms - 1), null)
  assert.ok(validFishingHit(session, 0, session.start_at_ms + 600))
  assert.equal(validFishingHit(session, 1, session.start_at_ms + 600), null)
  for (let round = 0; round < 5; round++) {
    const best = Array.from({ length: 4_000 }, (_, ms) => ms).find(ms => tournamentPoints(round * 4_000 + ms, round) >= 170)
    session.hits[round] = { at: round * 4_000 + best }
  }
  assert.ok(scoreTournament(session.hits) >= 850)
  assert.equal(validateFishingResult(session, session.deadline_ms - 1), null)
  assert.ok(validateFishingResult(session, session.deadline_ms)?.score >= 850)
})
