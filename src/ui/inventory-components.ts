import { DEFAULT_HOTBAR, GEAR, MAX_INVENTORY_SLOTS, TOOL_ITEM_IDS, eat, moveInventorySlot, remove, sortInventory, splitInventorySlot, type GearId, type GearSlot, type ItemId, type Save, type Slot } from '../domain'
import { INVENTORY_CATEGORIES, ITEM_DEFINITIONS, inventoryWeight, type InventoryCategory } from '../inventory'
import { FISH_ART_ASSETS, FISHING_ITEM_ASSETS, INVENTORY_ITEM_ASSETS, ITEM_ASSETS, SHOP_ITEM_ASSETS, TAILOR_GEAR_ART, fishArtStyle, fishingItemAssetStyle, inventoryItemAssetStyle, itemAssetStyle, shopItemAssetStyle, tailorItemAssetStyle, type FishingItemAssetKey, type InventoryItemAssetKey, type ItemAssetKey, type ShopItemAssetKey } from './item-assets'
import './inventory-ui.css'

const fishingArt: Partial<Record<ItemId, FishingItemAssetKey>> = { fishing_bait: 'bait', fishing_rod_1: 'rod1', fishing_rod_2: 'rod2', fishing_rod_3: 'rod3', sea_shell: 'shells', sea_glass: 'seaGlass' }

export function renderItemIcon(id: ItemId, className = ''): string {
  if (id in FISH_ART_ASSETS) return `<span class="inventory-item-icon inventory-fish-icon ${className}" style="${fishArtStyle(id)}" role="img" aria-label="${ITEM_DEFINITIONS[id].name}"></span>`
  if (fishingArt[id]) return `<span class="inventory-item-icon inventory-fishing-icon ${className}" style="${fishingItemAssetStyle(fishingArt[id]!)}" role="img" aria-label="${ITEM_DEFINITIONS[id].name}"></span>`
  if (id in INVENTORY_ITEM_ASSETS) return `<span class="inventory-item-icon inventory-local-icon ${className}" style="${inventoryItemAssetStyle(id as InventoryItemAssetKey)}" role="img" aria-label="${INVENTORY_ITEM_ASSETS[id as InventoryItemAssetKey].alt}"></span>`
  if (id in ITEM_ASSETS) return `<span class="inventory-item-icon game-atlas-icon ${className}" style="${itemAssetStyle(id as ItemAssetKey)}" role="img" aria-label="${ITEM_ASSETS[id as ItemAssetKey].alt}"></span>`
  if (id in SHOP_ITEM_ASSETS) return `<span class="inventory-item-icon game-atlas-icon ${className}" style="${shopItemAssetStyle(id as ShopItemAssetKey)}" role="img" aria-label="${SHOP_ITEM_ASSETS[id as ShopItemAssetKey].alt}"></span>`
  return `<span class="inventory-item-icon inventory-art-missing ${className}" aria-label="ยังไม่มีภาพ ${ITEM_DEFINITIONS[id].name}"><small>ART<br>TODO</small></span>`
}

export function renderItemSlot(slot: Slot | undefined, index: number, selected = false): string {
  if (!slot) return `<button class="inventory-slot empty" data-inventory-drop="${index}" aria-label="ช่องว่าง ${index + 1}"></button>`
  const item = ITEM_DEFINITIONS[slot.itemId]
  return `<button class="inventory-slot rarity-${item.rarity} ${selected ? 'selected' : ''}" draggable="true" data-inventory-slot="${slot.slot}" data-inventory-item="${slot.itemId}" data-inventory-drop="${index}" title="${item.name} · ${item.description}">${renderItemIcon(slot.itemId)}${slot.favorite ? '<i class="inventory-favorite">★</i>' : ''}${slot.locked ? '<i class="inventory-lock">◆</i>' : ''}<b>${slot.quantity > 1 ? slot.quantity : ''}</b></button>`
}

export function renderInventoryPanel(save: Save, slots: Slot[], selectedSlot?: number): string {
  const cells = Array.from({ length: MAX_INVENTORY_SLOTS }, (_, index) => renderItemSlot(slots[index], index, slots[index]?.slot === selectedSlot)).join('')
  return `<section class="inventory-grid-panel"><div class="inventory-grid">${cells}</div><footer><button data-inventory-view="grid" class="active" aria-label="มุมมองตาราง">▦</button><span>1 / 1</span><button data-inventory-action="sort">จัดเรียง</button></footer></section>`
}

