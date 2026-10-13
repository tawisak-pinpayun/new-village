import type { CharacterId, GearId, GearSlot } from './domain'

type Equipped = Partial<Record<GearSlot, GearId>>
type Anchor = { brim: number; brimWidth: number; flowerX: number; neck: number; handLeft: number; handRight: number; foot: number }

const anchors: Record<CharacterId, Anchor> = {
  a: { brim: 79, brimWidth: 166, flowerX: 201, neck: 153, handLeft: 94, handRight: 198, foot: 247 },
  b: { brim: 83, brimWidth: 169, flowerX: 204, neck: 156, handLeft: 92, handRight: 202, foot: 248 },
  c: { brim: 77, brimWidth: 163, flowerX: 200, neck: 153, handLeft: 91, handRight: 202, foot: 245 },
  d: { brim: 87, brimWidth: 160, flowerX: 199, neck: 158, handLeft: 95, handRight: 197, foot: 247 },
  e: { brim: 82, brimWidth: 172, flowerX: 205, neck: 155, handLeft: 92, handRight: 202, foot: 246 },
  f: { brim: 90, brimWidth: 182, flowerX: 207, neck: 157, handLeft: 89, handRight: 205, foot: 249 },
  g: { brim: 80, brimWidth: 166, flowerX: 201, neck: 154, handLeft: 93, handRight: 201, foot: 246 },
  h: { brim: 82, brimWidth: 174, flowerX: 207, neck: 156, handLeft: 92, handRight: 202, foot: 249 }
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function jewel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, outline: string, size = 10) {
  rect(ctx, x - size / 2, y - size / 2, size, size, outline)
  rect(ctx, x - size / 2 + 2, y - size / 2 + 2, size - 4, size - 4, color)
  rect(ctx, x - size / 2 + 3, y - size / 2 + 3, 3, 3, '#fff6d7')
}

function drawHat(ctx: CanvasRenderingContext2D, gear: GearId | undefined, anchor: Anchor, direction: number) {
  if (!gear) return
  const sideOffset = direction === 2 ? -8 : direction === 3 ? 8 : 0
  if (gear === 'wizard_hat') {
    const center = 140 + sideOffset, brim = anchor.brim
    const half = anchor.brimWidth / 2
    ctx.fillStyle = '#251744'; ctx.beginPath(); ctx.moveTo(center - half + 22, brim - 8); ctx.lineTo(center - 35, brim - 52); ctx.lineTo(center - 8, brim - 73); ctx.lineTo(center + 19, Math.max(3, brim - 80)); ctx.lineTo(center + 9, brim - 62); ctx.lineTo(center + 31, brim - 51); ctx.lineTo(center + half - 22, brim - 8); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#684ea7'; ctx.beginPath(); ctx.moveTo(center - half + 30, brim - 10); ctx.lineTo(center - 27, brim - 49); ctx.lineTo(center - 4, brim - 66); ctx.lineTo(center + 11, Math.max(7, brim - 72)); ctx.lineTo(center + 4, brim - 54); ctx.lineTo(center + 23, brim - 47); ctx.lineTo(center + half - 30, brim - 10); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#241742'; ctx.beginPath(); ctx.ellipse(center, brim, half, 13, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#7658b5'; ctx.beginPath(); ctx.ellipse(center, brim - 3, half - 8, 8, 0, 0, Math.PI * 2); ctx.fill()
    rect(ctx, center - half + 29, brim - 18, anchor.brimWidth - 58, 8, '#dab660')
    rect(ctx, center - 30, brim - 45, 7, 7, '#f8df8b')
    rect(ctx, center + 21, brim - 32, 6, 6, '#f8df8b')
    jewel(ctx, center, brim - 15, '#86b2ef', '#3f3281', 11)
  } else if (gear === 'flower_hat') {
    const center = 140 + sideOffset, y = anchor.brim - 13
    ctx.strokeStyle = '#345c3b'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(center, y, anchor.brimWidth * .38, 17, 0, Math.PI, Math.PI * 2); ctx.stroke()
    for (const [dx, dy] of [[-39, -12], [2, -20], [37, -11]]) {
      const x = center + dx
      rect(ctx, x - 6, y + dy - 10, 12, 30, '#447b49')
      for (const [px, py] of [[0, -8], [8, 0], [0, 8], [-8, 0]]) jewel(ctx, x + px, y + dy + py, '#ed91b7', '#8c4569', 10)
      jewel(ctx, x, y + dy, '#f4cf6b', '#a3713b', 10)
    }
  }
}

