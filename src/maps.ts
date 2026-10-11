import type { MapId } from './domain'

export const TILE = 32
export const WORLD_WIDTH = 1536
export const WORLD_HEIGHT = 1024

export type Interaction = {
  id: string
  x: number
  y: number
  label: string
  kind: 'door' | 'shop' | 'market_shop' | 'tailor' | 'magic_shop' | 'forge' | 'quest' | 'festival' | 'rest' | 'cook' | 'storage' | 'future' | 'refill'
  destination?: MapId
  arrival?: { x: number; y: number }
}
export type ResourceNode = { id: string; x: number; y: number; kind: 'tree' | 'rock' | 'grass' | 'rabbit' | 'boar' | 'copper' | 'iron'; hp: number }

type Rect = [number, number, number, number]
const MINE_BLOCKED: Rect[] = [
  [0, 0, 1536, 110], [0, 0, 140, 1024], [1390, 0, 146, 1024],
  [0, 925, 620, 99], [900, 925, 636, 99],
  [185, 125, 245, 145], [1050, 125, 260, 135],
  [455, 300, 130, 105], [855, 225, 150, 95], [640, 420, 145, 100],
  [1000, 445, 110, 100], [330, 495, 115, 115], [565, 625, 100, 105], [820, 625, 115, 105]
]
export type MapConfig = {
  id: MapId
  name: string
  image: string
  spawn: { x: number; y: number }
  blocked: Rect[]
  interactions: Interaction[]
  resources?: ResourceNode[]
}

