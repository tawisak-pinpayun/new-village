import type { GearId, OutfitId } from '../domain'

export type GameAsset = {
  src: string
  atlasColumn: number
  atlasRow: number
  alt: string
  status: 'production' | 'missing'
}

const atlas = '/assets/ui/market-item-atlas.png'
const asset = (atlasColumn: number, atlasRow: number, alt: string): GameAsset => ({ src: atlas, atlasColumn, atlasRow, alt, status: 'production' })

/** Central registry. UI code must reference asset keys rather than raw paths. */
export const ITEM_ASSETS = {
  radish_seed: asset(0, 0, 'ถุงเมล็ดแรดิช'),
  carrot_seed: asset(1, 0, 'ถุงเมล็ดแครอท'),
  tomato_seed: asset(2, 0, 'ถุงเมล็ดมะเขือเทศ'),
  rice_meal: asset(3, 0, 'ข้าวกล่อง'),
  sword: asset(0, 1, 'ดาบเหล็ก'),
  bow: asset(1, 1, 'ธนูไม้'),
  carrot: asset(2, 1, 'แครอท'),
  tomato: asset(3, 1, 'มะเขือเทศ'),
  meat: asset(0, 2, 'เนื้อ'),
  hide: asset(1, 2, 'หนังสัตว์'),
  copper: asset(2, 2, 'แร่ทองแดง'),
  iron: asset(3, 2, 'แร่เหล็ก'),
  moonstone: asset(0, 3, 'จันทราศิลา'),
  coin: asset(1, 3, 'เหรียญ'),
  basket: asset(2, 3, 'ตะกร้าตลาด'),
  leaf: asset(3, 3, 'ตราใบไม้')
} as const

export type ItemAssetKey = keyof typeof ITEM_ASSETS

export function itemAssetStyle(key: ItemAssetKey): string {
  const item = ITEM_ASSETS[key]
  return `--asset-url:url('${item.src}');--asset-x:${item.atlasColumn};--asset-y:${item.atlasRow}`
}

const shopAtlas = '/assets/ui/shop-item-atlas.png'
const shopAsset = (atlasColumn: number, atlasRow: number, alt: string): GameAsset => ({ src: shopAtlas, atlasColumn, atlasRow, alt, status: 'production' })

/** Artwork for the Blacksmith, Magic, Animal, Furniture, and Tailor shops. */
export const SHOP_ITEM_ASSETS = {
  iron_sword: shopAsset(0, 0, 'ดาบเหล็กขัดเงา'), arcane_sword: shopAsset(1, 0, 'ดาบจันทรา'),
  wand: shopAsset(2, 0, 'คทาคริสตัล'), broom: shopAsset(3, 0, 'ไม้กวาดบิน'),
  mana_potion: shopAsset(0, 1, 'ยามานา'), animal_feed: shopAsset(1, 1, 'ถุงอาหารสัตว์'),
  pet_basket: shopAsset(2, 1, 'ตะกร้านอนสัตว์'), bell_collar: shopAsset(3, 1, 'ปลอกคอกระดิ่ง'),
  carved_chair: shopAsset(0, 2, 'เก้าอี้ไม้แกะสลัก'), walnut_cabinet: shopAsset(1, 2, 'ตู้ไม้วอลนัต'),
  flower_table: shopAsset(2, 2, 'โต๊ะลายดอกไม้'), hanging_lantern: shopAsset(3, 2, 'โคมไฟแขวน'),
  plum_dress: shopAsset(0, 3, 'ชุดช่างตัดเสื้อสีพลัม'), constellation_hat: shopAsset(1, 3, 'หมวกกลุ่มดาว'),
  amethyst_bracelet: shopAsset(2, 3, 'กำไลอเมทิสต์'), moon_necklace: shopAsset(3, 3, 'สร้อยจันทรา')
} as const

export type ShopItemAssetKey = keyof typeof SHOP_ITEM_ASSETS

export function shopItemAssetStyle(key: ShopItemAssetKey): string {
  const item = SHOP_ITEM_ASSETS[key]
  return `--asset-url:url('${item.src}');--asset-x:${item.atlasColumn};--asset-y:${item.atlasRow}`
}

const tailorAtlas = '/assets/ui/tailor-item-atlas.png'
const tailorAsset = (atlasColumn: number, atlasRow: number, alt: string): GameAsset => ({ src: tailorAtlas, atlasColumn, atlasRow, alt, status: 'production' })

