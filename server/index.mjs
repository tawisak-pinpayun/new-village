import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { WebSocketServer, WebSocket } from 'ws'

const port = Number(process.env.PORT || 3000)
const root = resolve('dist')
const rooms = new Map()
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
const server = createServer(async (req, res) => {
  if (req.url === '/health') { res.writeHead(200); res.end('ok'); return }
  let path
  try { path = decodeURIComponent((req.url || '/').split('?')[0]) } catch { res.writeHead(400); res.end(); return }
  const file = resolve(root, '.' + path)
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
  try {
    const target = (await stat(file)).isDirectory() ? resolve(file, 'index.html') : file
    res.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream', 'cache-control': target.endsWith('index.html') ? 'no-cache' : 'public, max-age=86400' })
    res.end(await readFile(target))
  } catch { res.writeHead(404); res.end('Not found') }
})
const wss = new WebSocketServer({ server, path: '/multiplayer', maxPayload: 1024 })
let nextId = 1
function send(ws, value) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(value)) }
function broadcast(room, value, except) { for (const peer of room.values()) if (peer.ws !== except) send(peer.ws, value) }
function leave(ws) {
  const room = rooms.get(ws.roomCode)
  if (!room) return
  room.delete(ws.playerId)
  broadcast(room, { type: 'left', id: ws.playerId })
  if (!room.size) rooms.delete(ws.roomCode)
  ws.roomCode = undefined
}
wss.on('connection', ws => {
  ws.playerId = String(nextId++)
  ws.on('message', raw => {
    let data
    try { data = JSON.parse(raw.toString()) } catch { return }
    if (data.type === 'join') {
      const code = String(data.room || '').trim().toUpperCase()
      if (!/^[A-Z0-9-]{3,16}$/.test(code)) return send(ws, { type: 'error', message: 'รหัสห้องต้องมี 3–16 ตัวอักษร' })
      leave(ws)
      const room = rooms.get(code) || new Map()
      if (room.size >= 20) return send(ws, { type: 'error', message: 'ห้องเต็มแล้ว' })
      rooms.set(code, room)
      ws.roomCode = code
      const player = { id: ws.playerId, name: String(data.name || 'เพื่อน').trim().slice(0, 20) || 'เพื่อน', x: 768, y: 800, mapId: 'village', character: data.character === 'b' ? 'b' : 'a', facing: 0, moving: false, ws }
      room.set(ws.playerId, player)
      send(ws, { type: 'joined', id: ws.playerId, room: code, players: [...room.values()].filter(p => p !== player).map(({ ws: _, ...p }) => p) })
      broadcast(room, { type: 'player', player: { ...player, ws: undefined } }, ws)
    } else if (data.type === 'move' && ws.roomCode) {
      const player = rooms.get(ws.roomCode)?.get(ws.playerId)
      if (!player) return
      if (!Number.isFinite(data.x) || !Number.isFinite(data.y) || !['village', 'farm', 'home'].includes(data.mapId)) return
      player.x = Math.max(16, Math.min(1520, data.x))
      player.y = Math.max(16, Math.min(1008, data.y))
      player.mapId = data.mapId
      player.character = data.character === 'b' ? 'b' : 'a'
      player.facing = [0, 1, 2, 3].includes(data.facing) ? data.facing : 0
      player.moving = !!data.moving
      broadcast(rooms.get(ws.roomCode), { type: 'player', player: { ...player, ws: undefined } }, ws)
    }
  })
  ws.on('close', () => leave(ws))
})
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.alive === false) { ws.terminate(); continue }
    ws.alive = false; ws.ping()
  }
}, 30000)
wss.on('connection', ws => { ws.alive = true; ws.on('pong', () => { ws.alive = true }) })
server.listen(port, '0.0.0.0', () => console.log(`New Village multiplayer listening on ${port}`))