export const MAPS: Record<MapId, MapConfig> = {
  village: {
    id: 'village', name: 'หมู่บ้าน', image: '/assets/village.png', spawn: { x: 768, y: 800 },
    blocked: [
      [600, 88, 328, 196], [196, 177, 292, 222], [1040, 180, 315, 225],
      [665, 413, 205, 177], [250, 650, 245, 165], [1035, 650, 240, 165],
      [0, 0, 600, 100], [910, 0, 626, 100], [0, 0, 140, 425], [1390, 0, 146, 425],
      [0, 660, 160, 364], [1375, 655, 161, 369], [0, 920, 650, 104], [890, 920, 646, 104]
    ],
    interactions: [
      { id: 'to-farm', x: 770, y: 924, label: 'ไปบ้านและฟาร์ม', kind: 'door', destination: 'farm', arrival: { x: 770, y: 870 } },
      { id: 'shop', x: 530, y: 420, label: 'คุยกับเจ้าของร้าน', kind: 'shop' },
      { id: 'quest', x: 565, y: 790, label: 'คุยกับไกด์หมู่บ้าน', kind: 'quest' },
      { id: 'forest', x: 560, y: 145, label: 'ทางไปป่า', kind: 'future' },
      { id: 'river', x: 1375, y: 520, label: 'ไปริมน้ำ', kind: 'door', destination: 'riverside', arrival: { x: 235, y: 520 } },
      { id: 'market', x: 175, y: 520, label: 'ไปตลาด', kind: 'door', destination: 'market', arrival: { x: 1280, y: 520 } }
    ]
  },
  farm: {
    id: 'farm', name: 'บ้านและฟาร์ม', image: '/assets/farm.png', spawn: { x: 770, y: 870 },
    blocked: [
      [630, 55, 295, 250], [365, 215, 145, 165], [1150, 478, 135, 160],
      [1110, 175, 255, 185], [0, 0, 310, 200], [1235, 0, 301, 180],
      [0, 0, 110, 1024], [1425, 0, 111, 1024], [0, 920, 650, 104], [890, 920, 646, 104]
    ],
    interactions: [
      { id: 'to-home', x: 780, y: 336, label: 'เข้าบ้าน', kind: 'door', destination: 'home', arrival: { x: 770, y: 780 } },
      { id: 'to-village', x: 770, y: 940, label: 'กลับหมู่บ้าน', kind: 'door', destination: 'village', arrival: { x: 770, y: 820 } },
      { id: 'storage', x: 515, y: 377, label: 'ดูโรงเก็บของ', kind: 'storage' },
      { id: 'well', x: 1100, y: 585, label: 'เติมน้ำที่บ่อ', kind: 'refill' }
    ],
    resources: [
      { id: 'farm-tree-1', x: 315, y: 705, kind: 'tree', hp: 3 },
      { id: 'farm-tree-2', x: 1250, y: 735, kind: 'tree', hp: 3 },
      { id: 'farm-rock-1', x: 345, y: 855, kind: 'rock', hp: 2 },
      { id: 'farm-rock-2', x: 1175, y: 840, kind: 'rock', hp: 2 },
      { id: 'farm-grass-1', x: 425, y: 845, kind: 'grass', hp: 1 },
      { id: 'farm-grass-2', x: 1075, y: 850, kind: 'grass', hp: 1 }
    ]
  },
  market: {
    id: 'market', name: 'ตลาด', image: '/assets/market.png', spawn: { x: 1280, y: 520 },
    blocked: [
      [0, 0, 1536, 110], [0, 0, 125, 1024], [1430, 0, 106, 410], [1430, 620, 106, 404],
      [240, 130, 285, 215], [1000, 130, 305, 210], [190, 630, 310, 195], [980, 630, 315, 200],
      [650, 365, 245, 225], [0, 855, 660, 169], [880, 855, 656, 169]
    ],
    interactions: [
      { id: 'to-village', x: 1385, y: 520, label: 'กลับหมู่บ้าน', kind: 'door', destination: 'village', arrival: { x: 300, y: 520 } },
      { id: 'to-magic-city', x: 770, y: 925, label: 'ไปเมืองเวทมนตร์', kind: 'door', destination: 'magic_city', arrival: { x: 770, y: 165 } },
      { id: 'seed-stall', x: 555, y: 285, label: 'ซื้อเมล็ดผัก', kind: 'market_shop' },
      { id: 'garden-stall', x: 1050, y: 335, label: 'ดูอุปกรณ์ปลูกผัก', kind: 'market_shop' },
      { id: 'tailor-stall', x: 545, y: 690, label: 'ร้านเสื้อผ้า', kind: 'tailor' },
      { id: 'magic-stall', x: 925, y: 690, label: 'ร้านเวทมนตร์', kind: 'magic_shop' },
      { id: 'harvest-festival', x: 770, y: 745, label: 'งานเทศกาลเก็บเกี่ยว', kind: 'festival' }
    ]
  },
  magic_city: {
    id: 'magic_city', name: 'เมืองเวทมนตร์', image: '/assets/magic-city.png', spawn: { x: 770, y: 165 },
    blocked: [
      [0, 0, 575, 350], [960, 0, 576, 350],
      [0, 625, 490, 399], [1040, 625, 496, 399],
      [650, 370, 235, 200], [0, 0, 1536, 60],
      [0, 950, 620, 74], [915, 950, 621, 74]
    ],
    interactions: [
      { id: 'to-market', x: 770, y: 105, label: 'กลับตลาด', kind: 'door', destination: 'market', arrival: { x: 770, y: 810 } },
      { id: 'arcane-shop', x: 635, y: 290, label: 'ร้านเวทมนตร์', kind: 'magic_shop' },
      { id: 'mage-tailor', x: 905, y: 290, label: 'ร้านชุดจอมเวท', kind: 'tailor' }
    ]
  },
  riverside: {
    id: 'riverside', name: 'ริมแม่น้ำ', image: '/assets/riverside.png', spawn: { x: 235, y: 520 },
    blocked: [
      [0, 0, 1536, 100], [0, 0, 100, 405], [0, 635, 100, 389], [1400, 0, 136, 1024],
      [0, 925, 1536, 99], [790, 100, 300, 365], [790, 605, 610, 320], [980, 365, 200, 105]
    ],
    interactions: [
      { id: 'to-village', x: 140, y: 520, label: 'กลับหมู่บ้าน', kind: 'door', destination: 'village', arrival: { x: 1280, y: 520 } },
      { id: 'to-mine', x: 1320, y: 155, label: 'เข้าเหมือง', kind: 'door', destination: 'mine', arrival: { x: 770, y: 810 } }
    ],
    resources: [
      { id: 'river-rabbit-1', x: 355, y: 530, kind: 'rabbit', hp: 1 },
      { id: 'river-rabbit-2', x: 675, y: 740, kind: 'rabbit', hp: 1 },
      { id: 'river-boar-1', x: 535, y: 250, kind: 'boar', hp: 3 },
      { id: 'river-boar-2', x: 390, y: 755, kind: 'boar', hp: 3 }
    ]
  },
  mine: {
    id: 'mine', name: 'เหมือง ชั้น 1', image: '/assets/mine.png', spawn: { x: 770, y: 810 },
    blocked: MINE_BLOCKED,
    interactions: [
      { id: 'to-riverside', x: 770, y: 895, label: 'ออกสู่ริมน้ำ', kind: 'door', destination: 'riverside', arrival: { x: 1260, y: 245 } },
      { id: 'to-mine2', x: 1210, y: 330, label: 'ลงเหมืองชั้น 2', kind: 'door', destination: 'mine2', arrival: { x: 770, y: 810 } },
      { id: 'forge', x: 865, y: 335, label: 'เตาหลอมอาวุธ', kind: 'forge' }
    ],
    resources: [
      { id: 'mine-copper-1', x: 350, y: 305, kind: 'copper', hp: 2 },
      { id: 'mine-copper-2', x: 1270, y: 730, kind: 'copper', hp: 2 },
      { id: 'mine-copper-3', x: 635, y: 175, kind: 'copper', hp: 2 },
      { id: 'mine-iron-1', x: 1230, y: 375, kind: 'iron', hp: 3 },
      { id: 'mine-iron-2', x: 250, y: 555, kind: 'iron', hp: 3 }
    ]
  },
  mine2: {
    id: 'mine2', name: 'เหมือง ชั้น 2', image: '/assets/mine.png', spawn: { x: 770, y: 810 },
    blocked: MINE_BLOCKED,
    interactions: [
      { id: 'to-mine1', x: 770, y: 895, label: 'ขึ้นเหมืองชั้น 1', kind: 'door', destination: 'mine', arrival: { x: 1120, y: 330 } },
      { id: 'to-mine3', x: 1210, y: 330, label: 'ลงเหมืองชั้น 3', kind: 'door', destination: 'mine3', arrival: { x: 770, y: 810 } }
    ],
    resources: [
      { id: 'mine2-copper-1', x: 340, y: 310, kind: 'copper', hp: 3 },
      { id: 'mine2-iron-1', x: 1230, y: 390, kind: 'iron', hp: 3 },
      { id: 'mine2-iron-2', x: 250, y: 560, kind: 'iron', hp: 3 },
      { id: 'mine2-iron-3', x: 1260, y: 735, kind: 'iron', hp: 3 }
    ]
  },
  mine3: {
    id: 'mine3', name: 'เหมือง ชั้น 3', image: '/assets/mine.png', spawn: { x: 770, y: 810 },
    blocked: MINE_BLOCKED,
    interactions: [
      { id: 'to-mine2', x: 770, y: 895, label: 'ขึ้นเหมืองชั้น 2', kind: 'door', destination: 'mine2', arrival: { x: 1120, y: 330 } }
    ],
    resources: [
      { id: 'mine3-iron-1', x: 340, y: 310, kind: 'iron', hp: 3 },
      { id: 'mine3-iron-2', x: 1230, y: 390, kind: 'iron', hp: 3 },
      { id: 'mine3-iron-3', x: 250, y: 560, kind: 'iron', hp: 3 },
      { id: 'mine3-iron-4', x: 1260, y: 735, kind: 'iron', hp: 3 }
    ]
  },
  home: {
    id: 'home', name: 'ภายในบ้าน', image: '/assets/home.png', spawn: { x: 770, y: 780 },
    blocked: [
      [130, 120, 275, 330], [650, 0, 235, 305], [1070, 95, 450, 260],
      [655, 468, 250, 200], [0, 0, 105, 1024], [1430, 0, 106, 1024],
      [0, 0, 1536, 80], [0, 915, 620, 109], [910, 915, 626, 109]
    ],
    interactions: [
      { id: 'to-farm', x: 770, y: 875, label: 'ออกไปฟาร์ม', kind: 'door', destination: 'farm', arrival: { x: 780, y: 430 } },
      { id: 'rest', x: 430, y: 355, label: 'นอนพัก 3 วินาที', kind: 'rest' },
      { id: 'cook', x: 1090, y: 385, label: 'คุยกับแม่ครัว', kind: 'cook' },
      { id: 'storage', x: 1280, y: 825, label: 'ดูหีบเก็บของ', kind: 'storage' }
    ]
  }
}

// Domain map data and collision tiles stay separate from the illustrated background.
export function collisionTiles(config: MapConfig): number[][] {
  const cols = WORLD_WIDTH / TILE, rows = WORLD_HEIGHT / TILE
  const grid = Array.from({ length: rows }, () => Array<number>(cols).fill(0))
  for (const [x, y, w, h] of config.blocked) {
    for (let row = Math.max(0, Math.floor(y / TILE)); row < Math.min(rows, Math.ceil((y + h) / TILE)); row++) {
      for (let col = Math.max(0, Math.floor(x / TILE)); col < Math.min(cols, Math.ceil((x + w) / TILE)); col++) grid[row][col] = 1
    }
  }
  return grid
}

export const FARM_PLOTS = [
  { x: 610, y: 540 }, { x: 770, y: 540 }, { x: 925, y: 540 },
  { x: 610, y: 655 }, { x: 770, y: 655 }, { x: 925, y: 655 }
]
