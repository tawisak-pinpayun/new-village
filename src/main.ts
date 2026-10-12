import Phaser from 'phaser'
import './style.css'
import { add, canAdd, count, craftArcaneSword, DAY_MS, dayNumber, eat, equipmentStats, gainXp, GEAR, GEAR_IDS, GROW_MS, isRaining, load, maxHp, maxMana, MAX_ENERGY, MAX_WATER, persist, rareDrop, refreshGrowth, remove, validate, xpNeeded, type CropId, type GearId, type GearSlot, type ItemId, type OutfitId, type Save } from './domain'
import { collisionTiles, FARM_PLOTS, MAPS, TILE, WORLD_HEIGHT, WORLD_WIDTH, type Interaction, type ResourceNode } from './maps'
import { Multiplayer } from './multiplayer'
import { WorldChat } from './world-chat'
import { mineFloor, monstersFor, type Monster } from './monsters'
import { drawAppearance } from './appearance'
import { calendarAt, type Calendar } from './calendar'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `<div id="game"></div><div class="vignette"></div>
  <div class="topbar"><div class="brand"><span class="flower">✿</span><span>NEW VILLAGE</span></div><div class="location"><span class="location-label">CURRENT LOCATION</span><strong id="map-name">หมู่บ้าน</strong></div><div id="day-display" class="day-display">🌸 ใบไม้ผลิ · วันที่ 1 · 06:00</div><button id="dress-toggle" title="แต่งตัวและดูสเตตัส">👗 แต่งตัว</button><button id="switch-character" title="เปลี่ยนตัวละคร">☺ <span id="character-label">Player A</span></button></div>
  <div class="status"><div class="coins"><span>✦</span><strong id="coins">50</strong></div><div class="energy"><span>⚡ ENERGY</span><strong id="energy-value">100 / 100</strong><div class="energy-track"><div id="energy-bar"></div></div></div><div class="vitals"><div><span>❤️ HP</span><b id="hp-value"></b></div><div class="vital-track"><i id="hp-bar"></i></div><div><span>✨ MANA</span><b id="mana-value"></b></div><div class="vital-track"><i id="mana-bar"></i></div><div><span id="level-value">LV 1</span><b id="xp-value"></b></div><div class="vital-track"><i id="xp-bar"></i></div></div></div>
  <div class="inventory"><div class="section-label">กระเป๋า <small>ลากของไปช่อง 8–10</small></div><div id="inventory-items"></div></div>
  <div class="bottom-center"><div id="prompt" class="prompt hidden"></div><div id="message" class="message" role="status">เลือกจอบด้วยปุ่ม 1 แล้วเดินไปฟาร์มเพื่อขุดแปลง</div><div class="controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> เดิน</span><span><kbd>1</kbd>–<kbd>0</kbd> เลือกช่อง</span><span><kbd>E</kbd> / <kbd>Space</kbd> / คลิก ใช้</span><span><kbd>F</kbd> ก่อกองไฟ (ไม้ 2 หิน 1)</span></div></div>
  <div id="hotbar" class="hotbar" aria-label="แถบเครื่องมือ"></div>
  <div class="map-guide"><span class="section-label">แผนที่</span><div id="map-steps"></div></div>
  <div class="multiplayer"><button id="account-toggle" title="บัญชีและเซฟออนไลน์">☁️ บัญชี / เซฟออนไลน์</button><button id="room-toggle" title="เล่นกับเพื่อน">👥 เล่นกับเพื่อน</button><div id="room-panel" class="room-panel hidden"><strong>เล่นกับเพื่อน</strong><p id="room-status">ยังไม่ได้เข้าห้อง</p><input id="player-name" maxlength="20" placeholder="ชื่อของคุณ" aria-label="ชื่อของคุณ"><input id="room-code" maxlength="16" placeholder="รหัสห้อง เช่น FARM123" aria-label="รหัสห้อง"><button id="join-room">เข้าห้อง / สร้างห้อง</button><button id="party-toggle" class="hidden">⚔️ เข้าปาร์ตี้เหมือง</button><button id="copy-room" class="hidden">คัดลอกลิงก์ชวนเพื่อน</button><button id="leave-room" class="hidden">ออกจากห้อง</button><small>เพื่อนที่ใช้รหัสเดียวกันจะเห็นกันบนแผนที่</small></div></div>
  <div id="account-panel" class="overlay hidden"><div class="dialog account-dialog"><div class="dialog-top"><span>ONLINE SAVE</span><button id="close-account" aria-label="ปิด">✕</button></div><h2>บัญชีและเซฟออนไลน์</h2><p id="account-status">กำลังตรวจสอบระบบ...</p><div id="account-form"><label>อีเมล<input id="account-email-input" type="email" maxlength="254" autocomplete="email"></label><label>รหัสผ่าน<input id="account-password" type="password" minlength="12" maxlength="128" autocomplete="current-password"></label><div class="account-actions"><button id="account-login" type="button">เข้าสู่ระบบ</button><button id="account-register" type="button">สร้างบัญชี</button></div><small>รหัสผ่านอย่างน้อย 12 ตัวอักษร</small></div><div id="account-signed" class="hidden"><strong id="account-email"></strong><p id="cloud-status"></p><div id="save-choice" class="hidden"><p>พบทั้งเซฟในเครื่องนี้และเซฟในบัญชี เลือกข้อมูลที่จะใช้:</p><button id="use-cloud">ใช้เซฟในบัญชี</button><button id="use-local">นำเซฟเครื่องนี้ขึ้นบัญชี</button></div><button id="account-logout">ออกจากระบบ</button></div></div></div>
  <div id="community-panel" class="community-panel hidden"><strong>🤝 เควสต์ร่วมในห้อง</strong><span id="community-quest"></span><small id="community-festival"></small></div>
  <div class="world-chat"><button id="chat-toggle">🌍 แชทโลก</button><div id="chat-panel" class="chat-panel hidden"><strong>แชทโลก</strong><small id="chat-status">กำลังเชื่อมต่อ...</small><div id="chat-log" role="log" aria-live="polite"></div><form id="chat-form"><input id="chat-input" maxlength="200" placeholder="พิมพ์ข้อความ..." aria-label="ข้อความแชท"><button type="submit">ส่ง</button></form></div></div>
  <div id="shop" class="overlay hidden"><div class="dialog"><div class="dialog-top"><span>GENERAL STORE</span><button id="close-shop">✕</button></div><h2>ร้านค้าหมู่บ้าน</h2><p>ซื้อเมล็ดไว้ปลูก หรือขายผลผลิตจากฟาร์ม</p><button id="buy" class="trade"><span>✿ เมล็ด Radish <small>ปลูกได้ 1 แปลง</small></span><strong>ซื้อ · 8 Coins</strong></button><button id="sell" class="trade"><span>❀ Radish <small>ผลผลิตจากสวน</small></span><strong>ขาย · 15 Coins</strong></button><div class="dialog-foot">กด <kbd>1</kbd> ซื้อ &nbsp; <kbd>2</kbd> ขาย &nbsp; <kbd>Esc</kbd> ปิด</div></div></div>
  <div id="market-shop" class="overlay hidden"><div class="dialog market-dialog"><div class="dialog-top"><span>FARMERS' MARKET</span><button id="close-market">✕</button></div><h2>ตลาดเมล็ดพันธุ์และอุปกรณ์</h2><p>ซื้อเมล็ด อาหาร และอาวุธ หรือขายของที่หาได้</p><button class="trade" data-buy="radish_seed"><span>✿ เมล็ด Radish</span><strong>8 Coins</strong></button><button class="trade" data-buy="carrot_seed"><span>🥕 เมล็ดแครอท</span><strong>10 Coins</strong></button><button class="trade" data-buy="tomato_seed"><span>🍅 เมล็ดมะเขือเทศ</span><strong>12 Coins</strong></button><div class="market-divider">อาหารและอาวุธ</div><button class="trade" data-buy="rice_meal"><span>🍚 ข้าวกล่อง <small>ฟื้น HP และพลังงาน คลิกในกระเป๋าเพื่อกิน</small></span><strong>12 Coins</strong></button><button class="trade" data-buy="sword"><span>⚔️ ดาบ</span><strong>35 Coins</strong></button><button class="trade" data-buy="bow"><span>🏹 ธนู</span><strong>55 Coins</strong></button><div class="market-divider">รับซื้อ</div><button class="trade" data-sell="carrot"><span>🥕 แครอท</span><strong>18 Coins</strong></button><button class="trade" data-sell="tomato"><span>🍅 มะเขือเทศ</span><strong>22 Coins</strong></button><button class="trade" data-sell="meat"><span>🍖 เนื้อ</span><strong>16 Coins</strong></button><button class="trade" data-sell="hide"><span>🟤 หนังสัตว์</span><strong>12 Coins</strong></button><button class="trade" data-sell="copper"><span>🟠 แร่ทองแดง</span><strong>14 Coins</strong></button><button class="trade" data-sell="iron"><span>⚪ แร่เหล็ก</span><strong>22 Coins</strong></button><button class="trade" data-sell="moonstone"><span>💎 จันทราศิลา</span><strong>120 Coins</strong></button><div class="dialog-foot">ลากอาวุธไป Hotbar ช่อง 8–10 · กด <kbd>Esc</kbd> ปิด</div></div></div>
  <div id="special-shop" class="overlay hidden"><div class="dialog market-dialog"><div class="dialog-top"><span id="special-label"></span><button id="close-special">✕</button></div><h2 id="special-title"></h2><p id="special-description"></p><div id="special-list"></div><div class="dialog-foot">กด <kbd>Esc</kbd> ปิด</div></div></div>
  <div id="wardrobe" class="overlay hidden"><div class="dialog wardrobe-dialog"><div class="dialog-top"><span>WARDROBE</span><button id="close-wardrobe">✕</button></div><h2>แต่งตัวและอุปกรณ์</h2><div id="wardrobe-content"></div><div class="dialog-foot">ซื้อชุดและเครื่องประดับจากร้านเสื้อผ้าในตลาดหรือเมืองเวทมนตร์ · กด <kbd>Esc</kbd> ปิด</div></div></div>
  <div id="festival-shop" class="overlay hidden"><div class="dialog"><div class="dialog-top"><span>HARVEST FESTIVAL</span><button id="close-festival">✕</button></div><h2>งานเทศกาลเก็บเกี่ยว</h2><p id="festival-description"></p><div id="festival-items"></div><div class="dialog-foot">นำผลผลิตมาร่วมงาน · กด <kbd>Esc</kbd> ปิด</div></div></div>`

const ui = {
  map: document.querySelector<HTMLElement>('#map-name')!,
  day: document.querySelector<HTMLElement>('#day-display')!,
  coins: document.querySelector<HTMLElement>('#coins')!,
  energy: document.querySelector<HTMLElement>('#energy-value')!,
  energyBar: document.querySelector<HTMLElement>('#energy-bar')!,
  hp: document.querySelector<HTMLElement>('#hp-value')!, hpBar: document.querySelector<HTMLElement>('#hp-bar')!,
  mana: document.querySelector<HTMLElement>('#mana-value')!, manaBar: document.querySelector<HTMLElement>('#mana-bar')!,
  level: document.querySelector<HTMLElement>('#level-value')!, xp: document.querySelector<HTMLElement>('#xp-value')!, xpBar: document.querySelector<HTMLElement>('#xp-bar')!,
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
let specialOpen = false
let wardrobeOpen = false
let festivalOpen = false
let specialKind: 'tailor' | 'magic_shop' | 'forge' | null = null
let scene: WorldScene | undefined
let messageTimer: number | undefined
const multiplayer = new Multiplayer()
let soloWorldBackup: { plots: typeof state.plots; nodeHp: NonNullable<typeof state.nodeHp>; gardenGateOpen: boolean; campfires: NonNullable<typeof state.campfires> } | null = null
const accountPanel = document.querySelector<HTMLElement>('#account-panel')!
const accountStatus = document.querySelector<HTMLElement>('#account-status')!
const cloudStatus = document.querySelector<HTMLElement>('#cloud-status')!
const saveChoice = document.querySelector<HTMLElement>('#save-choice')!
const accountForm = document.querySelector<HTMLElement>('#account-form')!
const accountSigned = document.querySelector<HTMLElement>('#account-signed')!
const accountEmailInput = document.querySelector<HTMLInputElement>('#account-email-input')!
const accountPassword = document.querySelector<HTMLInputElement>('#account-password')!
let accountEmail: string | null = null
let cloudRevision: number | null = null
let pendingCloudSave: { data: Save; revision: number } | null = null
let cloudDirty = false
let cloudUploading = false
let cloudTimer: number | undefined

async function accountRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  const result = await response.json()
  if (!response.ok) throw Object.assign(new Error(result.error ?? 'ระบบเซฟออนไลน์ขัดข้อง'), { status: response.status })
  return result as T
}

