import { add, canAdd, count, dayNumber, remove, type Save } from './domain.ts'
import { PET_SPECIES, PET_SPECIES_IDS, petProduct, type PetRecord, type PetSpecies } from './pet-data.ts'

export function activePet(save: Save): PetRecord | null {
  return save.pets?.find(pet => pet.id === save.activePetId) ?? null
}

export function petReady(pet: PetRecord | null): boolean {
  return !!pet && pet.hunger >= 20 && pet.happiness >= 20
}

export function petSpeedMultiplier(save: Save): number {
  const pet = activePet(save)
  return petReady(pet) && pet!.bondLevel >= 2 ? 1.06 : 1
}

export function petBond(pet: PetRecord, points: number): boolean {
  if (pet.bondLevel >= 20) return false
  pet.bondXp += points
  let leveled = false
  while (pet.bondLevel < 20 && pet.bondXp >= pet.bondLevel * 20) {
    pet.bondXp -= pet.bondLevel * 20
    pet.bondLevel++
    leveled = true
  }
  return leveled
}

export function buyPet(save: Save, species: PetSpecies, now = Date.now(), day = dayNumber(save, now)): string | null {
  if (!PET_SPECIES_IDS.includes(species) || (save.pets?.length ?? 0) >= 2 || save.player.coins < PET_SPECIES[species].price) return null
  const id = `${species}-${now}-${Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')}`
  const pet: PetRecord = { id, species, hunger: 80, happiness: 80, bondLevel: 1, bondXp: 0, lastCareAt: now, lastProducedDay: day, skillReadyAt: 0, lastPlayAt: 0 }
  save.player.coins -= PET_SPECIES[species].price
  save.pets ??= []
  save.pets.push(pet)
  save.activePetId ??= id
  return id
}

export function setActivePet(save: Save, id: string): boolean {
  if (!save.pets?.some(pet => pet.id === id)) return false
  save.activePetId = id
  return true
}

export function feedPet(save: Save, id: string, now = Date.now()): boolean {
  const pet = save.pets?.find(pet => pet.id === id)
  if (!pet || !count(save, 'animal_feed') || pet.hunger >= 100) return false
  remove(save, 'animal_feed')
  pet.hunger = Math.min(100, pet.hunger + 40)
  pet.happiness = Math.min(100, pet.happiness + 8)
  pet.lastCareAt = now
  petBond(pet, 5)
  return true
}

export function playWithPet(save: Save, id: string, now = Date.now()): boolean {
  const pet = save.pets?.find(pet => pet.id === id)
  if (!pet || now - pet.lastPlayAt < 60_000 || pet.happiness >= 100) return false
  pet.happiness = Math.min(100, pet.happiness + 18)
  pet.lastPlayAt = now
  petBond(pet, 6)
  return true
}

// คิดค่าความหิว/ความสุขจากเวลาจริง เพื่อให้เซฟออนไลน์ทำงานต่อได้ทุกเครื่อง
export function updatePets(save: Save, day: number, now = Date.now()): { changed: boolean; products: string[] } {
  let changed = false
  const products: string[] = []
  for (const pet of save.pets ?? []) {
    const minutes = Math.floor(Math.max(0, now - pet.lastCareAt) / 60_000)
    if (minutes) {
      pet.hunger = Math.max(0, pet.hunger - Math.min(minutes, 1440))
      pet.happiness = Math.max(0, pet.happiness - Math.floor(Math.min(minutes, 1440) / 2))
      pet.lastCareAt += minutes * 60_000
      changed = true
    }
    const product = petProduct(pet.species)
    if (product && day > pet.lastProducedDay && petReady(pet) && canAdd(save, product)) {
      add(save, product)
      pet.lastProducedDay = day
      petBond(pet, 4)
      products.push(product)
      changed = true
    }
  }
  return { changed, products }
}

export function canUsePetSkill(save: Save, now = Date.now()): boolean {
  const pet = activePet(save)
  return petReady(pet) && now >= pet!.skillReadyAt
}

export function markPetSkillUsed(save: Save, now = Date.now()): void {
  const pet = activePet(save)
  if (!pet) return
  pet.skillReadyAt = now + PET_SPECIES[pet.species].cooldown
  petBond(pet, 3)
}

