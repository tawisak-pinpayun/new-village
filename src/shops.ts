import type { ItemId } from './domain'

export type ShopTheme = { primary: string; accent: string; material: string; mood: string }
export type ShopDefinition = {
  id: string; name: string; type: string; exteriorAsset: string; interiorAsset: string; signAsset: string
  shopId: string; shopName: string; shopType: string; bannerAsset: string; bannerPosition: string; npcPortrait: string
  theme: ShopTheme; inventory: ItemId[]; buyItems: ItemId[]; acceptedSellCategories: ItemId[]; categories: { id: string; label: string }[]
  openingHours: [number, number]; npcId: string; ambientAnimations: string[]
  stock: ShopStock[]; sellPrices: Partial<Record<ItemId, number>>
}
export type ShopStock = { id: ItemId; price: number; category: string; description: string; art: string; available?: boolean }
export type NpcAnimationState = 'idle' | 'blink' | 'breathe' | 'greet' | 'walk' | 'work' | 'talk' | 'happy' | 'interact' | 'surprised' | 'sad'
export type DialogueExpression = 'happy' | 'surprised' | 'sad' | 'talking'
export type DialogueLine = { id: string; text: string; expression: DialogueExpression }
export type NpcDefinition = {
  id: string; name: string; occupation: string; personality: string; spriteSheet: string; portraitAssets: string
  animationStates: Record<NpcAnimationState, number[]>; dialogueTree: Record<string, DialogueLine[]>; friendshipLevel: number
  dailySchedule: { start: number; end: number; mapId: string; x: number; y: number }[]; shopId: string
}