function cloudSnapshot(): Save {
  const copy = structuredClone(state)
  if (multiplayer.world && soloWorldBackup) {
    copy.plots = structuredClone(soloWorldBackup.plots)
    copy.nodeHp = structuredClone(soloWorldBackup.nodeHp)
    copy.gardenGateOpen = soloWorldBackup.gardenGateOpen
    copy.campfires = structuredClone(soloWorldBackup.campfires)
  }
  return copy
}

function queueCloudSave() {
  if (!accountEmail || cloudRevision === null || pendingCloudSave) return
  cloudDirty = true
  cloudStatus.textContent = 'กำลังรออัปโหลดเซฟ...'
  if (cloudTimer) window.clearTimeout(cloudTimer)
  cloudTimer = window.setTimeout(() => { void flushCloudSave() }, 1200)
}

async function flushCloudSave() {
  if (cloudUploading || !cloudDirty || cloudRevision === null || !accountEmail) return
  cloudUploading = true
  cloudDirty = false
  const revision = cloudRevision
  try {
    const saved = await accountRequest<{ revision: number }>('/api/save', 'PUT', { revision, data: cloudSnapshot() })
    cloudRevision = saved.revision
    cloudStatus.textContent = 'เซฟออนไลน์แล้ว'
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 409) {
      cloudRevision = null
      cloudStatus.textContent = 'เซฟถูกเปลี่ยนจากอีกเครื่อง กรุณาเลือกข้อมูลที่จะใช้'
      await chooseCloudSave()
    } else {
      cloudDirty = true
      cloudStatus.textContent = `ยังอัปโหลดไม่ได้: ${(error as Error).message} · เซฟในเครื่องยังอยู่`
    }
  } finally {
    cloudUploading = false
    if (cloudDirty && cloudRevision !== null) cloudTimer = window.setTimeout(() => { void flushCloudSave() }, 15_000)
  }
}

async function chooseCloudSave() {
  try {
    const remote = await accountRequest<{ data: unknown; revision: number }>('/api/save')
    if (remote.data === null) {
      pendingCloudSave = null
      cloudRevision = 0
      saveChoice.classList.add('hidden')
      queueCloudSave()
    } else if (validate(remote.data)) {
      pendingCloudSave = { data: remote.data, revision: remote.revision }
      cloudRevision = null
      saveChoice.classList.remove('hidden')
      cloudStatus.textContent = 'พบเซฟในบัญชี เลือกเซฟที่จะใช้ก่อนเล่นต่อ'
      accountPanel.classList.remove('hidden')
    } else cloudStatus.textContent = 'เซฟออนไลน์ไม่ถูกต้อง เซฟในเครื่องยังปลอดภัย'
  } catch (error) { cloudStatus.textContent = (error as Error).message }
}

async function signedIn(email: string) {
  accountEmail = email
  accountPassword.value = ''
  accountForm.classList.add('hidden')
  accountSigned.classList.remove('hidden')
  document.querySelector<HTMLElement>('#account-email')!.textContent = email
  document.querySelector<HTMLElement>('#account-toggle')!.textContent = '☁️ เซฟออนไลน์'
  accountStatus.textContent = 'เข้าสู่ระบบแล้ว'
  await chooseCloudSave()
}

async function authenticate(mode: 'login' | 'register') {
  accountStatus.textContent = 'กำลังเชื่อมต่อ...'
  try {
    const result = await accountRequest<{ email: string }>(`/api/${mode}`, 'POST', { email: accountEmailInput.value.trim(), password: accountPassword.value })
    await signedIn(result.email)
  } catch (error) { accountStatus.textContent = (error as Error).message }
}

document.querySelector('#account-toggle')!.addEventListener('click', () => accountPanel.classList.remove('hidden'))
document.querySelector('#close-account')!.addEventListener('click', () => accountPanel.classList.add('hidden'))
accountPanel.addEventListener('click', event => { if (event.target === accountPanel) accountPanel.classList.add('hidden') })
document.querySelector('#account-login')!.addEventListener('click', () => { void authenticate('login') })
document.querySelector('#account-register')!.addEventListener('click', () => { void authenticate('register') })
document.querySelector('#use-cloud')!.addEventListener('click', () => {
  if (!pendingCloudSave) return
  if (multiplayer.room) multiplayer.disconnect()
  state = structuredClone(pendingCloudSave.data)
  refreshGrowth(state)
  saveBlocked = false
  cloudRevision = pendingCloudSave.revision
  pendingCloudSave = null
  saveChoice.classList.add('hidden')
  persist(state); hud(); scene?.scene.restart()
  cloudStatus.textContent = 'ใช้เซฟจากบัญชีแล้ว'
  accountPanel.classList.add('hidden')
})
document.querySelector('#use-local')!.addEventListener('click', () => {
  if (!pendingCloudSave) return
  cloudRevision = pendingCloudSave.revision
  pendingCloudSave = null
  saveChoice.classList.add('hidden')
  queueCloudSave()
  accountPanel.classList.add('hidden')
})
document.querySelector('#account-logout')!.addEventListener('click', async () => {
  if (cloudTimer) window.clearTimeout(cloudTimer)
  await flushCloudSave()
  try { await accountRequest('/api/logout', 'POST') } catch { /* local save remains available */ }
  accountEmail = null; cloudRevision = null; pendingCloudSave = null; cloudDirty = false
  accountForm.classList.remove('hidden'); accountSigned.classList.add('hidden'); saveChoice.classList.add('hidden')
  document.querySelector<HTMLElement>('#account-toggle')!.textContent = '☁️ บัญชี / เซฟออนไลน์'
  accountStatus.textContent = 'ออกจากระบบแล้ว เซฟในเครื่องยังอยู่'
})

