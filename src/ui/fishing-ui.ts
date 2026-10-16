import type { Calendar } from '../calendar'
import type { Save } from '../domain'
import { FISH, FISHING_SPOTS, fishingLevel, fishingProgress, selectFish, type Fish, type FishingSpotId } from '../fishing'
import { FishingSession } from '../fishing-session'
import { SHOPS } from '../shops'
import { FISHING_ITEM_ASSETS, fishArtStyle, fishingItemAssetStyle, type FishingItemAssetKey } from './item-assets'
import { WEATHER_LABELS, type WeatherType } from '../weather.mjs'
import './fishing-ui.css'

export function fishingMarkup() {
  return `<aside id="fishing-beach-hud" class="fishing-beach-hud hidden" aria-label="ข้อมูลชายหาด"><section class="fishing-quest-card"><strong>เควสแนะนำ</strong><small id="fishing-beach-quest"></small><small>จับปลาชนิดใหม่ 0/1</small><small>เก็บหอยทะเล 0/5</small></section><section class="fishing-map-card"><strong>ชายหาดแสงจันทร์</strong><div class="fishing-beach-mini"><span id="fishing-player-dot" aria-label="ตำแหน่งผู้เล่น"></span></div><small id="fishing-beach-weather"></small><small><kbd>E</kbd> ตกปลา · <kbd>R</kbd> เหยื่อ · <kbd>Tab</kbd> กระเป๋า</small></section></aside><div id="fishing-overlay" class="overlay hidden" tabindex="-1"><section class="dialog game-window fishing-window" role="dialog" aria-modal="true" aria-labelledby="fishing-title"><header class="fishing-ribbon-header"><div><small>MOONLIGHT BEACH</small><h2 id="fishing-title">ระบบตกปลา</h2></div><button id="fishing-close" aria-label="ปิด">✕</button></header><div id="fishing-content" class="fishing-content"></div></section></div>`
}

const shop = SHOPS.fishing_shop
const price = (id: 'bait' | 'rod2' | 'rod3') => shop.serviceStock!.find(product => product.id === id)!.price
const art = (id: FishingItemAssetKey) => `<span class="fishing-item-art" style="${fishingItemAssetStyle(id)}" role="img" aria-label="${FISHING_ITEM_ASSETS[id].alt}"></span>`
const fishArtwork = (fish: Fish, className = '') => `<span class="fishing-fish-art ${className}" style="${fishArtStyle(fish.id)}" role="img" aria-label="${fish.name}"></span>`
const rarityStars = (fish: Fish) => '★'.repeat({ common: 1, uncommon: 2, rare: 3, legendary: 5 }[fish.rarity]) + '☆'.repeat(5 - { common: 1, uncommon: 2, rare: 3, legendary: 5 }[fish.rarity])
const rarityLabel = (fish: Fish) => ({ common: 'ทั่วไป', uncommon: 'ไม่ธรรมดา', rare: 'หายาก', legendary: 'ตำนาน' })[fish.rarity]
const spotCards = (active: FishingSpotId) => Object.entries(FISHING_SPOTS).map(([id, spot]) => `<article class="fishing-spot-card ${id === active ? 'active' : ''}"><span></span><strong>${spot.name}</strong><small>${id === active ? 'ตำแหน่งปัจจุบัน' : `Lv.${spot.level} · เดินทางไปที่จุดนี้`}</small></article>`).join('')

export class FishingUI {
  private overlay = document.querySelector<HTMLElement>('#fishing-overlay')!
  private content = document.querySelector<HTMLElement>('#fishing-content')!
  private spot: FishingSpotId = 'beginner-pier'
  private view: 'fish' | 'shop' | 'journal' = 'fish'
  private shopTab: 'buy' | 'sell' | 'upgrade' = 'buy'
  private journalFilter: 'all' | FishingSpotId | 'rare' | 'legendary' = 'all'
  private target?: Fish
  private session?: FishingSession
  private interval?: number
  private held = false
  private settled = false
  private newCatch = false
  private message = ''

