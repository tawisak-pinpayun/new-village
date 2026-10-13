import type { ItemId } from './domain'

export type ShopTheme = { primary: string; accent: string; material: string; mood: string }
export type ShopDefinition = {
  id: string; name: string; type: string; exteriorAsset: string; interiorAsset: string; signAsset: string
  shopId: string; shopName: string; shopType: string; bannerAsset: string; bannerPosition: string; npcPortrait: string
  theme: ShopTheme; inventory: ItemId[]; buyItems: ItemId[]; acceptedSellCategories: ItemId[]; categories: { id: string; label: string }[]
  openingHours: [number, number]; npcId: string; ambientAnimations: string[]
}
export type NpcAnimationState = 'idle' | 'blink' | 'breathe' | 'greet' | 'walk' | 'work' | 'talk' | 'happy' | 'surprised' | 'sad'
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
    inventory: ['radish_seed', 'carrot_seed', 'tomato_seed', 'rice_meal'], buyItems: ['radish_seed', 'carrot_seed', 'tomato_seed', 'rice_meal', 'sword', 'bow'],
    acceptedSellCategories: ['carrot', 'tomato', 'meat', 'hide', 'copper', 'iron', 'moonstone'],
    categories: [{ id: 'all', label: 'ทั้งหมด' }, { id: 'seeds', label: 'เมล็ดพันธุ์' }, { id: 'supplies', label: 'อาหารและอาวุธ' }, { id: 'weapons', label: 'อาวุธ' }],
    openingHours: [7, 20], npcId: 'lily',
    ambientAnimations: ['hanging-herbs', 'leaf-drift', 'lantern-glow']
  }
}

export const NPCS: Record<string, NpcDefinition> = {
  lily: {
    id: 'lily', name: 'ลิลลี่', occupation: 'แม่ค้าเมล็ดพันธุ์', personality: 'ร่าเริง อ่อนโยน และชอบแนะนำพืชให้ชาวบ้าน',
    spriteSheet: '/assets/ui/lily-sprite-sheet.png', portraitAssets: '/assets/ui/lily-portraits.png',
    animationStates: { idle: [0], blink: [1], breathe: [2, 3], greet: [4], walk: [5], work: [6], talk: [7], happy: [4], surprised: [3], sad: [2] },
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

export function lilyGreeting(hour: number, raining: boolean, firstMeeting: boolean): DialogueLine {
  const tree = NPCS.lily.dialogueTree
  if (firstMeeting) return tree.firstMeeting[0]
  if (raining) return tree.rain[0]
  if (hour < 12) return tree.morning[0]
  if (hour >= 19 || hour < 7) return tree.night[0]
  return tree.afternoon[0]
}
