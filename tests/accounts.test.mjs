import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createAccountApi, hashPassword, validSave, verifyPassword } from '../server/accounts.mjs'
import { initialState } from '../src/domain.ts'

test('password hashes use a salt and reject a wrong password', async () => {
  const first = await hashPassword('long-example-passphrase')
  const second = await hashPassword('long-example-passphrase')
  assert.notEqual(first, second)
  assert.equal(await verifyPassword('long-example-passphrase', first), true)
  assert.equal(await verifyPassword('wrong-passphrase', first), false)
})

test('account API keeps sessions in cookies and prevents overwriting a newer save', async t => {
  const accounts = new Map(), sessions = new Map(), saves = new Map()
  const store = {
    async register(email, password) {
      if (accounts.has(email)) return null
      const account = { id: String(accounts.size + 1), email, password_hash: await hashPassword(password) }
      accounts.set(email, account)
      return account
    },
    async findAccount(email) { return accounts.get(email) ?? null },
    async createSession(id) { const token = 'a'.repeat(43); sessions.set(token, id); return token },
    async accountForToken(token) { const id = sessions.get(token); return [...accounts.values()].find(item => item.id === id) ?? null },
    async revokeSession(token) { sessions.delete(token) },
    async getSave(id) { return saves.get(id) ?? null },
    async putSave(id, data, revision) {
      const previous = saves.get(id)
      if ((previous?.revision ?? 0) !== revision) return null
      const saved = { data, revision: revision + 1, updated_at: new Date() }
      saves.set(id, saved)
      return saved
    }
  }
  const api = createAccountApi(store)
  const server = createServer((req, res) => { void api(req, res) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server.close())
  const origin = `http://127.0.0.1:${server.address().port}`
  const request = (path, method = 'GET', body, cookie, source = origin) => fetch(origin + path, {
    method, headers: { origin: source, ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
  const register = await request('/api/register', 'POST', { email: 'Player@example.com', password: 'long-example-passphrase' })
  assert.equal(register.status, 200)
  const cookie = register.headers.get('set-cookie').split(';')[0]
  assert.match(register.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/)
  assert.equal((await (await request('/api/me', 'GET', undefined, cookie)).json()).email, 'player@example.com')
  const save = initialState()
  assert.equal(validSave(save), true)
  const upload = await request('/api/save', 'PUT', { revision: 0, data: save }, cookie)
  assert.equal((await upload.json()).revision, 1)
  assert.equal((await (await request('/api/save', 'GET', undefined, cookie)).json()).data.player.coins, 50)
  assert.equal((await request('/api/save', 'PUT', { revision: 0, data: save }, cookie)).status, 409)
  assert.equal((await request('/api/save', 'PUT', { revision: 1, data: save }, cookie, 'https://other.example')).status, 403)
  await request('/api/logout', 'POST', undefined, cookie)
  assert.equal((await request('/api/save', 'GET', undefined, cookie)).status, 401)
})
