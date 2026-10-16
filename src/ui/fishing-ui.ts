import type { Calendar } from '../calendar'
import type { Save } from '../domain'
import { FISH, FISHING_SPOTS, fishingLevel, fishingProgress, selectFish, type Fish, type FishingSpotId } from '../fishing'
import { SHOPS } from '../shops'
import { FISHING_ITEM_ASSETS, fishingItemAssetStyle, type FishingItemAssetKey } from './item-assets'
import { WEATHER_LABELS, type WeatherType } from '../weather.mjs'
import './fishing-ui.css'

export function fishingMarkup() {
  return `<div id="fishing-overlay" class="overlay hidden" tabindex="-1"><section class="dialog game-window fishing-window" role="dialog" aria-modal="true" aria-labelledby="fishing-title"><header class="mini-game-header"><div><small>MOONLIGHT BEACH</small><h2 id="fishing-title">ชายหาดแสงจันทร์</h2></div><button id="fishing-close" aria-label="ปิด">✕</button></header><div id="fishing-content" class="fishing-content"></div></section></div>`
}

const shop = SHOPS.fishing_shop
const price = (id: 'bait' | 'rod2' | 'rod3') => shop.serviceStock!.find(product => product.id === id)!.price
const art = (id: FishingItemAssetKey) => `<span class="fishing-item-art" style="${fishingItemAssetStyle(id)}" role="img" aria-label="${FISHING_ITEM_ASSETS[id].alt}"></span>`

export class FishingUI {
  private overlay = document.querySelector<HTMLElement>('#fishing-overlay')!
  private content = document.querySelector<HTMLElement>('#fishing-content')!
  private spot: FishingSpotId = 'beginner-pier'
  private view: 'fish' | 'shop' | 'journal' = 'fish'
  private target?: Fish
  private startedAt = 0
  private interval?: number
  private misses = 0
  private message = ''

