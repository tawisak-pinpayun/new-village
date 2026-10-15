import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { WebSocketServer, WebSocket } from 'ws'
import { actPlot, advanceWorld, hitMonster, hitResource, makeWorld, publicWorld } from './world.mjs'
import { createAccountApi, createAccountStore } from './accounts.mjs'

const port = Number(process.env.PORT || 3000)
const root = resolve('dist')
const rooms = new Map()
const worlds = new Map()
const chatClients = new Set()
const chatHistory = new Map()
let accountApi = null
if (process.env.MONGODB_URI) {
  try {
    const store = createAccountStore(process.env.MONGODB_URI)
    await store.init()
    accountApi = createAccountApi(store)
  } catch (error) { console.error('Online saves unavailable:', error?.name ?? 'UnknownError') }
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
const server = createServer(async (req, res) => {
  if (req.url === '/health') { res.writeHead(200); res.end('ok'); return }
  if ((req.url || '').startsWith('/api/')) {
    if (accountApi) await accountApi(req, res)
    else { res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify({ error: 'ระบบเซฟออนไลน์ยังไม่พร้อม' })) }
    return
  }
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
function broadcastChat(server, value) { for (const ws of chatClients) if (ws.chatServer === server) send(ws, value) }
function onlinePlayers(server) { return [...chatClients].filter(ws => ws.chatServer === server).map(ws => ({ id: ws.playerId, name: ws.chatName })) }
function announcePresence(server, name, action) { broadcastChat(server, { type: 'chat-notice', text: `${name}${action === 'join' ? ' เข้าสู่แชทโลก' : ' ออกจากแชทโลก'}`, time: Date.now() }); broadcastChat(server, { type: 'online-players', players: onlinePlayers(server) }) }
function leave(ws) {
  const room = rooms.get(ws.roomKey)
  if (!room) return
  room.delete(ws.playerId)
  broadcast(room, { type: 'left', id: ws.playerId })
  if (!room.size) { rooms.delete(ws.roomKey); worlds.delete(ws.roomKey) }
  ws.roomKey = undefined
}
wss.on('connection', ws => {
  ws.playerId = String(nextId++)
  ws.on('message', raw => {
    let data
    try { data = JSON.parse(raw.toString()) } catch { return }
    if (data.type === 'chat-join') {
      if (chatClients.has(ws)) return
      ws.chatName = String(data.name || 'ชาวบ้าน').trim().slice(0, 20) || 'ชาวบ้าน'
      ws.chatServer = [1, 2, 3].includes(data.server) ? data.server : 1
      chatClients.add(ws)
      send(ws, { type: 'chat-history', messages: chatHistory.get(ws.chatServer) || [] })
      announcePresence(ws.chatServer, ws.chatName, 'join')
    } else if (data.type === 'chat-name' && chatClients.has(ws)) {
      ws.chatName = String(data.name || 'ชาวบ้าน').trim().slice(0, 20) || 'ชาวบ้าน'
    } else if (data.type === 'chat' && chatClients.has(ws)) {
      if (Date.now() - (ws.lastChat ?? 0) < 800) return
      const message = String(data.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200)
      if (!message) return
      ws.lastChat = Date.now()
      const entry = { type: 'chat', name: ws.chatName, text: message, time: Date.now() }
      const history = chatHistory.get(ws.chatServer) || []
      history.push(entry)
      if (history.length > 40) history.shift()
      chatHistory.set(ws.chatServer, history)
      broadcastChat(ws.chatServer, entry)
    } else if (data.type === 'join') {
      const selectedServer = [1, 2, 3].includes(data.server) ? data.server : 1
      const key = String(selectedServer)
      leave(ws)
      const room = rooms.get(key) || new Map()
      rooms.set(key, room)
      if (!worlds.has(key)) worlds.set(key, makeWorld())
      ws.roomKey = key
      const player = { id: ws.playerId, name: String(data.name || 'เพื่อน').trim().slice(0, 20) || 'เพื่อน', x: 768, y: 800, mapId: 'village', character: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].includes(data.character) ? data.character : 'a', facing: 0, moving: false, outfit: 'default', mounted: false, pet: null, partyCode: '', ws }
      room.set(ws.playerId, player)
      send(ws, { type: 'joined', id: ws.playerId, server: selectedServer, players: [...room.values()].filter(p => p !== player).map(({ ws: _, ...p }) => p) })
      send(ws, publicWorld(worlds.get(key)))
      broadcast(room, { type: 'player', player: { ...player, ws: undefined } }, ws)
    } else if (data.type === 'party' && ws.roomKey) {
      const room = rooms.get(ws.roomKey), player = room?.get(ws.playerId)
      if (!player) return
      const partyCode = String(data.code || '').trim().toUpperCase()
      if (partyCode && !/^[A-Z0-9]{6}$/.test(partyCode)) return send(ws, { type: 'party-error', message: 'รหัสปาร์ตี้ต้องมีตัวอักษรหรือตัวเลข 6 ตัว' })
      player.partyCode = partyCode
      send(ws, { type: 'party-state', code: partyCode })
      for (const peer of room.values()) send(peer.ws, { type: 'player', player: { ...player, ws: undefined } })
    } else if (data.type === 'pet-note' && ws.roomKey) {
      const room = rooms.get(ws.roomKey), player = room?.get(ws.playerId)
      if (!player || player.pet !== 'bird' || !player.partyCode || Date.now() - (ws.lastPetNote ?? 0) < 45_000) return
      const message = String(data.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 60)
      if (!message) return
      ws.lastPetNote = Date.now()
      for (const peer of room.values()) if (peer.partyCode === player.partyCode) send(peer.ws, { type: 'pet-note', from: player.name, text: message })
    } else if (data.type === 'world-action' && ws.roomKey) {
      const room = rooms.get(ws.roomKey), world = worlds.get(ws.roomKey), player = room?.get(ws.playerId)
      if (!room || !world || !player) return
      const seq = Number(data.seq)
      if (!Number.isInteger(seq) || seq < 1) return
      if (Date.now() - (ws.lastAction ?? 0) < 130) return send(ws, { type: 'action-result', seq, ok: false, message: 'ทำรายการเร็วเกินไป' })
      ws.lastAction = Date.now()
      advanceWorld(world)
      let result
      if (data.action === 'node') result = hitResource(world, player, String(data.id || ''), data.damage)
      else if (data.action === 'monster') result = hitMonster(world, player, String(data.id || ''), data.damage)
      else if (data.action === 'plot') result = actPlot(world, player, Number(data.index), data.plotAction, data.cropId, Date.now(), player.pet === 'chicken' ? .95 : 1)
      else if (data.action === 'pet-grow') {
        const index = Number(data.index), plot = world.plots[index], positions = [[610, 540], [770, 540], [925, 540], [610, 655], [770, 655], [925, 655]]
        const valid = player.pet === 'chicken' && player.mapId === 'farm' && Number.isInteger(index) && index >= 0 && index < 6 && plot?.state === 'GROWING' && Math.hypot(player.x - positions[index][0], player.y - positions[index][1]) < 145 && Date.now() - (ws.lastPetGrow ?? 0) >= 90_000
        result = valid ? { ok: true } : { ok: false, message: 'ไม่มีแปลงที่เร่งโตได้ใกล้ตัว หรือสกิลยังไม่พร้อม' }
        if (valid) { plot.readyAt = Math.max(Date.now(), plot.readyAt - 15_000); ws.lastPetGrow = Date.now() }
      }
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
      if (data.action === 'monster' && result.defeated && player.partyCode) {
        for (const peer of room.values()) if (peer !== player && peer.partyCode === player.partyCode && peer.mapId === player.mapId && Math.hypot(peer.x - monster.x, peer.y - monster.y) < 300) send(peer.ws, { type: 'party-reward', xp: Math.ceil(monster.xp / 2), coins: 5, from: player.name })
      }
      if (data.action === 'quest-deliver') broadcast(room, { type: 'quest-reward', coins: 40, xp: 20 })
      if (data.action === 'festival' && world.festival.completed) broadcast(room, { type: 'festival-reward', coins: 35, xp: 15 })
      for (const peer of room.values()) send(peer.ws, publicWorld(world))
    } else if (data.type === 'move' && ws.roomKey) {
      const room = rooms.get(ws.roomKey)
      const player = room?.get(ws.playerId)
      if (!player) return
      if (!Number.isFinite(data.x) || !Number.isFinite(data.y) || !['village', 'farm', 'home', 'market', 'magic_city', 'riverside', 'city', 'mine', 'mine2', 'mine3'].includes(data.mapId)) return
      const previousMap = player.mapId
      if (Date.now() - (ws.lastMove ?? 0) < 150 && previousMap === data.mapId) return
      ws.lastMove = Date.now()
      player.x = Math.max(16, Math.min(1520, data.x))
      player.y = Math.max(16, Math.min(1008, data.y))
      player.mapId = data.mapId
      player.character = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].includes(data.character) ? data.character : 'a'
      player.facing = [0, 1, 2, 3].includes(data.facing) ? data.facing : 0
      player.moving = !!data.moving
      player.outfit = ['default', 'forest', 'royal', 'mage', 'explorer', 'starlight', 'ceremonial'].includes(data.outfit) ? data.outfit : 'default'
      const allowedGear = { hat: ['flower_hat', 'wizard_hat'], necklace: ['silver_necklace', 'moon_amulet'], bracelet: ['gold_bracelet', 'star_bracelet'], boots: ['leather_boots', 'cloud_boots'], charm: ['lucky_charm', 'crystal_charm'] }
      player.equipped = Object.fromEntries(Object.entries(allowedGear).filter(([slot, ids]) => ids.includes(data.equipped?.[slot])).map(([slot]) => [slot, data.equipped[slot]]))
      player.mounted = !!data.mounted
      player.pet = ['dog', 'cat', 'chicken', 'cow', 'goat', 'magic_dog', 'bird'].includes(data.pet) ? data.pet : null
      if (previousMap !== player.mapId) send(ws, { type: 'peers', players: [...room.values()].filter(p => p !== player).map(({ ws: _, ...p }) => p) })
      for (const peer of room.values()) if (peer.ws !== ws && (peer.mapId === player.mapId || peer.mapId === previousMap)) send(peer.ws, { type: 'player', player: { ...player, ws: undefined } })
    }
  })
  ws.on('close', () => { leave(ws); if (chatClients.delete(ws)) announcePresence(ws.chatServer, ws.chatName, 'leave') })
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
