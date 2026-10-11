import Phaser from 'phaser'
import './style.css'
import { add, canAdd, count, dayNumber, GROW_MS, initialState, isRaining, KEY, load, MAX_ENERGY, MAX_WATER, persist, refreshGrowth, remove, type CropId, type ItemId } from './domain'
import { collisionTiles, FARM_PLOTS, MAPS, TILE, WORLD_HEIGHT, WORLD_WIDTH, visualTiles, type Interaction, type ResourceNode } from './maps'
import { Multiplayer } from './multiplayer'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<div id="game"></div><div class="vignette"></div>
  <div class="topbar"><div class="brand"><span class="flower">✿</span><span>NEW VILLAGE</span></div><div class="location"><span class="location-label">CURRENT LOCATION</span><strong id="map-name">หมู่บ้าน</strong></div><div id="day-display" class="day-display">☀ วันที่ 1 · 09:00</div><button id="switch-character" title="เปลี่ยนตัวละคร">☺ <span id="character-label">Player A</span></button><button id="new-game" title="เริ่มเกมใหม่">↻ <span>เกมใหม่</span></button></div>
  <div class="status"><div class="coins"><span>✦</span><strong id="coins">50</strong></div><div class="energy"><span>⚡ ENERGY</span><strong id="energy-value">100 / 100</strong><div class="energy-track"><div id="energy-bar"></div></div></div></div>
  <div class="inventory"><div class="section-label">กระเป๋า <small>ลากของไปช่อง 8–10</small></div><div id="inventory-items"></div></div>
  <div class="bottom-center"><div id="prompt" class="prompt hidden"></div><div id="message" class="message" role="status">เลือกจอบด้วยปุ่ม 1 แล้วเดินไปฟาร์มเพื่อขุดแปลง</div><div class="controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> เดิน</span><span><kbd>1</kbd>–<kbd>0</kbd> เลือกช่อง</span><span><kbd>E</kbd> / <kbd>Space</kbd> / คลิก ใช้</span></div></div>
  <div id="hotbar" class="hotbar" aria-label="แถบเครื่องมือ"></div>
  <div class="map-guide"><span class="section-label">แผนที่</span><div id="map-steps"></div></div>
  <div class="multiplayer"><button id="room-toggle" title="เล่นกับเพื่อน">👥 เล่นกับเพื่อน</button><div id="room-panel" class="room-panel hidden"><strong>เล่นกับเพื่อน</strong><p id="room-status">ยังไม่ได้เข้าห้อง</p><input id="player-name" maxlength="20" placeholder="ชื่อของคุณ" aria-label="ชื่อของคุณ"><input id="room-code" maxlength="16" placeholder="รหัสห้อง เช่น FARM123" aria-label="รหัสห้อง"><button id="join-room">เข้าห้อง / สร้างห้อง</button><button id="copy-room" class="hidden">คัดลอกลิงก์ชวนเพื่อน</button><button id="leave-room" class="hidden">ออกจากห้อง</button><small>เพื่อนที่ใช้รหัสเดียวกันจะเห็นกันบนแผนที่</small></div></div>
  <div id="shop" class="overlay hidden"><div class="dialog"><div class="dialog-top"><span>GENERAL STORE</span><button id="close-shop">✕</button></div><h2>ร้านค้าหมู่บ้าน</h2><p>ซื้อเมล็ดไว้ปลูก หรือขายผลผลิตจากฟาร์ม</p><button id="buy" class="trade"><span>✿ เมล็ด Radish <small>ปลูกได้ 1 แปลง</small></span><strong>ซื้อ · 8 Coins</strong></button><button id="sell" class="trade"><span>❀ Radish <small>ผลผลิตจากสวน</small></span><strong>ขาย · 15 Coins</strong></button><div class="dialog-foot">กด <kbd>1</kbd> ซื้อ &nbsp; <kbd>2</kbd> ขาย &nbsp; <kbd>Esc</kbd> ปิด</div></div></div>
  <div id="market-shop" class="overlay hidden"><div class="dialog market-dialog"><div class="dialog-top"><span>FARMERS' MARKET</span><button id="close-market">✕</button></div><h2>ตลาดเมล็ดพันธุ์</h2><p>ซื้อเมล็ดไปปลูกที่ฟาร์ม หรือขายผลผลิตที่เก็บมา</p><button class="trade" data-buy="radish_seed"><span>✿ เมล็ด Radish <small>โตได้หลังรดน้ำ 60 วินาที</small></span><strong>8 Coins</strong></button><button class="trade" data-buy="carrot_seed"><span>🥕 เมล็ดแครอท <small>ขุดแปลง → ปลูก → รดน้ำ</small></span><strong>10 Coins</strong></button><button class="trade" data-buy="tomato_seed"><span>🍅 เมล็ดมะเขือเทศ <small>ขุดแปลง → ปลูก → รดน้ำ</small></span><strong>12 Coins</strong></button><div class="market-divider">รับซื้อผลผลิต</div><button class="trade" data-sell="carrot"><span>🥕 แครอท</span><strong>ขาย 18 Coins</strong></button><button class="trade" data-sell="tomato"><span>🍅 มะเขือเทศ</span><strong>ขาย 22 Coins</strong></button><div class="dialog-foot">ลากเมล็ดจากกระเป๋าไป Hotbar ช่อง 8–10 · กด <kbd>Esc</kbd> ปิด</div></div></div>`

