import test from 'node:test'
import assert from 'node:assert/strict'
import { FESTIVALS, festivalOccurrenceId, festivalOn, festivalStatus } from '../src/festivals.ts'

test('twelve annual festivals have unique dates and game IDs', () => {
  assert.equal(FESTIVALS.length, 12)
  assert.equal(new Set(FESTIVALS.map(f => `${f.season}:${f.day}`)).size, 12)
  assert.equal(new Set(FESTIVALS.map(f => f.miniGameId)).size, 12)
  assert.equal(festivalOn('spring', 5)?.id, 'flower')
  assert.equal(festivalOccurrenceId(FESTIVALS[0], 2), 'flower:2')
})

test('festival status follows the selected year, day and hour', () => {
  const flower = FESTIVALS[0]
  const today = { year: 1, season: 'spring', day: 5, hour: 7 }
  assert.equal(festivalStatus(flower, 1, today), 'เปิดวันนี้')
  assert.equal(festivalStatus(flower, 1, { ...today, hour: 8 }), 'กำลังจัดงาน')
  assert.equal(festivalStatus(flower, 1, { ...today, hour: 18 }), 'หมดเวลา')
  assert.equal(festivalStatus(flower, 2, { ...today, day: 28 }), 'กำลังจะมาถึง')
})