export const SHOPS: Record<string, ShopDefinition> = {
  seed_shop: {
    id: 'seed_shop', name: 'ร้านเมล็ดพันธุ์ของลิลลี่', type: 'seed', exteriorAsset: '/assets/market.png',
    interiorAsset: '/assets/ui/farmers-market-header.png', signAsset: '/assets/ui/market-item-atlas.png',
    shopId: 'seed_shop', shopName: 'ร้านเมล็ดพันธุ์ของลิลลี่', shopType: 'seed', bannerAsset: '/assets/ui/farmers-market-header.png', bannerPosition: 'center 48%', npcPortrait: '/assets/ui/lily-portraits.png',
    theme: { primary: '#527f3e', accent: '#f0c96d', material: 'honey-wood', mood: 'sunny-garden' },
    inventory: ['radish_seed', 'carrot_seed', 'tomato_seed'], buyItems: ['radish_seed', 'carrot_seed', 'tomato_seed'],
    acceptedSellCategories: ['radish', 'carrot', 'tomato'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'seeds', label: 'เมล็ดพันธุ์' }],
    openingHours: [7, 20], npcId: 'lily',
    ambientAnimations: ['hanging-herbs', 'leaf-drift', 'lantern-glow'],
    stock: [
      { id: 'radish_seed', price: 8, category: 'seeds', description: 'ปลูก Radish ในแปลง', art: 'radish_seed' },
      { id: 'carrot_seed', price: 10, category: 'seeds', description: 'ปลูกแครอทในแปลง', art: 'carrot_seed' },
      { id: 'tomato_seed', price: 12, category: 'seeds', description: 'ปลูกมะเขือเทศในแปลง', art: 'tomato_seed' }
    ],
    sellPrices: { radish: 15, carrot: 18, tomato: 22 }
  },
  general: {
    id: 'general', name: 'ร้านของใช้ของมีร่า', type: 'general', exteriorAsset: '/assets/village.png',
    interiorAsset: '/assets/ui/shops/general-store-header.png', signAsset: '/assets/ui/shops/general-store-header.png',
    shopId: 'general', shopName: 'ร้านของใช้ของมีร่า', shopType: 'general', bannerAsset: '/assets/ui/shops/general-store-header.png', bannerPosition: 'center 45%', npcPortrait: '/assets/ui/npcs/mira-portraits.png',
    theme: { primary: '#9c633b', accent: '#e2b76b', material: 'honey-wood', mood: 'village' },
    inventory: ['radish_seed', 'rice_meal', 'stew', 'wood', 'stone'],
    buyItems: ['radish_seed', 'rice_meal', 'stew', 'wood', 'stone'], acceptedSellCategories: ['radish', 'carrot', 'tomato', 'fiber'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'food', label: 'อาหาร' }, { id: 'supplies', label: 'ของใช้' }],
    openingHours: [6, 22], npcId: 'mira', ambientAnimations: ['lantern-glow'],
    stock: [
      { id: 'rice_meal', price: 12, category: 'food', description: 'ฟื้น HP และพลังงาน', art: 'rice_meal' },
      { id: 'stew', price: 28, category: 'food', description: 'อาหารอุ่น ๆ ฟื้นพลังมากขึ้น', art: '' },
      { id: 'radish_seed', price: 8, category: 'supplies', description: 'เมล็ดพื้นฐานสำหรับชาวบ้าน', art: 'radish_seed' },
      { id: 'wood', price: 12, category: 'supplies', description: 'ไม้สำหรับประดิษฐ์และก่อไฟ', art: '' },
      { id: 'stone', price: 10, category: 'supplies', description: 'หินสำหรับประดิษฐ์และก่อไฟ', art: '' }
    ],
    sellPrices: { radish: 15, carrot: 18, tomato: 22, fiber: 8 }
  },
  forge: {
    id: 'forge', name: 'โรงตีเหล็กของโบริน', type: 'forge', exteriorAsset: '/assets/mine.png',
    interiorAsset: '/assets/ui/shops/blacksmith-header.png', signAsset: '/assets/ui/shops/blacksmith-header.png',
    shopId: 'forge', shopName: 'โรงตีเหล็กของโบริน', shopType: 'forge', bannerAsset: '/assets/ui/shops/blacksmith-header.png', bannerPosition: 'center 48%', npcPortrait: '/assets/ui/npcs/borin-portraits.png',
    theme: { primary: '#754c3a', accent: '#df8952', material: 'stone-iron', mood: 'forge' },
    inventory: ['sword', 'bow'], buyItems: ['sword', 'bow'], acceptedSellCategories: ['copper', 'iron', 'moonstone'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'weapons', label: 'อาวุธ' }, { id: 'craft', label: 'หลอม' }],
    openingHours: [7, 21], npcId: 'borin', ambientAnimations: ['forge-embers'],
    stock: [
      { id: 'sword', price: 35, category: 'weapons', description: 'ดาบเหล็กสำหรับการผจญภัย', art: 'iron_sword' },
      { id: 'bow', price: 55, category: 'weapons', description: 'ธนูไม้สำหรับต่อสู้ระยะไกล', art: 'bow' },
      { id: 'arcane_sword', price: 0, category: 'craft', description: 'ใช้เหล็ก 2 ชิ้น และจันทราศิลา 1 ชิ้น', art: 'arcane_sword' }
    ],
    sellPrices: { copper: 14, iron: 22, moonstone: 120 }
  },
  magic_shop: {
    id: 'magic_shop', name: 'ร้านเวทมนตร์ของเซลีน', type: 'magic', exteriorAsset: '/assets/magic-city.png',
    interiorAsset: '/assets/ui/shops/magic-shop-header.png', signAsset: '/assets/ui/shops/magic-shop-header.png',
    shopId: 'magic_shop', shopName: 'ร้านเวทมนตร์ของเซลีน', shopType: 'magic', bannerAsset: '/assets/ui/shops/magic-shop-header.png', bannerPosition: 'center 48%', npcPortrait: '/assets/ui/npcs/selene-portraits.png',
    theme: { primary: '#635082', accent: '#c5a1dc', material: 'violet-wood', mood: 'mystical' },
    inventory: ['wand', 'broom', 'mana_potion'], buyItems: ['wand', 'broom', 'mana_potion'], acceptedSellCategories: ['moonstone'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'magic', label: 'อุปกรณ์เวท' }, { id: 'potions', label: 'โพชั่น' }],
    openingHours: [8, 23], npcId: 'selene', ambientAnimations: ['magic-sparkle'],
    stock: [
      { id: 'wand', price: 65, category: 'magic', description: 'โจมตีโดยใช้มานา', art: 'wand' },
      { id: 'broom', price: 110, category: 'magic', description: 'บินได้เมื่อเลือกใน Hotbar', art: 'broom' },
      { id: 'mana_potion', price: 20, category: 'potions', description: 'ฟื้น 30 มานา', art: 'mana_potion' }
    ],
    sellPrices: { moonstone: 120 }
  },
  animal_shop: {
    id: 'animal_shop', name: 'ร้านสัตว์ของพลอย', type: 'animal', exteriorAsset: '/assets/market.png',
    interiorAsset: '/assets/ui/shops/animal-shop-header.png', signAsset: '/assets/ui/shops/animal-shop-header.png',
    shopId: 'animal_shop', shopName: 'ร้านสัตว์ของพลอย', shopType: 'animal', bannerAsset: '/assets/ui/shops/animal-shop-header.png', bannerPosition: 'center 48%', npcPortrait: '/assets/ui/npcs/ploy-portraits.png',
    theme: { primary: '#678248', accent: '#ebcb83', material: 'farm-wood', mood: 'meadow' },
    inventory: ['animal_feed', 'pet_basket'], buyItems: ['animal_feed', 'pet_basket'], acceptedSellCategories: ['meat', 'hide'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'feed', label: 'อาหารสัตว์' }, { id: 'care', label: 'อุปกรณ์ดูแล' }],
    openingHours: [7, 20], npcId: 'ploy', ambientAnimations: ['hay-drift'],
    stock: [
      { id: 'animal_feed', price: 18, category: 'feed', description: 'เก็บไว้ใช้ดูแลสัตว์ในฟาร์ม', art: 'animal_feed' },
      { id: 'pet_basket', price: 28, category: 'care', description: 'ตะกร้าสำหรับสัตว์เลี้ยง', art: 'pet_basket' }
    ],
    sellPrices: { meat: 16, hide: 12 }
  },
  furniture_shop: {
    id: 'furniture_shop', name: 'ร้านเฟอร์นิเจอร์ของโรวัน', type: 'furniture', exteriorAsset: '/assets/market.png',
    interiorAsset: '/assets/ui/shops/furniture-shop-header.png', signAsset: '/assets/ui/shops/furniture-shop-header.png',
    shopId: 'furniture_shop', shopName: 'ร้านเฟอร์นิเจอร์ของโรวัน', shopType: 'furniture', bannerAsset: '/assets/ui/shops/furniture-shop-header.png', bannerPosition: 'center 48%', npcPortrait: '/assets/ui/npcs/rowan-portraits.png',
    theme: { primary: '#70543c', accent: '#c9a66b', material: 'walnut', mood: 'workshop' },
    inventory: ['carved_chair', 'flower_table'], buyItems: ['carved_chair', 'flower_table'], acceptedSellCategories: ['wood', 'stone'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'furniture', label: 'เฟอร์นิเจอร์' }, { id: 'materials', label: 'วัสดุ' }],
    openingHours: [8, 20], npcId: 'rowan', ambientAnimations: ['wood-dust'],
    stock: [
      { id: 'carved_chair', price: 45, category: 'furniture', description: 'เก้าอี้ไม้แกะสลัก เก็บในกระเป๋า', art: 'carved_chair' },
      { id: 'flower_table', price: 55, category: 'furniture', description: 'โต๊ะลายดอกไม้ เก็บในกระเป๋า', art: 'flower_table' },
      { id: 'wood', price: 12, category: 'materials', description: 'ไม้สำหรับงานช่าง', art: '' }
    ],
    sellPrices: { wood: 6, stone: 5 }
  },
  tailor: {
    id: 'tailor', name: 'ร้านเสื้อผ้าของอาเรีย', type: 'tailor', exteriorAsset: '/assets/market.png',
    interiorAsset: '/assets/ui/shops/tailor-jewelry-header.png', signAsset: '/assets/ui/shops/tailor-jewelry-header.png',
    shopId: 'tailor', shopName: 'ร้านเสื้อผ้าและเครื่องประดับของอาเรีย', shopType: 'tailor', bannerAsset: '/assets/ui/shops/tailor-jewelry-header.png', bannerPosition: 'center 48%', npcPortrait: '/assets/ui/npcs/aria-portraits.png',
    theme: { primary: '#84536e', accent: '#e7b9c9', material: 'rose-wood', mood: 'boutique' },
    inventory: [], buyItems: [], acceptedSellCategories: ['fiber', 'hide'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'outfits', label: 'เสื้อผ้า' }, { id: 'gear', label: 'เครื่องประดับ' }],
    openingHours: [8, 21], npcId: 'aria', ambientAnimations: ['fabric-sway'],
    stock: [], sellPrices: { fiber: 8, hide: 12 }
  }
}