const ui = {
  map: document.querySelector<HTMLElement>('#map-name')!,
  day: document.querySelector<HTMLElement>('#day-display')!,
  coins: document.querySelector<HTMLElement>('#coins')!,
  energy: document.querySelector<HTMLElement>('#energy-value')!,
  energyBar: document.querySelector<HTMLElement>('#energy-bar')!,
  inventory: document.querySelector<HTMLElement>('#inventory-items')!,
  hotbar: document.querySelector<HTMLElement>('#hotbar')!,
  prompt: document.querySelector<HTMLElement>('#prompt')!,
  message: document.querySelector<HTMLElement>('#message')!,
  steps: document.querySelector<HTMLElement>('#map-steps')!,
  shop: document.querySelector<HTMLElement>('#shop')!
}
const characterLabel = document.querySelector<HTMLElement>('#character-label')!
let { state, error } = load()
let saveBlocked = !!error
let shopOpen = false
let marketOpen = false
let scene: WorldScene | undefined
let messageTimer: number | undefined
const multiplayer = new Multiplayer()
const roomPanel = document.querySelector<HTMLElement>('#room-panel')!
const roomStatus = document.querySelector<HTMLElement>('#room-status')!
const playerName = document.querySelector<HTMLInputElement>('#player-name')!
const roomCode = document.querySelector<HTMLInputElement>('#room-code')!
const copyRoom = document.querySelector<HTMLButtonElement>('#copy-room')!
const leaveRoom = document.querySelector<HTMLButtonElement>('#leave-room')!
playerName.value = localStorage.getItem('new-village.player-name') || ''
roomCode.value = new URLSearchParams(location.search).get('room') || ''
document.querySelector('#room-toggle')!.addEventListener('click', () => roomPanel.classList.toggle('hidden'))
document.querySelector('#join-room')!.addEventListener('click', () => {
  const code = roomCode.value.trim().toUpperCase()
  if (!/^[A-Z0-9-]{3,16}$/.test(code)) { roomStatus.textContent = 'รหัสห้องต้องมี 3–16 ตัวอักษรหรือตัวเลข'; return }
  const name = playerName.value.trim() || `ชาวสวน${Math.floor(100 + Math.random() * 900)}`
  playerName.value = name
  localStorage.setItem('new-village.player-name', name)
  multiplayer.connect(code, name, state.character ?? 'a')
})
copyRoom.addEventListener('click', async () => {
  const url = new URL(location.href); url.searchParams.set('room', multiplayer.room)
  try { await navigator.clipboard.writeText(url.toString()); announce('คัดลอกลิงก์ชวนเพื่อนแล้ว') }
  catch { announce(`ส่งลิงก์นี้ให้เพื่อน: ${url}`) }
})
leaveRoom.addEventListener('click', () => { multiplayer.disconnect(); roomStatus.textContent = 'ออกจากห้องแล้ว' })
multiplayer.onStatus = text => { roomStatus.textContent = text; copyRoom.classList.toggle('hidden', !multiplayer.room); leaveRoom.classList.toggle('hidden', !multiplayer.room) }
multiplayer.onChange = () => { scene?.syncRemotePlayers(); if (multiplayer.room) scene?.sendPresence(true) }
const HOTBAR_FIXED = [
  { icon: '⚒', name: 'จอบ' }, { icon: '💧', name: 'บัวรดน้ำ' },
  { icon: '🪓', name: 'ขวาน' }, { icon: '⛏', name: 'อีเต้อ' },
  { icon: '🌾', name: 'เคียว' }, { icon: '✿', name: 'เมล็ด Radish' },
  { icon: '❀', name: 'Radish' }
]
const ITEMS: Record<ItemId, { icon: string; name: string }> = {
  radish_seed: { icon: '✿', name: 'เมล็ด Radish' }, radish: { icon: '❀', name: 'Radish' },
  carrot_seed: { icon: '🥕', name: 'เมล็ดแครอท' }, carrot: { icon: '🥕', name: 'แครอท' },
  tomato_seed: { icon: '🍅', name: 'เมล็ดมะเขือเทศ' }, tomato: { icon: '🍅', name: 'มะเขือเทศ' },
  wood: { icon: '🪵', name: 'ไม้' }, stone: { icon: '🪨', name: 'หิน' }, fiber: { icon: '🌿', name: 'เส้นใย' }
}
type SeedId = 'radish_seed' | 'carrot_seed' | 'tomato_seed'
function selectedSeedId(): SeedId | null {
  const slot = state.selectedSlot ?? 0
  if (slot === 5) return 'radish_seed'
  const item = slot >= 7 ? state.hotbarExtras?.[slot - 7] : null
  return item === 'carrot_seed' || item === 'tomato_seed' || item === 'radish_seed' ? item : null
}
function activeActionSlot(): number {
  const slot = state.selectedSlot ?? 0
  if (slot < 7) return slot
  const item = state.hotbarExtras?.[slot - 7]
  return item === 'radish_seed' ? 5 : item === 'radish' ? 6 : slot
}

