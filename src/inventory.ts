import { FISH } from './fishing'
import type { FishItemId, ItemId, Save } from './domain'

export type InventoryCategory = 'all' | 'materials' | 'food' | 'tools' | 'fishing' | 'animals' | 'furniture' | 'special' | 'other'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type ItemDefinition = {
  name: string
  category: Exclude<InventoryCategory, 'all'>
  description: string
  rarity: ItemRarity
  sellPrice?: number
  usable?: boolean
  hotbar?: boolean
  durability?: number
}

const items: Partial<Record<ItemId, ItemDefinition>> = {
  hoe: { name: 'จอบทำสวน', category: 'tools', description: 'ใช้พรวนดินก่อนปลูกพืช', rarity: 'common', hotbar: true, durability: 50 },
  watering_can: { name: 'บัวรดน้ำ', category: 'tools', description: 'รดน้ำแปลงเพาะปลูก', rarity: 'common', hotbar: true, durability: 50 },
  axe: { name: 'ขวาน', category: 'tools', description: 'ใช้ตัดไม้และเก็บทรัพยากร', rarity: 'common', hotbar: true, durability: 50 },
  pickaxe: { name: 'อีเต้อ', category: 'tools', description: 'ใช้ขุดหินและแร่ในเหมือง', rarity: 'common', hotbar: true, durability: 50 },
  sickle: { name: 'เคียว', category: 'tools', description: 'ใช้เก็บเกี่ยวและตัดวัชพืช', rarity: 'common', hotbar: true, durability: 50 },
  radish_seed: { name: 'เมล็ด Radish', category: 'materials', description: 'เมล็ดสำหรับปลูกในแปลง', rarity: 'common', sellPrice: 2, hotbar: true },
  radish: { name: 'Radish', category: 'food', description: 'ผลผลิตสด ฟื้นพลังเล็กน้อย', rarity: 'common', sellPrice: 8, usable: true, hotbar: true },
  carrot_seed: { name: 'เมล็ดแครอท', category: 'materials', description: 'เมล็ดแครอทสำหรับเพาะปลูก', rarity: 'common', sellPrice: 4, hotbar: true },
  carrot: { name: 'แครอท', category: 'food', description: 'แครอทสดจากฟาร์ม', rarity: 'common', sellPrice: 12 },
  tomato_seed: { name: 'เมล็ดมะเขือเทศ', category: 'materials', description: 'เมล็ดมะเขือเทศสำหรับเพาะปลูก', rarity: 'common', sellPrice: 5, hotbar: true },
  tomato: { name: 'มะเขือเทศ', category: 'food', description: 'มะเขือเทศสุกฉ่ำ', rarity: 'common', sellPrice: 15 },
  wood: { name: 'ไม้', category: 'materials', description: 'วัสดุพื้นฐานสำหรับคราฟต์', rarity: 'common', sellPrice: 4 },
  stone: { name: 'หิน', category: 'materials', description: 'วัสดุก่อสร้างพื้นฐาน', rarity: 'common', sellPrice: 4 },
  fiber: { name: 'เส้นใย', category: 'materials', description: 'เส้นใยพืชสำหรับงานคราฟต์', rarity: 'common', sellPrice: 3 },
  sword: { name: 'ดาบ', category: 'tools', description: 'อาวุธระยะประชิดพื้นฐาน', rarity: 'uncommon', hotbar: true, durability: 50 },
  bow: { name: 'ธนู', category: 'tools', description: 'อาวุธโจมตีระยะไกล', rarity: 'uncommon', hotbar: true, durability: 50 },
  meat: { name: 'เนื้อ', category: 'animals', description: 'วัตถุดิบจากสัตว์สำหรับทำอาหาร', rarity: 'common', sellPrice: 16 },
  hide: { name: 'หนังสัตว์', category: 'animals', description: 'วัสดุสำหรับทำเครื่องป้องกัน', rarity: 'uncommon', sellPrice: 18 },
  copper: { name: 'แร่ทองแดง', category: 'materials', description: 'แร่สำหรับงานช่างระดับต้น', rarity: 'common', sellPrice: 8 },
  iron: { name: 'แร่เหล็ก', category: 'materials', description: 'แร่แข็งแรงสำหรับหลอมอาวุธ', rarity: 'uncommon', sellPrice: 12 },
  moonstone: { name: 'จันทราศิลา', category: 'special', description: 'ผลึกเวทหายากจากเหมืองลึก', rarity: 'rare', sellPrice: 35 },
  arcane_sword: { name: 'ดาบจันทรา', category: 'tools', description: 'ดาบเวทที่หลอมจากจันทราศิลา', rarity: 'rare', hotbar: true, durability: 80 },
  wand: { name: 'คทาเวท', category: 'tools', description: 'คทาสำหรับร่ายเวท', rarity: 'rare', hotbar: true, durability: 60 },
  broom: { name: 'ไม้กวาดขี่', category: 'tools', description: 'พาหนะเวทสำหรับเดินทาง', rarity: 'rare', hotbar: true },
  rice_meal: { name: 'ข้าวกล่อง', category: 'food', description: 'อาหารพร้อมทาน ฟื้นพลังงาน', rarity: 'common', sellPrice: 12, usable: true, hotbar: true },
  stew: { name: 'สตูว์', category: 'food', description: 'สตูว์ร้อน ฟื้น HP และ Energy มาก', rarity: 'uncommon', sellPrice: 24, usable: true, hotbar: true },
  mana_potion: { name: 'ยามานา', category: 'special', description: 'น้ำยาฟื้น Mana', rarity: 'uncommon', sellPrice: 18, usable: true, hotbar: true },
  animal_feed: { name: 'อาหารสัตว์', category: 'animals', description: 'อาหารสำหรับสัตว์ในฟาร์ม', rarity: 'common', sellPrice: 8 },
  pet_basket: { name: 'ตะกร้าสัตว์เลี้ยง', category: 'animals', description: 'ที่นอนสานสำหรับสัตว์ตัวเล็ก', rarity: 'uncommon', sellPrice: 20 },
  carved_chair: { name: 'เก้าอี้ไม้แกะสลัก', category: 'furniture', description: 'เฟอร์นิเจอร์สำหรับตกแต่งบ้าน', rarity: 'uncommon', sellPrice: 30 },
  flower_table: { name: 'โต๊ะลายดอกไม้', category: 'furniture', description: 'โต๊ะไม้ประดับลายดอกไม้', rarity: 'uncommon', sellPrice: 36 },
  fishing_bait: { name: 'เหยื่อทะเล', category: 'fishing', description: 'ใช้หนึ่งชิ้นต่อการเหวี่ยงเบ็ด', rarity: 'common', hotbar: true },
  fishing_rod_1: { name: 'คันเบ็ดไม้ไผ่', category: 'fishing', description: 'คันเบ็ดพื้นฐานสำหรับผู้เริ่มต้น', rarity: 'common', hotbar: true, durability: 50 },
  fishing_rod_2: { name: 'คันเบ็ดปะการัง', category: 'fishing', description: 'คันเบ็ดที่ช่วยควบคุมปลาได้ดีขึ้น', rarity: 'uncommon', hotbar: true, durability: 70 },
  fishing_rod_3: { name: 'คันเบ็ดเรือเก่า', category: 'fishing', description: 'คันเบ็ดระดับสูงสำหรับทะเลลึก', rarity: 'rare', hotbar: true, durability: 90 },
  sea_shell: { name: 'เปลือกหอย', category: 'fishing', description: 'ทรัพยากรชายหาด นำไปขายให้นาวาได้', rarity: 'common', sellPrice: 12 },
  sea_glass: { name: 'แก้วทะเล', category: 'fishing', description: 'แก้วสีที่คลื่นทะเลขัดจนเรียบ', rarity: 'uncommon', sellPrice: 20 }
}

for (const fish of FISH) items[fish.id as FishItemId] = {
  name: fish.name, category: 'fishing', description: `ปลาจาก${fish.spots.map(spot => spot.replaceAll('-', ' ')).join(', ')}`, rarity: fish.rarity, sellPrice: fish.value
}

export const ITEM_DEFINITIONS = items as Record<ItemId, ItemDefinition>

export const INVENTORY_CATEGORIES: { id: InventoryCategory; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' }, { id: 'materials', label: 'วัตถุดิบ' }, { id: 'food', label: 'อาหาร' },
  { id: 'tools', label: 'อุปกรณ์' }, { id: 'fishing', label: 'ตกปลา' }, { id: 'animals', label: 'สัตว์/ผลิตภัณฑ์' },
  { id: 'furniture', label: 'เฟอร์นิเจอร์' }, { id: 'special', label: 'ไอเทมพิเศษ' }, { id: 'other', label: 'อื่น ๆ' }
]

export function inventoryWeight(save: Save): number { return save.inventory.reduce((sum, slot) => sum + slot.quantity, 0) }
