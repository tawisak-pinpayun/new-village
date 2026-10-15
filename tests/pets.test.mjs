import test from 'node:test'
import assert from 'node:assert/strict'
import { add, count, initialState, validate } from '../src/domain.ts'
import { PET_SPECIES_IDS } from '../src/pet-data.ts'
import { activePet, buyPet, canUsePetSkill, feedPet, markPetSkillUsed, petSpeedMultiplier, playWithPet, setActivePet, updatePets } from '../src/pet-system.ts'
import { validSave } from '../server/accounts.mjs'

test('all seven pets can be adopted, but a player owns at most two', () => {
  for (const species of PET_SPECIES_IDS) {
    const save = initialState()
    save.player.coins = 1000
    const first = buyPet(save, species, 1_700_000_000_000, 1)
    assert.ok(first, species)
    assert.equal(activePet(save)?.species, species)
    const second = buyPet(save, 'dog', 1_700_000_000_001, 1)
    assert.ok(second)
    assert.equal(buyPet(save, 'cat', 1_700_000_000_002, 1), null)
    assert.equal(setActivePet(save, second), true)
    assert.equal(activePet(save)?.id, second)
    assert.equal(save.pets.length, 2)
    assert.equal(validate(save), true)
    assert.equal(validSave(save), true)
  }
})

test('feeding, play and skills use inventory, bond and cooldown', () => {
  const save = initialState()
  save.player.coins = 1000
  const now = 1_700_000_000_000
  const id = buyPet(save, 'dog', now, 1)
  add(save, 'animal_feed')
  save.pets[0].hunger = 40
  assert.equal(feedPet(save, id, now), true)
  assert.equal(count(save, 'animal_feed'), 0)
  assert.equal(save.pets[0].hunger, 80)
  assert.equal(playWithPet(save, id, now), true)
  assert.equal(playWithPet(save, id, now + 1000), false)
  assert.equal(canUsePetSkill(save, now), true)
  markPetSkillUsed(save, now)
  assert.equal(canUsePetSkill(save, now + 44_000), false)
  assert.equal(canUsePetSkill(save, now + 45_000), true)
  for (let i = 0; i < 4; i++) { add(save, 'animal_feed'); save.pets[0].hunger = 30; feedPet(save, id, now + i * 60_000) }
  assert.ok(save.pets[0].bondLevel >= 2)
  assert.equal(petSpeedMultiplier(save), 1.06)
})

test('chicken, cow and goat produce once per game day and save online', () => {
  for (const [species, product] of [['chicken', 'egg'], ['cow', 'milk'], ['goat', 'milk']]) {
    const save = initialState()
    save.player.coins = 1000
    const now = 1_700_000_000_000
    buyPet(save, species, now, 20)
    assert.deepEqual(updatePets(save, 21, now + 1000).products, [product])
    assert.equal(count(save, product), 1)
    assert.deepEqual(updatePets(save, 21, now + 2000).products, [])
    assert.equal(count(save, product), 1)
    assert.equal(validSave(JSON.parse(JSON.stringify(save))), true)
  }
})

test('invalid pet roster and ground loot cannot enter local or online saves', () => {
  const save = initialState()
  save.player.coins = 1000
  buyPet(save, 'cat', 1_700_000_000_000, 20)
  save.activePetId = 'other'
  assert.equal(validate(save), false)
  assert.equal(validSave(save), false)
  save.activePetId = save.pets[0].id
  save.groundDrops.push({ id: 'test', itemId: 'copper', mapId: 'mine', x: 300, y: 400 })
  assert.equal(validate(save), true)
  assert.equal(validSave(save), true)
  save.groundDrops[0].x = -1
  assert.equal(validate(save), false)
  assert.equal(validSave(save), false)
})
