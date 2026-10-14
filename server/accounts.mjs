import { createHash, pbkdf2 as pbkdf2Callback, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { MongoClient } from 'mongodb'

const pbkdf2 = promisify(pbkdf2Callback)
const COOKIE_AGE_SECONDS = 30 * 24 * 60 * 60
const HASH_ITERATIONS = 600_000
const SAVE_LIMIT = 64 * 1024
const MAPS = new Set(['village', 'farm', 'home', 'market', 'magic_city', 'riverside', 'city', 'mine', 'mine2', 'mine3'])

export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128
}

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = await pbkdf2(password, salt, HASH_ITERATIONS, 32, 'sha256')
  return `pbkdf2-sha256$${HASH_ITERATIONS}$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export async function verifyPassword(password, stored) {
  const [algorithm, rounds, saltText, hashText] = String(stored || '').split('$')
  if (algorithm !== 'pbkdf2-sha256' || rounds !== String(HASH_ITERATIONS) || !saltText || !hashText) return false
  const expected = Buffer.from(hashText, 'base64url')
  if (expected.length !== 32) return false
  const actual = await pbkdf2(password, Buffer.from(saltText, 'base64url'), HASH_ITERATIONS, 32, 'sha256')
  return timingSafeEqual(actual, expected)
}

export function validSave(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 2) return false
  const player = value.player
  if (!player || typeof player !== 'object' || !MAPS.has(player.mapId)) return false
  if (![player.x, player.y, player.coins, player.energy, value.savedAt].every(Number.isFinite)) return false
  if (player.x < 0 || player.x > 1536 || player.y < 0 || player.y > 1024 || player.coins < 0 || player.energy < 0 || player.energy > 100) return false
  if (!Array.isArray(value.inventory) || value.inventory.length > 24 || !Array.isArray(value.plots) || value.plots.length !== 6 || typeof value.questDone !== 'boolean') return false
  return true
}

const tokenHash = token => createHash('sha256').update(token).digest('hex')

export function createAccountStore(connectionString) {
  const client = new MongoClient(connectionString, { maxPoolSize: 5, serverSelectionTimeoutMS: 5_000 })
  const db = client.db()
  const accounts = db.collection('accounts')
  const sessions = db.collection('account_sessions')
  const saves = db.collection('game_saves')
  return {
    async init() {
      await client.connect()
      await db.command({ ping: 1 })
      await accounts.createIndex({ email: 1 }, { unique: true })
      await sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
    },
    async register(email, password) {
      const id = randomUUID()
      const passwordHash = await hashPassword(password)
      try { await accounts.insertOne({ _id: id, email, password_hash: passwordHash, created_at: new Date() }) }
      catch (error) { if (error.code === 11000) return null; throw error }
      return { id, email }
    },
    async findAccount(email) {
      const account = await accounts.findOne({ email })
      return account ? { id: account._id, email: account.email, password_hash: account.password_hash } : null
    },
    async createSession(accountId) {
      const token = randomBytes(32).toString('base64url')
      await sessions.insertOne({ _id: tokenHash(token), account_id: accountId, expires_at: new Date(Date.now() + COOKIE_AGE_SECONDS * 1000) })
      return token
    },
    async accountForToken(token) {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null
      const session = await sessions.findOne({ _id: tokenHash(token), expires_at: { $gt: new Date() } })
      if (!session) return null
      const account = await accounts.findOne({ _id: session.account_id })
      return account ? { id: account._id, email: account.email } : null
    },
    async revokeSession(token) {
      if (token) await sessions.deleteOne({ _id: tokenHash(token) })
    },
    async getSave(accountId) {
      return await saves.findOne({ _id: accountId })
    },
    async putSave(accountId, data, revision) {
      if (revision === 0) {
        try { await saves.insertOne({ _id: accountId, data, revision: 1, updated_at: new Date() }); return { revision: 1, updated_at: new Date() } }
        catch (error) { if (error.code === 11000) return null; throw error }
      }
      const saved = await saves.findOneAndUpdate({ _id: accountId, revision }, { $set: { data, updated_at: new Date() }, $inc: { revision: 1 } }, { returnDocument: 'after' })
      return saved ? { revision: saved.revision, updated_at: saved.updated_at } : null
    },
    async close() { await client.close() }
  }
}

function cookieName(secure) { return secure ? '__Host-nv_session' : 'nv_session' }
function cookie(secure, token, maxAge = COOKIE_AGE_SECONDS) {
  return `${cookieName(secure)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
}
function sendJson(res, status, value, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers })
  res.end(JSON.stringify(value))
}
async function readJson(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new Error('content-type')
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (Buffer.byteLength(raw) > SAVE_LIMIT) throw new Error('too-large')
  }
  return JSON.parse(raw)
}
function sameOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = req.headers.origin
  if (!origin) return false
  const expected = process.env.RENDER_EXTERNAL_URL || `http://${req.headers.host}`
  return origin === expected
}

