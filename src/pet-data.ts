export const PET_SPECIES = {
  dog: { name: 'หมาบ้าน', price: 90, art: 0, passive: 'เก็บของร่วงในรัศมี 2 ไทล์ และเตือนเมื่อผู้เล่นเข้าใกล้', active: 'วิ่งไปคาบของร่วงที่อยู่ใกล้', cooldown: 45_000 },
  cat: { name: 'แมว', price: 100, art: 1, passive: 'เพิ่มโอกาสพบจันทราศิลาในเหมือง 3%', active: 'เพิ่มโชคขุดแร่ชั่วคราว', cooldown: 75_000 },
  chicken: { name: 'ไก่', price: 80, art: 2, passive: 'ออกไข่ทุกเช้า และเร่งพืชโต 5%', active: 'เร่งพืชในแปลงใกล้ตัว', cooldown: 90_000 },
  cow: { name: 'วัว', price: 130, art: 3, passive: 'ให้นมทุกเช้า และฟื้น Energy เมื่อยืนนิ่ง', active: 'ฟื้น Energy 12 หน่วย', cooldown: 75_000 },
  goat: { name: 'แพะ', price: 120, art: 4, passive: 'ให้นมทุกเช้า และฟื้น Energy เมื่อยืนนิ่ง', active: 'ฟื้น Energy 12 หน่วย', cooldown: 75_000 },
  magic_dog: { name: 'สุนัขเวท', price: 180, art: 5, passive: 'ฟื้น Mana ช้า ๆ และใช้ Mana น้อยลง', active: 'ฟื้น Mana 15 หน่วย', cooldown: 60_000 },
  bird: { name: 'นก', price: 95, art: 6, passive: 'ติดตามปาร์ตี้และส่งสารได้', active: 'ส่งข้อความสั้นถึงเพื่อนในปาร์ตี้', cooldown: 45_000 }
} as const

export type PetSpecies = keyof typeof PET_SPECIES
export const PET_SPECIES_IDS = Object.keys(PET_SPECIES) as PetSpecies[]

export type PetRecord = {
  id: string
  species: PetSpecies
  hunger: number
  happiness: number
  bondLevel: number
  bondXp: number
  lastCareAt: number
  lastProducedDay: number
  skillReadyAt: number
  lastPlayAt: number
}

export const petProduct = (species: PetSpecies): 'egg' | 'milk' | null =>
  species === 'chicken' ? 'egg' : species === 'cow' || species === 'goat' ? 'milk' : null

export function validPets(value: unknown, activeId: unknown): boolean {
  if (value === undefined) return activeId === undefined || activeId === null
  if (!Array.isArray(value) || value.length > 2) return false
  const ids = new Set<string>()
  for (const pet of value as PetRecord[]) {
    if (!pet || typeof pet !== 'object' || typeof pet.id !== 'string' || !/^[a-z_]+-\d{10,15}-[0-9a-f]{4}$/.test(pet.id) || ids.has(pet.id) || !PET_SPECIES_IDS.includes(pet.species)) return false
    ids.add(pet.id)
    if (![pet.hunger, pet.happiness].every(n => Number.isInteger(n) && n >= 0 && n <= 100) ||
      !Number.isInteger(pet.bondLevel) || pet.bondLevel < 1 || pet.bondLevel > 20 ||
      !Number.isInteger(pet.bondXp) || pet.bondXp < 0 || pet.bondXp > 400 ||
      !Number.isInteger(pet.lastProducedDay) || pet.lastProducedDay < 0 ||
      ![pet.lastCareAt, pet.skillReadyAt, pet.lastPlayAt].every(n => Number.isFinite(n) && n >= 0)) return false
  }
  return activeId === undefined || activeId === null || (typeof activeId === 'string' && ids.has(activeId))
}