export function renderEquipmentPanel(save: Save): string {
  const equipment = (slot: GearSlot, label: string) => {
    const id = save.equipped?.[slot]
    const art = id ? TAILOR_GEAR_ART[id] : undefined
    return `<button class="equipment-slot ${id ? 'equipped' : ''}" data-equipment-slot="${slot}" data-gear-id="${id ?? ''}" title="${id ? `ถอด ${GEAR[id].name}` : `${label}: ยังไม่ได้สวม`}">${art ? `<span class="game-atlas-icon" style="${tailorItemAssetStyle(art)}"></span>` : '<span class="equipment-empty"></span>'}<small>${label}</small></button>`
  }
  const character = save.character ?? 'a'
  return `<aside class="inventory-character-panel"><div class="equipment-layout"><div>${equipment('hat', 'หมวก')}${equipment('bracelet', 'กำไล')}${equipment('boots', 'รองเท้า')}</div><figure><span style="background-image:url('/assets/player-${character}.png')"></span><figcaption>Player ${character.toUpperCase()}</figcaption></figure><div>${equipment('necklace', 'สร้อย')}${equipment('charm', 'เครื่องราง')}<button class="equipment-slot bag-slot" disabled><span></span><small>กระเป๋า</small></button></div></div><div class="inventory-wallet"><p><span>Coins</span><b>${save.player.coins.toLocaleString('th-TH')}</b></p><p><span>ความจุ</span><b>${save.inventory.length}/${MAX_INVENTORY_SLOTS}</b></p><div><i style="width:${save.inventory.length / MAX_INVENTORY_SLOTS * 100}%"></i></div><small>น้ำหนักรวม ${inventoryWeight(save)} หน่วย</small></div></aside>`
}

export function inventoryMarkup() {
  return `<div id="inventory-overlay" class="overlay hidden" tabindex="-1"><section class="dialog game-window inventory-window" role="dialog" aria-modal="true" aria-labelledby="inventory-title"><header class="inventory-titlebar"><div class="inventory-bag-mark" aria-hidden="true"></div><h2 id="inventory-title">กระเป๋า</h2><button id="inventory-close" aria-label="ปิด">✕</button></header><nav id="inventory-categories" class="inventory-categories" aria-label="หมวดไอเทม"></nav><div id="inventory-content" class="inventory-content"></div><div id="inventory-hotbar-editor" class="inventory-hotbar-editor"></div></section></div>`
}

