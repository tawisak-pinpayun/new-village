# Shop and NPC Asset Specification

## Shop assets

| Asset | Size | Format | Notes |
| --- | --- | --- | --- |
| Exterior | 1536 × 1024 | PNG/WebP | Full map art, no baked interaction text |
| Interior/header | 2176 × 724 or 3:1 | PNG/WebP | Safe text region and NPC region documented |
| Signboard | 768 × 320 | transparent PNG | No baked localized text |
| Shelf/display | 512 × 256 | transparent PNG | Same camera and lighting as interior |
| Ambient effect | 256 × 256 | transparent PNG atlas | 4–8 equal frames, 6–12 FPS |

## NPC world sprite sheet

- File: `{npc-id}-sprite-sheet.png`
- Transparent 4 × 2 atlas with equal logical cells.
- States: idle, blink, breathe down/up, greet, walk, profession work, talk.
- Full body and consistent foot anchor in every frame.
- Runtime frame rate: idle 2–4 FPS, walk 6 FPS, greet/work/talk 4–6 FPS.
- Interaction range: indicator at 95 world pixels; greeting starts at 160 pixels.

## Dialogue portraits

- File: `{npc-id}-portraits.png`
- Transparent 4 × 1 atlas.
- Expressions: happy, surprised, sad, talking.
- Waist-up, consistent head scale and eye line.
- Minimum cell height 700 px.

## Seed Shop vertical slice

Production assets: `lily-sprite-sheet.png`, `lily-portraits.png`, `farmers-market-header.png`, and `market-item-atlas.png`.

Still missing for later shops: unique exteriors, interiors, signs, ambient atlases, NPC sprite sheets, portrait expressions, profession sounds, music loops, and complete product illustration sets for Blacksmith, Magic, General, Animal, Furniture, and Jewelry shops. Do not reuse Lily or recolor the Seed Shop as final art for those shops.

## Remaining shop and NPC art direction

The approved exploration board is `design-preview/remaining-shops-npc-concept.png`. It establishes six distinct silhouettes and palettes while keeping one painterly cozy-fantasy rendering style.

| Shop | NPC | Character direction | Palette and signature props |
| --- | --- | --- | --- |
| General Store | Mira | Cheerful, practical middle-aged merchant in a terracotta apron | Honey wood, sage, food jars, bread, daily supplies |
| Blacksmith | Borin | Broad, friendly master smith with soot marks and leather apron | Charcoal, iron, ember orange, anvil, forged tools |
| Magic Shop | Selene | Elegant scholarly mage with dark hair and constellation robes | Indigo, violet, gold, potions, books, celestial instruments |
| Animal Shop | Ploy | Energetic young caretaker with braid and straw hat | Meadow green, butter yellow, feed sacks, rabbit and chicken motifs |
| Furniture Workshop | Rowan | Calm bearded carpenter with rolled sleeves and tool belt | Walnut, forest green, carved chairs, cabinets, hand tools |
| Tailor and Jewelry | Aria | Refined auburn-haired designer in cream and plum | Plum, rose, gold, fabric rolls, necklaces, mirror |

This board is art direction, not a runtime sprite sheet. Each NPC still needs a transparent world sprite sheet, expression portraits, and a shop-specific banner crop before its shop can be marked production ready.

Production audio is also still missing for the Seed Shop: a seamless shop music loop and separate greeting, dialogue, purchase, sale, hover, and close effects. These are reported as missing and are not replaced with browser beeps or unrelated stock sounds.