function recolorBoots(ctx: CanvasRenderingContext2D, x: number, y: number, gear: GearId, anchor: Anchor, direction: number, row: number) {
  const top = row === 4 ? anchor.foot - 15 : anchor.foot
  const patch = ctx.getImageData(x + 65, y + top, 165, 280 - top)
  const cloud = gear === 'cloud_boots'
  for (let py = 0; py < patch.height; py++) for (let px = 0; px < patch.width; px++) {
    const index = (py * patch.width + px) * 4
    const r = patch.data[index], g = patch.data[index + 1], b = patch.data[index + 2]
    if (patch.data[index + 3] < 100 || Math.max(r, g, b) < 35) continue
    const brown = r > g * 1.08 && g > b * 1.04 && r > 55
    if (!brown) continue
    const light = Math.min(1.15, Math.max(.54, (.3 * r + .59 * g + .11 * b) / 115))
    const base = cloud ? [160, 202, 232] : [106, 65, 39]
    patch.data[index] = Math.round(base[0] * light)
    patch.data[index + 1] = Math.round(base[1] * light)
    patch.data[index + 2] = Math.round(base[2] * light)
  }
  ctx.putImageData(patch, x + 65, y + top)
  const outline = cloud ? '#52708d' : '#4d2f20'
  const main = cloud ? '#a9d2eb' : '#794626'
  const light = cloud ? '#d9eff9' : '#a86d39'
  const trim = cloud ? '#f7fcff' : '#e0b56b'
  const step = row === 1 ? -6 : row === 2 ? 6 : 0
  const feet = direction <= 1 ? [[108 + step, 31], [153 - step, 31]] : [[111 - step, 37], [150 + step, 31]]
  for (const [left, width] of feet) {
    const bootTop = row === 4 ? top + 11 : top + 3
    rect(ctx, x + left + 4, y + bootTop, width - 8, 5, outline)
    rect(ctx, x + left + 1, y + bootTop + 4, width - 2, 13, outline)
    rect(ctx, x + left + 4, y + bootTop + 4, width - 8, 12, main)
    rect(ctx, x + left + 6, y + bootTop + 5, width - 12, 4, light)
    rect(ctx, x + left - 4, y + bootTop + 16, width + 8, 8, outline)
    rect(ctx, x + left - 1, y + bootTop + 17, width + 2, 4, main)
    rect(ctx, x + left - 6, y + bootTop + 22, width + 12, 5, outline)
    rect(ctx, x + left + 4, y + bootTop + 12, width - 8, 3, trim)
    if (!cloud) jewel(ctx, x + left + width / 2, y + bootTop + 12, '#e2bd70', '#654020', 7)
  }
}

function drawNecklace(ctx: CanvasRenderingContext2D, gear: GearId | undefined, anchor: Anchor, direction: number) {
  if (!gear || direction === 1) return
  const center = direction === 2 ? 129 : direction === 3 ? 151 : 140
  const neck = anchor.neck
  ctx.strokeStyle = '#cba75d'; ctx.lineWidth = 3; ctx.beginPath()
  ctx.moveTo(center - (direction >= 2 ? 13 : 25), neck)
  ctx.lineTo(center, neck + 25)
  ctx.lineTo(center + (direction >= 2 ? 8 : 25), neck)
  ctx.stroke()
  jewel(ctx, center, neck + 26, gear === 'moon_amulet' ? '#9bd9ff' : '#e6e8ed', '#755b38', gear === 'moon_amulet' ? 13 : 10)
}

function drawBracelet(ctx: CanvasRenderingContext2D, gear: GearId | undefined, anchor: Anchor, direction: number, row: number) {
  if (!gear || direction === 1) return
  const wristY = row === 4 ? 229 : row === 3 ? 194 : 201
  const color = gear === 'star_bracelet' ? '#ad96ed' : '#e7ba55'
  const positions = direction === 0 ? [anchor.handLeft, anchor.handRight] : [direction === 2 ? 110 : 185]
  for (const wristX of positions) {
    rect(ctx, wristX - 7, wristY - 3, 14, 7, '#70492f')
    rect(ctx, wristX - 5, wristY - 2, 10, 5, color)
    rect(ctx, wristX - 1, wristY - 2, 3, 5, gear === 'star_bracelet' ? '#fff1ae' : '#fef0b9')
  }
}

function drawCharm(ctx: CanvasRenderingContext2D, gear: GearId | undefined, direction: number, row: number) {
  if (!gear) return
  const x = direction === 2 ? 171 : direction === 3 ? 111 : 184
  const y = row === 4 ? 194 : 213
  rect(ctx, x - 2, y - 18, 4, 16, '#b49a69')
  jewel(ctx, x, y, gear === 'crystal_charm' ? '#93c9f2' : '#8dd363', '#526b55', 15)
  rect(ctx, x - 3, y - 6, 4, 4, '#fff9ce')
}

export function drawGearOnSheet(ctx: CanvasRenderingContext2D, character: CharacterId, equipped: Equipped) {
  if (!Object.values(equipped).some(Boolean)) return
  const anchor = anchors[character]
  for (let row = 0; row < 5; row++) for (let direction = 0; direction < 4; direction++) {
    const x = direction * 280, y = row * 280
    if (equipped.boots) recolorBoots(ctx, x, y, equipped.boots, anchor, direction, row)
    ctx.save(); ctx.translate(x, y)
    drawNecklace(ctx, equipped.necklace, anchor, direction)
    drawBracelet(ctx, equipped.bracelet, anchor, direction, row)
    drawCharm(ctx, equipped.charm, direction, row)
    drawHat(ctx, equipped.hat, anchor, direction)
    ctx.restore()
  }
}