export const NPCS: Record<string, NpcDefinition> = {
  lily: {
    id: 'lily', name: 'ลิลลี่', occupation: 'แม่ค้าเมล็ดพันธุ์', personality: 'ร่าเริง อ่อนโยน และชอบแนะนำพืชให้ชาวบ้าน',
    spriteSheet: '/assets/ui/lily-sprite-sheet.png', portraitAssets: '/assets/ui/lily-portraits.png',
    animationStates: { idle: [0], blink: [1], breathe: [2, 3], greet: [4], walk: [5], work: [6], talk: [7], happy: [4], interact: [4], surprised: [3], sad: [2] },
    dialogueTree: {
      firstMeeting: [{ id: 'first', expression: 'happy', text: 'สวัสดีจ้า! ฉันชื่อลิลลี่ ดูแลร้านเมล็ดพันธุ์แห่งนี้ ยินดีที่ได้รู้จักนะ!' }],
      morning: [{ id: 'morning', expression: 'happy', text: 'อรุณสวัสดิ์จ้า! เมล็ดที่ปลูกตอนเช้าจะได้สัมผัสแดดอ่อน ๆ พอดีเลย' }],
      afternoon: [{ id: 'afternoon', expression: 'talking', text: 'วันนี้อยากปลูกอะไรดีล่ะ? มีเมล็ดพันธุ์สดใหม่มาให้เลือกด้วยนะ!' }],
      night: [{ id: 'night', expression: 'sad', text: 'ร้านใกล้ปิดแล้วจ้ะ กลับมาหาฉันตอนเช้าได้นะ' }],
      rain: [{ id: 'rain', expression: 'happy', text: 'ฝนกำลังดีเลย! ปลูกวันนี้แล้วดินจะชุ่มเป็นพิเศษนะ' }],
      purchase: [{ id: 'purchase', expression: 'happy', text: 'ขอบคุณมากจ้า ขอให้เมล็ดทุกเมล็ดเติบโตแข็งแรงนะ!' }],
      sale: [{ id: 'sale', expression: 'surprised', text: 'ผลผลิตสวยมากเลย! ฉันรับซื้อไว้เองจ้ะ' }],
      quest: [{ id: 'quest', expression: 'talking', text: 'ถ้าปลูกและเก็บเกี่ยวผักให้ได้ 3 ชิ้น ฉันจะเล่าเคล็ดลับสวนดอกไม้ให้ฟังนะ' }],
      chat: [{ id: 'chat', expression: 'talking', text: 'ฉันชอบกลิ่นดินหลังฝนตกที่สุดเลย มันทำให้นึกถึงวันที่เริ่มเปิดร้านครั้งแรก' }]
    },
    friendshipLevel: 0,
    dailySchedule: [{ start: 7, end: 20, mapId: 'market', x: 555, y: 285 }], shopId: 'seed_shop'
  }
}