  constructor(private save: () => Save, private environment: () => { calendar: Calendar; weather: WeatherType }, private changed: () => void) {
    document.querySelector('#fishing-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    this.content.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
      const action = button?.dataset.fishingAction
      if (action === 'cast') this.cast()
      if (action === 'hook') this.hook()
      if (action === 'bait') this.buyBait()
      if (action === 'rod') this.buyRod()
      if (action === 'sell-shells') this.sellMaterial('shells')
      if (action === 'sell-glass') this.sellMaterial('seaGlass')
      if (action === 'sell-fish' && button?.dataset.fishId) this.sellFish(button.dataset.fishId)
      if (action === 'journal') { this.view = 'journal'; this.render(); this.content.scrollTop = 0 }
      if (action === 'shop') { this.view = 'shop'; this.shopTab = 'buy'; this.render(); this.content.scrollTop = 0 }
      if (action === 'back') { this.view = 'fish'; this.render(); this.content.scrollTop = 0 }
      const tab = button?.dataset.fishingTab as 'buy' | 'sell' | 'upgrade' | undefined
      if (tab) { this.shopTab = tab; this.message = ''; this.render() }
      const filter = button?.dataset.fishingFilter as 'all' | FishingSpotId | 'rare' | 'legendary' | undefined
      if (filter) { this.journalFilter = filter; this.render() }
    })
    this.content.addEventListener('pointerdown', event => {
      if ((event.target as HTMLElement).closest('[data-fishing-action="reel"]')) { this.held = true; event.preventDefault() }
    })
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) this.content.addEventListener(type, () => { this.held = false })
    window.addEventListener('keydown', event => {
      const onBeach = this.save().player.mapId === 'beach'
      if (!this.isOpen && document.querySelector('.overlay:not(.hidden)')) return
      if (event.key === 'Tab' && onBeach) { event.preventDefault(); event.stopImmediatePropagation(); this.openJournal(); return }
      if ((event.key === 'r' || event.key === 'R') && onBeach && !this.isOpen) { event.preventDefault(); event.stopImmediatePropagation(); this.openShop(); return }
      if (!this.isOpen) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.close(); return }
      if ((event.code === 'Space' || event.code === 'KeyE') && this.view === 'fish' && !event.repeat) {
        event.preventDefault(); event.stopImmediatePropagation()
        if (this.session?.phase === 'bite') this.hook()
        else if (this.session?.phase === 'reeling') this.held = true
        else if (!this.session || this.session.phase === 'failed' || this.session.phase === 'success') this.cast()
      }
    }, { capture: true })
    window.addEventListener('keyup', event => { if (event.code === 'Space' || event.code === 'KeyE') this.held = false }, { capture: true })
    window.addEventListener('blur', () => { this.held = false })
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }
  openSpot(spot: FishingSpotId) { this.spot = spot; this.view = 'fish'; this.open() }
  openShop() { this.view = 'shop'; this.shopTab = 'buy'; this.open() }
  openJournal() { this.view = 'journal'; this.open() }
  private open() { this.message = ''; this.overlay.classList.remove('hidden'); this.render(); this.overlay.focus(); this.content.scrollTop = 0 }
  close() { this.stop(); this.overlay.classList.add('hidden') }
  private stop() { if (this.interval) clearInterval(this.interval); this.interval = undefined; this.target = undefined; this.session = undefined; this.held = false }

  private cast() {
    if (this.session && !['failed', 'success'].includes(this.session.phase)) return
    this.stop()
    const progress = fishingProgress(this.save())
    const spot = FISHING_SPOTS[this.spot]
    if (fishingLevel(progress.xp) < spot.level || progress.rod < spot.rod) { this.message = `ต้องมีทักษะตกปลาเลเวล ${spot.level} และคันเบ็ดระดับ ${spot.rod}`; this.render(); return }
    if (progress.bait <= 0) { this.message = 'เหยื่อหมด ซื้อเพิ่มจากนาวาที่ร้าน'; this.render(); return }
    if (this.save().player.energy < 2) { this.message = 'Energy ไม่พอ'; this.render(); return }
    const { calendar, weather } = this.environment()
    this.target = selectFish(this.spot, calendar, weather)
    this.session = new FishingSession(this.target, progress.rod, fishingLevel(progress.xp))
    this.session.cast(performance.now())
    this.settled = false; this.held = false
    progress.bait--; this.save().player.energy -= 2
    this.message = 'โยนเบ็ดแล้ว รอปลากินเหยื่อ'
    this.changed()
    this.render()
    this.interval = window.setInterval(() => this.updateSession(), 33)
  }

  private hook() {
    if (!this.session?.hook(performance.now())) return
    this.message = 'กด Space ค้างหรือกดปุ่มค้างเพื่อยกแถบสีเขียว ปล่อยเพื่อลดความตึง'
    this.render()
  }

  private updateSession() {
    if (!this.session) return
    const previous = this.session.phase
    this.session.tick(performance.now(), this.held)
    if (this.session.phase === 'success' && !this.settled) { this.settled = true; this.completeCatch(); return }
    if (this.session.phase === 'failed') {
      this.message = this.session.failure
      if (this.interval) clearInterval(this.interval)
      this.interval = undefined; this.held = false; this.render(); return
    }
    if (this.session.phase !== previous) { this.render(); return }
    this.paintSession()
  }

  private completeCatch() {
    const fish = this.target!
    const progress = fishingProgress(this.save())
    this.newCatch = !progress.caught[fish.id]
    progress.caught[fish.id] = (progress.caught[fish.id] ?? 0) + 1
    progress.inventory![fish.id] = (progress.inventory![fish.id] ?? 0) + 1
    progress.xp += fish.xp
    this.save().player.coins += fish.value
    this.message = `จับ${fish.name}ได้! +${fish.value} Coins · +${fish.xp} Fishing XP`
    if (this.interval) clearInterval(this.interval)
    this.interval = undefined; this.held = false; this.changed(); this.render()
  }

  private paintSession() {
    const session = this.session
    if (!session || session.phase !== 'reeling') return
    const fish = this.content.querySelector<HTMLElement>('.fishing-moving-fish')
    const zone = this.content.querySelector<HTMLElement>('.fishing-catch-zone')
    if (fish) fish.style.bottom = `${session.fishPosition * 100}%`
    if (zone) { zone.style.bottom = `${(session.zonePosition - session.zoneSize / 2) * 100}%`; zone.style.height = `${session.zoneSize * 100}%` }
    this.content.querySelector<HTMLElement>('.fishing-progress-fill')?.style.setProperty('width', `${session.progress * 100}%`)
    this.content.querySelector<HTMLElement>('.fishing-tension-fill')?.style.setProperty('height', `${session.tension * 100}%`)
    const copy = this.content.querySelector<HTMLElement>('.fishing-progress-copy')
    if (copy) copy.textContent = `${Math.round(session.progress * 100)}%`
  }

  private buyBait() {
    const save = this.save(), progress = fishingProgress(save)
    if (save.player.coins < price('bait')) this.message = 'Coins ไม่พอซื้อเหยื่อ'
    else if (progress.bait > 989) this.message = 'เหยื่อเต็มแล้ว'
    else { save.player.coins -= price('bait'); progress.bait += 10; this.message = 'ซื้อเหยื่อ 10 ชิ้นแล้ว'; this.changed() }
    this.render()
  }
  private buyRod() {
    const save = this.save(), progress = fishingProgress(save)
    const next = progress.rod + 1
    const cost = next === 2 ? price('rod2') : price('rod3')
    if (next > 3) this.message = 'คันเบ็ดระดับสูงสุดแล้ว'
    else if (fishingLevel(progress.xp) < next) this.message = `ต้องมีทักษะตกปลาเลเวล ${next}`
    else if (save.player.coins < cost) this.message = 'Coins ไม่พออัปเกรดคันเบ็ด'
    else { save.player.coins -= cost; progress.rod = next as 2 | 3; this.message = `อัปเกรดคันเบ็ดเป็นระดับ ${next} แล้ว`; this.changed() }
    this.render()
  }
  private sellMaterial(kind: 'shells' | 'seaGlass') {
    const save = this.save(), progress = fishingProgress(save), count = progress[kind] ?? 0
    if (!count) this.message = 'ยังไม่มีของทะเลชนิดนี้'
    else { const value = shop.materialSellPrices![kind]; progress[kind] = 0; save.player.coins += count * value; this.message = `ขาย${kind === 'shells' ? 'เปลือกหอย' : 'แก้วทะเล'} ${count} ชิ้น ได้ ${count * value} Coins`; this.changed() }
    this.render()
  }

  private sellFish(id: string) {
    const fish = FISH.find(item => item.id === id)
    const save = this.save(), progress = fishingProgress(save)
    if (!fish || !progress.inventory?.[id]) this.message = 'ไม่มีปลาชนิดนี้ในกระเป๋า'
    else {
      progress.inventory[id]--
      save.player.coins += fish.value
      this.message = `ขาย${fish.name} 1 ตัว ได้ ${fish.value} Coins`
      this.changed()
    }
    this.render()
  }

  private render() {
    const save = this.save(), progress = fishingProgress(save)
    const level = fishingLevel(progress.xp)
    const feedback = `<p class="fishing-feedback" role="status">${this.message}</p>`
    if (this.view === 'shop') {
      const caughtFish = FISH.filter(fish => (progress.inventory?.[fish.id] ?? 0) > 0)
      const buyPanel = `<div class="fishing-product-list"><button data-fishing-action="bait" class="fishing-product-row">${art('bait')}<span><strong>เหยื่อทะเล 10 ชิ้น</strong><small>เหมาะสำหรับปลาทั่วไปทุกพื้นที่</small></span><b>${price('bait')} Coins</b></button></div>`
      const sellPanel = `<div class="fishing-product-list">${caughtFish.map(fish => `<button data-fishing-action="sell-fish" data-fish-id="${fish.id}" class="fishing-product-row">${fishArtwork(fish)}<span><strong>${fish.name} ×${progress.inventory![fish.id]}</strong><small>${rarityLabel(fish)} · ขายครั้งละ 1 ตัว</small></span><b>${fish.value} Coins</b></button>`).join('') || '<p class="fishing-empty">ยังไม่มีปลาในกระเป๋าสำหรับขาย</p>'}<button data-fishing-action="sell-shells" class="fishing-product-row">${art('shells')}<span><strong>เปลือกหอย ×${progress.shells ?? 0}</strong><small>ขายทั้งหมด</small></span><b>${shop.materialSellPrices!.shells} / ชิ้น</b></button><button data-fishing-action="sell-glass" class="fishing-product-row">${art('seaGlass')}<span><strong>แก้วทะเล ×${progress.seaGlass ?? 0}</strong><small>ขายทั้งหมด</small></span><b>${shop.materialSellPrices!.seaGlass} / ชิ้น</b></button></div>`
      const nextRod = progress.rod === 1 ? 'rod2' : 'rod3'
      const upgradePanel = `<div class="fishing-upgrade-card">${art(progress.rod < 3 ? nextRod : 'rod3')}<div><h3>คันเบ็ดระดับ ${progress.rod}</h3><p>Catch Zone +${progress.rod * 5}% · ลดความเสี่ยงสายขาด · ปลดล็อกพื้นที่ระดับ ${progress.rod}</p><button data-fishing-action="rod" class="mini-game-primary" ${progress.rod >= 3 ? 'disabled' : ''}>${progress.rod >= 3 ? 'อัปเกรดสูงสุดแล้ว' : `อัปเกรด ${price(nextRod)} Coins`}</button></div></div>`
      const activePanel = this.shopTab === 'buy' ? buyPanel : this.shopTab === 'sell' ? sellPanel : upgradePanel
      this.content.innerHTML = `<div class="fishing-shop-shell"><div class="fishing-shop-hero" style="background-image:url('${shop.bannerAsset}')"><div class="fishing-shop-sign" style="background-image:url('${shop.signAsset}')"><strong>ร้านอุปกรณ์ตกปลา</strong></div><div class="fishing-shop-dialogue"><span class="fishing-npc-art" style="background-image:url('${shop.npcPortrait}')" role="img" aria-label="นาวา เจ้าของร้านตกปลา"></span><p><b>นาวา</b> “มีอุปกรณ์ตกปลาดี ๆ มากมายเลย ลองดูได้นะ!”</p></div></div><section class="fishing-shop-ledger"><header><h3>ร้านอุปกรณ์ตกปลา</h3><b class="fishing-coins">● ${save.player.coins}</b></header><nav class="fishing-shop-tabs"><button data-fishing-tab="buy" class="${this.shopTab === 'buy' ? 'active' : ''}">ซื้อ</button><button data-fishing-tab="sell" class="${this.shopTab === 'sell' ? 'active' : ''}">ขาย</button><button data-fishing-tab="upgrade" class="${this.shopTab === 'upgrade' ? 'active' : ''}">อัปเกรด</button></nav>${activePanel}${feedback}</section></div><div class="fishing-footer-actions"><button data-fishing-action="journal">สมุดสะสมปลา</button><button data-fishing-action="back">กลับจุดตกปลา</button></div>`
      return
    }
    if (this.view === 'journal') {
      const found = FISH.filter(fish => progress.caught[fish.id]).length
      const filtered = FISH.filter(fish => this.journalFilter === 'all' || this.journalFilter === 'rare' || this.journalFilter === 'legendary' ? this.journalFilter === 'all' || fish.rarity === this.journalFilter : fish.spots.includes(this.journalFilter))
      const grid = filtered.map(fish => { const discovered = !!progress.caught[fish.id]; return `<article class="fishing-book-card ${discovered ? 'found' : 'unknown'}">${fishArtwork(fish)}<strong>${discovered ? fish.name : 'ยังไม่ค้นพบ'}</strong><span>${discovered ? rarityStars(fish) : '???'}</span><small>${discovered ? `${FISHING_SPOTS[fish.spots[0]].name} · เคยจับ ${progress.caught[fish.id]} ตัว` : 'ออกสำรวจเพื่อค้นหา'}</small></article>` }).join('')
      const filterButton = (id: typeof this.journalFilter, label: string) => `<button data-fishing-filter="${id}" class="${this.journalFilter === id ? 'active' : ''}">${label}</button>`
      this.content.innerHTML = `<div class="fishing-journal-shell"><aside class="fishing-journal-rail"><h3>สมุดสะสมปลา</h3>${filterButton('all', 'ทั้งหมด')}${filterButton('beginner-pier', 'ทะเลใกล้ชายฝั่ง')}${filterButton('coral-reef', 'แนวปะการัง')}${filterButton('shipwreck', 'ซากเรือ')}${filterButton('rare', 'ปลาหายาก')}${filterButton('legendary', 'ตำนาน')}</aside><section class="fishing-journal-book"><header><div><h3>สมุดสะสมปลา</h3><p>พบแล้ว ${found}/${FISH.length} ชนิด · Fishing Level ${level}</p></div><b>${Math.round(found / FISH.length * 100)}%</b></header><div class="fishing-book-grid">${grid}</div></section><aside class="fishing-condition-card"><h3>ช่วงเวลาที่พบ</h3><div><span>☀</span> กลางวัน</div><div><span>◐</span> เย็น</div><div><span>☾</span> กลางคืน</div><h3>สภาพอากาศ</h3><p>ฟ้าใส · ฝน · พายุ</p><h3>ฤดูกาล</h3><p>ใบไม้ผลิ · ร้อน · ใบไม้ร่วง · หนาว</p></aside></div><div class="fishing-footer-actions"><button data-fishing-action="shop">ร้านอุปกรณ์</button><button data-fishing-action="back">กลับจุดตกปลา</button></div>`
      return
    }
    const { calendar, weather } = this.environment()
    const status = this.session?.phase ?? 'idle'
    const environment = `<div class="fishing-context-bar"><strong>${FISHING_SPOTS[this.spot].name}</strong><span>${calendar.night ? 'กลางคืน' : 'กลางวัน'}</span><span>${WEATHER_LABELS[weather]}</span><span>ฤดู${calendar.season.name}</span><b>Lv.${level} · เหยื่อ ${progress.bait}</b></div>`
    if (status === 'success' && this.target) {
      const catchNumber = progress.caught[this.target.id] ?? 1
      const hash = [...this.target.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) + catchNumber * 7
      const size = (22 + hash % 420 / 10).toFixed(1), weight = (.4 + hash % 38 / 10).toFixed(1)
      const bagFish = FISH.filter(fish => progress.inventory?.[fish.id]).slice(0, 8)
      this.content.innerHTML = `${environment}<div class="fishing-result-layout"><section class="fishing-catch-result rarity-${this.target.rarity}"><div class="fishing-result-ribbon">จับได้แล้ว!</div><span class="fishing-new">${this.newCatch ? 'NEW' : ''}</span>${fishArtwork(this.target, 'fishing-catch-art')}<h3>${this.target.name}</h3><div class="fishing-stars">${rarityStars(this.target)}</div><div class="fishing-measure"><span>ขนาด ${size} cm</span><span>น้ำหนัก ${weight} kg</span></div><p>${rarityLabel(this.target)} · ได้ ${this.target.xp} Fishing EXP · ราคา ${this.target.value} Coins</p><div><button data-fishing-action="cast" class="mini-game-primary">ตกอีกครั้ง</button><button data-fishing-action="journal">ดูรายละเอียด</button></div></section><section class="fishing-bag-panel"><header><h3>กระเป๋าปลา</h3><b>${bagFish.reduce((sum, fish) => sum + (progress.inventory?.[fish.id] ?? 0), 0)}/60</b></header><div class="fishing-bag-grid">${bagFish.map(fish => `<div>${fishArtwork(fish)}<small>${progress.inventory![fish.id]}</small></div>`).join('')}</div><p>${this.message}</p><button data-fishing-action="shop">ไปร้านอุปกรณ์</button></section></div>`
      return
    }
    if (status === 'casting' || status === 'waiting' || status === 'bite' || status === 'reeling') {
      const label = status === 'casting' ? 'กำลังโยนเบ็ด' : status === 'waiting' ? 'รอปลากินเหยื่อ' : status === 'bite' ? 'ปลากินเหยื่อแล้ว! กด Space' : 'ควบคุมแถบสีเขียวให้ครอบตัวปลา'
      const fish = this.target ?? FISH[0]
      this.content.innerHTML = `${environment}<div class="fishing-game-layout"><section class="fishing-underwater"><div class="fishing-title-ribbon"><h3>${label}</h3><small>${status === 'reeling' ? fish.name : 'Unknown Fish'}</small></div>${status === 'reeling' ? `<div class="fishing-playfield"><div class="fishing-catch-column"><span class="fishing-catch-zone"></span>${fishArtwork(fish, 'fishing-moving-fish')}</div><div class="fishing-tension-column"><span class="fishing-tension-fill"></span></div></div><div class="fishing-progress-track"><span class="fishing-progress-fill"></span></div><button data-fishing-action="reel" class="mini-game-primary">กดค้างในช่วงสีเขียว · Space</button>` : `<div class="fishing-bobber" aria-hidden="true"></div>${status === 'bite' ? '<button data-fishing-action="hook" class="mini-game-primary">ติดเบ็ดตอนนี้! · Space</button>' : '<p>มองทุ่นและเตรียมกด Space</p>'}`}</section><aside class="fishing-game-sidebar"><div class="fishing-fish-shadow">${fishArtwork(fish)}</div><h3>${status === 'reeling' ? fish.name : 'ปลาปริศนา'}</h3><p>ความยาก ${rarityStars(fish)}</p><div class="fishing-stat"><span>ความคืบหน้า</span><b class="fishing-progress-copy">${Math.round((this.session?.progress ?? 0) * 100)}%</b></div><div class="fishing-stat"><span>ความตึงสาย</span><b>อย่าให้เต็ม</b></div><p class="fishing-control-tip">กดค้างเพื่อยก Catch Zone<br>ปล่อยเพื่อลดระดับและความตึง</p>${feedback}</aside></div>`
      this.paintSession()
      return
    }
    this.content.innerHTML = `${environment}<div class="fishing-adventure-layout"><section class="fishing-spot-preview"><div class="fishing-preview-copy"><span>จุดตกปลา</span><h3>${FISHING_SPOTS[this.spot].name}</h3><p>ปลาที่พบเปลี่ยนตามเวลา ฤดูกาล และอากาศ</p></div><div class="fishing-control-keys"><span><kbd>E</kbd> ตกปลา</span><span><kbd>R</kbd> เปลี่ยนเหยื่อ</span><span><kbd>Tab</kbd> เปิดสมุด</span></div><button data-fishing-action="cast" class="mini-game-primary fishing-cast-button">เริ่มตกปลา · Space</button></section><aside class="fishing-info-panel"><h3>ข้อมูลจุดตกปลา</h3><p><b>คันเบ็ด</b> ระดับ ${progress.rod}/3</p><p><b>เหยื่อ</b> ${progress.bait} ชิ้น</p><p><b>ช่วงเวลา</b> ${calendar.night ? 'กลางคืน' : 'กลางวัน'}</p><p><b>อากาศ</b> ${WEATHER_LABELS[weather]}</p><div class="fishing-actions"><button data-fishing-action="journal">สมุดสะสมปลา</button><button data-fishing-action="shop">ร้านอุปกรณ์</button></div>${feedback}</aside></div><div class="fishing-spot-strip">${spotCards(this.spot)}</div>`
  }
}
