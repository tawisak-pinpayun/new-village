import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { WebSocket } from 'ws'

async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  server.close()
  await once(server, 'close')
  return port
}

function nextMessage(socket, type) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.off('message', onMessage); reject(new Error(`Missing ${type}`)) }, 5000)
    function onMessage(raw) {
      const value = JSON.parse(raw.toString())
      if (value.type !== type) return
      clearTimeout(timeout); socket.off('message', onMessage); resolve(value)
    }
    socket.on('message', onMessage)
  })
}

test('world chat and twelve-player room stay responsive without echoing movement', async t => {
  const port = await freePort()
  const child = spawn(process.execPath, ['server/index.mjs'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] })
  t.after(() => child.kill())
  await Promise.race([
    new Promise(resolve => child.stdout.on('data', chunk => { if (chunk.toString().includes('listening')) resolve() })),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Server did not start')), 5000))
  ])
  const sockets = []
  t.after(() => sockets.forEach(socket => socket.close()))
  for (let i = 0; i < 12; i++) {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/multiplayer`)
    sockets.push(socket)
    await once(socket, 'open')
    const joined = nextMessage(socket, 'joined')
    socket.send(JSON.stringify({ type: 'join', room: 'LOADTEST', name: `Player${i}` }))
    await joined
  }
  let sentToSelf = 0, receivedByOthers = 0
  sockets.forEach((socket, index) => socket.on('message', raw => {
    const value = JSON.parse(raw.toString())
    if (value.type !== 'player' || value.player?.x !== 600) return
    if (value.player?.name === `Player${index}`) sentToSelf++
    else receivedByOthers++
  }))
  sockets[0].send(JSON.stringify({ type: 'move', x: 600, y: 600, mapId: 'mine3', character: 'a', facing: 0, moving: true }))
  await new Promise(resolve => setTimeout(resolve, 250))
  assert.equal(sentToSelf, 0)
  assert.equal(receivedByOthers, 11)

  const chatter = new WebSocket(`ws://127.0.0.1:${port}/multiplayer`)
  sockets.push(chatter)
  await once(chatter, 'open')
  const history = nextMessage(chatter, 'chat-history')
  chatter.send(JSON.stringify({ type: 'chat-join', name: 'Tester' }))
  await history
  const heard = nextMessage(chatter, 'chat')
  chatter.send(JSON.stringify({ type: 'chat', text: 'ทดสอบแชทโลก' }))
  assert.equal((await heard).text, 'ทดสอบแชทโลก')
})

test('two clients receive one shared resource result and party mine reward', async t => {
  const port = await freePort()
  const child = spawn(process.execPath, ['server/index.mjs'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] })
  t.after(() => child.kill())
  await Promise.race([new Promise(resolve => child.stdout.on('data', chunk => { if (chunk.toString().includes('listening')) resolve() })), new Promise((_, reject) => setTimeout(() => reject(new Error('Server did not start')), 5000))])
  const clients = []
  let firstWorld
  t.after(() => clients.forEach(socket => socket.close()))
  for (const name of ['A', 'B']) {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/multiplayer`)
    clients.push(socket)
    await once(socket, 'open')
    const joined = nextMessage(socket, 'joined'), world = nextMessage(socket, 'world-state')
    socket.send(JSON.stringify({ type: 'join', room: 'SHARED', name }))
    await joined
    const snapshot = await world
    if (!firstWorld) firstWorld = snapshot
  }
  const [a, b] = clients
  for (const socket of clients) socket.send(JSON.stringify({ type: 'move', x: 425, y: 845, mapId: 'farm', character: 'a', facing: 0 }))
  await new Promise(resolve => setTimeout(resolve, 190))
  const resultA = nextMessage(a, 'action-result'), updatedB = nextMessage(b, 'world-state')
  a.send(JSON.stringify({ type: 'world-action', seq: 1, action: 'node', id: 'farm-grass-1', damage: 1 }))
  assert.equal((await resultA).defeated, true)
  assert.equal((await updatedB).nodeHp['farm-grass-1'], 0)
  const resultB = nextMessage(b, 'action-result')
  b.send(JSON.stringify({ type: 'world-action', seq: 1, action: 'node', id: 'farm-grass-1', damage: 1 }))
  assert.equal((await resultB).ok, false)

  const monster = firstWorld.monsters.mine[0]
  for (const socket of clients) {
    socket.send(JSON.stringify({ type: 'move', x: monster.x, y: monster.y, mapId: 'mine', character: 'a', facing: 0 }))
    socket.send(JSON.stringify({ type: 'party', join: true }))
  }
  await new Promise(resolve => setTimeout(resolve, 190))
  const reward = nextMessage(b, 'party-reward'), kill = nextMessage(a, 'action-result')
  a.send(JSON.stringify({ type: 'world-action', seq: 2, action: 'monster', id: monster.id, damage: 5 }))
  assert.equal((await kill).defeated, true)
  assert.ok((await reward).xp > 0)
})

test('garden gate and campfire changes reach everyone in the room', async t => {
  const port = await freePort()
  const child = spawn(process.execPath, ['server/index.mjs'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] })
  t.after(() => child.kill())
  await Promise.race([new Promise(resolve => child.stdout.on('data', chunk => { if (chunk.toString().includes('listening')) resolve() })), new Promise((_, reject) => setTimeout(() => reject(new Error('Server did not start')), 5000))])
  const sockets = []
  t.after(() => sockets.forEach(socket => socket.close()))
  for (const name of ['A', 'B']) {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/multiplayer`)
    sockets.push(socket)
    await once(socket, 'open')
    const joined = nextMessage(socket, 'joined'), world = nextMessage(socket, 'world-state')
    socket.send(JSON.stringify({ type: 'join', room: 'GARDEN', name }))
    await joined; await world
  }
  const [a, b] = sockets
  a.send(JSON.stringify({ type: 'move', x: 770, y: 870, mapId: 'farm', character: 'a', facing: 0 }))
  await new Promise(resolve => setTimeout(resolve, 190))
  const gateResult = nextMessage(a, 'action-result'), gateWorld = nextMessage(b, 'world-state')
  a.send(JSON.stringify({ type: 'world-action', seq: 1, action: 'garden-gate' }))
  assert.equal((await gateResult).ok, true)
  assert.equal((await gateWorld).gardenGateOpen, true)
  a.send(JSON.stringify({ type: 'move', x: 600, y: 820, mapId: 'farm', character: 'a', facing: 0 }))
  await new Promise(resolve => setTimeout(resolve, 190))
  const fireResult = nextMessage(a, 'action-result'), fireWorld = nextMessage(b, 'world-state')
  a.send(JSON.stringify({ type: 'world-action', seq: 2, action: 'campfire', operation: 'place' }))
  assert.equal((await fireResult).ok, true)
  assert.deepEqual((await fireWorld).campfires, [{ mapId: 'farm', x: 600, y: 845 }])
})
