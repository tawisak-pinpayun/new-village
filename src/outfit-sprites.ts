import type { CharacterId, GearId, GearSlot, OutfitId } from './domain'
import { drawGearOnSheet } from './gear-sprites'

const FRAME = 280
const COLUMNS = 4
const ROWS = 5

const donors: Record<'male' | 'female', Record<OutfitId, CharacterId>> = {
  male: { default: 'g', forest: 'g', royal: 'g', mage: 'e', explorer: 'c', starlight: 'e', ceremonial: 'g' },
  female: { default: 'b', forest: 'c', royal: 'd', mage: 'd', explorer: 'a', starlight: 'd', ceremonial: 'd' }
}

const alternateDonors: Partial<Record<CharacterId, Partial<Record<OutfitId, CharacterId>>>> = {
  g: { default: 'c', forest: 'c', ceremonial: 'e' }
}

const palettes: Record<OutfitId, { main: [number, number, number]; side: [number, number, number]; gold: [number, number, number] }> = {
  default: { main: [126, 103, 73], side: [70, 104, 72], gold: [186, 153, 96] },
  forest: { main: [105, 75, 42], side: [42, 89, 57], gold: [195, 151, 74] },
  royal: { main: [224, 202, 153], side: [91, 57, 137], gold: [213, 169, 67] },
  mage: { main: [39, 71, 132], side: [77, 52, 143], gold: [216, 174, 83] },
  explorer: { main: [81, 106, 61], side: [111, 77, 45], gold: [188, 146, 82] },
  starlight: { main: [38, 77, 136], side: [26, 46, 100], gold: [234, 194, 95] },
  ceremonial: { main: [159, 48, 43], side: [230, 211, 172], gold: [210, 162, 72] }
}

type OutfitBoards = { ad: CanvasImageSource; eh: CanvasImageSource }
const boardColumns: Record<CharacterId, { sheet: keyof OutfitBoards; x: number; width: number }> = {
  a: { sheet: 'ad', x: 175, width: 140 }, b: { sheet: 'ad', x: 525, width: 140 },
  c: { sheet: 'ad', x: 875, width: 140 }, d: { sheet: 'ad', x: 1225, width: 140 },
  e: { sheet: 'eh', x: 340, width: 145 }, f: { sheet: 'eh', x: 580, width: 145 },
  g: { sheet: 'eh', x: 815, width: 165 }, h: { sheet: 'eh', x: 1025, width: 190 }
}
const boardRows: Record<keyof OutfitBoards, number[]> = {
  ad: [0, 153, 304, 460, 619, 773, 900, 1024],
  eh: [0, 153, 301, 453, 605, 755, 897, 1024]
}
const outfitRow: Record<OutfitId, number> = { default: 0, forest: 1, royal: 2, mage: 3, explorer: 4, starlight: 5, ceremonial: 6 }

function boardCutout(board: CanvasImageSource, region: { x: number; y: number; width: number; height: number }, clearSideGaps = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = region.width; canvas.height = region.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(board, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const seen = new Uint8Array(canvas.width * canvas.height)
  const queue: number[] = []
  const background = (i: number) => {
    const p = i * 4, r = pixels.data[p], g = pixels.data[p + 1], b = pixels.data[p + 2]
    return pixels.data[p + 3] < 70 || (r > 173 && g > 139 && b > 91 && r - g < 75 && g - b < 85)
  }
  const push = (i: number) => { if (!seen[i] && background(i)) { seen[i] = 1; queue.push(i) } }
  for (let x = 0; x < canvas.width; x++) { push(x); push((canvas.height - 1) * canvas.width + x) }
  for (let y = 0; y < canvas.height; y++) { push(y * canvas.width); push(y * canvas.width + canvas.width - 1) }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head], x = i % canvas.width, y = Math.floor(i / canvas.width)
    pixels.data[i * 4 + 3] = 0
    if (x > 0) push(i - 1)
    if (x + 1 < canvas.width) push(i + 1)
    if (y > 0) push(i - canvas.width)
    if (y + 1 < canvas.height) push(i + canvas.width)
  }
  // Twin tails enclose two small patches of the parchment background beside H's face.
  if (clearSideGaps) {
    const examined = new Uint8Array(seen.length)
    for (let start = 0; start < seen.length; start++) {
      if (seen[start] || examined[start] || !background(start)) continue
      const component = [start]
      examined[start] = 1
      let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0
      for (let head = 0; head < component.length; head++) {
        const i = component[head], x = i % canvas.width, y = Math.floor(i / canvas.width)
        minX = Math.min(minX, x); maxX = Math.max(maxX, x)
        minY = Math.min(minY, y); maxY = Math.max(maxY, y)
        for (const next of [x > 0 ? i - 1 : -1, x + 1 < canvas.width ? i + 1 : -1, y > 0 ? i - canvas.width : -1, y + 1 < canvas.height ? i + canvas.width : -1]) {
          if (next >= 0 && !seen[next] && !examined[next] && background(next)) { examined[next] = 1; component.push(next) }
        }
      }
      const besideFace = (minX > 38 && maxX < 68) || (minX > 108 && maxX < 145)
      if (component.length >= 12 && besideFace && minY > 52 && maxY < 96) {
        for (const i of component) pixels.data[i * 4 + 3] = 0
      }
    }
  }
  ctx.putImageData(pixels, 0, 0)
  return canvas
}

