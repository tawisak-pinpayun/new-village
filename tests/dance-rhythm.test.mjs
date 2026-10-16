import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createAccountApi } from '../server/accounts.mjs'
import { DANCE_DURATION_MS, DanceSession, danceChart, danceJudgment, scoreDance } from '../src/mini-games/dance.mjs'
import { activeDanceOccurrence, validDanceHit, validateDanceResult } from '../server/dance-rhythm.mjs'
import { WORLD_DAY_MS } from '../server/world-clock.mjs'

const epoch = Date.UTC(2026, 0, 1)
const danceEvening = epoch + 27 * WORLD_DAY_MS + 12 * 60_000

test('dance chart and timing judgments are deterministic', () => {
  assert.deepEqual(danceChart(42), danceChart(42))
  assert.notDeepEqual(danceChart(42), danceChart(43))
  assert.equal(danceChart(42).length, 24)
  assert.equal(danceJudgment(85), 'Perfect')
  assert.equal(danceJudgment(165), 'Great')
  assert.equal(danceJudgment(300), 'Good')
  assert.equal(danceJudgment(301), 'Miss')
  const chart = danceChart(42)
  const hits = Object.fromEntries(chart.map(note => [note.index, { lane: note.lane, at: note.at }]))
  assert.equal(scoreDance(chart, hits).score, 1000)
  assert.equal(scoreDance(chart, hits).maxCombo, 24)
  assert.equal(scoreDance(chart, {}).score, 0)
})

test('dance practice supports pause and touch or keyboard lane input', () => {
  const game = new DanceSession(42)
  game.start(0)
  assert.equal(game.hit(game.chart[0].lane, 1000), null)
  game.update(3000)
  assert.equal(game.pause(3500), true)
  assert.equal(game.hit(game.chart[0].lane, 4000), null)
  assert.equal(game.resume(4500), true)
  const first = game.chart[0]
  assert.equal(game.hit(first.lane, game.startAt + first.at)?.judgment, 'Perfect')
  assert.equal(game.hit(first.lane, game.startAt + first.at), null)
  game.update(game.startAt + DANCE_DURATION_MS)
  assert.equal(game.state, 'completed')
  assert.equal(game.result.counts.Perfect, 1)
  assert.equal(game.result.counts.Miss, 23)
})

test('server window and hit validation use receipt time', () => {
  assert.equal(activeDanceOccurrence(danceEvening, epoch), 'spring_dance:1')
  assert.equal(activeDanceOccurrence(epoch + 27 * WORLD_DAY_MS, epoch), null)
  assert.equal(activeDanceOccurrence(epoch + 28 * WORLD_DAY_MS, epoch), null)
  const session = { seed: 42, start_at_ms: 10_000, deadline_ms: 10_000 + DANCE_DURATION_MS, hits: {} }
  const first = danceChart(42)[0]
  assert.deepEqual(validDanceHit(session, 0, first.lane, 10_000 + first.at), { lane: first.lane, at: first.at })
  assert.equal(validDanceHit(session, 0, first.lane, 10_000 + first.at + 301), null)
  assert.equal(validDanceHit(session, 24, first.lane, 10_000 + first.at), null)
  assert.equal(validateDanceResult(session, session.deadline_ms + 1), null)
})

test('dance API ranks only server-recorded hits and claims once', async t => {
  let now = danceEvening
  let game
  let claimed = false
  const store = {
    async accountForToken(token) { return token === 'a'.repeat(43) ? { id: 'player-1', email: 'player@example.com' } : null },
    async getFestivalProgress() { return { tokens: claimed ? 100 : 0, exp: claimed ? 200 : 0, friendshipExp: 0, claims: claimed ? { spring_dance_1: { score: 1000 } } : {} } },
    async createDanceSession(accountId, occurrence, started) {
      game = { _id: '12345678-1234-1234-1234-123456789abc', account_id: accountId, occurrence, seed: 42, start_at_ms: started + 3000, deadline_ms: started + 3000 + DANCE_DURATION_MS, hits: {} }
      return game
    },
    async getDanceSession(accountId, id) { return game?.account_id === accountId && game?._id === id ? game : null },
    async recordDanceHit(accountId, id, index, hit) {
      if (game.account_id !== accountId || game._id !== id || game.hits[index]) return false
      game.hits[index] = hit
      return true
    },
    async claimFestivalResult(_accountId, _occurrence, result) {
      if (claimed) return null
      claimed = true
      return { tokens: result.tokens, exp: result.festivalExp, friendshipExp: 0 }
    }
  }
  const api = createAccountApi(store, { now: () => now, worldEpochMs: epoch })
  const server = createServer((req, res) => { void api(req, res) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())
  const origin = `http://127.0.0.1:${server.address().port}`
  const request = (path, body, authenticated = true) => fetch(origin + path, {
    method: 'POST', headers: { origin, ...(authenticated ? { cookie: `nv_session=${'a'.repeat(43)}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
  assert.equal((await request('/api/festival/dance/start', null, false)).status, 401)
  const started = await (await request('/api/festival/dance/start')).json()
  assert.equal(started.seed, 42)
  assert.equal((await request('/api/festival/dance/submit', { sessionId: started.sessionId, score: 1000 })).status, 400)
  const chart = danceChart(42)
  for (const note of chart) {
    now = started.startAt + note.at
    assert.equal((await request('/api/festival/dance/hit', { sessionId: started.sessionId, noteIndex: note.index, lane: note.lane })).status, 200)
  }
  assert.equal((await request('/api/festival/dance/hit', { sessionId: started.sessionId, noteIndex: 23, lane: chart[23].lane })).status, 409)
  now = game.deadline_ms + 1
  const result = await (await request('/api/festival/dance/submit', { sessionId: started.sessionId, score: 0 })).json()
  assert.equal(result.score, 1000)
  assert.equal(result.rank, 'S')
  assert.equal(result.maxCombo, 24)
  assert.equal((await request('/api/festival/dance/submit', { sessionId: started.sessionId })).status, 409)
  assert.equal((await request('/api/festival/dance/start')).status, 409)
})
