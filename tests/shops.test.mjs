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
  assert.deepEqual(shop.acceptedSellCategories, ['radish', 'carrot', 'tomato'])
  assert.deepEqual(shop.categories.map(category => category.id), ['all', 'seeds'])
  assert.deepEqual(shop.stock.map(product => product.id), shop.buyItems)
  assert.deepEqual(lily.animationStates.greet, [4])
  assert.deepEqual(lily.animationStates.talk, [7])
  assert.ok(lily.dialogueTree.quest[0].text.length > 20)
})

test('each shop links its merchant and only lists configured stock', () => {
  const expected = {
    seed_shop: ['radish_seed', 'carrot_seed', 'tomato_seed'],
    general: ['rice_meal', 'stew', 'radish_seed', 'wood', 'stone'],
    forge: ['sword', 'bow', 'arcane_sword'],
    magic_shop: ['wand', 'broom', 'mana_potion'],
    animal_shop: ['animal_feed', 'pet_basket'],
    furniture_shop: ['carved_chair', 'flower_table', 'wood'],
    tailor: []
  }
  for (const [id, stock] of Object.entries(expected)) {
    const shop = SHOPS[id]
    assert.equal(NPCS[shop.npcId].shopId, id)
    assert.deepEqual(shop.stock.map(product => product.id), stock)
    assert.ok(shop.stock.every(product => product.category === 'craft' || shop.categories.some(category => category.id === product.category)))
    assert.ok(shop.acceptedSellCategories.every(item => shop.sellPrices[item] > 0))
  }
})

test('Lily greeting selects time and weather dialogue without UI changes', () => {
  assert.equal(lilyGreeting(8, false, false).id, 'morning')
  assert.equal(lilyGreeting(14, false, false).id, 'afternoon')
  assert.equal(lilyGreeting(14, true, false).id, 'rain')
  assert.equal(lilyGreeting(22, false, false).id, 'night')
  assert.equal(lilyGreeting(14, false, true).id, 'first')
})
