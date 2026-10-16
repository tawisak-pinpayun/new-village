import type { SeasonId } from './calendar'

export type FestivalDefinition = {
  id: string
  name: string
  description: string
  season: SeasonId
  day: number
  startHour: number
  endHour: number
  location: string
  npcIds: string[]
  miniGameId: string
  rewards: string[]
}

// Definitions are calendar data; gameplay and rewards require server-side sessions and claims.
export const FESTIVALS: readonly FestivalDefinition[] = [
  { id: 'flower', name: 'เทศกาลดอกไม้', description: 'จัดดอกไม้และชมสวนดอกไม้ของหมู่บ้าน', season: 'spring', day: 5, startHour: 8, endHour: 18, location: 'ลานหมู่บ้าน', npcIds: ['lily'], miniGameId: 'flower_arrangement', rewards: ['เหรียญเทศกาล', 'เมล็ดดอกไม้หายาก'] },
  { id: 'friendship', name: 'วันแห่งมิตรภาพ', description: 'แลกของขวัญและทำกิจกรรมกับชาวบ้าน', season: 'spring', day: 14, startHour: 9, endHour: 20, location: 'ลานหมู่บ้าน', npcIds: ['ploy'], miniGameId: 'gift_match', rewards: ['ค่ามิตรภาพ', 'ของตกแต่งรูปหัวใจ'] },
  { id: 'spring_dance', name: 'งานเต้นรำฤดูใบไม้ผลิ', description: 'เต้นรำและฟังดนตรีกับเพื่อน', season: 'spring', day: 28, startHour: 17, endHour: 23, location: 'ลานหมู่บ้าน', npcIds: ['aria'], miniGameId: 'dance_rhythm', rewards: ['ชุดเต้นรำ', 'เหรียญเทศกาล'] },
  { id: 'beach', name: 'เทศกาลชายหาด', description: 'แข่งขันตกปลาและเดินตลาดริมทะเล', season: 'summer', day: 7, startHour: 8, endHour: 18, location: 'ชายหาด', npcIds: ['ploy'], miniGameId: 'fishing_tournament', rewards: ['อุปกรณ์ตกปลา', 'เหรียญเทศกาล'] },
  { id: 'star', name: 'เทศกาลดวงดาว', description: 'ชมดาวและเก็บเศษดาวตก', season: 'summer', day: 15, startHour: 19, endHour: 23, location: 'เนินเวทมนตร์', npcIds: ['selene'], miniGameId: 'star_catcher', rewards: ['เศษดาว', 'เครื่องประดับเวท'] },
  { id: 'firework', name: 'คืนดอกไม้ไฟ', description: 'ชมดอกไม้ไฟริมทะเลสาบ', season: 'summer', day: 28, startHour: 18, endHour: 23, location: 'ริมทะเลสาบ', npcIds: ['mira'], miniGameId: 'firework_puzzle', rewards: ['ดอกไม้ไฟตกแต่ง', 'เหรียญเทศกาล'] },
  { id: 'harvest', name: 'เทศกาลเก็บเกี่ยว', description: 'ประกวดผลผลิตและฉลองฤดูเก็บเกี่ยว', season: 'autumn', day: 10, startHour: 8, endHour: 19, location: 'ฟาร์ม', npcIds: ['lily'], miniGameId: 'harvest_challenge', rewards: ['ปุ๋ยพิเศษ', 'ของตกแต่งฟาร์ม'] },
  { id: 'auction', name: 'ประมูลใหญ่', description: 'ชมของหายากและประเมินสมบัติ', season: 'autumn', day: 21, startHour: 10, endHour: 20, location: 'บ้านประมูล', npcIds: ['borin'], miniGameId: 'treasure_appraisal', rewards: ['เหรียญประมูล', 'วัตถุดิบหายาก'] },
  { id: 'spirit', name: 'คืนแห่งวิญญาณ', description: 'ออกตามหาวิญญาณและสิ่งมีชีวิตเวท', season: 'autumn', day: 28, startHour: 18, endHour: 23, location: 'ป่าต้องมนตร์', npcIds: ['selene'], miniGameId: 'ghost_catcher', rewards: ['หน้ากากฟักทอง', 'ของตกแต่งวิญญาณ'] },
  { id: 'snow', name: 'เทศกาลหิมะ', description: 'ประกวดปั้นตุ๊กตาหิมะและเล่นหิมะ', season: 'winter', day: 8, startHour: 8, endHour: 18, location: 'ลานหมู่บ้าน', npcIds: ['rowan'], miniGameId: 'snowman_builder', rewards: ['เฟอร์นิเจอร์หิมะ', 'เหรียญเทศกาล'] },
  { id: 'winter_market', name: 'ตลาดฤดูหนาว', description: 'ทำอาหารและเลือกของขวัญในตลาด', season: 'winter', day: 20, startHour: 9, endHour: 21, location: 'ตลาด', npcIds: ['mira'], miniGameId: 'cooking_rush', rewards: ['สูตรอาหารพิเศษ', 'เหรียญเทศกาล'] },
  { id: 'new_year', name: 'เทศกาลปีใหม่', description: 'ปล่อยโคมและฉลองสิ้นปี', season: 'winter', day: 28, startHour: 17, endHour: 23, location: 'ลานหมู่บ้าน', npcIds: ['aria', 'rowan'], miniGameId: 'lantern_wishes', rewards: ['ชุดปีใหม่', 'โคมหายาก'] }
]

export const festivalOn = (season: SeasonId, day: number) => FESTIVALS.find(event => event.season === season && event.day === day)
export const festivalOccurrenceId = (festival: FestivalDefinition, year: number) => `${festival.id}:${year}`
export const MINI_GAME_NAMES: Record<string, string> = {
  flower_arrangement: 'จัดดอกไม้', gift_match: 'จับคู่ของขวัญ', dance_rhythm: 'เต้นตามจังหวะ', fishing_tournament: 'แข่งขันตกปลา',
  star_catcher: 'เก็บดาว', firework_puzzle: 'ปริศนาดอกไม้ไฟ', harvest_challenge: 'ท้าทายเก็บเกี่ยว', treasure_appraisal: 'ประเมินสมบัติ',
  ghost_catcher: 'จับวิญญาณ', snowman_builder: 'ปั้นตุ๊กตาหิมะ', cooking_rush: 'ทำอาหารแข่งเวลา', lantern_wishes: 'โคมอธิษฐาน'
}

export function festivalStatus(festival: FestivalDefinition, year: number, today: { year: number; season: SeasonId; day: number; hour: number }) {
  const seasonOrder = ['spring', 'summer', 'autumn', 'winter']
  const eventIndex = (year - 1) * 112 + seasonOrder.indexOf(festival.season) * 28 + festival.day
  const todayIndex = (today.year - 1) * 112 + seasonOrder.indexOf(today.season) * 28 + today.day
  if (eventIndex < todayIndex || (eventIndex === todayIndex && today.hour >= festival.endHour)) return 'หมดเวลา'
  if (eventIndex > todayIndex) return 'กำลังจะมาถึง'
  return today.hour >= festival.startHour ? 'กำลังจัดงาน' : 'เปิดวันนี้'
}
