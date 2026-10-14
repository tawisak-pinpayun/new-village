import type { MapId } from './domain'

export type WorldMapLocation = {
  id: string
  mapIds: MapId[]
  destination: MapId
  name: string
  english: string
  description: string
  x: number
  y: number
  arrival: { x: number; y: number }
}

export const WORLD_MAP_LOCATIONS: WorldMapLocation[] = [
  { id: 'market', mapIds: ['market'], destination: 'market', name: 'ตลาด', english: 'Market', description: 'ลานค้าขาย ร้านช่าง และเทศกาลเก็บเกี่ยว', x: 17, y: 36, arrival: { x: 1280, y: 520 } },
  { id: 'magic', mapIds: ['magic_city'], destination: 'magic_city', name: 'เมืองเวทมนตร์', english: 'Magic City', description: 'นครคริสตัล วงเวท และร้านอุปกรณ์เวทมนตร์', x: 15, y: 67, arrival: { x: 770, y: 165 } },
  { id: 'village', mapIds: ['village'], destination: 'village', name: 'หมู่บ้าน', english: 'Village', description: 'ศูนย์กลางชุมชน บ้านชาวเมือง และลานน้ำพุ', x: 49, y: 39, arrival: { x: 770, y: 820 } },
  { id: 'farm', mapIds: ['farm'], destination: 'farm', name: 'ฟาร์ม', english: 'Farm', description: 'แปลงเพาะปลูก โรงนา กังหันลม และคอกสัตว์', x: 49, y: 72, arrival: { x: 770, y: 870 } },
  { id: 'home', mapIds: ['home'], destination: 'home', name: 'บ้าน', english: 'Home', description: 'บ้านและสวนส่วนตัวสำหรับพักผ่อนและทำอาหาร', x: 72, y: 82, arrival: { x: 770, y: 780 } },
  { id: 'riverside', mapIds: ['riverside'], destination: 'riverside', name: 'ริมน้ำ', english: 'Riverside', description: 'แม่น้ำ ท่าเรือ น้ำตก และสะพานไม้', x: 82, y: 45, arrival: { x: 235, y: 520 } },
  { id: 'city', mapIds: ['city'], destination: 'city', name: 'เมือง', english: 'Capital City', description: 'ปราสาท กำแพงเมือง และย่านการค้าแฟนตาซี', x: 67, y: 18, arrival: { x: 768, y: 900 } },
  { id: 'mine', mapIds: ['mine', 'mine2', 'mine3'], destination: 'mine', name: 'เหมือง', english: 'Mine', description: 'ภูเขาหิน รางรถเหมือง แร่ และชั้นใต้ดิน', x: 89, y: 16, arrival: { x: 770, y: 810 } }
]

export type MapPeer = { name: string; mapId: MapId }

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!)
const locationFor = (mapId: MapId) => WORLD_MAP_LOCATIONS.find(location => location.mapIds.includes(mapId)) ?? WORLD_MAP_LOCATIONS[2]

function marker(location: WorldMapLocation, currentMap: MapId, mini: boolean) {
  const active = location.mapIds.includes(currentMap)
  return `<button class="world-location ${active ? 'is-current' : ''}" style="--map-x:${location.x}%;--map-y:${location.y}%" data-world-location="${location.id}" aria-label="${location.name}: ${location.description}" ${mini ? 'tabindex="-1"' : ''}>
    <span class="world-location-sigil sigil-${location.id}" aria-hidden="true"></span><span class="world-location-label"><b>${location.name}</b>${mini ? '' : `<small>${location.english}</small>`}</span>${active ? '<i>คุณอยู่ที่นี่</i>' : ''}
  </button>`
}

function people(currentMap: MapId, peers: MapPeer[], selfName: string) {
  const groups = new Map<string, MapPeer[]>()
  for (const peer of peers) {
    const location = locationFor(peer.mapId)
    const list = groups.get(location.id) ?? []
    list.push(peer); groups.set(location.id, list)
  }
  const self = locationFor(currentMap)
  const selfPin = `<span class="world-person world-person-self" style="--map-x:${self.x + 2.3}%;--map-y:${self.y - 5}%"><b></b><em>${escapeHtml(selfName || 'คุณ')}</em></span>`
  const peerPins = [...groups].flatMap(([id, list]) => {
    const location = WORLD_MAP_LOCATIONS.find(item => item.id === id)!
    return list.slice(0, 4).map((peer, index) => `<span class="world-person world-person-friend" style="--map-x:${location.x + 3 + index * 1.8}%;--map-y:${location.y + 4 + (index % 2) * 3}%"><b></b><em>${escapeHtml(peer.name)}</em></span>`)
  }).join('')
  return selfPin + peerPins
}

