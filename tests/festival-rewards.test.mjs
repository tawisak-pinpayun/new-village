import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createAccountApi } from '../server/accounts.mjs'
import { activeFlowerOccurrence, validateFlowerResult } from '../server/flower-festival.mjs'
import { flowerTarget } from '../src/mini-games/flower.mjs'
import { WORLD_DAY_MS } from '../server/world-clock.mjs'

const epoch = Date.UTC(2026, 0, 1)
const flowerMorning = epoch + 4 * WORLD_DAY_MS + 3 * 60_000

test('flower reward window is based on server world time', () => {
  assert.equal(activeFlowerOccurrence(flowerMorning, epoch), 'flower:1')
  assert.equal(activeFlowerOccurrence(epoch + 4 * WORLD_DAY_MS, epoch), null)
  assert.equal(activeFlowerOccurrence(epoch + 5 * WORLD_DAY_MS, epoch), null)
  assert.equal(activeFlowerOccurrence(flowerMorning + 112 * WORLD_DAY_MS, epoch), 'flower:2')
})

test('result replay rejects impossible moves and uses server time for score', () => {
  const game = { seed: 42, start_at_ms: 1000, deadline_ms: 31_000 }
  const moves = flowerTarget(42).map((pick, index) => ({ index, ...pick, at: 2000 + index * 100 }))
  const good = validateFlowerResult(game, moves, 6000)
  assert.equal(good.rank, 'S')
  assert.equal(validateFlowerResult(game, moves.map(move => ({ ...move, at: 29_000 })), 6000), null)
  assert.equal(validateFlowerResult(game, moves.slice(0, 3), 6000), null)
  assert.equal(validateFlowerResult(game, moves, 35_000), null)
  assert.equal(validateFlowerResult(game, moves.map(move => ({ ...move, color: 'forged' })), 6000), null)
})

test('authenticated festival result can be claimed only once per occurrence', async t => {
  let now = flowerMorning
  const sessions = new Map()
  const balances = new Map()
  const store = {
    async accountForToken(token) { return token === 'a'.repeat(43) ? { id: 'player-1', email: 'player@example.com' } : null },
    async getFestivalProgress(id) { return balances.get(id) ?? { tokens: 0, exp: 0, claims: {} } },
    async createFlowerSession(id, occurrence, started) {
      const session = { _id: '12345678-1234-1234-1234-123456789abc', account_id: id, occurrence, seed: 42, start_at_ms: started + 3000, deadline_ms: started + 33_000 }
      sessions.set(session._id, session)
      return session
    },
    async getFlowerSession(id, sessionId) { const session = sessions.get(sessionId); return session?.account_id === id ? session : null },
    async claimFlowerResult(id, occurrence, result) {
      const progress = balances.get(id) ?? { tokens: 0, exp: 0, claims: {} }
      const key = occurrence.replace(':', '_')
      if (progress.claims[key]) return null
      progress.tokens += result.tokens
      progress.exp += result.festivalExp
      progress.claims[key] = { score: result.score, rank: result.rank }
      balances.set(id, progress)
      return { ...progress, claim: progress.claims[key] }
    }
  }
  const api = createAccountApi(store, { now: () => now, worldEpochMs: epoch })
  const server = createServer((req, res) => { void api(req, res) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())
  const origin = `http://127.0.0.1:${server.address().port}`
  const request = (path, method = 'GET', body, authenticated = true) => fetch(origin + path, {
    method, headers: { origin, ...(authenticated ? { cookie: `nv_session=${'a'.repeat(43)}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
  assert.equal((await request('/api/festival/flower/start', 'POST', undefined, false)).status, 401)
  const started = await request('/api/festival/flower/start', 'POST')
  assert.equal(started.status, 200)
  const game = await started.json()
  now += 10_000
  const moves = flowerTarget(game.seed).map((pick, index) => ({ index, ...pick, at: 1000 + index * 100 }))
  const [first, duplicate] = await Promise.all([
    request('/api/festival/flower/submit', 'POST', { sessionId: game.sessionId, moves }),
    request('/api/festival/flower/submit', 'POST', { sessionId: game.sessionId, moves })
  ])
  assert.deepEqual([first.status, duplicate.status].sort(), [200, 409])
  const claim = await (first.status === 200 ? first : duplicate).json()
  assert.equal(claim.rank, 'S')
  assert.equal(claim.balance, claim.tokens)
  const progress = await (await request('/api/festival/progress')).json()
  assert.equal(progress.tokens, claim.tokens)
  assert.equal((await request('/api/festival/flower/start', 'POST')).status, 409)
})