export class InventoryUI {
  private overlay = document.querySelector<HTMLElement>('#inventory-overlay')!
  private content = document.querySelector<HTMLElement>('#inventory-content')!
  private categories = document.querySelector<HTMLElement>('#inventory-categories')!
  private hotbar = document.querySelector<HTMLElement>('#inventory-hotbar-editor')!
  private category: InventoryCategory = 'all'
  private selected?: number
  private query = ''
  private dragFrom?: number
  private splitDrag = false
  private pendingDrop = false
  constructor(private save: () => Save, private changed: () => void, private notify: (message: string) => void) {
    document.querySelector('#inventory-close')!.addEventListener('click', () => this.close())
    this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.close() })
    this.overlay.addEventListener('input', event => { const input = (event.target as HTMLElement).closest<HTMLInputElement>('[data-inventory-search]'); if (input) { this.query = input.value; this.render() } })
    this.overlay.addEventListener('click', event => this.click(event))
    this.overlay.addEventListener('dragstart', event => {
      const slot = (event.target as HTMLElement).closest<HTMLElement>('[data-inventory-slot]')
      if (!slot) return
      this.dragFrom = Number(slot.dataset.inventorySlot); this.splitDrag = (event as DragEvent).shiftKey
      ;(event as DragEvent).dataTransfer?.setData('text/plain', slot.dataset.inventoryItem ?? '')
    })
    this.overlay.addEventListener('dragover', event => { if ((event.target as HTMLElement).closest('[data-inventory-drop],[data-hotbar-index]')) event.preventDefault() })
    this.overlay.addEventListener('drop', event => this.drop(event as DragEvent))
    window.addEventListener('keydown', event => {
      if (event.key.toLowerCase() === 'i' && !event.repeat) { event.preventDefault(); this.isOpen ? this.close() : this.open() }
      if (event.key === 'Escape' && this.isOpen) { event.preventDefault(); event.stopImmediatePropagation(); this.close() }
    }, { capture: true })
  }
  get isOpen() { return !this.overlay.classList.contains('hidden') }
  open() { this.overlay.classList.remove('hidden'); this.pendingDrop = false; this.render(); this.overlay.focus() }
  close() { this.overlay.classList.add('hidden') }
  refresh() { if (this.isOpen) this.render() }

  private click(event: MouseEvent) {
    const target = event.target as HTMLElement
    const category = target.closest<HTMLElement>('[data-inventory-category]')?.dataset.inventoryCategory as InventoryCategory | undefined
    if (category) { this.category = category; this.selected = undefined; this.render(); return }
    const slot = target.closest<HTMLElement>('[data-inventory-slot]')
    if (slot) { this.selected = Number(slot.dataset.inventorySlot); this.pendingDrop = false; this.render(); return }
    const action = target.closest<HTMLElement>('[data-inventory-action]')?.dataset.inventoryAction
    if (!action) return
    const save = this.save(), item = save.inventory.find(entry => entry.slot === this.selected)
    if (action === 'sort') { sortInventory(save); this.selected = undefined; this.commit('จัดเรียงกระเป๋าแล้ว'); return }
    if (action === 'favorite' && item) { item.favorite = !item.favorite; this.commit(item.favorite ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว'); return }
    if (action === 'lock' && item) { item.locked = !item.locked; this.commit(item.locked ? 'ล็อกไอเทมแล้ว' : 'ปลดล็อกไอเทมแล้ว'); return }
    if (action === 'use' && item) { if (eat(save, item.itemId)) this.commit(`ใช้${ITEM_DEFINITIONS[item.itemId].name}แล้ว`); else this.notify('ตอนนี้ยังใช้ไอเทมนี้ไม่ได้'); return }
    if (action === 'drop' && item && !item.locked && !TOOL_ITEM_IDS.includes(item.itemId as never)) { this.pendingDrop = true; this.render(); return }
    if (action === 'cancel-drop') { this.pendingDrop = false; this.render(); return }
    if (action === 'confirm-drop' && item && !item.locked) { save.inventory = save.inventory.filter(entry => entry !== item); save.hotbar = (save.hotbar ?? DEFAULT_HOTBAR).map(id => id === item.itemId ? null : id); this.selected = undefined; this.pendingDrop = false; this.commit(`ทิ้ง${ITEM_DEFINITIONS[item.itemId].name}แล้ว`); return }
    const gearId = target.closest<HTMLElement>('[data-gear-id]')?.dataset.gearId as GearId | undefined
    const gearSlot = target.closest<HTMLElement>('[data-equipment-slot]')?.dataset.equipmentSlot as GearSlot | undefined
    if (gearId && gearSlot) { delete save.equipped?.[gearSlot]; this.commit(`ถอด${GEAR[gearId].name}แล้ว`) }
  }

  private drop(event: DragEvent) {
    event.preventDefault()
    const save = this.save(), hotbar = (save.hotbar ??= [...DEFAULT_HOTBAR])
    const itemId = this.dragFrom === undefined ? event.dataTransfer?.getData('text/plain') as ItemId : save.inventory.find(slot => slot.slot === this.dragFrom)?.itemId
    const hotbarTarget = (event.target as HTMLElement).closest<HTMLElement>('[data-hotbar-index]')
    if (hotbarTarget && itemId && ITEM_DEFINITIONS[itemId]?.hotbar) { hotbar[Number(hotbarTarget.dataset.hotbarIndex)] = itemId; this.commit(`เพิ่ม${ITEM_DEFINITIONS[itemId].name}ในช่องลัดแล้ว`); return }
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-inventory-drop]')
    if (target && this.dragFrom !== undefined) {
      const to = Number(target.dataset.inventoryDrop)
      const changed = this.splitDrag ? splitInventorySlot(save, this.dragFrom, to) : moveInventorySlot(save, this.dragFrom, to)
      if (changed) { this.selected = to; this.commit(this.splitDrag ? 'แบ่งกองไอเทมแล้ว' : 'ย้ายไอเทมแล้ว') }
    }
    this.dragFrom = undefined; this.splitDrag = false
  }

  private commit(message: string) { this.changed(); this.notify(message); this.render() }
  private render() {
    const save = this.save()
    save.hotbar ??= [...DEFAULT_HOTBAR]
    this.categories.innerHTML = INVENTORY_CATEGORIES.map(category => `<button data-inventory-category="${category.id}" class="${category.id === this.category ? 'active' : ''}">${category.label}</button>`).join('')
    const query = this.query.trim().toLocaleLowerCase('th')
    const filtered = save.inventory.filter(slot => (this.category === 'all' || ITEM_DEFINITIONS[slot.itemId].category === this.category) && (!query || ITEM_DEFINITIONS[slot.itemId].name.toLocaleLowerCase('th').includes(query)))
      .sort((a, b) => a.slot - b.slot)
    const viewSlots = this.category === 'all' && !query ? Array.from({ length: MAX_INVENTORY_SLOTS }, (_, slot) => save.inventory.find(item => item.slot === slot)) : [...filtered, ...Array(Math.max(0, MAX_INVENTORY_SLOTS - filtered.length)).fill(undefined)]
    const selected = save.inventory.find(slot => slot.slot === this.selected)
    const detail = selected ? this.renderDetail(selected) : '<aside class="inventory-detail empty"><strong>เลือกไอเทม</strong><p>คลิกช่องในกระเป๋าเพื่อดูรายละเอียดและคำสั่งที่ใช้ได้</p></aside>'
    this.content.innerHTML = `${renderEquipmentPanel(save)}<main class="inventory-main"><div class="inventory-toolbar"><input data-inventory-search value="${this.query.replaceAll('"', '&quot;')}" placeholder="ค้นหาไอเทม"><span>${filtered.length} รายการ</span></div>${renderInventoryPanel(save, viewSlots, this.selected)}</main>${detail}`
    this.hotbar.innerHTML = `<strong>ช่องใช้งานด่วน</strong><div>${save.hotbar.map((id, index) => `<button data-hotbar-index="${index}" class="${index === (save.selectedSlot ?? 0) ? 'selected' : ''}"><small>${index === 9 ? 0 : index + 1}</small>${id ? renderItemIcon(id) : '<span class="hotbar-empty">＋</span>'}<b>${id ? save.inventory.filter(slot => slot.itemId === id).reduce((sum, slot) => sum + slot.quantity, 0) || '' : ''}</b></button>`).join('')}</div>`
  }

  private renderDetail(slot: Slot) {
    const item = ITEM_DEFINITIONS[slot.itemId]
    const canUse = !!item.usable
    const dropDisabled = slot.locked || TOOL_ITEM_IDS.includes(slot.itemId as never)
    if (this.pendingDrop) return `<aside class="inventory-detail confirm"><h3>ทิ้ง${item.name}?</h3>${renderItemIcon(slot.itemId, 'large')}<p>การทิ้งจะนำไอเทมกองนี้ออกจากกระเป๋า</p><div><button data-inventory-action="cancel-drop">ยกเลิก</button><button data-inventory-action="confirm-drop" class="danger">ยืนยันการทิ้ง</button></div></aside>`
    return `<aside class="inventory-detail"><header><div><h3>${item.name}</h3><small>${item.category} · ${item.rarity}</small></div><span>★</span></header>${renderItemIcon(slot.itemId, 'large')}<p>${item.description}</p>${item.durability ? `<label>ความทนทาน <b>${item.durability}/${item.durability}</b></label><div class="inventory-durability"><i style="width:100%"></i></div>` : ''}<dl><div><dt>จำนวน</dt><dd>${slot.quantity}</dd></div><div><dt>ราคาขาย</dt><dd>${item.sellPrice ?? 'ขายไม่ได้'}</dd></div></dl><div class="inventory-detail-actions">${canUse ? '<button data-inventory-action="use" class="primary">ใช้งาน</button>' : ''}<button data-inventory-action="favorite">${slot.favorite ? 'เลิกโปรด' : 'รายการโปรด'}</button><button data-inventory-action="lock">${slot.locked ? 'ปลดล็อก' : 'ล็อก'}</button><button data-inventory-action="drop" class="danger" ${dropDisabled ? 'disabled title="ไอเทมนี้ทิ้งไม่ได้"' : ''}>ทิ้ง</button></div></aside>`
  }
}