function announce(text: string) {
  ui.message.textContent = text
  ui.message.classList.add('visible')
  if (messageTimer) window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => ui.message.classList.remove('visible'), 5500)
}
if (error) announce(error)
function hud() {
  characterLabel.textContent = `Player ${(state.character ?? 'a').toUpperCase()}`
  ui.map.textContent = MAPS[state.player.mapId].name
  ui.coins.textContent = String(state.player.coins)
  ui.energy.textContent = `${state.player.energy} / ${MAX_ENERGY}`
  ui.energyBar.style.width = `${state.player.energy}%`
  clock()
  ui.inventory.innerHTML = state.inventory.length
    ? state.inventory.map(item => `<div class="item" draggable="true" data-item="${item.itemId}"><span class="item-icon">${ITEMS[item.itemId].icon}</span><div><strong>${ITEMS[item.itemId].name}</strong><small>ลากไปช่องว่างได้</small></div><b>×${item.quantity}</b></div>`).join('')
    : '<div class="empty-bag">กระเป๋าว่าง</div>'
  ui.hotbar.innerHTML = Array.from({ length: 10 }, (_, i) => {
    const extra = state.hotbarExtras?.[i - 7] ?? null
    const item = i < 7 ? HOTBAR_FIXED[i] : extra ? ITEMS[extra] : { icon: '＋', name: 'ช่องว่าง' }
    const badge = i === 1 ? `${state.water ?? MAX_WATER}/${MAX_WATER}` : i === 5 ? String(count(state, 'radish_seed')) : i === 6 ? String(count(state, 'radish')) : extra ? String(count(state, extra)) : ''
    return `<button class="hotbar-slot ${i === (state.selectedSlot ?? 0) ? 'selected' : ''}" data-slot="${i}" title="${item.name}"><span class="slot-key">${i === 9 ? 0 : i + 1}</span><span class="slot-icon">${item.icon}</span><span class="slot-name">${item.name}</span>${badge ? `<span class="slot-count">${badge}</span>` : ''}</button>`
  }).join('')
  ui.steps.innerHTML = `<div class="${state.player.mapId === 'village' ? 'active' : ''}">01 <span>หมู่บ้าน</span></div><div class="${state.player.mapId === 'farm' ? 'active' : ''}">02 <span>บ้านและฟาร์ม</span></div><div class="${state.player.mapId === 'home' ? 'active' : ''}">03 <span>ภายในบ้าน</span></div><div class="${state.player.mapId === 'market' ? 'active' : ''}">04 <span>ตลาด</span></div>`
}
function clock() {
  const day = dayNumber(state)
  const minute = Math.floor(((Date.now() - (state.dayStartedAt ?? Date.now())) % 120000) / 120000 * 720)
  ui.day.textContent = `${isRaining(day) ? '☂ ฝนตก' : '☀ วันฟ้าใส'} · วันที่ ${day} · ${String(6 + Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}
function changed() {
  hud()
  if (!saveBlocked && !persist(state)) announce('บันทึกเกมไม่ได้ แต่ยังเล่นต่อได้')
}
hud()
ui.hotbar.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-slot]')
  if (!button) return
  state.selectedSlot = Number(button.dataset.slot)
  changed(); announce(`เลือก${button.title}`)
})
ui.inventory.addEventListener('dragstart', event => {
  const item = (event.target as HTMLElement).closest<HTMLElement>('[data-item]')
  if (item?.dataset.item) event.dataTransfer?.setData('text/plain', item.dataset.item)
})
ui.hotbar.addEventListener('dragover', event => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-slot]')
  if (button && Number(button.dataset.slot) >= 7) event.preventDefault()
})
ui.hotbar.addEventListener('drop', event => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-slot]')
  if (!button || Number(button.dataset.slot) < 7) return
  event.preventDefault()
  const itemId = event.dataTransfer?.getData('text/plain') as ItemId
  if (!ITEMS[itemId] || count(state, itemId) < 1) return
  state.hotbarExtras ??= [null, null, null]
  state.hotbarExtras[Number(button.dataset.slot) - 7] = itemId
  changed(); announce(`ใส่${ITEMS[itemId].name}ในช่อง ${Number(button.dataset.slot) + 1}`)
})

function buy() {
  if (state.player.coins < 8) return announce('Coins ไม่พอซื้อเมล็ด')
  if (!canAdd(state, 'radish_seed')) return announce('กระเป๋าเต็ม')
  state.player.coins -= 8; add(state, 'radish_seed'); changed(); announce('ซื้อเมล็ด Radish แล้ว')
}
function sell() {
  if (!remove(state, 'radish')) return announce('ยังไม่มี Radish ให้ขาย')
  state.player.coins += 15; changed(); announce('ขาย Radish ได้ 15 Coins')
}
function closeShop() { shopOpen = false; marketOpen = false; ui.shop.classList.add('hidden'); document.querySelector('#market-shop')!.classList.add('hidden') }
function openShop() { shopOpen = true; ui.shop.classList.remove('hidden'); announce('ยินดีต้อนรับสู่ร้านค้าหมู่บ้าน') }
function openMarket() { marketOpen = true; document.querySelector('#market-shop')!.classList.remove('hidden'); announce('ยินดีต้อนรับสู่ตลาดเมล็ดพันธุ์') }
const marketPrices: Record<SeedId, number> = { radish_seed: 8, carrot_seed: 10, tomato_seed: 12 }
function marketBuy(itemId: SeedId) {
  const price = marketPrices[itemId]
  if (state.player.coins < price) return announce('Coins ไม่พอซื้อเมล็ด')
  if (!canAdd(state, itemId)) return announce('กระเป๋าเต็ม')
  state.player.coins -= price; add(state, itemId); changed(); announce(`ซื้อ${ITEMS[itemId].name}แล้ว`)
}
function marketSell(itemId: 'carrot' | 'tomato') {
  if (!remove(state, itemId)) return announce(`ยังไม่มี${ITEMS[itemId].name}ให้ขาย`)
  const price = itemId === 'carrot' ? 18 : 22
  state.player.coins += price; changed(); announce(`ขาย${ITEMS[itemId].name}ได้ ${price} Coins`)
}
document.querySelector('#buy')!.addEventListener('click', buy)
document.querySelector('#sell')!.addEventListener('click', sell)
document.querySelector('#close-shop')!.addEventListener('click', closeShop)
ui.shop.addEventListener('click', event => { if (event.target === ui.shop) closeShop() })
const marketShop = document.querySelector<HTMLElement>('#market-shop')!
marketShop.addEventListener('click', event => {
  if (event.target === marketShop || (event.target as HTMLElement).closest('#close-market')) { closeShop(); return }
  const buyId = (event.target as HTMLElement).closest<HTMLElement>('[data-buy]')?.dataset.buy as SeedId | undefined
  const sellId = (event.target as HTMLElement).closest<HTMLElement>('[data-sell]')?.dataset.sell as 'carrot' | 'tomato' | undefined
  if (buyId && buyId in marketPrices) marketBuy(buyId)
  if (sellId === 'carrot' || sellId === 'tomato') marketSell(sellId)
})
document.querySelector('#new-game')!.addEventListener('click', () => {
  if (!window.confirm('เริ่มเกมใหม่และลบข้อมูลบันทึกเดิม?')) return
  try { localStorage.removeItem(KEY); localStorage.removeItem('new-village.save.v1') } catch { return announce('ลบข้อมูลบันทึกไม่ได้') }
  state = initialState(); saveBlocked = false; closeShop(); changed(); scene?.scene.restart(); announce('เริ่มเกมใหม่แล้ว')
})
document.querySelector('#switch-character')!.addEventListener('click', () => {
  state.character = state.character === 'b' ? 'a' : 'b'
  scene?.setCharacter()
  scene?.sendPresence(true)
  changed()
  announce(`เลือก Player ${state.character.toUpperCase()} แล้ว`)
})

class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>
  private e!: Phaser.Input.Keyboard.Key
  private one!: Phaser.Input.Keyboard.Key
  private two!: Phaser.Input.Keyboard.Key
  private space!: Phaser.Input.Keyboard.Key
  private hotbarKeys!: Phaser.Input.Keyboard.Key[]
  private esc!: Phaser.Input.Keyboard.Key
  private plotMarkers: Phaser.GameObjects.Container[] = []
  private resourceMarkers: Phaser.GameObjects.Container[] = []
  private restingUntil = 0
  private lastSave = 0
  private lastGrowthCheck = 0
  private interactionCooldown = 0
  private facing = 0
  private actionUntil = 0
  private actionRow = 0
  private lastClock = 0
  private remoteSprites = new Map<string, { sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }>()

  constructor() { super('World') }
  preload() {
    for (const config of Object.values(MAPS)) if (!this.textures.exists(config.id)) this.load.image(config.id, config.image)
    if (!this.textures.exists('player-a')) this.load.spritesheet('player-a', '/assets/player-a.png', { frameWidth: 280, frameHeight: 280 })
    if (!this.textures.exists('player-b')) this.load.spritesheet('player-b', '/assets/player-b.png', { frameWidth: 280, frameHeight: 280 })
    if (!this.textures.exists('npcs')) this.load.spritesheet('npcs', '/assets/npcs.png', { frameWidth: 591, frameHeight: 887 })
  }
  create() {
    scene = this
    const config = MAPS[state.player.mapId]
    const artwork = this.make.tilemap({ data: visualTiles(), tileWidth: TILE, tileHeight: TILE })
    const artworkTiles = artwork.addTilesetImage(config.id, config.id, TILE, TILE)
    if (!artworkTiles || !artwork.createLayer(0, artworkTiles, 0, 0)) throw new Error('Visual tilemap unavailable')
    if (!this.textures.exists('collision-tile')) {
      const tile = this.make.graphics({ x: 0, y: 0 })
      tile.fillStyle(0xffffff).fillRect(0, 0, TILE, TILE)
      tile.generateTexture('collision-tile', TILE, TILE)
      tile.destroy()
    }
    const map = this.make.tilemap({ data: collisionTiles(config), tileWidth: TILE, tileHeight: TILE })
    const tileset = map.addTilesetImage('collision-tile', 'collision-tile', TILE, TILE)
    if (!tileset) throw new Error('Tilemap tileset unavailable')
    const blockers = map.createLayer(0, tileset, 0, 0)
    if (!blockers) throw new Error('Tilemap collision layer unavailable')
    blockers.setCollision(1).setVisible(false)
    this.player = this.physics.add.sprite(state.player.x, state.player.y, `player-${state.character ?? 'a'}`, 0).setDepth(20).setScale(.23)
    this.player.body!.setSize(104, 78).setOffset(88, 194)
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, blockers)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT).startFollow(this.player, true, .12, .12)
    this.resizeCamera()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeCamera, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeCamera, this))
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>
    this.e = this.input.keyboard!.addKey('E')
    this.one = this.input.keyboard!.addKey('ONE')
    this.two = this.input.keyboard!.addKey('TWO')
    this.space = this.input.keyboard!.addKey('SPACE')
    this.hotbarKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO'].map(key => this.input.keyboard!.addKey(key))
    this.esc = this.input.keyboard!.addKey('ESC')
    if (config.id === 'farm') { this.drawPlots(); this.drawResources() }
    if (config.id === 'village') {
      this.addNpc(0, 530, 418, 'Shopkeeper')
      this.addNpc(2, 565, 790, 'Village Guide')
    }
    if (config.id === 'market') {
      const labelStyle = { fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#fff9dc', backgroundColor: '#243829', padding: { x: 9, y: 4 } }
      this.add.text(460, 245, 'เมล็ดพันธุ์', labelStyle).setOrigin(.5).setDepth(12)
      this.add.text(1090, 270, 'ของทำสวน', labelStyle).setOrigin(.5).setDepth(12)
    }
    if (config.id === 'home') this.addNpc(1, 1090, 382, 'Cook')
    this.input.on('pointerdown', () => this.useSelected())
    this.syncRemotePlayers()
    this.sendPresence(true)
    hud()
  }

  setCharacter() {
    if (this.player?.active) this.player.setTexture(`player-${state.character ?? 'a'}`, this.facing)
  }

  sendPresence(force = false) {
    if (this.player?.active) multiplayer.send(this.player.x, this.player.y, state.player.mapId, state.character ?? 'a', this.facing, this.player.body?.velocity.length() !== 0, force)
  }

  syncRemotePlayers() {
    for (const [id, objects] of this.remoteSprites) if (!multiplayer.players.has(id) || multiplayer.players.get(id)?.mapId !== state.player.mapId) {
      objects.sprite.destroy(); objects.label.destroy(); this.remoteSprites.delete(id)
    }
    for (const peer of multiplayer.players.values()) {
      if (peer.mapId !== state.player.mapId) continue
      let objects = this.remoteSprites.get(peer.id)
      if (!objects) {
        const sprite = this.add.sprite(peer.x, peer.y, `player-${peer.character}`, 0).setDepth(19).setScale(.23).setAlpha(.9)
        const label = this.add.text(peer.x, peer.y - 49, peer.name, { fontFamily: 'Nunito, sans-serif', fontSize: '15px', color: '#ffffff', backgroundColor: '#244b46', padding: { x: 6, y: 2 } }).setOrigin(.5).setDepth(21)
        objects = { sprite, label }; this.remoteSprites.set(peer.id, objects)
      }
      objects.sprite.setTexture(`player-${peer.character}`)
      objects.sprite.setData('targetX', peer.x).setData('targetY', peer.y)
      objects.sprite.setFrame((peer.moving ? 1 + Math.floor(this.time.now / 180) % 2 : 0) * 4 + peer.facing)
      objects.label.setText(peer.name)
    }
  }

  private addNpc(frame: number, x: number, y: number, name: string) {
    this.add.image(x, y - 30, 'npcs', frame).setScale(.1).setDepth(12)
    this.add.text(x, y - 85, name, { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#fff9dc', backgroundColor: '#243829', padding: { x: 7, y: 3 } }).setOrigin(.5).setDepth(13)
  }

  private resizeCamera() {
    const width = this.scale.width, height = this.scale.height
    this.cameras.main.setSize(width, height)
    this.cameras.main.setZoom(Math.max(width / WORLD_WIDTH, height / WORLD_HEIGHT))
  }

  private drawPlots() {
    this.plotMarkers.forEach(marker => marker.destroy())
    this.plotMarkers = []
    state.plots.forEach((plot, i) => {
      const { x, y } = FARM_PLOTS[i]
      const g = this.add.graphics()
      if (plot.state === 'EMPTY') {
        g.fillStyle(0xabc578, .72).fillRoundedRect(-64, -47, 128, 94, 4)
        g.fillStyle(0x89ad60, .75)
        for (let j = -2; j <= 2; j++) g.fillEllipse(j * 23, j % 2 ? 12 : -12, 14, 7)
      } else if (plot.state === 'TILLED') {
        g.lineStyle(3, 0x5b3522, .7).strokeRoundedRect(-62, -46, 124, 92, 4)
        for (let j = -1; j <= 1; j++) g.lineBetween(-50, j * 24, 50, j * 24)
      } else if (plot.state === 'WITHERED') {
        g.fillStyle(0x78694d, .8).fillRoundedRect(-62, -46, 124, 92, 4)
        g.lineStyle(4, 0xc4ad82).lineBetween(-16, -18, 0, 14).lineBetween(0, 14, 13, -15)
      } else if (plot.state === 'PLANTED') {
        g.fillStyle(0x6ab34f).fillRect(-8, -8, 16, 11)
        g.fillStyle(0x3f8436).fillRect(-4, -16, 8, 10)
      } else {
        const ready = plot.state === 'READY'
        for (const dx of [-20, 0, 20]) {
          g.fillStyle(0x4c9a3c).fillRect(dx - 9, -15, 18, 20)
          g.fillStyle(0x82ca5c).fillRect(dx - 4, -22, 9, 12)
          if (ready) g.fillStyle(({ radish: 0xf2cad0, carrot: 0xf19a38, tomato: 0xe64c40 } as Record<CropId, number>)[plot.cropId ?? 'radish']).fillRect(dx - 7, 6, 14, 14)
        }
      }
      this.plotMarkers.push(this.add.container(x, y, [g]).setDepth(5))
    })
  }

  private drawResources() {
    this.resourceMarkers.forEach(marker => marker.destroy())
    this.resourceMarkers = []
    for (const node of MAPS.farm.resources ?? []) {
      if ((state.nodeHp?.[node.id] ?? node.hp) <= 0) continue
      const g = this.add.graphics()
      if (node.kind === 'tree') {
        g.fillStyle(0x583a27).fillRect(-8, 1, 16, 30)
        g.fillStyle(0x366d3e).fillCircle(0, -12, 29)
        g.fillStyle(0x6eaf5c).fillCircle(-10, -22, 19)
        g.fillStyle(0x86c66c).fillCircle(13, -23, 15)
      } else if (node.kind === 'rock') {
        g.fillStyle(0x626b6a).fillTriangle(-31, 23, -11, -22, 25, 22)
        g.fillStyle(0x9ba7a1).fillTriangle(-12, -21, 25, 22, 34, 7)
        g.lineStyle(3, 0xd4d9ca).lineBetween(-10, -15, 9, 5)
      } else {
        for (const dx of [-17, 0, 17]) {
          g.lineStyle(5, 0x427e38).lineBetween(dx, 20, dx - 6, -12)
          g.lineStyle(4, 0x81ba50).lineBetween(dx, 20, dx + 9, -19)
        }
      }
      this.resourceMarkers.push(this.add.container(node.x, node.y, [g]).setDepth(7))
    }
  }

  private nearest(): { interaction?: Interaction; plot?: number; resource?: ResourceNode; distance: number } | null {
    const x = this.player.x, y = this.player.y
    const targets: { interaction?: Interaction; plot?: number; resource?: ResourceNode; distance: number }[] = []
    for (const interaction of MAPS[state.player.mapId].interactions) {
      if (interaction.kind === 'door') continue
      const distance = Math.hypot(x - interaction.x, y - interaction.y)
      if (distance < 95) targets.push({ interaction, distance })
    }
    if (state.player.mapId === 'farm') FARM_PLOTS.forEach((plot, i) => {
      const distance = Math.hypot(x - plot.x, y - plot.y)
      if (distance < 100) targets.push({ plot: i, distance })
    })
    if (state.player.mapId === 'farm') for (const node of MAPS.farm.resources ?? []) {
      if ((state.nodeHp?.[node.id] ?? node.hp) <= 0) continue
      const distance = Math.hypot(x - node.x, y - node.y)
      if (distance < 100) targets.push({ resource: node, distance })
    }
    const selected = activeActionSlot()
    const score = (target: typeof targets[number]) => target.distance - (
      target.plot !== undefined && ([0, 1, 4].includes(selected) || !!selectedSeedId()) ? 25 :
      target.resource && ((selected === 2 && target.resource.kind === 'tree') || (selected === 3 && target.resource.kind === 'rock') || (selected === 4 && target.resource.kind === 'grass')) ? 25 : 0)
    return targets.sort((a, b) => score(a) - score(b))[0] ?? null
  }

  private usePlot(i: number) {
    const plot = state.plots[i]
    const selected = activeActionSlot()
    if (selected === 0) {
      if (!['EMPTY', 'WITHERED'].includes(plot.state)) return announce('แปลงนี้ขุดแล้ว เลือกเมล็ดหรือเครื่องมืออื่น')
      if (state.player.energy < 2) return announce('Energy ไม่พอใช้จอบ')
      state.player.energy -= 2; plot.state = 'TILLED'; plot.cropId = null; plot.readyAt = null; plot.dryDays = 0
      this.showAction(4); announce('ขุดแปลงแล้ว เลือกเมล็ดช่อง 6 เพื่อปลูก')
    } else if (selectedSeedId()) {
      const seedId = selectedSeedId()!
      if (plot.state !== 'TILLED') return announce('ต้องใช้จอบขุดดินก่อนปลูก')
      if (count(state, seedId) < 1) return announce('เมล็ดหมด ซื้อเพิ่มได้ที่ตลาด')
      if (state.player.energy < 2) return announce('Energy ไม่พอปลูก')
      remove(state, seedId); state.player.energy -= 2
      plot.state = 'PLANTED'; plot.cropId = seedId.replace('_seed', '') as CropId; plot.dryDays = 0; plot.wateredDay = null
      this.showAction(4)
      if (isRaining(dayNumber(state))) { refreshGrowth(state); announce('ปลูกแล้ว ฝนรดน้ำให้อัตโนมัติ') }
      else announce('ปลูกแล้ว เลือกบัวรดน้ำช่อง 2')
    } else if (selected === 1) {
      if (plot.state !== 'PLANTED') return announce(plot.state === 'GROWING' ? `กำลังโต อีก ${Math.max(0, Math.ceil(((plot.readyAt ?? 0) - Date.now()) / 1000))} วินาที` : 'รดน้ำได้หลังปลูกเมล็ด')
      if ((state.water ?? MAX_WATER) < 1) return announce('บัวรดน้ำหมด ไปเติมที่บ่อในฟาร์ม')
      if (state.player.energy < 1) return announce('Energy ไม่พอรดน้ำ')
      state.water = (state.water ?? MAX_WATER) - 1; state.player.energy -= 1
      plot.state = 'GROWING'; plot.readyAt = Date.now() + GROW_MS; plot.wateredDay = dayNumber(state); plot.dryDays = 0
      this.showAction(3); announce('รดน้ำแล้ว อีก 60 วินาทีจะเก็บได้')
    } else if (selected === 4) {
      if (plot.state !== 'READY') return announce('ยังเก็บไม่ได้ รอให้พืชโตเต็มที่')
      const cropId = plot.cropId as CropId
      if (!canAdd(state, cropId)) return announce('กระเป๋าเต็ม ต้นผักยังอยู่')
      if (state.player.energy < 2) return announce('Energy ไม่พอเก็บเกี่ยว')
      add(state, cropId); state.player.energy -= 2
      plot.state = 'TILLED'; plot.cropId = null; plot.readyAt = null; plot.dryDays = 0; plot.wateredDay = null
      this.showAction(4); announce(`เก็บ${ITEMS[cropId].name}แล้ว แปลงพร้อมปลูกใหม่`)
    } else return announce('เลือกเครื่องมือให้ตรงงาน: จอบ → เมล็ด → บัวรดน้ำ → เคียว')
    this.drawPlots(); changed()
  }

  private useNode(node: ResourceNode) {
    const selected = activeActionSlot()
    const required = { tree: 2, rock: 3, grass: 4 }[node.kind]
    if (selected !== required) return announce(`ต้องใช้${{ tree: 'ขวาน', rock: 'อีเต้อ', grass: 'เคียว' }[node.kind]}กับสิ่งนี้`)
    const cost = node.kind === 'grass' ? 1 : 3
    if (state.player.energy < cost) return announce('Energy ไม่พอใช้เครื่องมือ')
    const remaining = state.nodeHp?.[node.id] ?? node.hp
    const drop: ItemId = { tree: 'wood', rock: 'stone', grass: 'fiber' }[node.kind] as ItemId
    if (remaining === 1 && !canAdd(state, drop)) return announce('กระเป๋าเต็ม วัตถุดิบยังอยู่')
    state.player.energy -= cost
    state.nodeHp ??= {}
    state.nodeHp[node.id] = remaining - 1
    this.showAction(4)
    if (remaining === 1) { add(state, drop); this.drawResources(); announce(`เก็บ${ITEMS[drop].name}ได้ 1 ชิ้น`) }
    else announce(`ใช้${HOTBAR_FIXED[selected].name}แล้ว อีก ${remaining - 1} ครั้ง`)
    changed()
  }

  private useSelected() {
    if (shopOpen || marketOpen || this.restingUntil || this.actionUntil > this.time.now || this.time.now < this.interactionCooldown) return
    const nearest = this.nearest()
    if (nearest?.interaction) { this.interactionCooldown = this.time.now + 250; this.interact(nearest.interaction); return }
    if (activeActionSlot() === 6) {
      if (count(state, 'radish') < 1) return announce('ยังไม่มี Radish')
      if (state.player.energy === MAX_ENERGY) return announce('Energy เต็มแล้ว เก็บ Radish ไว้ขายหรือทำอาหาร')
      remove(state, 'radish'); state.player.energy = Math.min(MAX_ENERGY, state.player.energy + 10)
      changed(); announce('กิน Radish แล้ว Energy +10'); return
    }
    if (nearest?.plot !== undefined) { this.interactionCooldown = this.time.now + 250; this.usePlot(nearest.plot); return }
    if (nearest?.resource) { this.interactionCooldown = this.time.now + 250; this.useNode(nearest.resource); return }
    if (selectedSeedId()) return announce('เดินเข้าใกล้แปลงที่ขุดแล้วในฟาร์มเพื่อปลูก')
    if (activeActionSlot() >= 7) return announce('ช่องนี้ใช้ถือวัตถุดิบสำหรับคราฟต์ในอนาคต')
    announce('เดินเข้าใกล้แปลงหรือวัตถุที่ใช้เครื่องมือนี้')
  }

  private showAction(row: number) {
    this.actionRow = row
    this.actionUntil = this.time.now + 550
    this.player.setFrame(row * 4 + this.facing)
  }

  private travel(target: Interaction) {
    if (!target.destination || !target.arrival) return
    state.player.mapId = target.destination
    state.player.x = target.arrival.x; state.player.y = target.arrival.y
    changed(); this.scene.restart(); announce(`เข้าสู่${MAPS[target.destination].name}`)
    multiplayer.send(state.player.x, state.player.y, state.player.mapId, state.character ?? 'a', this.facing, false, true)
  }

  private interact(target: Interaction) {
    if (target.kind === 'future') return announce('เส้นทางนี้จะเปิดในอัปเดตถัดไป')
    if (target.kind === 'shop') return openShop()
    if (target.kind === 'market_shop') return openMarket()
    if (target.kind === 'refill') {
      if ((state.water ?? MAX_WATER) === MAX_WATER) return announce('บัวรดน้ำเต็มแล้ว')
      state.water = MAX_WATER; changed(); announce('เติมน้ำเต็มบัวแล้ว')
      return
    }
    if (target.kind === 'quest') {
      if (state.questDone) return announce('เควสต์แรกสำเร็จแล้ว ขอบคุณที่ช่วยหมู่บ้าน!')
      if (!remove(state, 'radish')) return announce('เควสต์แรก: นำ Radish 1 ชิ้นมาส่ง รับ 20 Coins')
      state.player.coins += 20; state.questDone = true; changed(); announce('ส่ง Radish สำเร็จ ได้รับ 20 Coins!')
      return
    }
    if (target.kind === 'rest') {
      if (state.player.energy === MAX_ENERGY) return announce('Energy เต็มแล้ว')
      this.restingUntil = this.time.now + 3000; announce('กำลังนอนพัก หยุดเดิน 3 วินาที')
      return
    }
    if (target.kind === 'cook') {
      if (!state.recipeUnlocked) {
        state.recipeUnlocked = true; changed(); announce('แม่ครัวสอนสูตรซุป Radish แล้ว! กด E อีกครั้งเพื่อทำอาหาร')
        return
      }
      if (count(state, 'radish') < 1) return announce('ต้องใช้ Radish 1 ชิ้นในการทำอาหาร')
      if (state.player.energy === MAX_ENERGY) return announce('Energy เต็มแล้ว เก็บ Radish ไว้ก่อน')
      remove(state, 'radish'); state.player.energy = Math.min(MAX_ENERGY, state.player.energy + 15)
      changed(); announce('ทำซุป Radish แล้ว Energy +15')
      return
    }
    if (target.kind === 'storage') announce('ที่เก็บของและคราฟต์จะเพิ่มในอัปเดตถัดไป')
  }

  update(time: number) {
    for (const objects of this.remoteSprites.values()) {
      const x = objects.sprite.getData('targetX'), y = objects.sprite.getData('targetY')
      objects.sprite.x = Phaser.Math.Linear(objects.sprite.x, x, .35)
      objects.sprite.y = Phaser.Math.Linear(objects.sprite.y, y, .35)
      objects.label.setPosition(objects.sprite.x, objects.sprite.y - 49)
    }
    if (time - this.lastClock > 1000) { this.lastClock = time; clock() }
    if (time - this.lastGrowthCheck > 250) {
      this.lastGrowthCheck = time
      if (refreshGrowth(state)) { if (state.player.mapId === 'farm') this.drawPlots(); changed(); announce('พืชโตพร้อมเก็บแล้ว!') }
    }
    if (Phaser.Input.Keyboard.JustDown(this.esc)) closeShop()
    if (shopOpen || marketOpen) {
      this.player.setVelocity(0)
      if (shopOpen && Phaser.Input.Keyboard.JustDown(this.one)) buy()
      if (shopOpen && Phaser.Input.Keyboard.JustDown(this.two)) sell()
      return
    }
    this.hotbarKeys.forEach((key, index) => {
      if (Phaser.Input.Keyboard.JustDown(key)) { state.selectedSlot = index; changed(); announce(`เลือก${index < 7 ? HOTBAR_FIXED[index].name : state.hotbarExtras?.[index - 7] ? ITEMS[state.hotbarExtras[index - 7]!].name : 'ช่องว่าง'}`) }
    })
    let x = Number(this.cursors.right.isDown || this.wasd.D.isDown) - Number(this.cursors.left.isDown || this.wasd.A.isDown)
    let y = Number(this.cursors.down.isDown || this.wasd.S.isDown) - Number(this.cursors.up.isDown || this.wasd.W.isDown)
    if (this.restingUntil && (x || y)) { this.restingUntil = 0; announce('ยกเลิกการพัก') }
    if (this.restingUntil && time >= this.restingUntil) {
      this.restingUntil = 0; state.player.energy = MAX_ENERGY; changed(); announce('พักเต็มอิ่ม Energy ฟื้นแล้ว')
    }
    if (this.restingUntil) { x = 0; y = 0 }
    if (this.actionUntil > time) { x = 0; y = 0 }
    const length = Math.hypot(x, y) || 1
    this.player.setVelocity(x / length * 220, y / length * 220)
    if (x || y) this.facing = y > 0 ? 0 : y < 0 ? 1 : x < 0 ? 2 : 3
    if (this.actionUntil > time) this.player.setFrame(this.actionRow * 4 + this.facing)
    else this.player.setFrame((x || y ? 1 + Math.floor(time / 180) % 2 : 0) * 4 + this.facing)
    state.player.x = this.player.x; state.player.y = this.player.y
    this.sendPresence()
    if (time > this.interactionCooldown) {
      for (const door of MAPS[state.player.mapId].interactions) {
        if (door.kind === 'door' && Math.hypot(this.player.x - door.x, this.player.y - door.y) < 54) {
          this.interactionCooldown = time + 600
          this.travel(door)
          return
        }
      }
    }
    const nearest = this.nearest()
    if (nearest) {
      let label = nearest.interaction?.label ?? ''
      if (nearest.plot !== undefined) {
        const stateName = state.plots[nearest.plot].state
        label = { EMPTY: 'ขุดแปลงด้วยจอบ', TILLED: 'ปลูกด้วยเมล็ด', PLANTED: 'รดน้ำด้วยบัว', GROWING: 'ดูเวลาที่เหลือ', READY: 'เก็บด้วยเคียว', WITHERED: 'ขุดแปลงใหม่' }[stateName]
      }
      if (nearest.resource) label = { tree: 'ตัดด้วยขวาน', rock: 'ทุบด้วยอีเต้อ', grass: 'ตัดด้วยเคียว' }[nearest.resource.kind]
      ui.prompt.innerHTML = `<kbd>E</kbd> ${label}`
      ui.prompt.classList.remove('hidden')
    } else ui.prompt.classList.add('hidden')
    if (Phaser.Input.Keyboard.JustDown(this.e) || Phaser.Input.Keyboard.JustDown(this.space)) this.useSelected()
    if (time - this.lastSave > 15000) {
      this.lastSave = time
      if (!saveBlocked && !persist(state)) announce('บันทึกเกมไม่ได้ แต่ยังเล่นต่อได้')
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: window.innerWidth, height: window.innerHeight,
  transparent: true, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } }, scene: [WorldScene],
  render: { pixelArt: true, antialias: false }
})
