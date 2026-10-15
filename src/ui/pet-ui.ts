import type { Save } from '../domain'
import { PET_SPECIES, type PetSpecies } from '../pet-data'
import { activePet } from '../pet-system'
import { PET_UI_ASSETS, petUiAssetStyle } from './item-assets'

const art = (species: PetSpecies, className = 'pet-art') => `<span class="${className}" role="img" aria-label="${PET_UI_ASSETS[species].alt}" style="${petUiAssetStyle(species)}"></span>`
const bar = (label: string, value: number) => `<div class="pet-meter"><span>${label}</span><div class="pet-meter-track"><i style="width:${value}%"></i></div><b>${value}</b></div>`

export function renderPetPanel(save: Save, now = Date.now()): string {
  const active = activePet(save)
  const pets = save.pets ?? []
  const cards = pets.map(pet => {
    const species = PET_SPECIES[pet.species]
    const selected = pet.id === save.activePetId
    const cooldown = Math.max(0, Math.ceil((pet.skillReadyAt - now) / 1000))
    return `<article class="pet-card ${selected ? 'pet-card-active' : ''}">
      ${art(pet.species)}<div class="pet-card-copy"><strong>${species.name} · Bond Lv ${pet.bondLevel}</strong><small>${selected ? 'ตัวหลัก · เดินตาม' : 'ตัวสำรอง'}</small>
      ${bar('หิว', pet.hunger)}${bar('สุข', pet.happiness)}<small>Passive: ${species.passive}</small><small>Active: ${species.active}</small>
      <div class="pet-actions"><button type="button" data-pet-feed="${pet.id}">ให้อาหาร</button><button type="button" data-pet-play="${pet.id}">เล่นด้วย</button>${selected ? '' : `<button type="button" data-pet-active="${pet.id}">เลือกตัวหลัก</button>`}</div>
      ${selected ? `<button type="button" class="pet-skill-button" data-pet-skill ${cooldown ? 'disabled' : ''}>ใช้สกิล${cooldown ? ` · อีก ${cooldown} วินาที` : ''}</button>` : ''}
      </div></article>`
  }).join('')
  return `<p class="pet-panel-summary">เลี้ยงได้ 2 ตัว · ตัวหลักเดินตาม 1 ตัว · อาหารสัตว์ในกระเป๋า ${save.inventory.find(item => item.itemId === 'animal_feed')?.quantity ?? 0}</p>
    <div class="pet-roster">${cards || '<p class="game-shop-empty">ยังไม่มีสัตว์เลี้ยง · ซื้อได้ที่ร้านพลอยในตลาด</p>'}</div>
    ${active?.species === 'bird' ? '<form id="pet-bird-form"><label>ข้อความถึงปาร์ตี้<input name="message" maxlength="60" placeholder="พิมพ์ข้อความสั้น ๆ" aria-label="ข้อความถึงปาร์ตี้"></label><button type="submit">ส่งกับนก</button></form>' : ''}`
}

export function renderPetShop(species: readonly PetSpecies[], owned: number): string {
  return species.map(id => `<article class="game-item-card trade pet-shop-card" data-special-card data-shop-category="pets" data-price="${PET_SPECIES[id].price}" data-name="${PET_SPECIES[id].name}">
    ${art(id, 'game-item-art pet-art')}<span class="game-item-copy"><b>${PET_SPECIES[id].name}</b><small>${PET_SPECIES[id].passive}</small><em><i class="game-coin-icon" aria-hidden="true"></i>${PET_SPECIES[id].price} Coins</em></span><span></span>
    <button class="game-purchase" type="button" data-pet-buy="${id}" ${owned >= 2 ? 'disabled' : ''} aria-label="ซื้อ${PET_SPECIES[id].name}">${owned >= 2 ? 'เต็ม 2 ตัว' : 'รับเลี้ยง'}</button></article>`).join('')
}

export function renderPetHud(save: Save): string {
  const pet = activePet(save)
  return pet ? `${art(pet.species, 'pet-hud-art')}<span><b>${PET_SPECIES[pet.species].name} · Lv ${pet.bondLevel}</b><small>หิว ${pet.hunger} · สุข ${pet.happiness}</small></span>` : '<span>ยังไม่มีสัตว์เลี้ยง</span>'
}
