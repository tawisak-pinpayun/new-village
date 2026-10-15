import Phaser from 'phaser'
import { PET_SPECIES, type PetSpecies } from './pet-data'

export class PetFollower {
  readonly sprite: Phaser.GameObjects.Sprite
  private species: PetSpecies

  constructor(scene: Phaser.Scene, species: PetSpecies, x: number, y: number) {
    this.species = species
    this.sprite = scene.add.sprite(x - 30, y + 22, 'pet-atlas', PET_SPECIES[species].art)
      .setDisplaySize(47, 47).setOrigin(.5, 1).setDepth(19)
  }

  setSpecies(species: PetSpecies) {
    if (this.species !== species) { this.species = species; this.sprite.setFrame(PET_SPECIES[species].art) }
  }

  // จุดตามอยู่หลังผู้เล่นเล็กน้อย และเลื่อนแบบนุ่มนวลโดยไม่ชนตัวละคร
  update(ownerX: number, ownerY: number, delta: number, time: number) {
    const targetX = ownerX - 34
    const targetY = ownerY + 24
    const distance = Math.hypot(targetX - this.sprite.x, targetY - this.sprite.y)
    if (distance > 250) this.sprite.setPosition(targetX, targetY)
    else if (distance > 5) {
      const step = Math.min(1, delta / 130)
      this.sprite.x += (targetX - this.sprite.x) * step
      this.sprite.y += (targetY - this.sprite.y) * step
    }
    this.sprite.setY(this.sprite.y + Math.sin(time / 280) * .06)
    this.sprite.setFlipX(targetX < this.sprite.x)
  }

  destroy() { this.sprite.destroy() }
}