/** Exact 4 × 4 grid for Aria's six outfits and ten wearable accessories. */
export const TAILOR_ITEM_ASSETS = {
  tailor_forest: tailorAsset(0, 0, 'ชุดนักผจญภัยสีเขียว'),
  tailor_royal: tailorAsset(1, 0, 'ชุดราชสำนักสีน้ำเงิน'),
  tailor_mage: tailorAsset(2, 0, 'ชุดจอมเวทสีม่วง'),
  tailor_explorer: tailorAsset(3, 0, 'ชุดนักสำรวจสีน้ำตาล'),
  tailor_starlight: tailorAsset(0, 1, 'ชุดจอมเวทดวงดาว'),
  tailor_ceremonial: tailorAsset(1, 1, 'ชุดราชสำนักหรูสีแดง'),
  tailor_flower_hat: tailorAsset(2, 1, 'หมวกฟางประดับดอกไม้'),
  tailor_wizard_hat: tailorAsset(3, 1, 'หมวกจอมเวท'),
  tailor_silver_necklace: tailorAsset(0, 2, 'สร้อยเงิน'),
  tailor_moon_amulet: tailorAsset(1, 2, 'จี้จันทรา'),
  tailor_leather_boots: tailorAsset(2, 2, 'รองเท้าหนัง'),
  tailor_cloud_boots: tailorAsset(3, 2, 'รองเท้าเมฆ'),
  tailor_gold_bracelet: tailorAsset(0, 3, 'กำไลทอง'),
  tailor_star_bracelet: tailorAsset(1, 3, 'กำไลดาว'),
  tailor_lucky_charm: tailorAsset(2, 3, 'เครื่องรางโชคดีรูปใบโคลเวอร์'),
  tailor_crystal_charm: tailorAsset(3, 3, 'เครื่องรางคริสตัล')
} as const

export type TailorItemAssetKey = keyof typeof TAILOR_ITEM_ASSETS

export const TAILOR_OUTFIT_ART: Partial<Record<OutfitId, TailorItemAssetKey>> = {
  forest: 'tailor_forest', royal: 'tailor_royal', mage: 'tailor_mage', explorer: 'tailor_explorer',
  starlight: 'tailor_starlight', ceremonial: 'tailor_ceremonial'
}

export const TAILOR_GEAR_ART: Record<GearId, TailorItemAssetKey> = {
  flower_hat: 'tailor_flower_hat', wizard_hat: 'tailor_wizard_hat', silver_necklace: 'tailor_silver_necklace', moon_amulet: 'tailor_moon_amulet',
  leather_boots: 'tailor_leather_boots', cloud_boots: 'tailor_cloud_boots', gold_bracelet: 'tailor_gold_bracelet', star_bracelet: 'tailor_star_bracelet',
  lucky_charm: 'tailor_lucky_charm', crystal_charm: 'tailor_crystal_charm'
}

export function tailorItemAssetStyle(key: TailorItemAssetKey): string {
  const item = TAILOR_ITEM_ASSETS[key]
  return `--asset-url:url('${item.src}');--asset-x:${item.atlasColumn};--asset-y:${item.atlasRow}`
}

/** Fixed 3 × 2 atlas for Nava's rod upgrades, bait, and beach materials. */
const fishingAtlas = '/assets/ui/fishing-item-atlas.png'
const fishingAsset = (atlasColumn: number, atlasRow: number, alt: string): GameAsset => ({ src: fishingAtlas, atlasColumn, atlasRow, alt, status: 'production' })
export const FISHING_ITEM_ASSETS = {
  rod1: fishingAsset(0, 0, 'คันเบ็ดไม้ไผ่'), rod2: fishingAsset(1, 0, 'คันเบ็ดปะการัง'), rod3: fishingAsset(2, 0, 'คันเบ็ดเรือเก่า'),
  bait: fishingAsset(0, 1, 'ขวดเหยื่อตกปลา'), shells: fishingAsset(1, 1, 'เปลือกหอย'), seaGlass: fishingAsset(2, 1, 'แก้วทะเล')
} as const
export type FishingItemAssetKey = keyof typeof FISHING_ITEM_ASSETS
export function fishingItemAssetStyle(key: FishingItemAssetKey): string {
  const item = FISHING_ITEM_ASSETS[key]
  return `--fish-asset-url:url('${item.src}');--fish-asset-x:${item.atlasColumn * 50}%;--fish-asset-y:${item.atlasRow * 100}%`
}