export function renderWorldMap(currentMap: MapId, peers: MapPeer[], selfName: string, mini = false) {
  return `<div class="fantasy-world-map ${mini ? 'is-mini' : ''}"><div class="world-map-canvas"><div class="world-map-art" role="img" aria-label="แผนที่โลก New Village แบบแฟนตาซี"></div><div class="world-water-shimmer"></div><div class="world-magic-glow"></div>${WORLD_MAP_LOCATIONS.map(location => marker(location, currentMap, mini)).join('')}${people(currentMap, peers, selfName)}<span class="world-compass" aria-hidden="true"><b>N</b><i></i></span></div></div>`
}

export class WorldMapController {
  private root: HTMLElement
  private onTravel: (location: WorldMapLocation) => void
  private zoom = 1
  private x = 0
  private y = 0
  private dragging = false
  private startX = 0
  private startY = 0
  private originX = 0
  private originY = 0
  private selected = WORLD_MAP_LOCATIONS[0]
  private stage: HTMLElement
  private viewport: HTMLElement

  constructor(root: HTMLElement, currentMap: MapId, peers: MapPeer[], selfName: string, onTravel: (location: WorldMapLocation) => void, canTravel = false) {
    this.root = root
    this.onTravel = onTravel
    root.innerHTML = `<div class="world-map-toolbar"><button data-map-zoom-out aria-label="ซูมออก">−</button><strong data-map-zoom-value>100%</strong><button data-map-zoom-in aria-label="ซูมเข้า">＋</button><button data-map-reset>คืนมุมมอง</button><span>ลากเพื่อเลื่อน · หมุนล้อเพื่อซูม</span></div>${renderWorldMap(currentMap, peers, selfName)}<section class="world-map-details"><div><small>${canTravel ? 'แท่นวาร์ป · เลือกปลายทาง' : 'ข้อมูลสถานที่'}</small><h3 data-map-title></h3><p data-map-description></p></div>${canTravel ? '<button data-map-travel>วาร์ปไปที่นี่</button>' : '<div class="world-map-travel-locked">เดินทางด้วยถนน หรือใช้แท่นวาร์ปที่เมืองเวทมนตร์</div>'}</section>`
    this.viewport = root.querySelector('.fantasy-world-map')!
    this.stage = root.querySelector('.world-map-canvas')!
    this.selected = locationFor(currentMap)
    root.querySelector(`[data-world-location="${this.selected.id}"]`)?.classList.add('is-selected')
    this.renderDetails()
    this.bind()
  }

  private bind() {
    this.root.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLElement>('[data-world-location]')
      if (!button) return
      const selected = WORLD_MAP_LOCATIONS.find(location => location.id === button.dataset.worldLocation)
      if (!selected) return
      this.selected = selected
      this.root.querySelectorAll('.world-location').forEach(item => item.classList.toggle('is-selected', item === button))
      this.renderDetails()
    })
    this.root.querySelector('[data-map-travel]')?.addEventListener('click', () => this.onTravel(this.selected))
    this.root.querySelector('[data-map-zoom-in]')?.addEventListener('click', () => this.setZoom(this.zoom + .2))
    this.root.querySelector('[data-map-zoom-out]')?.addEventListener('click', () => this.setZoom(this.zoom - .2))
    this.root.querySelector('[data-map-reset]')?.addEventListener('click', () => { this.zoom = 1; this.x = 0; this.y = 0; this.applyTransform() })
    this.viewport.addEventListener('wheel', event => { event.preventDefault(); this.setZoom(this.zoom + (event.deltaY < 0 ? .12 : -.12)) }, { passive: false })
    this.viewport.addEventListener('pointerdown', event => { if ((event.target as HTMLElement).closest('button')) return; this.dragging = true; this.startX = event.clientX; this.startY = event.clientY; this.originX = this.x; this.originY = this.y; this.viewport.setPointerCapture(event.pointerId) })
    this.viewport.addEventListener('pointermove', event => { if (!this.dragging) return; this.x = this.originX + event.clientX - this.startX; this.y = this.originY + event.clientY - this.startY; this.applyTransform() })
    this.viewport.addEventListener('pointerup', () => { this.dragging = false })
    this.viewport.addEventListener('pointercancel', () => { this.dragging = false })
  }

  private setZoom(value: number) { this.zoom = Math.min(2.2, Math.max(1, value)); if (this.zoom === 1) { this.x = 0; this.y = 0 } this.applyTransform() }
  private applyTransform() {
    const limitX = this.viewport.clientWidth * (this.zoom - 1) / 2
    const limitY = this.viewport.clientHeight * (this.zoom - 1) / 2
    this.x = Math.max(-limitX, Math.min(limitX, this.x)); this.y = Math.max(-limitY, Math.min(limitY, this.y))
    this.stage.style.transform = `translate(${this.x}px,${this.y}px) scale(${this.zoom})`
    const value = this.root.querySelector<HTMLElement>('[data-map-zoom-value]'); if (value) value.textContent = `${Math.round(this.zoom * 100)}%`
  }
  private renderDetails() {
    const title = this.root.querySelector<HTMLElement>('[data-map-title]')
    const copy = this.root.querySelector<HTMLElement>('[data-map-description]')
    if (title) title.textContent = this.selected.name
    if (copy) copy.textContent = this.selected.description
  }
}
