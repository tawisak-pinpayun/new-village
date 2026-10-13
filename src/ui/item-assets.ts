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
