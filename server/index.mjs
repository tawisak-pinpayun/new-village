import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { WebSocketServer, WebSocket } from 'ws'
import { actPlot, advanceWorld, hitMonster, hitResource, makeWorld, publicWorld } from './world.mjs'

const port = Number(process.env.PORT || 3000)
const root = resolve('dist')
const rooms = new Map()
const worlds = new Map()
const chatClients = new Set()
const chatHistory = []
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
const server = createServer(async (req, res) => {
  if (req.url === '/health') { res.writeHead(200); res.end('ok'); return }
  let path
  try { path = decodeURIComponent((req.url || '/').split('?')[0]) } catch { res.writeHead(400); res.end(); return }
  const file = resolve(root, '.' + path)
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
  try {
    const target = (await stat(file)).isDirectory() ? resolve(file, 'index.html') : file
    res.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream', 'cache-control': target.endsWith('index.html') || /\.(png|jpg|svg)$/.test(target) ? 'no-cache' : 'public, max-age=86400' })
    res.end(await readFile(target))
  } catch { res.writeHead(404); res.end('Not found') }
})
const wss = new WebSocketServer({ server, path: '/multiplayer', maxPayload: 1024 })
let nextId = 1
function send(ws, value) { if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 128_000) ws.send(JSON.stringify(value)) }
function broadcast(room, value, except) { for (const peer of room.values()) if (peer.ws !== except) send(peer.ws, value) }
function broadcastChat(value) { for (const ws of chatClients) send(ws, value) }
function leave(ws) {
  const room = rooms.get(ws.roomCode)
  if (!room) return
  room.delete(ws.playerId)
  broadcast(room, { type: 'left', id: ws.playerId })
  if (!room.size) { rooms.delete(ws.roomCode); worlds.delete(ws.roomCode) }
  ws.roomCode = undefined
}
wss.on('connection', ws => {
  ws.playerId = String(nextId++)
  ws.on('message', raw => {
    let data
    try { data = JSON.parse(raw.toString()) } catch { return }
    if (data.type === 'chat-join') {
      ws.chatName = String(data.name || 'ชาวบ้าน').trim().slice(0, 20) || 'ชาวบ้าน'
      chatClients.add(ws)
      send(ws, { type: 'chat-history', messages: chatHistory })
    } else if (data.type === 'chat-name' && chatClients.has(ws)) {
      ws.chatName = String(data.name || 'ชาวบ้าน').trim().slice(0, 20) || 'ชาวบ้าน'
    } else if (data.type === 'chat' && chatClients.has(ws)) {
      if (Date.now() - (ws.lastChat ?? 0) < 800) return
      const message = String(data.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200)
      if (!message) return
      ws.lastChat = Date.now()
      const entry = { type: 'chat', name: ws.chatName, text: message, time: Date.now() }
      chatHistory.push(entry)
      if (chatHistory.length > 40) chatHistory.shift()
      broadcastChat(entry)
    } else if (data.type === 'join') {
      const code = String(data.room || '').trim().toUpperCase()
      if (!/^[A-Z0-9-]{3,16}$/.test(code)) return send(ws, { type: 'error', message: 'รหัสห้องต้องมี 3–16 ตัวอักษร' })
      leave(ws)
      const room = rooms.get(code) || new Map()
      if (room.size >= 20) return send(ws, { type: 'error', message: 'ห้องเต็มแล้ว' })
      rooms.set(code, room)
      if (!worlds.has(code)) worlds.set(code, makeWorld())
      ws.roomCode = code
      const player = { id: ws.playerId, name: String(data.name || 'เพื่อน').trim().slice(0, 20) || 'เพื่อน', x: 768, y: 800, mapId: 'village', character: data.character === 'b' ? 'b' : 'a', facing: 0, moving: false, outfit: 'default', mounted: false, party: false, ws }
      room.set(ws.playerId, player)
      send(ws, { type: 'joined', id: ws.playerId, room: code, players: [...room.values()].filter(p => p !== player).map(({ ws: _, ...p }) => p) })
      send(ws, publicWorld(worlds.get(code)))
      broadcast(room, { type: 'player', player: { ...player, ws: undefined } }, ws)
    } else if (data.type === 'party' && ws.roomCode) {
      const room = rooms.get(ws.roomCode), player = room?.get(ws.playerId)
      if (!player) return
      player.party = !!data.join
      for (const peer of room.values()) send(peer.ws, { type: 'player', player: { ...player, ws: undefined } })
    } else if (data.type === 'world-action' && ws.roomCode) {
      const room = rooms.get(ws.roomCode), world = worlds.get(ws.roomCode), player = room?.get(ws.playerId)
      if (!room || !world || !player) return
      const seq = Number(data.seq)
      if (!Number.isInteger(seq) || seq < 1) return
      if (Date.now() - (ws.lastAction ?? 0) < 130) return send(ws, { type: 'action-result', seq, ok: false, message: 'ทำรายการเร็วเกินไป' })
      ws.lastAction = Date.now()
      advanceWorld(world)
      let result
      if (data.action === 'node') result = hitResource(world, player, String(data.id || ''), data.damage)
      else if (data.action === 'monster') result = hitMonster(world, player, String(data.id || ''), data.damage)
      else if (data.action === 'plot') result = actPlot(world, player, Number(data.index), data.plotAction, data.cropId)
      else if (data.action === 'garden-gate') {
        const doorwayOccupied = [...room.values()].some(peer => peer.mapId === 'farm' && Math.abs(peer.x - 770) < 64 && Math.abs(peer.y - 780) < 43)
        result = player.mapId === 'farm' && Math.hypot(player.x - 770, player.y - 780) < 115 && (!world.gardenGateOpen || !doorwayOccupied)
          ? { ok: true } : { ok: false, message: doorwayOccupied ? 'มีคนยืนอยู่ตรงช่องประตู' : 'อยู่ไกลจากประตูสวนเกินไป' }
        if (result.ok) world.gardenGateOpen = !world.gardenGateOpen
      } else if (data.action === 'campfire') {
        const index = world.campfires.findIndex(fire => fire.mapId === player.mapId && Math.hypot(player.x - fire.x, player.y - fire.y) < 85)
        if (data.operation === 'remove') {
          result = index >= 0 ? { ok: true } : { ok: false, message: 'ไม่มีกองไฟอยู่ใกล้' }
          if (result.ok) world.campfires.splice(index, 1)
        } else {
          const outdoors = ['village', 'farm', 'market', 'magic_city', 'riverside'].includes(player.mapId)
          const valid = outdoors && player.x > 60 && player.x < 1476 && player.y > 60 && player.y < 964
            && Math.hypot(player.x - 770, player.y - 780) > (player.mapId === 'farm' ? 110 : 0)
            && world.campfires.filter(fire => fire.mapId === player.mapId).length < 3 && index < 0
          result = valid ? { ok: true } : { ok: false, message: 'วางกองไฟตรงนี้ไม่ได้' }
          if (result.ok) world.campfires.push({ mapId: player.mapId, x: Math.round(player.x), y: Math.round(player.y) + 25 })
        }
      }
      else if (data.action === 'quest-deliver') {
        result = player.mapId === 'village' && Math.hypot(player.x - 565, player.y - 790) < 140 && world.quest.stage === 2 && !world.quest.completed
          ? { ok: true, questReward: true } : { ok: false, message: 'เควสต์ยังไม่ถึงขั้นส่งของ' }
        if (result.ok) { world.quest.completed = true; world.quest.stage = 3 }
      } else if (data.action === 'festival') {
        result = player.mapId === 'market' && Math.hypot(player.x - 770, player.y - 745) < 145 && !world.festival.completed && ['radish', 'carrot', 'tomato'].includes(data.itemId)
          ? { ok: true, itemId: data.itemId } : { ok: false, message: 'งานเทศกาลปิดหรืออยู่ไกลเกินไป' }
        if (result.ok) { world.festival.donated++; if (world.festival.donated >= world.festival.goal) world.festival.completed = true }
      } else result = { ok: false, message: 'ไม่รู้จักกิจกรรมนี้' }
      if (!result.ok) return send(ws, { type: 'action-result', seq, ...result })
      if (data.action === 'plot' && data.plotAction === 'harvest' && world.quest.stage === 0) {
        world.quest.harvested++
        if (world.quest.harvested >= 5) world.quest.stage = 1
      }
      if (data.action === 'node' && result.defeated && ['copper', 'iron'].includes(result.node.kind) && world.quest.stage === 1) {
        world.quest.mined++
        if (world.quest.mined >= 3) world.quest.stage = 2
      }
      const { node, monster, plot, ...reply } = result
      send(ws, { type: 'action-result', seq, action: data.action, ...reply, kind: node?.kind, crop: result.crop, monsterKind: monster?.kind, xp: monster?.xp, monsterHp: monster?.hp, maxMonsterHp: monster?.maxHp })
      if (data.action === 'monster' && result.defeated && player.party) {
        for (const peer of room.values()) if (peer !== player && peer.party && peer.mapId === player.mapId && Math.hypot(peer.x - monster.x, peer.y - monster.y) < 300) send(peer.ws, { type: 'party-reward', xp: Math.ceil(monster.xp / 2), coins: 5, from: player.name })
      }
      if (data.action === 'quest-deliver') broadcast(room, { type: 'quest-reward', coins: 40, xp: 20 })
      if (data.action === 'festival' && world.festival.completed) broadcast(room, { type: 'festival-reward', coins: 35, xp: 15 })
      for (const peer of room.values()) send(peer.ws, publicWorld(world))
    } else if (data.type === 'move' && ws.roomCode) {
      const room = rooms.get(ws.roomCode)
      const player = room?.get(ws.playerId)
      if (!player) return
      if (!Number.isFinite(data.x) || !Number.isFinite(data.y) || !['village', 'farm', 'home', 'market', 'magic_city', 'riverside', 'mine', 'mine2', 'mine3'].includes(data.mapId)) return
      const previousMap = player.mapId
      if (Date.now() - (ws.lastMove ?? 0) < 150 && previousMap === data.mapId) return
      ws.lastMove = Date.now()
      player.x = Math.max(16, Math.min(1520, data.x))
      player.y = Math.max(16, Math.min(1008, data.y))
      player.mapId = data.mapId
      player.character = data.character === 'b' ? 'b' : 'a'
      player.facing = [0, 1, 2, 3].includes(data.facing) ? data.facing : 0
      player.moving = !!data.moving
      player.outfit = ['default', 'forest', 'royal', 'mage'].includes(data.outfit) ? data.outfit : 'default'
      const allowedGear = { hat: ['flower_hat', 'wizard_hat'], necklace: ['silver_necklace', 'moon_amulet'], bracelet: ['gold_bracelet', 'star_bracelet'], boots: ['leather_boots', 'cloud_boots'], charm: ['lucky_charm', 'crystal_charm'] }
      player.equipped = Object.fromEntries(Object.entries(allowedGear).filter(([slot, ids]) => ids.includes(data.equipped?.[slot])).map(([slot]) => [slot, data.equipped[slot]]))
      player.mounted = !!data.mounted
      if (previousMap !== player.mapId) send(ws, { type: 'peers', players: [...room.values()].filter(p => p !== player).map(({ ws: _, ...p }) => p) })
      for (const peer of room.values()) if (peer.ws !== ws && (peer.mapId === player.mapId || peer.mapId === previousMap)) send(peer.ws, { type: 'player', player: { ...player, ws: undefined } })
    }
  })
  ws.on('close', () => { leave(ws); chatClients.delete(ws) })
})
setInterval(() => {
  for (const [code, world] of worlds) {
    const room = rooms.get(code)
    if (!room) continue
    const changed = advanceWorld(world)
    if (changed) broadcast(room, publicWorld(world))
    for (const mapId of ['mine', 'mine2', 'mine3']) {
      if (![...room.values()].some(player => player.mapId === mapId)) continue
      const monsters = world.monsters[mapId].map(monster => ({ id: monster.id, x: Math.round(monster.x), y: Math.round(monster.y), remaining: monster.hp }))
      for (const player of room.values()) if (player.mapId === mapId) send(player.ws, { type: 'monster-tick', mapId, monsters })
    }
  }
}, 200)
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.alive === false) { ws.terminate(); continue }
    ws.alive = false; ws.ping()
  }
}, 30000)
wss.on('connection', ws => { ws.alive = true; ws.on('pong', () => { ws.alive = true }) })
server.listen(port, '0.0.0.0', () => console.log(`New Village multiplayer listening on ${port}`))