async function initializeAccount() {
  try {
    const result = await accountRequest<{ email: string | null }>('/api/me')
    if (result.email) await signedIn(result.email)
    else accountStatus.textContent = 'เข้าสู่ระบบเพื่อเก็บตัวละครและเล่นต่อจากเครื่องอื่น'
  } catch (error) {
    accountStatus.textContent = (error as Error).message
    accountForm.classList.add('hidden')
  }
}
const worldChat = new WorldChat()
const roomPanel = document.querySelector<HTMLElement>('#room-panel')!
const roomStatus = document.querySelector<HTMLElement>('#room-status')!
const playerName = document.querySelector<HTMLInputElement>('#player-name')!
const roomCode = document.querySelector<HTMLInputElement>('#room-code')!
const copyRoom = document.querySelector<HTMLButtonElement>('#copy-room')!
const leaveRoom = document.querySelector<HTMLButtonElement>('#leave-room')!
const partyToggle = document.querySelector<HTMLButtonElement>('#party-toggle')!
let inParty = false
playerName.value = localStorage.getItem('new-village.player-name') || ''
roomCode.value = new URLSearchParams(location.search).get('room') || ''
document.querySelector('#room-toggle')!.addEventListener('click', () => roomPanel.classList.toggle('hidden'))
document.querySelector('#join-room')!.addEventListener('click', () => {
  const code = roomCode.value.trim().toUpperCase()
  if (!/^[A-Z0-9-]{3,16}$/.test(code)) { roomStatus.textContent = 'รหัสห้องต้องมี 3–16 ตัวอักษรหรือตัวเลข'; return }
  const name = playerName.value.trim() || `ชาวสวน${Math.floor(100 + Math.random() * 900)}`
  playerName.value = name
  localStorage.setItem('new-village.player-name', name)
  worldChat.setName(name)
  multiplayer.connect(code, name, state.character ?? 'a')
})
copyRoom.addEventListener('click', async () => {
  const url = new URL(location.href); url.searchParams.set('room', multiplayer.room)
  try { await navigator.clipboard.writeText(url.toString()); announce('คัดลอกลิงก์ชวนเพื่อนแล้ว') }
  catch { announce(`ส่งลิงก์นี้ให้เพื่อน: ${url}`) }
})
leaveRoom.addEventListener('click', () => { multiplayer.disconnect(); inParty = false; roomStatus.textContent = 'ออกจากห้องแล้ว'; renderCommunity() })
partyToggle.addEventListener('click', () => { inParty = !inParty; multiplayer.setParty(inParty); partyToggle.textContent = inParty ? '✅ อยู่ในปาร์ตี้เหมือง' : '⚔️ เข้าปาร์ตี้เหมือง'; announce(inParty ? 'เข้าปาร์ตี้แล้ว คนในปาร์ตี้ที่อยู่ใกล้กันในเหมืองจะได้ XP ร่วมกัน' : 'ออกจากปาร์ตี้แล้ว') })
multiplayer.onStatus = text => { roomStatus.textContent = text; copyRoom.classList.toggle('hidden', !multiplayer.room); leaveRoom.classList.toggle('hidden', !multiplayer.room); partyToggle.classList.toggle('hidden', !multiplayer.room) }
multiplayer.onChange = () => scene?.syncRemotePlayers()
multiplayer.onJoined = () => { soloWorldBackup = { plots: state.plots.map(plot => ({ ...plot })), nodeHp: { ...state.nodeHp }, gardenGateOpen: !!state.gardenGateOpen, campfires: (state.campfires ?? []).map(fire => ({ ...fire })) }; inParty = false; partyToggle.textContent = '⚔️ เข้าปาร์ตี้เหมือง'; scene?.sendPresence(true) }
function renderCommunity() {
  const panel = document.querySelector<HTMLElement>('#community-panel')!
  const world = multiplayer.world
  panel.classList.toggle('hidden', !world || !multiplayer.room)
  if (!world) return
  const q = world.quest
  document.querySelector('#community-quest')!.textContent = q.completed ? '✅ เควสต์ร่วมสำเร็จ' : q.stage === 0 ? `เก็บเกี่ยวผัก ${q.harvested}/5` : q.stage === 1 ? `ขุดแร่ในเหมือง ${q.mined}/3` : 'นำ Radish ไปให้ไกด์หมู่บ้าน'
  document.querySelector('#community-festival')!.textContent = `🎪 งานเทศกาลตลาด: ส่งผลผลิต ${world.festival.donated}/${world.festival.goal}${world.festival.completed ? ' · สำเร็จแล้ว' : ''}`
}
multiplayer.onWorld = full => {
  if (full && !multiplayer.world && soloWorldBackup) {
    state.plots = soloWorldBackup.plots
    state.nodeHp = soloWorldBackup.nodeHp
    state.gardenGateOpen = soloWorldBackup.gardenGateOpen
    state.campfires = soloWorldBackup.campfires
    soloWorldBackup = null
    changed(); scene?.scene.restart()
  }
  if (full && multiplayer.world) {
    for (const map of Object.values(MAPS)) for (const node of map.resources ?? []) delete state.nodeHp?.[node.id]
    for (const id of Object.keys(state.nodeHp ?? {})) if (id.startsWith('monster-')) delete state.nodeHp![id]
    Object.assign(state.nodeHp ??= {}, multiplayer.world.nodeHp)
    state.plots = multiplayer.world.plots.map(plot => ({ ...plot }))
    state.gardenGateOpen = multiplayer.world.gardenGateOpen
    state.campfires = multiplayer.world.campfires.map(fire => ({ ...fire }))
    for (const list of Object.values(multiplayer.world.monsters)) for (const monster of list ?? []) state.nodeHp[monster.id] = monster.remaining
    changed()
  }
  renderCommunity()
  if (festivalOpen) renderFestival()
  scene?.syncSharedWorld(full)
}
multiplayer.onReward = (kind, xp, coins, from) => {
  state.player.coins += coins
  const leveled = gainXp(state, xp)
  changed()
  announce(kind === 'party-reward' ? `ปาร์ตี้ช่วย${from ?? 'เพื่อน'}ปราบมอนสเตอร์ ได้ ${xp} XP และ ${coins} Coins` : kind === 'quest-reward' ? `เควสต์ร่วมสำเร็จ! ได้ ${coins} Coins และ ${xp} XP` : `งานเทศกาลสำเร็จ! ได้ ${coins} Coins และ ${xp} XP${leveled ? ' · เลเวลเพิ่ม!' : ''}`)
}
const chatPanel = document.querySelector<HTMLElement>('#chat-panel')!
const chatLog = document.querySelector<HTMLElement>('#chat-log')!
const chatInput = document.querySelector<HTMLInputElement>('#chat-input')!
document.querySelector('#chat-toggle')!.addEventListener('click', () => chatPanel.classList.toggle('hidden'))
document.querySelector<HTMLFormElement>('#chat-form')!.addEventListener('submit', event => {
  event.preventDefault()
  if (worldChat.send(chatInput.value)) chatInput.value = ''
  else announce('แชทโลกยังไม่พร้อม ลองอีกครั้ง')
})
worldChat.onStatus = text => { document.querySelector('#chat-status')!.textContent = text }
worldChat.onMessages = messages => {
  chatLog.replaceChildren(...messages.map(message => {
    const row = document.createElement('div')
    const name = document.createElement('b')
    name.textContent = `${message.name}: `
    row.append(name, document.createTextNode(message.text))
    return row
  }))
  chatLog.scrollTop = chatLog.scrollHeight
}
worldChat.connect()
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
  wood: { icon: '🪵', name: 'ไม้' }, stone: { icon: '🪨', name: 'หิน' }, fiber: { icon: '🌿', name: 'เส้นใย' },
  sword: { icon: '⚔️', name: 'ดาบ' }, bow: { icon: '🏹', name: 'ธนู' }, meat: { icon: '🍖', name: 'เนื้อ' }, hide: { icon: '🟤', name: 'หนังสัตว์' }, copper: { icon: '🟠', name: 'แร่ทองแดง' }, iron: { icon: '⚪', name: 'แร่เหล็ก' },
  moonstone: { icon: '💎', name: 'จันทราศิลา' }, arcane_sword: { icon: '🗡️', name: 'ดาบจันทรา' }, wand: { icon: '🪄', name: 'คทาเวท' }, broom: { icon: '🧹', name: 'ไม้กวาดขี่' }, rice_meal: { icon: '🍚', name: 'ข้าวกล่อง' }, stew: { icon: '🍲', name: 'สตูว์' }, mana_potion: { icon: '🧪', name: 'ยามานา' }
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
  ui.hp.textContent = `${state.player.hp ?? 100}/${maxHp(state)}`
  ui.hpBar.style.width = `${(state.player.hp ?? 100) / maxHp(state) * 100}%`
  ui.mana.textContent = `${state.player.mana ?? 50}/${maxMana(state)}`
  ui.manaBar.style.width = `${(state.player.mana ?? 50) / maxMana(state) * 100}%`
  ui.level.textContent = `LV ${state.player.level ?? 1}`
  ui.xp.textContent = `${state.player.xp ?? 0}/${xpNeeded(state.player.level ?? 1)} XP`
  ui.xpBar.style.width = `${(state.player.xp ?? 0) / xpNeeded(state.player.level ?? 1) * 100}%`
  clock()
  ui.inventory.innerHTML = state.inventory.length
    ? state.inventory.map(item => `<div class="item" draggable="true" data-item="${item.itemId}"><span class="item-icon">${ITEMS[item.itemId].icon}</span><div><strong>${ITEMS[item.itemId].name}</strong><small>${['radish', 'rice_meal', 'stew', 'mana_potion'].includes(item.itemId) ? 'คลิกเพื่อกิน/ใช้' : 'ลากไป Hotbar ได้'}</small></div><b>×${item.quantity}</b></div>`).join('')
    : '<div class="empty-bag">กระเป๋าว่าง</div>'
  ui.hotbar.innerHTML = Array.from({ length: 10 }, (_, i) => {
    const extra = state.hotbarExtras?.[i - 7] ?? null
    const item = i < 7 ? HOTBAR_FIXED[i] : extra ? ITEMS[extra] : { icon: '＋', name: 'ช่องว่าง' }
    const badge = i === 1 ? `${state.water ?? MAX_WATER}/${MAX_WATER}` : i === 5 ? String(count(state, 'radish_seed')) : i === 6 ? String(count(state, 'radish')) : extra ? String(count(state, extra)) : ''
    return `<button class="hotbar-slot ${i === (state.selectedSlot ?? 0) ? 'selected' : ''}" data-slot="${i}" title="${item.name}"><span class="slot-key">${i === 9 ? 0 : i + 1}</span><span class="slot-icon">${item.icon}</span><span class="slot-name">${item.name}</span>${badge ? `<span class="slot-count">${badge}</span>` : ''}</button>`
  }).join('')
  ui.steps.innerHTML = `<div class="${state.player.mapId === 'village' ? 'active' : ''}">01 <span>หมู่บ้าน</span></div><div class="${state.player.mapId === 'farm' ? 'active' : ''}">02 <span>บ้านและฟาร์ม</span></div><div class="${state.player.mapId === 'home' ? 'active' : ''}">03 <span>ภายในบ้าน</span></div><div class="${state.player.mapId === 'market' ? 'active' : ''}">04 <span>ตลาด</span></div><div class="${state.player.mapId === 'magic_city' ? 'active' : ''}">05 <span>เมืองเวทมนตร์</span></div><div class="${state.player.mapId === 'riverside' ? 'active' : ''}">06 <span>ริมน้ำ</span></div><div class="${state.player.mapId.startsWith('mine') ? 'active' : ''}">07 <span>เหมือง 1–3</span></div>`
}
function clock() {
  const now = Date.now()
  const sharedTime = multiplayer.world && multiplayer.serverOffsetMs !== null
    ? now + multiplayer.serverOffsetMs : null
  const elapsed = sharedTime === null ? Math.max(0, now - (state.dayStartedAt ?? now)) : sharedTime
  const day = sharedTime === null ? dayNumber(state, now) : Math.floor(elapsed / DAY_MS) + 1
  const calendar = calendarAt(day, (elapsed % DAY_MS) / DAY_MS)
  const time = `${String(calendar.hour).padStart(2, '0')}:${String(calendar.minute).padStart(2, '0')}`
  ui.day.textContent = `${calendar.season.icon} ฤดู${calendar.season.name} · วันที่ ${calendar.dayInSeason} · ${calendar.night ? '🌙' : '☀️'} ${time}${isRaining(day) ? ' · ☂ ฝน' : ''}`
  scene?.setAtmosphere(calendar, isRaining(day))
}
function changed() {
  hud()
  if (!saveBlocked && !persist(state)) announce('บันทึกเกมไม่ได้ แต่ยังเล่นต่อได้')
  queueCloudSave()
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
ui.inventory.addEventListener('click', event => {
  const itemId = (event.target as HTMLElement).closest<HTMLElement>('[data-item]')?.dataset.item as ItemId | undefined
  if (!itemId || !['radish', 'rice_meal', 'stew', 'mana_potion'].includes(itemId)) return
  if (!eat(state, itemId)) return announce('ตอนนี้ยังไม่ต้องใช้ของชิ้นนี้')
  changed(); announce(`ใช้${ITEMS[itemId].name}แล้ว`)
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
const specialShop = document.querySelector<HTMLElement>('#special-shop')!
const wardrobe = document.querySelector<HTMLElement>('#wardrobe')!
const festivalShop = document.querySelector<HTMLElement>('#festival-shop')!
function closeShop() { shopOpen = false; marketOpen = false; specialOpen = false; wardrobeOpen = false; festivalOpen = false; specialKind = null; ui.shop.classList.add('hidden'); document.querySelector('#market-shop')!.classList.add('hidden'); specialShop.classList.add('hidden'); wardrobe.classList.add('hidden'); festivalShop.classList.add('hidden'); accountPanel.classList.add('hidden') }
function festivalStatus() {
  if (multiplayer.world) return multiplayer.world.festival
  const day = dayNumber(state)
  if (!state.festival || state.festival.day !== day) state.festival = { day, donated: 0, completed: false }
  return { ...state.festival, goal: 3 }
}
function renderFestival() {
  const event = festivalStatus()
  document.querySelector('#festival-description')!.textContent = event.completed ? 'งานวันนี้สำเร็จแล้ว! มาร่วมงานใหม่วันถัดไป' : `นำผลผลิตมาร่วมงาน ${event.donated}/${event.goal} ชิ้น · ครบแล้วทุกคนในห้องได้ 35 Coins และ 15 XP`
  document.querySelector<HTMLElement>('#festival-items')!.innerHTML = (['radish', 'carrot', 'tomato'] as ItemId[]).map(id => `<button class="trade" data-festival-item="${id}" ${event.completed || count(state, id) < 1 ? 'disabled' : ''}><span>${ITEMS[id].icon} ${ITEMS[id].name} <small>ในกระเป๋า ${count(state, id)}</small></span><strong>ร่วมงาน 1 ชิ้น</strong></button>`).join('')
}
function openFestival() { closeShop(); festivalOpen = true; renderFestival(); festivalShop.classList.remove('hidden') }
festivalShop.addEventListener('click', event => {
  const target = event.target as HTMLElement
  if (target === festivalShop || target.closest('#close-festival')) return closeShop()
  const itemId = target.closest<HTMLElement>('[data-festival-item]')?.dataset.festivalItem as ItemId | undefined
  if (!itemId || count(state, itemId) < 1 || festivalStatus().completed) return
  if (multiplayer.world) {
    multiplayer.action('festival', { itemId }, result => {
      if (!result.ok) return announce(result.message ?? 'ร่วมงานไม่ได้')
      remove(state, itemId); changed(); renderFestival(); announce('นำผลผลิตมาร่วมงานเทศกาลแล้ว')
    })
  } else {
    remove(state, itemId)
    const local = state.festival!
    local.donated++
    if (local.donated >= 3) { local.completed = true; state.player.coins += 35; gainXp(state, 15); announce('งานเทศกาลสำเร็จ! ได้ 35 Coins และ 15 XP') }
    else announce(`นำผลผลิตมาร่วมงานแล้ว ${local.donated}/3`)
    changed(); renderFestival()
  }
})
function openShop() { shopOpen = true; ui.shop.classList.remove('hidden'); announce('ยินดีต้อนรับสู่ร้านค้าหมู่บ้าน') }
function openMarket() { marketOpen = true; document.querySelector('#market-shop')!.classList.remove('hidden'); announce('ยินดีต้อนรับสู่ตลาดเมล็ดพันธุ์') }
const marketPrices: Partial<Record<ItemId, number>> = { radish_seed: 8, carrot_seed: 10, tomato_seed: 12, rice_meal: 12, sword: 35, bow: 55, wand: 65, broom: 110, mana_potion: 20 }
const sellPrices: Partial<Record<ItemId, number>> = { carrot: 18, tomato: 22, meat: 16, hide: 12, copper: 14, iron: 22, moonstone: 120 }
function marketBuy(itemId: ItemId) {
  const price = marketPrices[itemId]
  if (!price) return
  if (['sword', 'bow', 'wand', 'broom'].includes(itemId) && count(state, itemId)) return announce('คุณมีอุปกรณ์นี้แล้ว')
  if (state.player.coins < price) return announce('Coins ไม่พอซื้อของชิ้นนี้')
  if (!canAdd(state, itemId)) return announce('กระเป๋าเต็ม')
  state.player.coins -= price; add(state, itemId); changed(); announce(`ซื้อ${ITEMS[itemId].name}แล้ว`)
}
const outfitPrices: Partial<Record<OutfitId, number>> = { forest: 25, royal: 55, mage: 80 }
const outfitNames: Record<OutfitId, string> = { default: 'ชุดชาวสวน', forest: 'ชุดนักผจญภัย', royal: 'ชุดราชสำนัก', mage: 'ชุดจอมเวท' }
const outfitBonuses: Record<OutfitId, string> = { default: 'ไม่มีโบนัส', forest: 'HP +10', royal: 'ป้องกัน +1', mage: 'มานา +12' }
type WardrobeSlot = GearSlot | 'outfit'
const wardrobeSlots: { id: WardrobeSlot; title: string; icon: string }[] = [
  { id: 'hat', title: 'หมวก', icon: '👒' }, { id: 'outfit', title: 'เสื้อ / ชุด', icon: '👗' },
  { id: 'necklace', title: 'สร้อย', icon: '📿' }, { id: 'bracelet', title: 'กำไล', icon: '🟡' },
  { id: 'boots', title: 'รองเท้า', icon: '🥾' }, { id: 'charm', title: 'เครื่องประดับ', icon: '🍀' }
]
let wardrobeSelection: WardrobeSlot = 'outfit'
function gearBonus(id: GearId) {
  return (['hp', 'mana', 'attack', 'defense', 'speed'] as const).filter(key => GEAR[id][key]).map(key => `${{ hp: 'HP', mana: 'มานา', attack: 'โจมตี', defense: 'ป้องกัน', speed: 'ความเร็ว' }[key]} +${GEAR[id][key]}`).join(' · ')
}
function refreshAppearance() { scene?.setCharacter(); scene?.sendPresence(true); changed(); if (wardrobeOpen) renderWardrobe() }
function renderWardrobe() {
  const stats = equipmentStats(state)
  const cards = wardrobeSlots.map(slot => {
    const id = slot.id === 'outfit' ? null : state.equipped?.[slot.id]
    const name = slot.id === 'outfit' ? outfitNames[state.outfit ?? 'default'] : id ? GEAR[id].name : slot.id === 'hat' ? 'หมวกฟาง' : 'ยังไม่สวม'
    const icon = id ? GEAR[id].icon : slot.icon
    return `<button class="wardrobe-slot ${wardrobeSelection === slot.id ? 'active' : ''}" data-wardrobe-slot="${slot.id}"><span class="wardrobe-slot-icon">${icon}</span><span><strong>${slot.title}</strong><small>${name}</small></span><b>${wardrobeSelection === slot.id ? 'เลือกอยู่' : 'เปลี่ยน'}</b></button>`
  }).join('')
  const selectedGearSlot = wardrobeSelection as GearSlot
  const choices = wardrobeSelection === 'outfit'
    ? (['default', 'forest', 'royal', 'mage'] as OutfitId[]).filter(id => state.ownedOutfits?.includes(id)).map(id => `<button class="wardrobe-choice ${state.outfit === id ? 'equipped' : ''}" data-wear-outfit="${id}"><span>👗 ${outfitNames[id]}<small>${outfitBonuses[id]}</small></span><b>${state.outfit === id ? 'สวมอยู่' : 'สวม'}</b></button>`).join('')
    : `<button class="wardrobe-choice ${!state.equipped?.[selectedGearSlot] ? 'equipped' : ''}" data-wear-gear="none" data-gear-slot="${selectedGearSlot}"><span>${selectedGearSlot === 'hat' ? '👒 หมวกฟางเดิม' : selectedGearSlot === 'boots' ? '🥾 รองเท้าชาวสวนเดิม' : 'ไม่สวม'}</span><b>${state.equipped?.[selectedGearSlot] ? 'เลือก' : 'เลือกอยู่'}</b></button>${(state.ownedGear ?? []).filter(id => GEAR[id].slot === selectedGearSlot).map(id => `<button class="wardrobe-choice ${state.equipped?.[selectedGearSlot] === id ? 'equipped' : ''}" data-wear-gear="${id}" data-gear-slot="${selectedGearSlot}"><span>${GEAR[id].icon} ${GEAR[id].name}<small>${gearBonus(id)}</small></span><b>${state.equipped?.[selectedGearSlot] === id ? 'สวมอยู่' : 'สวม'}</b></button>`).join('')}`
  const selectedName = wardrobeSlots.find(slot => slot.id === wardrobeSelection)?.title ?? 'ชุด'
  document.querySelector<HTMLElement>('#wardrobe-content')!.innerHTML = `<div class="wardrobe-layout"><div class="wardrobe-slots">${cards}</div><div class="wardrobe-preview"><div class="avatar-stage"><div class="avatar-sprite avatar-${state.character ?? 'a'} outfit-${state.outfit ?? 'default'}"><i class="avatar-coat"></i><i class="avatar-hat hat-${state.equipped?.hat ?? 'default'}"></i><i class="avatar-necklace necklace-${state.equipped?.necklace ?? 'none'}"></i><i class="avatar-bracelet bracelet-${state.equipped?.bracelet ?? 'none'}"></i><i class="avatar-boots boots-${state.equipped?.boots ?? 'none'}"></i><i class="avatar-charm charm-${state.equipped?.charm ?? 'none'}"></i></div></div><span>Player ${(state.character ?? 'a').toUpperCase()} · ${outfitNames[state.outfit ?? 'default']}</span><div class="avatar-character-switch"><button data-preview-character="a" class="${state.character !== 'b' ? 'active' : ''}">Player A</button><button data-preview-character="b" class="${state.character === 'b' ? 'active' : ''}">Player B</button></div></div><div class="wardrobe-stats"><strong>รายละเอียด</strong><span>❤️ HP <b>${maxHp(state)}</b></span><span>✨ มานา <b>${maxMana(state)}</b></span><span>⚔️ โจมตี <b>+${stats.attack}</b></span><span>🛡️ ป้องกัน <b>+${stats.defense}</b></span><span>👟 ความเร็ว <b>+${stats.speed}</b></span></div></div><div class="wardrobe-picker"><h3>เลือก${selectedName}</h3><div class="wardrobe-choices">${choices}</div><p>ซื้อเพิ่มเติมได้ที่ร้านเสื้อผ้าในตลาดและเมืองเวทมนตร์</p></div>`
}
function openWardrobe() { closeShop(); wardrobeOpen = true; renderWardrobe(); wardrobe.classList.remove('hidden') }
document.querySelector('#dress-toggle')!.addEventListener('click', openWardrobe)
wardrobe.addEventListener('click', event => {
  const target = event.target as HTMLElement
  if (target === wardrobe || target.closest('#close-wardrobe')) return closeShop()
  const character = target.closest<HTMLElement>('[data-preview-character]')?.dataset.previewCharacter as 'a' | 'b' | undefined
  if (character) { state.character = character; refreshAppearance(); announce(`เลือก Player ${character.toUpperCase()} แล้ว`); return }
  const slotButton = target.closest<HTMLElement>('[data-wardrobe-slot]')
  if (slotButton) { wardrobeSelection = slotButton.dataset.wardrobeSlot as WardrobeSlot; renderWardrobe(); return }
  const outfit = target.closest<HTMLElement>('[data-wear-outfit]')?.dataset.wearOutfit as OutfitId | undefined
  if (outfit && state.ownedOutfits?.includes(outfit)) { state.outfit = outfit; state.player.hp = Math.min(state.player.hp ?? 100, maxHp(state)); state.player.mana = Math.min(state.player.mana ?? 50, maxMana(state)); refreshAppearance(); announce(`สวม${outfitNames[outfit]}แล้ว`); return }
  const button = target.closest<HTMLElement>('[data-wear-gear]')
  if (!button) return
  const slot = button.dataset.gearSlot as GearSlot, id = button.dataset.wearGear as GearId | 'none'
  if (id !== 'none' && (!state.ownedGear?.includes(id) || GEAR[id].slot !== slot)) return
  state.equipped ??= {}; if (id === 'none') delete state.equipped[slot]; else state.equipped[slot] = id
  state.player.hp = Math.min(state.player.hp ?? 100, maxHp(state)); state.player.mana = Math.min(state.player.mana ?? 50, maxMana(state))
  refreshAppearance(); announce(id === 'none' ? 'ถอดอุปกรณ์แล้ว' : `สวม${GEAR[id].name}แล้ว`)
})
function openSpecial(kind: 'tailor' | 'magic_shop' | 'forge') {
  specialKind = kind; specialOpen = true
  const title = kind === 'tailor' ? 'ร้านเสื้อผ้า' : kind === 'magic_shop' ? 'ร้านเวทมนตร์' : 'เตาหลอมอาวุธ'
  document.querySelector('#special-label')!.textContent = kind === 'tailor' ? 'TAILOR' : kind === 'magic_shop' ? 'MAGIC SHOP' : 'FORGE'
  document.querySelector('#special-title')!.textContent = title
  document.querySelector('#special-description')!.textContent = kind === 'tailor' ? 'ซื้อชุด หมวก สร้อย กำไล รองเท้า และเครื่องราง แล้วกด แต่งตัว เพื่อเลือกสวม' : kind === 'magic_shop' ? 'คทาใช้มานาโจมตี ไม้กวาดบินได้ และยาฟื้นมานา' : 'ใช้เหล็ก 2 ชิ้น กับจันทราศิลา 1 ชิ้น ทำดาบจันทรา'
  const list = document.querySelector<HTMLElement>('#special-list')!
  list.innerHTML = kind === 'tailor'
    ? `<div class="market-divider">ชุด</div>${(['forest', 'royal', 'mage'] as OutfitId[]).map(id => `<button class="trade" data-outfit="${id}"><span>${outfitNames[id]} <small>${outfitBonuses[id]}</small></span><strong>${state.ownedOutfits?.includes(id) ? state.outfit === id ? 'สวมอยู่' : 'สวมใส่' : `${outfitPrices[id]} Coins`}</strong></button>`).join('')}<div class="market-divider">หมวก · สร้อย · กำไล · รองเท้า · เครื่องราง</div>${GEAR_IDS.map(id => `<button class="trade" data-gear-buy="${id}"><span>${GEAR[id].icon} ${GEAR[id].name} <small>${gearBonus(id)}</small></span><strong>${state.ownedGear?.includes(id) ? state.equipped?.[GEAR[id].slot] === id ? 'สวมอยู่' : 'สวมใส่' : `${GEAR[id].price} Coins`}</strong></button>`).join('')}<button class="trade" data-open-wardrobe="1"><span>👗 เปิดหน้าแต่งตัว</span><strong>ดูสเตตัส</strong></button>`
    : kind === 'magic_shop'
      ? `<button class="trade" data-special-buy="wand"><span>🪄 คทาเวท <small>โจมตีมอนสเตอร์ ใช้ 8 มานา</small></span><strong>65 Coins</strong></button><button class="trade" data-special-buy="broom"><span>🧹 ไม้กวาดขี่ <small>เลือกใน Hotbar แล้วกด E เพื่อขึ้น/ลง</small></span><strong>110 Coins</strong></button><button class="trade" data-special-buy="mana_potion"><span>🧪 ยามานา <small>ฟื้น 30 มานา</small></span><strong>20 Coins</strong></button>`
      : `<button class="trade" data-craft="arcane_sword"><span>🗡️ ดาบจันทรา <small>เหล็ก 2 + จันทราศิลา 1</small></span><strong>หลอม</strong></button>`
  specialShop.classList.remove('hidden')
  announce(`ยินดีต้อนรับสู่${title}`)
}
specialShop.addEventListener('click', event => {
  const target = event.target as HTMLElement
  if (target === specialShop || target.closest('#close-special')) return closeShop()
  const outfit = target.closest<HTMLElement>('[data-outfit]')?.dataset.outfit as OutfitId | undefined
  const gear = target.closest<HTMLElement>('[data-gear-buy]')?.dataset.gearBuy as GearId | undefined
  const buyId = target.closest<HTMLElement>('[data-special-buy]')?.dataset.specialBuy as ItemId | undefined
  if (target.closest('[data-open-wardrobe]')) return openWardrobe()
  if (outfit && outfitPrices[outfit]) {
    if (!state.ownedOutfits?.includes(outfit)) {
      const price = outfitPrices[outfit]!
      if (state.player.coins < price) return announce('Coins ไม่พอซื้อชุดนี้')
      state.player.coins -= price; state.ownedOutfits ??= ['default']; state.ownedOutfits.push(outfit)
    }
    state.outfit = outfit; state.player.hp = Math.min(state.player.hp ?? 100, maxHp(state)); state.player.mana = Math.min(state.player.mana ?? 50, maxMana(state)); refreshAppearance(); openSpecial('tailor'); announce(`สวม${outfitNames[outfit]}แล้ว`)
  }
  if (gear && GEAR[gear]) {
    if (!state.ownedGear?.includes(gear)) {
      if (state.player.coins < GEAR[gear].price) return announce('Coins ไม่พอซื้ออุปกรณ์นี้')
      state.player.coins -= GEAR[gear].price; state.ownedGear ??= []; state.ownedGear.push(gear)
    }
    state.equipped ??= {}; state.equipped[GEAR[gear].slot] = gear
    refreshAppearance(); openSpecial('tailor'); announce(`สวม${GEAR[gear].name}แล้ว`)
  }
  if (buyId && marketPrices[buyId]) marketBuy(buyId)
  if (target.closest('[data-craft]')) {
    if (!craftArcaneSword(state)) return announce('ต้องมีเหล็ก 2 จันทราศิลา 1 และที่ว่างในกระเป๋า')
    changed(); announce('หลอมดาบจันทราสำเร็จ! ลากไป Hotbar เพื่อใช้')
  }
})
function marketSell(itemId: ItemId) {
  const price = sellPrices[itemId]
  if (!price) return
  if (!remove(state, itemId)) return announce(`ยังไม่มี${ITEMS[itemId].name}ให้ขาย`)
  state.player.coins += price; changed(); announce(`ขาย${ITEMS[itemId].name}ได้ ${price} Coins`)
}
document.querySelector('#buy')!.addEventListener('click', buy)
document.querySelector('#sell')!.addEventListener('click', sell)
document.querySelector('#close-shop')!.addEventListener('click', closeShop)
ui.shop.addEventListener('click', event => { if (event.target === ui.shop) closeShop() })
const marketShop = document.querySelector<HTMLElement>('#market-shop')!
marketShop.addEventListener('click', event => {
  if (event.target === marketShop || (event.target as HTMLElement).closest('#close-market')) { closeShop(); return }
  const buyId = (event.target as HTMLElement).closest<HTMLElement>('[data-buy]')?.dataset.buy as ItemId | undefined
  const sellId = (event.target as HTMLElement).closest<HTMLElement>('[data-sell]')?.dataset.sell as ItemId | undefined
  if (buyId && buyId in marketPrices) marketBuy(buyId)
  if (sellId && sellId in sellPrices) marketSell(sellId)
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
  private background?: Phaser.GameObjects.Image
  private seasonWash?: Phaser.GameObjects.Rectangle
  private darkness?: Phaser.GameObjects.Rectangle
  private rainGraphics?: Phaser.GameObjects.Graphics
  private raining = false
  private gardenGateImage?: Phaser.GameObjects.Image
  private gardenGateCollider?: Phaser.Physics.Arcade.Collider
  private campfireMarkers: Phaser.GameObjects.GameObject[] = []
  private campfireGlows: Phaser.GameObjects.Arc[] = []
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>
  private e!: Phaser.Input.Keyboard.Key
  private one!: Phaser.Input.Keyboard.Key
  private two!: Phaser.Input.Keyboard.Key
  private space!: Phaser.Input.Keyboard.Key
  private f!: Phaser.Input.Keyboard.Key
  private hotbarKeys!: Phaser.Input.Keyboard.Key[]
  private esc!: Phaser.Input.Keyboard.Key
  private plotMarkers: Phaser.GameObjects.Container[] = []
  private resourceMarkers: Phaser.GameObjects.Container[] = []
  private monsterMarkers: Phaser.GameObjects.Container[] = []
  private monsters: Monster[] = []
  private lastMonsterAttack = 0
  private lastMonsterDay = 0
  private broomMarker?: Phaser.GameObjects.Text
  private flyingSprite?: Phaser.GameObjects.Sprite
  private flyingShadow?: Phaser.GameObjects.Ellipse
  private clothing?: Phaser.GameObjects.Graphics
  private terrainCollider?: Phaser.Physics.Arcade.Collider
  private monsterWander = new Map<string, { homeX: number; homeY: number; targetX: number; targetY: number; nextTurn: number; phase: number }>()
  private handlePointer = () => this.useSelected()
  private restingUntil = 0
  private lastSave = 0
  private lastGrowthCheck = 0
  private interactionCooldown = 0
  private facing = 0
  private actionUntil = 0
  private actionRow = 0
  private lastClock = 0
  private remoteSprites = new Map<string, { sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text; clothing: Phaser.GameObjects.Graphics; look: string }>()

  constructor() { super('World') }
  preload() {
    const config = MAPS[state.player.mapId]
    const imageKey = config.id.startsWith('mine') ? 'mine' : config.id
    if (!this.textures.exists(imageKey)) this.load.image(imageKey, config.image)
    if (config.id === 'farm' && !this.textures.exists('farm-open')) this.load.image('farm-open', '/assets/farm-open.png')
    if (!this.textures.exists('player-a')) this.load.spritesheet('player-a', '/assets/player-a.png', { frameWidth: 280, frameHeight: 280 })
    if (!this.textures.exists('player-b')) this.load.spritesheet('player-b', '/assets/player-b.png', { frameWidth: 280, frameHeight: 280 })
    if (!this.textures.exists('npcs')) this.load.spritesheet('npcs', '/assets/npcs.png', { frameWidth: 591, frameHeight: 887 })
  }
  create() {
    scene = this
    const config = MAPS[state.player.mapId]
    this.remoteSprites.clear()
    this.plotMarkers = []
    this.resourceMarkers = []
    this.monsterMarkers = []
    this.monsters = []
    this.monsterWander.clear()
    this.lastMonsterAttack = 0
    const imageKey = config.id.startsWith('mine') ? 'mine' : config.id
    this.background = this.add.image(0, 0, imageKey).setOrigin(0).setDepth(0).setTint(config.id === 'mine2' ? 0xdbe6ff : config.id === 'mine3' ? 0xdac4f6 : 0xffffff)
    const outdoors = !config.id.startsWith('mine') && config.id !== 'home'
    this.seasonWash = outdoors ? this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0xffffff).setDepth(1) : undefined
    this.darkness = outdoors ? this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x07152e).setDepth(40) : undefined
    this.rainGraphics = outdoors ? this.add.graphics().setDepth(43).setScrollFactor(0) : undefined
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
    this.broomMarker = this.add.text(state.player.x, state.player.y + 10, '🧹', { fontSize: '29px' }).setOrigin(.5).setDepth(19).setVisible(!!state.mounted)
    this.flyingShadow = this.add.ellipse(state.player.x, state.player.y + 20, 42, 13, 0x142218, .35).setDepth(18).setVisible(!!state.mounted)
    this.flyingSprite = this.add.sprite(state.player.x, state.player.y - 27, `player-${state.character ?? 'a'}`, 0).setScale(.23).setDepth(22).setVisible(!!state.mounted)
    this.clothing = this.add.graphics().setDepth(23)
    drawAppearance(this.clothing, { outfit: state.outfit ?? 'default', equipped: state.equipped ?? {} }, 0)
    this.player.setVisible(!state.mounted)
    this.player.body!.setSize(104, 78).setOffset(88, 194)
    this.player.setCollideWorldBounds(true)
    this.terrainCollider = this.physics.add.collider(this.player, blockers)
    this.terrainCollider.active = !state.mounted
    if (config.id === 'farm') {
      this.gardenGateImage = this.add.image(0, 0, 'farm-open').setOrigin(0).setCrop(683, 712, 174, 111).setDepth(3)
      const gateBody = this.physics.add.staticImage(770, 780, 'collision-tile').setDisplaySize(102, 35).setVisible(false)
      gateBody.refreshBody()
      this.gardenGateCollider = this.physics.add.collider(this.player, gateBody)
      this.syncGardenGate()
    }
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
    this.f = this.input.keyboard!.addKey('F')
    this.hotbarKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO'].map(key => this.input.keyboard!.addKey(key))
    this.esc = this.input.keyboard!.addKey('ESC')
    if (config.id === 'farm') this.drawPlots()
    this.syncCampfires()
    if (config.resources) this.drawResources()
    if (mineFloor(config.id)) {
      this.lastMonsterDay = dayNumber(state)
      this.monsters = multiplayer.world?.monsters[config.id]?.map(({ remaining: _, ...monster }) => monster) ?? monstersFor(config.id, this.lastMonsterDay)
      this.drawMonsters()
      const labelStyle = { fontFamily: 'Nunito, sans-serif', fontSize: '19px', color: '#fff1ce', backgroundColor: '#352642', padding: { x: 10, y: 5 } }
      this.add.text(1210, 265, config.id === 'mine3' ? 'ชั้นลึกสุด' : '⬇ ลงชั้นถัดไป', labelStyle).setOrigin(.5).setDepth(8)
      if (config.id === 'mine') this.add.text(865, 280, '⚒ เตาหลอม', labelStyle).setOrigin(.5).setDepth(8)
    }
    if (config.id === 'village') {
      this.addNpc(0, 530, 418, 'Shopkeeper')
      this.addNpc(2, 565, 790, 'Village Guide')
    }
    if (config.id === 'market') {
      const labelStyle = { fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#fff9dc', backgroundColor: '#243829', padding: { x: 9, y: 4 } }
      this.add.text(460, 245, 'เมล็ดพันธุ์', labelStyle).setOrigin(.5).setDepth(12)
      this.add.text(1090, 270, 'ของทำสวน', labelStyle).setOrigin(.5).setDepth(12)
      this.add.text(770, 875, '⬇ เมืองเวทมนตร์', labelStyle).setOrigin(.5).setDepth(12)
      this.add.text(770, 705, '🎪 เทศกาลเก็บเกี่ยว', labelStyle).setOrigin(.5).setDepth(12)
    }
    if (config.id === 'magic_city') {
      const labelStyle = { fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#fff4ff', backgroundColor: '#34234d', padding: { x: 9, y: 4 } }
      this.add.text(635, 255, '🪄 ร้านเวทมนตร์', labelStyle).setOrigin(.5).setDepth(12)
      this.add.text(905, 255, '🧙 ร้านชุดจอมเวท', labelStyle).setOrigin(.5).setDepth(12)
      this.add.text(770, 145, '⬆ กลับตลาด', labelStyle).setOrigin(.5).setDepth(12)
    }
    if (config.id === 'home') this.addNpc(1, 1090, 382, 'Cook')
    this.input.off('pointerdown', this.handlePointer)
    this.input.on('pointerdown', this.handlePointer)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off('pointerdown', this.handlePointer))
    this.syncRemotePlayers()
    this.sendPresence(true)
    hud()
  }

  setCharacter() {
    if (this.player?.active) this.player.setTexture(`player-${state.character ?? 'a'}`, this.facing)
    if (this.flyingSprite?.active) this.flyingSprite.setTexture(`player-${state.character ?? 'a'}`, this.facing)
    if (this.clothing?.active) drawAppearance(this.clothing, { outfit: state.outfit ?? 'default', equipped: state.equipped ?? {} }, this.facing)
  }

  setAtmosphere(calendar: Calendar, raining: boolean) {
    if (!this.seasonWash || !this.darkness) return
    this.background?.setTint(calendar.season.tint)
    this.seasonWash.setFillStyle(calendar.season.wash, calendar.season.washAlpha)
    this.darkness.setAlpha(calendar.darkness)
    this.raining = raining
    for (const glow of this.campfireGlows) glow.setAlpha(Math.min(1, calendar.darkness * 1.5))
  }

  private syncGardenGate() {
    const open = multiplayer.world?.gardenGateOpen ?? state.gardenGateOpen ?? false
    this.gardenGateImage?.setVisible(open)
    if (this.gardenGateCollider) this.gardenGateCollider.active = !open && !state.mounted
  }

  private syncCampfires() {
    for (const marker of this.campfireMarkers) marker.destroy()
    this.campfireMarkers = []
    this.campfireGlows = []
    for (const fire of (multiplayer.world?.campfires ?? state.campfires ?? []).filter(fire => fire.mapId === state.player.mapId)) {
      const light = Math.min(1, (this.darkness?.alpha ?? 0) * 1.5)
      const glow = this.add.circle(fire.x, fire.y, 145, 0xffbf66, .3).setDepth(41).setBlendMode(Phaser.BlendModes.ADD).setAlpha(light)
      const inner = this.add.circle(fire.x, fire.y, 70, 0xffdf9a, .65).setDepth(41).setBlendMode(Phaser.BlendModes.ADD).setAlpha(light)
      const logs = this.add.graphics().setPosition(fire.x, fire.y).setDepth(42)
      logs.fillStyle(0x4b2b18).fillRect(-19, 9, 38, 7)
      logs.fillStyle(0x8c552b).fillRect(-15, 10, 30, 4)
      logs.fillStyle(0xffb02e).fillTriangle(-11, 10, 0, -22, 11, 10)
      logs.fillStyle(0xffe28b).fillTriangle(-5, 8, 2, -12, 7, 8)
      logs.fillStyle(0xfff4ca).fillCircle(1, 2, 3)
      this.campfireMarkers.push(glow, inner, logs)
      this.campfireGlows.push(glow, inner)
    }
  }

  syncSharedWorld(full: boolean) {
    if (!this.player?.active) return
    if (full) { this.syncGardenGate(); this.syncCampfires() }
    if (full && MAPS[state.player.mapId].resources) this.drawResources()
    if (full && state.player.mapId === 'farm') this.drawPlots()
    if (!mineFloor(state.player.mapId) || !multiplayer.world) return
    const list = multiplayer.world.monsters[state.player.mapId] ?? []
    const changedRoster = this.monsters.length !== list.length || this.monsters.some((monster, index) => monster.id !== list[index]?.id)
    this.monsters = list.map(({ remaining: _, ...monster }) => monster)
    if (full || changedRoster) this.drawMonsters()
    else for (const marker of this.monsterMarkers) {
      const monster = this.monsters.find(item => item.id === marker.getData('monsterId'))
      if (monster) marker.setPosition(monster.x, monster.y + (monster.kind === 'bat' ? Math.sin(this.time.now / 220) * 6 : 0))
    }
  }

  sendPresence(force = false) {
    if (this.player?.active) multiplayer.send(this.player.x, this.player.y, state.player.mapId, state.character ?? 'a', this.facing, this.player.body?.velocity.length() !== 0, force, state.outfit ?? 'default', !!state.mounted, state.equipped ?? {})
  }

  syncRemotePlayers() {
    for (const [id, objects] of this.remoteSprites) if (!multiplayer.players.has(id) || multiplayer.players.get(id)?.mapId !== state.player.mapId) {
      objects.sprite.destroy(); objects.label.destroy(); objects.clothing.destroy(); this.remoteSprites.delete(id)
    }
    for (const peer of multiplayer.players.values()) {
      if (peer.mapId !== state.player.mapId) continue
      let objects = this.remoteSprites.get(peer.id)
      if (!objects) {
        const sprite = this.add.sprite(peer.x, peer.y, `player-${peer.character}`, 0).setDepth(19).setScale(.23).setAlpha(.9)
        const label = this.add.text(peer.x, peer.y - 49, peer.name, { fontFamily: 'Nunito, sans-serif', fontSize: '15px', color: '#ffffff', backgroundColor: '#244b46', padding: { x: 6, y: 2 } }).setOrigin(.5).setDepth(21)
        const clothing = this.add.graphics().setDepth(20)
        objects = { sprite, label, clothing, look: '' }; this.remoteSprites.set(peer.id, objects)
      }
      if (objects.sprite.texture.key !== `player-${peer.character}`) objects.sprite.setTexture(`player-${peer.character}`)
      const look = `${peer.outfit ?? 'default'}:${peer.facing}:${JSON.stringify(peer.equipped ?? {})}`
      if (look !== objects.look) { drawAppearance(objects.clothing, { outfit: peer.outfit ?? 'default', equipped: peer.equipped ?? {} }, peer.facing); objects.look = look }
      objects.sprite.setData('targetX', peer.x).setData('targetY', peer.y)
      objects.sprite.setFrame((peer.moving ? 1 + Math.floor(this.time.now / 180) % 2 : 0) * 4 + peer.facing)
      const label = `${peer.mounted ? '🧹 ' : ''}${peer.name}`
      if (objects.label.text !== label) objects.label.setText(label)
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
    for (const node of MAPS[state.player.mapId].resources ?? []) {
      const remaining = state.nodeHp?.[node.id] ?? node.hp
      if (remaining <= 0 && node.kind !== 'copper' && node.kind !== 'iron') continue
      const g = this.add.graphics()
      if (remaining <= 0) {
        g.fillStyle(0x353431).fillEllipse(0, 11, 66, 35)
        g.lineStyle(2, 0x8b8378).strokeEllipse(0, 11, 66, 35)
      } else if (node.kind === 'tree') {
        g.fillStyle(0x583a27).fillRect(-8, 1, 16, 30)
        g.fillStyle(0x366d3e).fillCircle(0, -12, 29)
        g.fillStyle(0x6eaf5c).fillCircle(-10, -22, 19)
        g.fillStyle(0x86c66c).fillCircle(13, -23, 15)
      } else if (node.kind === 'rock') {
        g.fillStyle(0x626b6a).fillTriangle(-31, 23, -11, -22, 25, 22)
        g.fillStyle(0x9ba7a1).fillTriangle(-12, -21, 25, 22, 34, 7)
        g.lineStyle(3, 0xd4d9ca).lineBetween(-10, -15, 9, 5)
      } else if (node.kind === 'rabbit' || node.kind === 'boar') {
        const rabbit = node.kind === 'rabbit'
        g.fillStyle(0x392b28, .4).fillEllipse(0, 22, rabbit ? 44 : 66, 14)
        g.fillStyle(rabbit ? 0xc9aa81 : 0x76513a).fillEllipse(0, 1, rabbit ? 45 : 66, rabbit ? 32 : 43)
        g.fillStyle(rabbit ? 0xd8ba92 : 0x926443).fillCircle(rabbit ? 16 : 23, -13, rabbit ? 15 : 22)
        if (rabbit) { g.fillStyle(0xc9aa81).fillEllipse(12, -34, 9, 28).fillEllipse(26, -34, 9, 28) }
        else { g.fillStyle(0xf0dfba).fillTriangle(33, -4, 48, 0, 33, 7) }
        g.fillStyle(0x211c19).fillCircle(rabbit ? 21 : 28, -16, 3)
      } else if (node.kind === 'copper' || node.kind === 'iron') {
        g.fillStyle(0x64635e).fillTriangle(-33, 22, -18, -20, 23, 20)
        g.fillStyle(0x8b8980).fillTriangle(-18, -20, 23, 20, 32, 4)
        g.fillStyle(node.kind === 'copper' ? 0xe8994e : 0xc6dee0)
        g.fillRect(-13, -4, 12, 12).fillRect(9, 3, 10, 10).fillRect(0, -17, 8, 9)
      } else {
        for (const dx of [-17, 0, 17]) {
          g.lineStyle(5, 0x427e38).lineBetween(dx, 20, dx - 6, -12)
          g.lineStyle(4, 0x81ba50).lineBetween(dx, 20, dx + 9, -19)
        }
      }
      const children: Phaser.GameObjects.GameObject[] = [g]
      if (node.kind === 'copper' || node.kind === 'iron') {
        const label = this.add.text(0, -36, remaining <= 0 ? 'หมดวันนี้' : `${remaining} ⛏`, { fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#fff4d6', backgroundColor: '#292b2be0', padding: { x: 5, y: 2 } }).setOrigin(.5)
        children.push(label)
      }
      this.resourceMarkers.push(this.add.container(node.x, node.y, children).setDepth(7))
    }
  }

  private drawMonsters() {
    this.monsterMarkers.forEach(marker => marker.destroy())
    this.monsterMarkers = []
    for (const monster of this.monsters) {
      const hp = state.nodeHp?.[monster.id] ?? monster.hp
      if (hp <= 0) continue
      const g = this.add.graphics()
      g.fillStyle(0x11160e, .38).fillEllipse(0, 23, 56, 14)
      if (monster.kind === 'slime') {
        g.fillStyle(0x6bbc6d).fillEllipse(0, 2, 46, 42)
        g.fillStyle(0xa4e893).fillEllipse(-7, -8, 25, 15)
        g.fillStyle(0x1c4230).fillCircle(-9, 0, 3).fillCircle(9, 0, 3)
      } else if (monster.kind === 'bat') {
        g.fillStyle(0x776383).fillTriangle(-8, 0, -43, -16, -28, 22).fillTriangle(8, 0, 43, -16, 28, 22)
        g.fillStyle(0x473954).fillEllipse(0, 0, 30, 26)
        g.fillStyle(0xffc473).fillCircle(-6, -2, 3).fillCircle(6, -2, 3)
      } else {
        g.fillStyle(0x6c637a).fillRoundedRect(-29, -31, 58, 64, 9)
        g.fillStyle(0xb395d5).fillTriangle(-26, -22, -12, -55, 1, -23).fillTriangle(8, -24, 23, -52, 29, -19)
        g.fillStyle(0xe4aaff).fillRect(-17, -9, 12, 7).fillRect(8, -9, 12, 7)
      }
      g.fillStyle(0x251b26).fillRect(-27, -54, 54, 8)
      g.fillStyle(0xe76372).fillRect(-25, -52, 50 * hp / monster.hp, 4)
      this.monsterMarkers.push(this.add.container(monster.x, monster.y, [g]).setDepth(11).setData('monsterId', monster.id))
    }
  }

  private moveMonsters(time: number, delta: number) {
    const map = MAPS[state.player.mapId]
    const step = Math.min(delta, 50) / 1000
    for (const monster of this.monsters) {
      if ((state.nodeHp?.[monster.id] ?? monster.hp) <= 0) continue
      let motion = this.monsterWander.get(monster.id)
      if (!motion) {
        motion = { homeX: monster.x, homeY: monster.y, targetX: monster.x, targetY: monster.y, nextTurn: 0, phase: Math.random() * 6.28 }
        this.monsterWander.set(monster.id, motion)
      }
      const playerDistance = Math.hypot(this.player.x - monster.x, this.player.y - monster.y)
      const chasing = playerDistance < (monster.kind === 'bat' ? 200 : 155) && !state.mounted
      if (chasing) {
        motion.targetX = this.player.x; motion.targetY = this.player.y
      } else if (time > motion.nextTurn || Math.hypot(motion.targetX - monster.x, motion.targetY - monster.y) < 12) {
        motion.nextTurn = time + 1200 + Math.random() * 2300
        const angle = Math.random() * Math.PI * 2, radius = 40 + Math.random() * 100
        const tx = motion.homeX + Math.cos(angle) * radius, ty = motion.homeY + Math.sin(angle) * radius
        if (tx > 170 && tx < WORLD_WIDTH - 170 && ty > 125 && ty < WORLD_HEIGHT - 115 && !map.blocked.some(([x, y, w, h]) => tx > x - 24 && tx < x + w + 24 && ty > y - 24 && ty < y + h + 24)) {
          motion.targetX = tx; motion.targetY = ty
        } else { motion.targetX = monster.x; motion.targetY = monster.y }
      }
      const dx = motion.targetX - monster.x, dy = motion.targetY - monster.y, distance = Math.hypot(dx, dy)
      if (distance > 3) {
        const speed = (monster.kind === 'bat' ? 70 : monster.kind === 'golem' ? 32 : 48) * (chasing ? 1.25 : 1)
        const travel = Math.min(distance, speed * step)
        const nx = monster.x + dx / distance * travel, ny = monster.y + dy / distance * travel
        if (!map.blocked.some(([x, y, w, h]) => nx > x - 18 && nx < x + w + 18 && ny > y - 18 && ny < y + h + 18)) { monster.x = nx; monster.y = ny }
        else motion.nextTurn = 0
      }
      const marker = this.monsterMarkers.find(item => item.getData('monsterId') === monster.id)
      if (marker) {
        marker.setPosition(monster.x, monster.y + (monster.kind === 'bat' ? Math.sin(time / 220 + motion.phase) * 7 : Math.sin(time / 300 + motion.phase) * 2))
        marker.setScale(monster.kind === 'slime' ? 1 + Math.sin(time / 290 + motion.phase) * .055 : 1)
      }
    }
  }

  private nearest(): { interaction?: Interaction; plot?: number; resource?: ResourceNode; monster?: Monster; distance: number } | null {
    const x = this.player.x, y = this.player.y
    const targets: { interaction?: Interaction; plot?: number; resource?: ResourceNode; monster?: Monster; distance: number }[] = []
    for (const interaction of MAPS[state.player.mapId].interactions) {
      if (interaction.kind === 'door') continue
      const distance = Math.hypot(x - interaction.x, y - interaction.y)
      if (distance < 95) targets.push({ interaction, distance })
    }
    if (state.player.mapId === 'farm') FARM_PLOTS.forEach((plot, i) => {
      const distance = Math.hypot(x - plot.x, y - plot.y)
      if (distance < 100) targets.push({ plot: i, distance })
    })
    for (const node of MAPS[state.player.mapId].resources ?? []) {
      if ((state.nodeHp?.[node.id] ?? node.hp) <= 0) continue
      const distance = Math.hypot(x - node.x, y - node.y)
      if (distance < 100) targets.push({ resource: node, distance })
    }
    for (const monster of this.monsters) {
      if ((state.nodeHp?.[monster.id] ?? monster.hp) <= 0) continue
      const distance = Math.hypot(x - monster.x, y - monster.y)
      if (distance < 125) targets.push({ monster, distance })
    }
    const selected = activeActionSlot()
    const held = state.hotbarExtras?.[(state.selectedSlot ?? 0) - 7]
    const score = (target: typeof targets[number]) => target.distance - (
      target.plot !== undefined && ([0, 1, 4].includes(selected) || !!selectedSeedId()) ? 25 :
      target.monster && ['sword', 'bow', 'arcane_sword', 'wand'].includes(held ?? '') ? 40 :
      target.resource && ((selected === 2 && target.resource.kind === 'tree') || (selected === 3 && ['rock', 'copper', 'iron'].includes(target.resource.kind)) || (selected === 4 && target.resource.kind === 'grass') || (['sword', 'bow', 'arcane_sword', 'wand'].includes(held ?? '') && ['rabbit', 'boar'].includes(target.resource.kind))) ? 25 : 0)
    return targets.sort((a, b) => score(a) - score(b))[0] ?? null
  }

  private usePlot(i: number) {
    if (multiplayer.world) return this.useSharedPlot(i)
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

  private useSharedPlot(i: number) {
    const plot = state.plots[i], selected = activeActionSlot(), seed = selectedSeedId()
    let action = '', cropId: CropId | undefined, cost = 2
    if (selected === 0 && ['EMPTY', 'WITHERED'].includes(plot.state)) action = 'till'
    else if (seed && plot.state === 'TILLED') { action = 'plant'; cropId = seed.replace('_seed', '') as CropId; if (!count(state, seed)) return announce('เมล็ดหมด ซื้อเพิ่มได้ที่ตลาด') }
    else if (selected === 1 && plot.state === 'PLANTED') { action = 'water'; cost = 1; if ((state.water ?? 0) < 1) return announce('บัวรดน้ำหมด ไปเติมที่บ่อ') }
    else if (selected === 4 && plot.state === 'READY') { action = 'harvest'; if (!canAdd(state, plot.cropId as ItemId)) return announce('กระเป๋าเต็ม') }
    else return announce('เลือกเครื่องมือให้ตรงงาน: จอบ → เมล็ด → บัวรดน้ำ → เคียว')
    if (state.player.energy < cost) return announce('Energy ไม่พอทำสวน')
    multiplayer.action('plot', { index: i, plotAction: action, cropId }, result => {
      if (!result.ok) return announce(result.message ?? 'แปลงเปลี่ยนไปแล้ว')
      state.player.energy -= cost
      if (action === 'plant' && seed) remove(state, seed)
      if (action === 'water') state.water = (state.water ?? 0) - 1
      if (action === 'harvest' && result.crop) add(state, result.crop as ItemId)
      this.showAction(action === 'water' ? 3 : 4)
      changed(); announce(action === 'harvest' ? `เก็บ${ITEMS[result.crop as ItemId]?.name ?? 'ผลผลิต'}แล้ว เควสต์ร่วมคืบหน้า!` : action === 'plant' ? 'ปลูกแล้ว รดน้ำเพื่อให้โต' : action === 'water' ? 'รดน้ำแล้ว รอให้โต' : 'ขุดแปลงแล้ว')
    })
  }

  private useNode(node: ResourceNode) {
    const selected = activeActionSlot()
    const weapon = state.hotbarExtras?.[(state.selectedSlot ?? 0) - 7]
    const animal = node.kind === 'rabbit' || node.kind === 'boar'
    const ore = node.kind === 'copper' || node.kind === 'iron'
    const required = { tree: 2, rock: 3, grass: 4, copper: 3, iron: 3, rabbit: -1, boar: -1 }[node.kind]
    if (animal ? !['sword', 'bow', 'arcane_sword', 'wand'].includes(weapon ?? '') : selected !== required) return announce(animal ? 'ต้องซื้ออาวุธที่ตลาด แล้วเลือกจาก Hotbar ช่อง 8–10' : `ต้องใช้${node.kind === 'tree' ? 'ขวาน' : node.kind === 'grass' ? 'เคียว' : 'อีเต้อ'}กับสิ่งนี้`)
    const cost = node.kind === 'grass' ? 1 : animal ? 4 : 3
    if (state.player.energy < cost) return announce('Energy ไม่พอใช้เครื่องมือ')
    if (animal && weapon === 'wand' && (state.player.mana ?? 0) < 8) return announce('มานาไม่พอ ใช้ยามานาหรือพัก')
    const remaining = state.nodeHp?.[node.id] ?? node.hp
    const damage = (animal && weapon === 'arcane_sword' ? 3 : animal && weapon === 'wand' ? 2 : 1) + (animal ? equipmentStats(state).attack : 0)
    const drop: ItemId = ({ tree: 'wood', rock: 'stone', grass: 'fiber', rabbit: 'hide', boar: 'meat', copper: 'copper', iron: 'iron' } as Record<ResourceNode['kind'], ItemId>)[node.kind]
    if (multiplayer.world) {
      if ((state.nodeHp?.[node.id] ?? node.hp) <= damage && !canAdd(state, drop)) return announce('กระเป๋าเต็ม วัตถุดิบยังอยู่')
      multiplayer.action('node', { id: node.id, damage }, result => {
        if (!result.ok) return announce(result.message ?? 'วัตถุนี้ถูกเก็บไปแล้ว')
        state.player.energy -= cost
        if (animal && weapon === 'wand') state.player.mana = (state.player.mana ?? 0) - 8
        state.nodeHp ??= {}; state.nodeHp[node.id] = result.remaining ?? 0
        this.showAction(animal ? 1 : 4)
        if (result.defeated) {
          if (canAdd(state, drop)) add(state, drop)
          const rare = ore && rareDrop(mineFloor(state.player.mapId), Math.random()) && canAdd(state, 'moonstone')
          if (rare) add(state, 'moonstone')
          gainXp(state, animal ? 10 : ore ? 6 : 2)
          announce(`เก็บ${ITEMS[drop].name}ได้${rare ? ' และจันทราศิลา!' : ''}`)
        } else announce(`ใช้เครื่องมือแล้ว เหลือ ${result.remaining} ครั้ง`)
        this.drawResources(); changed()
      })
      return
    }
    const lastHit = remaining <= damage
    if (lastHit && !canAdd(state, drop)) return announce('กระเป๋าเต็ม วัตถุดิบยังอยู่')
    state.player.energy -= cost
    if (animal && weapon === 'wand') state.player.mana = (state.player.mana ?? 0) - 8
    state.nodeHp ??= {}
    state.nodeHp[node.id] = Math.max(0, remaining - damage)
    this.showAction(animal ? 1 : 4)
    if (lastHit) {
      add(state, drop)
      const rare = ore && rareDrop(mineFloor(state.player.mapId), Math.random()) && canAdd(state, 'moonstone')
      if (rare) add(state, 'moonstone')
      const leveled = gainXp(state, animal ? 10 : ore ? 6 : 2)
      this.drawResources()
      announce(`เก็บ${ITEMS[drop].name}ได้ 1 ชิ้น${rare ? ' และจันทราศิลาหายาก!' : ''}${leveled ? ` · เลเวล ${state.player.level}!` : ''}`)
    }
    else announce(`ใช้${animal ? ITEMS[weapon as ItemId].name : ore ? 'อีเต้อ' : HOTBAR_FIXED[selected].name}แล้ว อีก ${remaining - damage} ครั้ง`)
    changed()
  }

  private attackMonster(monster: Monster) {
    const weapon = state.hotbarExtras?.[(state.selectedSlot ?? 0) - 7]
    if (!weapon || !['sword', 'bow', 'arcane_sword', 'wand'].includes(weapon) || !count(state, weapon)) return announce('เลือกดาบ ธนู คทา หรือดาบจันทราใน Hotbar ก่อนโจมตี')
    if (state.player.energy < 3) return announce('พลังงานไม่พอโจมตี กินข้าวหรือนอนพัก')
    if (weapon === 'wand' && (state.player.mana ?? 0) < 8) return announce('มานาไม่พอ ใช้ยามานาหรือพัก')
    const damage = (weapon === 'arcane_sword' ? 3 : weapon === 'wand' ? 2 : 1) + equipmentStats(state).attack
    if (multiplayer.world) {
      const loot: ItemId = monster.kind === 'golem' ? 'moonstone' : monster.kind === 'bat' ? 'hide' : 'copper'
      if ((state.nodeHp?.[monster.id] ?? monster.hp) <= damage && !canAdd(state, loot)) return announce('กระเป๋าเต็ม เก็บของจากมอนสเตอร์ไม่ได้')
      multiplayer.action('monster', { id: monster.id, damage }, result => {
        if (!result.ok) return announce(result.message ?? 'มอนสเตอร์ถูกปราบแล้ว')
        state.player.energy -= 3
        if (weapon === 'wand') state.player.mana = (state.player.mana ?? 0) - 8
        state.nodeHp ??= {}; state.nodeHp[monster.id] = result.monsterHp ?? 0
        this.showAction(1)
        if (result.defeated) {
          const loot: ItemId = result.monsterKind === 'golem' ? 'moonstone' : result.monsterKind === 'bat' ? 'hide' : 'copper'
          const got = canAdd(state, loot) && add(state, loot)
          gainXp(state, result.xp ?? 0)
          announce(`ปราบมอนสเตอร์แล้ว! +${result.xp ?? 0} XP${got ? ` ได้${ITEMS[loot].name}` : ''}`)
        } else announce(`โจมตีมอนสเตอร์ เหลือ HP ${result.monsterHp}/${result.maxMonsterHp}`)
        this.drawMonsters(); changed()
      })
      return
    }
    state.player.energy -= 3
    if (weapon === 'wand') state.player.mana = (state.player.mana ?? 0) - 8
    const hp = Math.max(0, (state.nodeHp?.[monster.id] ?? monster.hp) - damage)
    state.nodeHp ??= {}
    state.nodeHp[monster.id] = hp
    this.showAction(1)
    if (hp === 0) {
      const loot: ItemId = monster.kind === 'golem' ? 'moonstone' : monster.kind === 'bat' ? 'hide' : 'copper'
      const gotLoot = canAdd(state, loot) && add(state, loot)
      const leveled = gainXp(state, monster.xp)
      announce(`ชนะ${{ slime: 'สไลม์', bat: 'ค้างคาว', golem: 'โกเลม' }[monster.kind]}! +${monster.xp} XP${gotLoot ? ` ได้${ITEMS[loot].name}` : ' กระเป๋าเต็ม'}${leveled ? ` เลเวล ${state.player.level}!` : ''}`)
    } else announce(`โจมตีมอนสเตอร์ เหลือ HP ${hp}/${monster.hp}`)
    this.drawMonsters(); changed()
  }

  private useSelected() {
    if (shopOpen || marketOpen || specialOpen || wardrobeOpen || festivalOpen || !accountPanel.classList.contains('hidden') || this.restingUntil || this.actionUntil > this.time.now || this.time.now < this.interactionCooldown) return
    if (state.player.mapId === 'farm' && Math.hypot(this.player.x - 770, this.player.y - 780) < 108) {
      this.interactionCooldown = this.time.now + 350
      this.toggleGardenGate()
      return
    }
    const nearbyFire = (multiplayer.world?.campfires ?? state.campfires ?? []).find(fire => fire.mapId === state.player.mapId && Math.hypot(this.player.x - fire.x, this.player.y - fire.y) < 82)
    if (nearbyFire) { this.interactionCooldown = this.time.now + 350; this.removeCampfire(nearbyFire); return }
    const nearest = this.nearest()
    if (nearest?.interaction) { this.interactionCooldown = this.time.now + 250; this.interact(nearest.interaction); return }
    const held = state.hotbarExtras?.[(state.selectedSlot ?? 0) - 7]
    if (held === 'broom' && count(state, 'broom')) {
      if (state.mounted && MAPS[state.player.mapId].blocked.some(([x, y, w, h]) => this.player.x > x - 24 && this.player.x < x + w + 24 && this.player.y > y - 24 && this.player.y < y + h + 24)) return announce('บินออกจากสิ่งกีดขวางก่อนลงจากไม้กวาด')
      state.mounted = !state.mounted
      if (this.terrainCollider) this.terrainCollider.active = !state.mounted
      this.syncGardenGate()
      this.broomMarker?.setVisible(!!state.mounted)
      this.flyingSprite?.setVisible(!!state.mounted)
      this.flyingShadow?.setVisible(!!state.mounted)
      this.player.setVisible(!state.mounted)
      changed(); announce(state.mounted ? 'ขึ้นไม้กวาดแล้ว! ใช้ปุ่มเดินเพื่อบินเหนือพื้น' : 'ลงจากไม้กวาดแล้ว'); return
    }
    if (held && ['rice_meal', 'stew', 'mana_potion'].includes(held)) {
      if (!eat(state, held)) return announce('ตอนนี้ยังไม่ต้องใช้ของชิ้นนี้')
      changed(); announce(`ใช้${ITEMS[held].name}แล้ว`); return
    }
    if (activeActionSlot() === 6) {
      if (!eat(state, 'radish')) return announce('ยังไม่ต้องกิน Radish หรือไม่มีในกระเป๋า')
      changed(); announce('กิน Radish แล้ว'); return
    }
    if (nearest?.monster) { this.interactionCooldown = this.time.now + 250; this.attackMonster(nearest.monster); return }
    if (nearest?.plot !== undefined) { this.interactionCooldown = this.time.now + 250; this.usePlot(nearest.plot); return }
    if (nearest?.resource) { this.interactionCooldown = this.time.now + 250; this.useNode(nearest.resource); return }
    if (selectedSeedId()) return announce('เดินเข้าใกล้แปลงที่ขุดแล้วในฟาร์มเพื่อปลูก')
    if (activeActionSlot() >= 7) return announce('เดินเข้าใกล้สัตว์ แล้วเลือกดาบหรือธนูเพื่อใช้')
    announce('เดินเข้าใกล้แปลงหรือวัตถุที่ใช้เครื่องมือนี้')
  }

  private toggleGardenGate() {
    const open = multiplayer.world?.gardenGateOpen ?? state.gardenGateOpen ?? false
    if (open && Math.abs(this.player.x - 770) < 64 && Math.abs(this.player.y - 780) < 43) return announce('ขยับออกจากช่องประตูก่อนปิด')
    if (multiplayer.world) {
      multiplayer.action('garden-gate', {}, result => { if (!result.ok) announce(result.message ?? 'เปิดปิดประตูไม่ได้') })
    } else {
      state.gardenGateOpen = !open
      this.syncGardenGate(); changed()
      announce(state.gardenGateOpen ? 'เปิดประตูสวนแล้ว' : 'ปิดประตูสวนแล้ว')
    }
  }

  private placeCampfire() {
    const mapId = state.player.mapId
    if (mapId === 'home' || mapId.startsWith('mine')) return announce('ก่อกองไฟได้เฉพาะกลางแจ้ง')
    if (state.mounted) return announce('ลงจากไม้กวาดก่อนก่อกองไฟ')
    if (count(state, 'wood') < 2 || count(state, 'stone') < 1) return announce('ก่อกองไฟต้องใช้ไม้ 2 และหิน 1')
    const x = Math.round(this.player.x), y = Math.round(this.player.y + 25)
    const fires = multiplayer.world?.campfires ?? state.campfires ?? []
    if (x < 60 || x > 1476 || y < 60 || y > 964 || MAPS[mapId].blocked.some(([bx, by, w, h]) => x > bx - 35 && x < bx + w + 35 && y > by - 35 && y < by + h + 35)
      || (mapId === 'farm' && (Math.hypot(x - 770, y - 780) < 110 || FARM_PLOTS.some(plot => Math.hypot(x - plot.x, y - plot.y) < 95)))
      || fires.some(fire => fire.mapId === mapId && Math.hypot(x - fire.x, y - fire.y) < 125)
      || fires.filter(fire => fire.mapId === mapId).length >= 3) return announce('เลือกที่โล่งห่างจากประตู แปลงผัก และกองไฟอื่น')
    if (multiplayer.world) {
      multiplayer.action('campfire', { operation: 'place' }, result => {
        if (!result.ok) return announce(result.message ?? 'ก่อกองไฟไม่ได้')
        remove(state, 'wood'); remove(state, 'wood'); remove(state, 'stone')
        changed(); announce('ก่อกองไฟแล้ว บริเวณนี้สว่างขึ้น')
      })
    } else {
      state.campfires ??= []
      state.campfires.push({ mapId, x, y })
      remove(state, 'wood'); remove(state, 'wood'); remove(state, 'stone')
      this.syncCampfires(); changed(); announce('ก่อกองไฟแล้ว บริเวณนี้สว่างขึ้น')
    }
  }

  private removeCampfire(fire: { mapId: string; x: number; y: number }) {
    if (multiplayer.world) multiplayer.action('campfire', { operation: 'remove' }, result => { if (!result.ok) announce(result.message ?? 'ดับกองไฟไม่ได้') })
    else {
      state.campfires = (state.campfires ?? []).filter(item => item !== fire)
      this.syncCampfires(); changed(); announce('ดับกองไฟแล้ว')
    }
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
    multiplayer.send(state.player.x, state.player.y, state.player.mapId, state.character ?? 'a', this.facing, false, true, state.outfit ?? 'default', !!state.mounted, state.equipped ?? {})
  }

  private interact(target: Interaction) {
    if (target.kind === 'future') return announce('เส้นทางนี้จะเปิดในอัปเดตถัดไป')
    if (target.kind === 'shop') return openShop()
    if (target.kind === 'market_shop') return openMarket()
    if (target.kind === 'festival') return openFestival()
    if (target.kind === 'tailor' || target.kind === 'magic_shop' || target.kind === 'forge') return openSpecial(target.kind)
    if (target.kind === 'refill') {
      if ((state.water ?? MAX_WATER) === MAX_WATER) return announce('บัวรดน้ำเต็มแล้ว')
      state.water = MAX_WATER; changed(); announce('เติมน้ำเต็มบัวแล้ว')
      return
    }
    if (target.kind === 'quest') {
      if (multiplayer.world) {
        const quest = multiplayer.world.quest
        if (quest.completed) return announce('เควสต์ร่วมสำเร็จแล้ว ขอบคุณทุกคน!')
        if (quest.stage === 0) return announce(`เควสต์ร่วม: เก็บเกี่ยวผัก ${quest.harvested}/5`)
        if (quest.stage === 1) return announce(`เควสต์ร่วม: ขุดแร่ในเหมือง ${quest.mined}/3`)
        if (!count(state, 'radish')) return announce('นำ Radish 1 ชิ้นมาส่งไกด์เพื่อจบเควสต์ร่วม')
        multiplayer.action('quest-deliver', {}, result => {
          if (!result.ok) return announce(result.message ?? 'ส่งเควสต์ไม่ได้')
          remove(state, 'radish'); changed(); announce('ส่ง Radish แล้ว ทุกคนในห้องได้รับรางวัล!')
        })
        return
      }
      if (state.questDone) return announce('เควสต์แรกสำเร็จแล้ว ขอบคุณที่ช่วยหมู่บ้าน!')
      if (!remove(state, 'radish')) return announce('เควสต์แรก: นำ Radish 1 ชิ้นมาส่ง รับ 20 Coins')
      state.player.coins += 20; state.questDone = true; changed(); announce('ส่ง Radish สำเร็จ ได้รับ 20 Coins!')
      return
    }
    if (target.kind === 'rest') {
      if (state.player.energy === MAX_ENERGY && (state.player.hp ?? 100) === maxHp(state) && (state.player.mana ?? 50) === maxMana(state)) return announce('พลังเต็มแล้ว')
      this.restingUntil = this.time.now + 3000; announce('กำลังนอนพัก หยุดเดิน 3 วินาที')
      return
    }
    if (target.kind === 'cook') {
      if (!state.recipeUnlocked) {
        state.recipeUnlocked = true; changed(); announce('แม่ครัวสอนสูตรซุป Radish แล้ว! กด E อีกครั้งเพื่อทำอาหาร')
        return
      }
      if (count(state, 'radish') < 1 || count(state, 'meat') < 1) return announce('สตูว์ต้องใช้ Radish 1 และเนื้อ 1')
      if (!canAdd(state, 'stew')) return announce('กระเป๋าเต็ม')
      remove(state, 'radish'); remove(state, 'meat'); add(state, 'stew')
      changed(); announce('ทำสตูว์แล้ว คลิกในกระเป๋าเพื่อกิน')
      return
    }
    if (target.kind === 'storage') announce('ที่เก็บของและคราฟต์จะเพิ่มในอัปเดตถัดไป')
  }

  update(time: number, delta: number) {
    if (this.rainGraphics) {
      this.rainGraphics.clear().setVisible(this.raining)
      if (this.raining) {
        this.rainGraphics.lineStyle(2, 0xc8eaff, .58)
        const width = this.scale.width + 100, height = this.scale.height + 100
        for (let i = 0; i < 110; i++) {
          const x = (i * 157 + time * .13) % width - 50
          const y = (i * 241 + time * .82) % height - 50
          this.rainGraphics.lineBetween(x, y, x - 8, y + 19)
        }
      }
    }
    for (const objects of this.remoteSprites.values()) {
      const x = objects.sprite.getData('targetX'), y = objects.sprite.getData('targetY')
      objects.sprite.x = Phaser.Math.Linear(objects.sprite.x, x, .35)
      objects.sprite.y = Phaser.Math.Linear(objects.sprite.y, y, .35)
      objects.label.setPosition(objects.sprite.x, objects.sprite.y - 49)
      objects.clothing.setPosition(objects.sprite.x, objects.sprite.y)
    }
    if (time - this.lastClock > 1000) { this.lastClock = time; clock() }
    if (mineFloor(state.player.mapId) && !multiplayer.world) this.moveMonsters(time, delta)
    const hover = Math.sin(time / 210) * 4
    this.broomMarker?.setPosition(this.player.x, this.player.y + 4 + hover)
    this.flyingSprite?.setPosition(this.player.x, this.player.y - 28 + hover).setFrame(this.player.frame.name).setVisible(!!state.mounted)
    this.flyingShadow?.setPosition(this.player.x, this.player.y + 25).setScale(1 - hover * .008).setVisible(!!state.mounted)
    this.clothing?.setPosition(this.player.x, this.player.y + (state.mounted ? -28 + hover : 0))
    if (mineFloor(state.player.mapId) && time - this.lastMonsterAttack > 1800) {
      this.lastMonsterAttack = time
      for (const monster of this.monsters) {
        if ((state.nodeHp?.[monster.id] ?? monster.hp) <= 0 || Math.hypot(this.player.x - monster.x, this.player.y - monster.y) > 62) continue
        const taken = Math.max(1, monster.damage - equipmentStats(state).defense)
        state.player.hp = Math.max(0, (state.player.hp ?? maxHp(state)) - taken)
        this.cameras.main.shake(100, .004)
        changed(); announce(`โดน${{ slime: 'สไลม์', bat: 'ค้างคาว', golem: 'โกเลม' }[monster.kind]}โจมตี! HP -${taken}`)
        if (state.player.hp === 0) {
          state.player.hp = Math.ceil(maxHp(state) / 2)
          state.player.mana = Math.ceil(maxMana(state) / 2)
          state.player.mapId = 'village'; state.player.x = 770; state.player.y = 820; state.mounted = false
          changed(); this.scene.restart(); announce('หมดสติ กลับมาฟื้นที่หมู่บ้าน'); return
        }
        break
      }
    }
    if (!multiplayer.world && mineFloor(state.player.mapId) && dayNumber(state) !== this.lastMonsterDay) {
      this.lastMonsterDay = dayNumber(state)
      this.monsters = monstersFor(state.player.mapId, this.lastMonsterDay)
      this.monsterWander.clear()
      this.drawMonsters()
    }
    if (time - this.lastGrowthCheck > 250) {
      this.lastGrowthCheck = time
      if (refreshGrowth(state)) { if (state.player.mapId === 'farm') this.drawPlots(); if (MAPS[state.player.mapId].resources) this.drawResources(); changed() }
    }
    if (Phaser.Input.Keyboard.JustDown(this.esc)) closeShop()
    if (shopOpen || marketOpen || specialOpen || wardrobeOpen || festivalOpen || !accountPanel.classList.contains('hidden') || [chatInput, playerName, roomCode].includes(document.activeElement as HTMLInputElement)) {
      this.player.setVelocity(0)
      if (shopOpen && Phaser.Input.Keyboard.JustDown(this.one)) buy()
      if (shopOpen && Phaser.Input.Keyboard.JustDown(this.two)) sell()
      return
    }
    if (Phaser.Input.Keyboard.JustDown(this.f)) this.placeCampfire()
    this.hotbarKeys.forEach((key, index) => {
      if (Phaser.Input.Keyboard.JustDown(key)) { state.selectedSlot = index; changed(); announce(`เลือก${index < 7 ? HOTBAR_FIXED[index].name : state.hotbarExtras?.[index - 7] ? ITEMS[state.hotbarExtras[index - 7]!].name : 'ช่องว่าง'}`) }
    })
    let x = Number(this.cursors.right.isDown || this.wasd.D.isDown) - Number(this.cursors.left.isDown || this.wasd.A.isDown)
    let y = Number(this.cursors.down.isDown || this.wasd.S.isDown) - Number(this.cursors.up.isDown || this.wasd.W.isDown)
    if (this.restingUntil && (x || y)) { this.restingUntil = 0; announce('ยกเลิกการพัก') }
    if (this.restingUntil && time >= this.restingUntil) {
      this.restingUntil = 0; state.player.energy = MAX_ENERGY; state.player.hp = maxHp(state); state.player.mana = maxMana(state); changed(); announce('พักเต็มอิ่ม HP มานา และพลังงานฟื้นแล้ว')
    }
    if (this.restingUntil) { x = 0; y = 0 }
    if (this.actionUntil > time) { x = 0; y = 0 }
    const length = Math.hypot(x, y) || 1
    const speed = (state.mounted ? 345 : 220) + equipmentStats(state).speed
    this.player.setVelocity(x / length * speed, y / length * speed)
    if (x || y) this.facing = y > 0 ? 0 : y < 0 ? 1 : x < 0 ? 2 : 3
    if (this.actionUntil > time) this.player.setFrame(this.actionRow * 4 + this.facing)
    else this.player.setFrame((x || y ? 1 + Math.floor(time / 180) % 2 : 0) * 4 + this.facing)
    if (this.clothing && this.clothing.getData('facing') !== this.facing) { drawAppearance(this.clothing, { outfit: state.outfit ?? 'default', equipped: state.equipped ?? {} }, this.facing); this.clothing.setData('facing', this.facing) }
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
    const nearGate = state.player.mapId === 'farm' && Math.hypot(this.player.x - 770, this.player.y - 780) < 108
    const nearFire = (multiplayer.world?.campfires ?? state.campfires ?? []).some(fire => fire.mapId === state.player.mapId && Math.hypot(this.player.x - fire.x, this.player.y - fire.y) < 82)
    if (nearest || nearGate || nearFire) {
      let label = nearest?.interaction?.label ?? ''
      if (nearest?.plot !== undefined) {
        const stateName = state.plots[nearest.plot].state
        label = { EMPTY: 'ขุดแปลงด้วยจอบ', TILLED: 'ปลูกด้วยเมล็ด', PLANTED: 'รดน้ำด้วยบัว', GROWING: 'ดูเวลาที่เหลือ', READY: 'เก็บด้วยเคียว', WITHERED: 'ขุดแปลงใหม่' }[stateName]
      }
      if (nearest?.resource) label = { tree: 'ตัดด้วยขวาน', rock: 'ทุบด้วยอีเต้อ', grass: 'ตัดด้วยเคียว', rabbit: 'ล่าด้วยดาบหรือธนู', boar: 'ล่าด้วยดาบหรือธนู', copper: 'ขุดด้วยอีเต้อ', iron: 'ขุดด้วยอีเต้อ' }[nearest.resource.kind]
      if (nearest?.monster) label = `โจมตี${{ slime: 'สไลม์', bat: 'ค้างคาว', golem: 'โกเลม' }[nearest.monster.kind]}`
      if (nearFire) label = 'ดับกองไฟ'
      if (nearGate) label = (multiplayer.world?.gardenGateOpen ?? state.gardenGateOpen) ? 'ปิดประตูสวน' : 'เปิดประตูสวน'
      ui.prompt.innerHTML = `<kbd>E</kbd> ${label}`
      ui.prompt.classList.remove('hidden')
    } else ui.prompt.classList.add('hidden')
    if (Phaser.Input.Keyboard.JustDown(this.e) || Phaser.Input.Keyboard.JustDown(this.space)) this.useSelected()
    if (time - this.lastSave > 15000) {
      this.lastSave = time
      if (!saveBlocked && !persist(state)) announce('บันทึกเกมไม่ได้ แต่ยังเล่นต่อได้')
      queueCloudSave()
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: window.innerWidth, height: window.innerHeight,
  transparent: true, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } }, scene: [WorldScene],
  render: { pixelArt: true, antialias: false }
})
void initializeAccount()