const merchantProfiles = [
  { id: 'mira', name: 'มีร่า', occupation: 'เจ้าของร้านทั่วไป', shopId: 'general', mapId: 'village', x: 530, y: 418, chat: 'วันนี้มีอาหารอุ่น ๆ กับของใช้ให้เลือกจ้ะ', work: 'มีร่าจัดขวดและตะกร้าบนชั้นวาง' },
  { id: 'borin', name: 'โบริน', occupation: 'ช่างตีเหล็ก', shopId: 'forge', mapId: 'mine', x: 865, y: 335, chat: 'เสียงค้อนกับประกายไฟคือเพลงโปรดของข้า', work: 'โบรินเคาะเหล็กบนทั่งอย่างระมัดระวัง' },
  { id: 'selene', name: 'เซลีน', occupation: 'นักเวทและนักปรุงยา', shopId: 'magic_shop', mapId: 'market', x: 925, y: 690, chat: 'ข้ากำลังอ่านตำราดวงดาวและผสมยามานา', work: 'เซลีนอ่านตำราและกวนขวดยา' },
  { id: 'ploy', name: 'พลอย', occupation: 'ผู้ดูแลสัตว์', shopId: 'animal_shop', mapId: 'market', x: 1210, y: 690, chat: 'อาหารสัตว์ใหม่มาถึงแล้ว เจ้าตัวเล็กคงชอบ', work: 'พลอยจัดถุงอาหารและตรวจตะกร้าสัตว์' },
  { id: 'rowan', name: 'โรวัน', occupation: 'ช่างไม้', shopId: 'furniture_shop', mapId: 'market', x: 1100, y: 390, chat: 'ข้ากำลังขัดไม้ให้เนียนก่อนประกอบโต๊ะ', work: 'โรวันขัดไม้และตรวจรอยต่อของเก้าอี้' },
  { id: 'aria', name: 'อาเรีย', occupation: 'ช่างตัดเสื้อและเครื่องประดับ', shopId: 'tailor', mapId: 'market', x: 545, y: 690, chat: 'กำลังเลือกผ้าและอัญมณีให้เข้ากันอยู่ค่ะ', work: 'อาเรียตรวจตะเข็บและจัดผ้าบนหุ่น' }
] as const
for (const merchant of merchantProfiles) {
  NPCS[merchant.id] = {
    id: merchant.id, name: merchant.name, occupation: merchant.occupation, personality: merchant.chat,
    spriteSheet: '/assets/ui/npcs/' + merchant.id + '-sprite-sheet.png',
    portraitAssets: '/assets/ui/npcs/' + merchant.id + '-portraits.png',
    animationStates: { idle: [0, 2, 3], blink: [1], breathe: [2, 3], greet: [4], walk: [5], work: [6], talk: [7, 3], happy: [4], interact: [4], surprised: [3], sad: [2] },
    dialogueTree: {
      chat: [{ id: 'chat', expression: 'talking', text: merchant.chat }],
      work: [{ id: 'work', expression: 'talking', text: merchant.work }],
      purchase: [{ id: 'purchase', expression: 'happy', text: 'ขอบคุณมาก! ขอให้ใช้ของชิ้นนี้ได้อย่างคุ้มค่านะ' }],
      sale: [{ id: 'sale', expression: 'happy', text: 'รับซื้อไว้แล้ว ขอบคุณมาก!' }]
    },
    friendshipLevel: 0,
    dailySchedule: [{ start: SHOPS[merchant.shopId].openingHours[0], end: SHOPS[merchant.shopId].openingHours[1], mapId: merchant.mapId, x: merchant.x, y: merchant.y }],
    shopId: merchant.shopId
  }
}

export function lilyGreeting(hour: number, raining: boolean, firstMeeting: boolean): DialogueLine {
  const tree = NPCS.lily.dialogueTree
  if (firstMeeting) return tree.firstMeeting[0]
  if (raining) return tree.rain[0]
  if (hour < 12) return tree.morning[0]
  if (hour >= 19 || hour < 7) return tree.night[0]
  return tree.afternoon[0]
}