function shade(target: [number, number, number], light: number): [number, number, number] {
  const factor = Math.max(.4, Math.min(1.35, light / 125))
  return target.map(value => Math.min(255, Math.round(value * factor))) as [number, number, number]
}

function recolorClothes(ctx: CanvasRenderingContext2D, outfit: OutfitId, character: CharacterId) {
  const data = ctx.getImageData(0, 0, FRAME * COLUMNS, FRAME * ROWS)
  const { main, side, gold } = palettes[outfit]
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLUMNS; col++) {
    const originX = col * FRAME, originY = row * FRAME
    for (let y = 147; y < 272; y++) for (let x = 53; x < 227; x++) {
      const index = ((originY + y) * data.width + originX + x) * 4
      const r = data.data[index], g = data.data[index + 1], b = data.data[index + 2], a = data.data[index + 3]
      if (a < 60 || Math.max(r, g, b) < 39) continue
      const pinkHair = character === 'h' && r > 48 && r > g * 1.14 && b > g * .91 && r > b * .95 && y < 230 && (x < 111 || x > 184 || y < 169)
      if (pinkHair) continue
      const isSkin = (x < 97 || x > 203) && r > 145 && r > g * 1.12 && g > b * 1.17 && b < 145 && y > 166 && y < 231
      const isBoot = y > 235 && r > g * 1.2 && g > b * 1.15 && r < 160
      if (isSkin || isBoot) continue
      const luminance = .3 * r + .59 * g + .11 * b
      const inCenter = x > 100 && x < 205
      const target = outfit === 'royal' ? (inCenter ? main : side) : outfit === 'forest' || outfit === 'explorer' ? (x > 108 && x < 178 ? main : side) : main
      const accent = (outfit === 'starlight' || outfit === 'mage') && r > 165 && g > 130 && b < 130 ? gold : target
      const [nr, ng, nb] = shade(accent, luminance)
      data.data[index] = nr; data.data[index + 1] = ng; data.data[index + 2] = nb
    }
  }
  ctx.putImageData(data, 0, 0)
}

function bareHeadForA(image: (id: CharacterId) => CanvasImageSource): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME * COLUMNS; canvas.height = FRAME * ROWS
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image('g'), 0, 0)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLUMNS; col++) {
    for (let y = 12; y < 118; y++) for (let x = 60; x < 220; x++) {
      const index = ((row * FRAME + y) * pixels.width + col * FRAME + x) * 4
      const r = pixels.data[index], g = pixels.data[index + 1], b = pixels.data[index + 2]
      if (pixels.data[index + 3] < 80 || r < 24 || r > 120 || Math.abs(r - g) > 20 || Math.abs(g - b) > 20) continue
      const shade = .65 + r / 175
      pixels.data[index] = Math.round(104 * shade)
      pixels.data[index + 1] = Math.round(68 * shade)
      pixels.data[index + 2] = Math.round(42 * shade)
    }
  }
  ctx.putImageData(pixels, 0, 0)
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLUMNS; col++) {
    const x = col * FRAME, y = row * FRAME
    ctx.clearRect(x, y + 120, FRAME, 42)
    ctx.drawImage(image('a'), x, y + 120, FRAME, 42, x, y + 120, FRAME, 42)
  }
  return canvas
}

function recolorNeck(ctx: CanvasRenderingContext2D, x: number, y: number, outfit: OutfitId) {
  const patch = ctx.getImageData(x + 80, y + 128, 120, 40)
  for (let py = 0; py < patch.height; py++) for (let px = 0; px < patch.width; px++) {
    const index = (py * patch.width + px) * 4
    const r = patch.data[index], g = patch.data[index + 1], b = patch.data[index + 2]
    if (patch.data[index + 3] < 80 || Math.max(r, g, b) < 35) continue
    const skin = r > 140 && r > g * 1.1 && g > b * 1.14 && b < 160
    const hair = r >= g && r < 120 && g < 100 && b < 85 && py < 27
    if (skin || hair) continue
    const [nr, ng, nb] = shade(palettes[outfit].side, .3 * r + .59 * g + .11 * b)
    patch.data[index] = nr; patch.data[index + 1] = ng; patch.data[index + 2] = nb
  }
  ctx.putImageData(patch, x + 80, y + 128)
}