  constructor(private save: () => Save, private environment: () => { calendar: Calendar; weather: WeatherType }, private changed: () => void) {
    document.querySelector('#fishing-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    this.content.addEventListener('click', event => {
      const action = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-fishing-action]')?.dataset.fishingAction
      if (action === 'cast') this.cast()
      if (action === 'hit') this.hit()
      if (action === 'bait') this.buyBait()
      if (action === 'rod') this.buyRod()
      if (action === 'sell-shells') this.sellMaterial('shells')
      if (action === 'sell-glass') this.sellMaterial('seaGlass')
      if (action === 'journal') { this.view = 'journal'; this.render(); this.content.scrollTop = 0 }
      if (action === 'shop') { this.view = 'shop'; this.render(); this.content.scrollTop = 0 }
      if (action === 'back') { this.view = 'fish'; this.render(); this.content.scrollTop = 0 }
    })
    window.addEventListener('keydown', event => {
      if (!this.isOpen) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.close(); return }
      if ((event.code === 'Space' || event.code === 'KeyE') && this.view === 'fish' && !event.repeat) {
        event.preventDefault(); event.stopImmediatePropagation(); this.target ? this.hit() : this.cast()
      }
    }, { capture: true })
  }

  get isOpen() { return !this.overlay.classList.contains('hidden') }
  openSpot(spot: FishingSpotId) { this.spot = spot; this.view = 'fish'; this.open() }
  openShop() { this.view = 'shop'; this.open() }
  openJournal() { this.view = 'journal'; this.open() }
  private open() { this.message = ''; this.overlay.classList.remove('hidden'); this.render(); this.overlay.focus(); this.content.scrollTop = 0 }
  close() { this.stop(); this.overlay.classList.add('hidden') }
  private stop() { if (this.interval) clearInterval(this.interval); this.interval = undefined; this.target = undefined }

  private cast() {
    if (this.target) return
    const progress = fishingProgress(this.save())
    const spot = FISHING_SPOTS[this.spot]
    if (fishingLevel(progress.xp) < spot.level || progress.rod < spot.rod) { this.message = `ต้องมีทักษะตกปลาเลเวล ${spot.level} และคันเบ็ดระดับ ${spot.rod}`; this.render(); return }
    if (progress.bait <= 0) { this.message = 'เหยื่อหมด ซื้อเพิ่มจากนาวาที่ร้าน'; this.render(); return }
    if (this.save().player.energy < 2) { this.message = 'Energy ไม่พอ'; this.render(); return }
    progress.bait--; this.save().player.energy -= 2
    const { calendar, weather } = this.environment()
    this.target = selectFish(this.spot, calendar, weather)
    this.startedAt = performance.now()
    this.misses = 0
    this.message = 'กด Space หรือแตะ “ดึงเบ็ด” ตอนตัวชี้อยู่ในแถบสีทอง'
    this.changed()
    this.render()
    this.interval = window.setInterval(() => this.updateMeter(), 30)
  }

  private updateMeter() {
    if (!this.target) return
    const elapsed = performance.now() - this.startedAt
    const position = (Math.sin(elapsed / 420) + 1) * 50
    const pointer = this.content.querySelector<HTMLElement>('.fishing-pointer')
    if (pointer) pointer.style.left = `${position}%`
    if (elapsed >= 8500) { this.message = 'ปลาหลุดเบ็ด ลองอีกครั้ง'; this.stop(); this.render() }
  }

  private hit() {
    if (!this.target) return
    const position = (Math.sin((performance.now() - this.startedAt) / 420) + 1) * 50
    const width = this.target.rarity === 'legendary' ? 9 : this.target.rarity === 'rare' ? 13 : 18
    if (Math.abs(position - 50) > width) {
      this.misses++
      this.message = this.misses >= 3 ? 'ปลาหลุดเบ็ด ลองใหม่อีกครั้ง' : `พลาดจังหวะ ${this.misses}/3 · ลองดึงเมื่อเข้าแถบสีทอง`
      if (this.misses >= 3) this.stop()
      this.render(); return
    }
    const fish = this.target
    const progress = fishingProgress(this.save())
    progress.caught[fish.id] = (progress.caught[fish.id] ?? 0) + 1
    progress.xp += fish.xp
    this.save().player.coins += fish.value
    this.message = `จับ${fish.name}ได้! +${fish.value} Coins · +${fish.xp} Fishing XP`
    this.stop(); this.changed(); this.render()
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

  private render() {
    const save = this.save(), progress = fishingProgress(save)
    const level = fishingLevel(progress.xp)
    const feedback = `<p class="fishing-feedback" role="status">${this.message}</p>`
    if (this.view === 'shop') {
      this.content.innerHTML = `<div class="fishing-shop-banner" style="background-image:url('${shop.bannerAsset}')"><div class="fishing-shop-sign" style="background-image:url('${shop.signAsset}')"><strong>${shop.shopName}</strong></div></div><div class="fishing-npc"><span class="fishing-npc-art" style="background-image:url('${shop.npcPortrait}')" role="img" aria-label="นาวา เจ้าของร้านตกปลา"></span><div><span class="fishing-npc-badge">นาวา</span><p>“ทะเลมีปลาต่างกันตามเวลาและอากาศ ลองกลับมาตอนฝนตกหรือกลางคืนสิ”</p></div></div><p>Coins ${save.player.coins} · Fishing Level ${level} · คันเบ็ดระดับ ${progress.rod} · เหยื่อ ${progress.bait}</p><div class="fishing-actions fishing-shop-products"><button data-fishing-action="bait">${art('bait')}<span>ซื้อเหยื่อ 10 ชิ้น<small>${price('bait')} Coins</small></span></button><button data-fishing-action="rod">${art(progress.rod === 1 ? 'rod2' : 'rod3')}<span>อัปเกรดคันเบ็ด<small>${progress.rod < 3 ? price(progress.rod === 1 ? 'rod2' : 'rod3') + ' Coins' : 'ระดับสูงสุด'}</small></span></button><button data-fishing-action="sell-shells">${art('shells')}<span>ขายเปลือกหอย ${progress.shells ?? 0} ชิ้น<small>${shop.materialSellPrices!.shells} Coins/ชิ้น</small></span></button><button data-fishing-action="sell-glass">${art('seaGlass')}<span>ขายแก้วทะเล ${progress.seaGlass ?? 0} ชิ้น<small>${shop.materialSellPrices!.seaGlass} Coins/ชิ้น</small></span></button></div><div class="fishing-actions"><button data-fishing-action="journal">สมุดสะสมปลา</button><button data-fishing-action="back">กลับจุดตกปลา</button></div>${feedback}`
      return
    }
    if (this.view === 'journal') {
      this.content.innerHTML = `<p>จับแล้ว ${Object.keys(progress.caught).length}/${FISH.length} ชนิด · Fishing Level ${level} (${progress.xp} XP)</p><div class="fishing-collection">${FISH.map(fish => `<div class="fishing-fish ${progress.caught[fish.id] ? 'found' : ''}"><strong>${progress.caught[fish.id] ? fish.name : '???'}</strong><small>${fish.rarity} · ${progress.caught[fish.id] ?? 0} ตัว</small></div>`).join('')}</div><button data-fishing-action="back">กลับจุดตกปลา</button>`
      return
    }
    const { calendar, weather } = this.environment()
    const targetWidth = this.target ? (this.target.rarity === 'legendary' ? 18 : this.target.rarity === 'rare' ? 26 : 36) : 36
    this.content.innerHTML = `<p class="fishing-location">${FISHING_SPOTS[this.spot].name} · ${calendar.night ? 'กลางคืน' : 'กลางวัน'} · ${WEATHER_LABELS[weather]} · ฤดู${calendar.season.name}</p><p>Fishing Level ${level} (${progress.xp} XP) · คันเบ็ดระดับ ${progress.rod} · เหยื่อ ${progress.bait}</p>${this.target ? `<div class="fishing-meter"><span class="fishing-target" style="left:${(100 - targetWidth) / 2}%;width:${targetWidth}%"></span><i class="fishing-pointer"></i></div><button data-fishing-action="hit" class="mini-game-primary">ดึงเบ็ด · Space</button>` : '<button data-fishing-action="cast" class="mini-game-primary">เหวี่ยงเบ็ด · Space</button>'}<div class="fishing-actions"><button data-fishing-action="journal">สมุดสะสมปลา</button><button data-fishing-action="shop">ร้านอุปกรณ์ตกปลา</button></div>${feedback}`
  }
}