export function createAccountApi(store) {
  const attempts = new Map()
  return async function accountApi(req, res) {
    const path = (req.url || '').split('?')[0]
    if (!path.startsWith('/api/')) return false
    const secure = process.env.RENDER === 'true' || req.headers['x-forwarded-proto'] === 'https'
    if (req.method !== 'GET' && (!sameOrigin(req) || !['POST', 'PUT'].includes(req.method))) {
      sendJson(res, 403, { error: 'คำขอไม่ได้มาจากหน้าเกม' }); return true
    }
    try {
      const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map(part => part.trim().split('=').slice(0, 2)).filter(([key, value]) => key && value))
      const token = cookies[cookieName(secure)]
      if (path === '/api/register' || path === '/api/login') {
        if (req.method !== 'POST') { sendJson(res, 405, { error: 'วิธีเรียกไม่ถูกต้อง' }); return true }
        const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0]
        const recent = (attempts.get(ip) ?? []).filter(time => time > Date.now() - 10 * 60_000)
        if (recent.length >= 8) { sendJson(res, 429, { error: 'ลองใหม่อีกครั้งใน 10 นาที' }); return true }
        recent.push(Date.now()); attempts.set(ip, recent)
        const body = await readJson(req)
        const email = String(body.email || '').trim().toLowerCase()
        const password = body.password
        if (!validEmail(email) || !validPassword(password)) { sendJson(res, 400, { error: 'ใช้อีเมลที่ถูกต้องและรหัสผ่านอย่างน้อย 12 ตัวอักษร' }); return true }
        let account
        if (path === '/api/register') {
          account = await store.register(email, password)
          if (!account) { sendJson(res, 409, { error: 'อีเมลนี้มีบัญชีแล้ว' }); return true }
        } else {
          account = await store.findAccount(email)
          if (!account || !await verifyPassword(password, account.password_hash)) { sendJson(res, 401, { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }); return true }
        }
        if (token) await store.revokeSession(token)
        const newToken = await store.createSession(account.id)
        sendJson(res, 200, { email: account.email }, { 'set-cookie': cookie(secure, newToken) })
        return true
      }
      if (path === '/api/logout' && req.method === 'POST') {
        await store.revokeSession(token)
        sendJson(res, 200, { ok: true }, { 'set-cookie': cookie(secure, '', 0) })
        return true
      }
      const account = await store.accountForToken(token)
      if (path === '/api/me' && req.method === 'GET') { sendJson(res, 200, { email: account?.email ?? null }); return true }
      if (!account) { sendJson(res, 401, { error: 'กรุณาเข้าสู่ระบบ' }); return true }
      if (path === '/api/save' && req.method === 'GET') {
        const save = await store.getSave(account.id)
        sendJson(res, 200, save ? { data: save.data, revision: save.revision, updatedAt: save.updated_at } : { data: null, revision: 0 })
        return true
      }
      if (path === '/api/save' && req.method === 'PUT') {
        const body = await readJson(req)
        if (!Number.isInteger(body.revision) || body.revision < 0 || !validSave(body.data)) { sendJson(res, 400, { error: 'ข้อมูลเซฟไม่ถูกต้อง' }); return true }
        const saved = await store.putSave(account.id, body.data, body.revision)
        if (!saved) { sendJson(res, 409, { error: 'เซฟนี้ถูกแก้จากอีกเครื่อง กรุณาโหลดเซฟล่าสุด' }); return true }
        sendJson(res, 200, { revision: saved.revision, updatedAt: saved.updated_at })
        return true
      }
      sendJson(res, 404, { error: 'ไม่พบคำขอ' }); return true
    } catch (error) {
      if (['content-type', 'too-large', 'SyntaxError'].includes(error.message) || error instanceof SyntaxError) sendJson(res, 400, { error: 'รูปแบบข้อมูลไม่ถูกต้องหรือมีขนาดใหญ่เกินไป' })
      else { console.error('Account API error:', error?.name ?? 'UnknownError'); sendJson(res, 503, { error: 'ระบบเซฟออนไลน์ขัดข้อง กรุณาลองอีกครั้ง' }) }
      return true
    }
  }
}
