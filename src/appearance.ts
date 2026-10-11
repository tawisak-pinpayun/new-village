import Phaser from 'phaser'
import type { GearId, GearSlot, OutfitId } from './domain'

export type Appearance = { outfit: OutfitId; equipped: Partial<Record<GearSlot, GearId>> }

export function drawAppearance(graphics: Phaser.GameObjects.Graphics, look: Appearance, facing: number) {
  graphics.clear()
  const colors = {
    default: { coat: 0x597842, trim: 0xd6bd79, cape: 0x49764b },
    forest: { coat: 0x297c65, trim: 0xbce889, cape: 0x245943 },
    royal: { coat: 0x466bce, trim: 0xffdd76, cape: 0x283e9c },
    mage: { coat: 0x8654b8, trim: 0xefd0ff, cape: 0x54327f }
  }[look.outfit]
  const front = facing === 0
  const back = facing === 1
  const side = facing >= 2
  if (look.outfit !== 'default') {
    graphics.fillStyle(colors.cape).fillRoundedRect(side ? -12 : -17, -1, side ? 24 : 34, 25, 5)
    graphics.fillStyle(colors.coat).fillRoundedRect(side ? -8 : -13, 0, side ? 17 : 26, 19, 4)
    graphics.lineStyle(2, colors.trim).strokeRoundedRect(side ? -8 : -13, 0, side ? 17 : 26, 19, 4)
    graphics.fillStyle(colors.trim).fillRect(side ? -7 : -11, 15, side ? 15 : 22, 3)
    if (front) { graphics.fillStyle(colors.trim).fillCircle(0, 7, 3); graphics.fillCircle(0, 13, 2) }
    if (back) graphics.lineStyle(2, colors.trim).strokeCircle(0, 8, 5)
  }
  if (look.equipped.boots) {
    graphics.fillStyle(look.equipped.boots === 'cloud_boots' ? 0xe0eeff : 0x824e2e)
    graphics.fillRoundedRect(side ? -9 : -12, 23, side ? 8 : 9, 8, 2)
    graphics.fillRoundedRect(side ? 1 : 3, 23, side ? 8 : 9, 8, 2)
  }
  if (look.equipped.necklace && !back) {
    graphics.lineStyle(2, 0xe7d19b).lineBetween(side ? -2 : -6, -1, side ? 3 : 0, 6).lineBetween(side ? 3 : 0, 6, side ? 5 : 6, -1)
    graphics.fillStyle(look.equipped.necklace === 'moon_amulet' ? 0x93dfff : 0xf3e3ad).fillCircle(side ? 3 : 0, 6, 3)
  }
  if (look.equipped.bracelet && !back) {
    graphics.fillStyle(look.equipped.bracelet === 'star_bracelet' ? 0xb7a5ff : 0xf4ca54).fillRoundedRect(side ? 12 : 17, 10, 7, 4, 1)
  }
  if (look.equipped.charm) {
    graphics.fillStyle(look.equipped.charm === 'crystal_charm' ? 0xa8c9ff : 0xaee277).fillCircle(side ? -14 : -19, 13, 4)
  }
  if (look.equipped.hat === 'wizard_hat') {
    graphics.fillStyle(0x593a91).fillTriangle(-15, -22, 1, -51, 13, -22)
    graphics.fillStyle(0x7652b3).fillEllipse(0, -21, 37, 8)
    graphics.lineStyle(2, 0xe6c67d).lineBetween(-10, -24, 10, -24)
  } else if (look.equipped.hat === 'flower_hat') {
    graphics.fillStyle(0xff79ae).fillCircle(12, -28, 5)
    graphics.fillStyle(0xffd66d).fillCircle(12, -28, 2)
    graphics.fillStyle(0x80b56a).fillEllipse(17, -30, 6, 3)
  }
}
