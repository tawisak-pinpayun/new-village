import test from 'node:test'
import assert from 'node:assert/strict'
import { NPCS, SHOPS, lilyGreeting } from '../src/shops.ts'

test('seed shop and Lily form a complete linked vertical slice', () => {
  const shop = SHOPS.seed_shop, lily = NPCS.lily
  assert.equal(shop.npcId, lily.id)
  assert.equal(lily.shopId, shop.id)
  assert.deepEqual(shop.openingHours, [7, 20])
  assert.ok(shop.inventory.includes('radish_seed'))
  assert.equal(shop.shopId, 'seed_shop')
  assert.equal(shop.shopType, 'seed')
  assert.match(shop.bannerAsset, /farmers-market-header\.png$/)
  assert.ok(shop.buyItems.includes('tomato_seed'))
  assert.ok(shop.acceptedSellCategories.includes('moonstone'))
  assert.deepEqual(shop.categories.map(category => category.id), ['all', 'seeds', 'supplies', 'weapons'])
  assert.deepEqual(lily.animationStates.greet, [4])
  assert.deepEqual(lily.animationStates.talk, [7])
  assert.ok(lily.dialogueTree.quest[0].text.length > 20)
})

test('Lily greeting selects time and weather dialogue without UI changes', () => {
  assert.equal(lilyGreeting(8, false, false).id, 'morning')
  assert.equal(lilyGreeting(14, false, false).id, 'afternoon')
  assert.equal(lilyGreeting(14, true, false).id, 'rain')
  assert.equal(lilyGreeting(22, false, false).id, 'night')
  assert.equal(lilyGreeting(14, false, true).id, 'first')
})
