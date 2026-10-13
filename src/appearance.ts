import type { CharacterId, OutfitId } from './domain'

export const characterSignature: Record<CharacterId, { name: string; suggested: OutfitId; accent: number }> = {
  a: { name: 'หนุ่มผมน้ำตาล', suggested: 'explorer', accent: 0x6a482b },
  b: { name: 'สาวผมเปีย', suggested: 'forest', accent: 0x8b5937 },
  c: { name: 'หนุ่มผมทอง', suggested: 'forest', accent: 0xd3a34a },
  d: { name: 'สาวแว่น', suggested: 'royal', accent: 0x8b6a42 },
  e: { name: 'หนุ่มผมหางม้า', suggested: 'mage', accent: 0x315782 },
  f: { name: 'สาวผมหยิก', suggested: 'forest', accent: 0x99643c },
  g: { name: 'หนุ่มผมดำ', suggested: 'forest', accent: 0x3d5260 },
  h: { name: 'สาวผมชมพู', suggested: 'ceremonial', accent: 0xd987a4 }
}
