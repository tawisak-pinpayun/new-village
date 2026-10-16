import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createAccountApi } from '../server/accounts.mjs'
import { FISHING_DURATION_MS, tournamentPoints } from '../src/mini-games/fishing-tournament.mjs'
import { WORLD_DAY_MS } from '../server/world-clock.mjs'

test('beach leaderboard accepts only server timed tournament hits once per year', async t => {
  const epoch = Date.UTC(2026, 0, 1)
  let now = epoch + 34 * WORLD_DAY_MS + 2 * 60_000
  let game, claimed = false
  const store = {
    async accountForToken(token) { return token === 'a'.repeat(43) ? { id: 'fisher-1', email: 'fisher@example.com' } : null },
    async getFestivalProgress() { return { tokens: claimed ? 100 : 0, exp: claimed ? 200 : 0, friendshipExp: 0, claims: claimed ? { beach_1: { score: 900, rank: 'S' } } : {} } },
    async getFestivalLeaderboard() { return claimed ? [{ place: 1, player: 'ผู้เล่น A', score: 900, grade: 'S' }] : [] },
    async createFishingSession(accountId, occurrence, started) {
      game = { _id: '12345678-1234-1234-1234-123456789abc', account_id: accountId, occurrence, seed: 42, start_at_ms: started + 2_000, deadline_ms: started + 2_000 + FISHING_DURATION_MS, hits: {} }
      return game
    },
    async getFishingSession(accountId, id) { return game?.account_id === accountId && game?._id === id ? game : null },
    async recordFishingHit(accountId, id, round, hit) {
      if (game.account_id !== accountId || game._id !== id || game.hits[round]) return false
      game.hits[round] = hit; return true
    },
    async claimFestivalResult(_accountId, _occurrence, result) {
      if (claimed) return null
      claimed = true
      return { tokens: result.tokens, exp: result.festivalExp, friendshipExp: 0 }
    }
  }
  const api = createAccountApi(store, { now: () => now, worldEpochMs: epoch })
  const server = createServer((req, res) => { void api(req, res) })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  t.after(() => server.close())
  const origin = `http://127.0.0.1:${server.address().port}`
  const post = (path, body, auth = true) => fetch(origin + path, { method: 'POST', headers: { origin, ...(auth ? { cookie: `nv_session=${'a'.repeat(43)}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  assert.equal((await post('/api/festival/fishing/start', null, false)).status, 401)
  const started = await (await post('/api/festival/fishing/start')).json()
  assert.equal(started.seed, 42)
  assert.equal((await post('/api/festival/fishing/submit', { sessionId: started.sessionId, score: 1000 })).status, 400)
  for (let round = 0; round < 5; round++) {
    const good = Array.from({ length: 4000 }, (_, i) => i).find(ms => tournamentPoints(round * 4000 + ms, round) >= 180)
    now = started.startAt + round * 4000 + good
    assert.equal((await post('/api/festival/fishing/hit', { sessionId: started.sessionId, round })).status, 200)
  }
  assert.equal((await post('/api/festival/fishing/hit', { sessionId: started.sessionId, round: 4 })).status, 409)
  now = game.deadline_ms
  const result = await (await post('/api/festival/fishing/submit', { sessionId: started.sessionId, score: 0 })).json()
  assert.ok(result.score >= 900)
  assert.equal(result.rank, 'S')
  assert.equal((await post('/api/festival/fishing/submit', { sessionId: started.sessionId })).status, 409)
  assert.equal((await post('/api/festival/fishing/start')).status, 409)
  const board = await (await fetch(origin + '/api/festival/leaderboard?event=beach&year=1')).json()
  assert.equal(board.entries[0].place, 1)
})
