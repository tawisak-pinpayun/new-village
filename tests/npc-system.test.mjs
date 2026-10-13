import test from 'node:test'
import assert from 'node:assert/strict'
import { NPCAnimationController } from '../src/npc-system.ts'

const clips = { IDLE: [0, 1], WORKING: [6], WALKING: [5], PLAYER_NEARBY: [2], GREETING: [4], TALKING: [7, 3], RETURN_TO_IDLE: [3, 2] }

test('NPC animation controller completes the Lily interaction lifecycle', () => {
  const npc = new NPCAnimationController(clips)
  npc.update(100, true, false)
  assert.equal(npc.state, 'GREETING')
  assert.equal(npc.frame(100), 4)
  npc.update(1500, true, false)
  assert.equal(npc.state, 'PLAYER_NEARBY')
  npc.update(1600, true, true)
  assert.equal(npc.state, 'TALKING')
  assert.notEqual(npc.frame(1600), npc.frame(1820))
  npc.update(1900, false, false)
  assert.equal(npc.state, 'RETURN_TO_IDLE')
  npc.update(2400, false, false)
  assert.equal(npc.state, 'IDLE')
})