function copyLongHair(ctx: CanvasRenderingContext2D, headImage: CanvasImageSource, character: CharacterId, frameX: number, frameY: number) {
  const source = document.createElement('canvas')
  source.width = FRAME; source.height = 70
  const sourceCtx = source.getContext('2d', { willReadFrequently: true })!
  sourceCtx.drawImage(headImage, frameX, frameY + 162, FRAME, 70, 0, 0, FRAME, 70)
  const hair = sourceCtx.getImageData(0, 0, FRAME, 70)
  const body = ctx.getImageData(frameX, frameY + 162, FRAME, 70)
  for (let py = 0; py < 70; py++) for (let px = 0; px < FRAME; px++) {
    if (px > 112 && px < 168) continue
    const index = (py * FRAME + px) * 4
    const r = hair.data[index], g = hair.data[index + 1], b = hair.data[index + 2]
    if (hair.data[index + 3] < 110) continue
    const pinkHair = character === 'h' && r > 145 && r > g * 1.2 && b > g * 1.08 && r > b * .9
    const brownHair = character !== 'h' && py < 60 && (px < 94 || px > 186) && r > 45 && r < 170 && r > g * 1.12 && g >= b * .91 && b < 110
    if (!pinkHair && !brownHair) continue
    body.data[index] = r; body.data[index + 1] = g; body.data[index + 2] = b; body.data[index + 3] = hair.data[index + 3]
  }
  ctx.putImageData(body, frameX, frameY + 162)
}

export function makeOutfitSheet(
  character: CharacterId,
  outfit: OutfitId,
  image: (id: CharacterId) => CanvasImageSource,
  equipped: Partial<Record<GearSlot, GearId>> = {},
  boards?: OutfitBoards
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME * COLUMNS
  canvas.height = FRAME * ROWS
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = false
  const donor = character === 'h' || character === 'b' ? character : alternateDonors[character]?.[outfit] ?? donors['bdfh'.includes(character) ? 'female' : 'male'][outfit]
  ctx.drawImage(image(donor), 0, 0)
  recolorClothes(ctx, outfit, character)
  // The donor's head and the original clothes are removed before the player's head is placed.
  const headImage = character === 'a' ? bareHeadForA(image) : image(character)
  const boardColumn = boardColumns[character]
  const boardRow = boardRows[boardColumn.sheet]
  const rowIndex = outfitRow[outfit]
  const referenceCharacter = boards ? boardCutout(boards[boardColumn.sheet], {
    x: boardColumn.x, y: boardRow[rowIndex] + 3, width: boardColumn.width,
    height: boardRow[rowIndex + 1] - boardRow[rowIndex] - 6
  }, character === 'h') : null
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLUMNS; col++) {
    const x = col * FRAME, y = row * FRAME
    if (character !== 'h') {
      ctx.clearRect(x, y, FRAME, 162)
      ctx.drawImage(headImage, x, y, FRAME, 162, x, y, FRAME, 162)
      if ('bdf'.includes(character)) copyLongHair(ctx, headImage, character, x, y)
      recolorNeck(ctx, x, y, outfit)
    }
    if (row < 3 && col === 0 && referenceCharacter) {
      ctx.clearRect(x, y, FRAME, FRAME)
      ctx.drawImage(referenceCharacter, x + (row === 1 ? 16 : 14), y + (row === 2 ? 6 : 8), 252, 262)
    }
    if (col === 0 && row >= 3 && (character === 'b' || character === 'h') && (outfit === 'royal' || outfit === 'starlight' || outfit === 'ceremonial')) {
      ctx.fillStyle = '#5b3a38'
      ctx.fillRect(x + 109, y + 158, 62, 13)
      ctx.fillStyle = '#f6eddb'
      ctx.fillRect(x + 112, y + 158, 56, 9)
      ctx.fillRect(x + 106, y + 228, 68, 5)
      ctx.fillStyle = '#d4ae65'
      ctx.fillRect(x + 137, y + 184, 6, 11)
    }
    const accent = palettes[outfit].gold
    ctx.fillStyle = `rgb(${accent.join(',')})`
    if (col !== 0 || (referenceCharacter && row < 3)) continue
    if (outfit === 'royal' || outfit === 'ceremonial') {
      ctx.fillRect(x + 136, y + 170, 8, 8)
      ctx.fillRect(x + 133, y + 173, 14, 3)
      ctx.fillRect(x + 119, y + 207, 42, 4)
    } else if (outfit === 'mage' || outfit === 'starlight') {
      ctx.fillRect(x + 138, y + 176, 5, 12)
      ctx.fillRect(x + 134, y + 180, 13, 4)
      ctx.fillRect(x + 116, y + 221, 5, 5)
      ctx.fillRect(x + 158, y + 213, 5, 5)
    } else if (outfit === 'explorer') {
      ctx.strokeStyle = '#9e7446'; ctx.lineWidth = 6
      ctx.beginPath(); ctx.moveTo(x + 117, y + 165); ctx.lineTo(x + 157, y + 210); ctx.stroke()
      ctx.fillStyle = '#6a472b'; ctx.fillRect(x + 159, y + 196, 18, 19)
      ctx.fillStyle = '#d1a960'; ctx.fillRect(x + 164, y + 198, 8, 4)
    } else {
      ctx.fillStyle = '#325d3c'
      ctx.fillRect(x + 114, y + 160, 52, 7)
      ctx.fillStyle = '#d1ae70'
      ctx.fillRect(x + 119, y + 205, 42, 5)
    }
  }
  drawGearOnSheet(ctx, character, equipped)
  return canvas
}
