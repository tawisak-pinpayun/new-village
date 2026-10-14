# Project New Village Asset Guidelines

## Art direction

Use one hand-painted cozy fantasy style for DOM UI artwork. Keep warm lighting, soft outlines, clean silhouettes, and consistent three-quarter presentation. Do not mix these assets with pixel art inside the same UI surface. Pixel characters remain valid inside the Phaser game world until that system is intentionally migrated.

## Storage and registry

- UI images belong in `public/assets/ui/`.
- Item art must be registered in `src/ui/item-assets.ts`.
- Components receive an asset key and must not embed paths.
- Atlases require a documented fixed grid and transparent background.
- Keep source proportions consistent and leave safe padding around the subject.

## Current production assets

| Asset | Purpose | Status |
| --- | --- | --- |
| `market-item-atlas.png` | 16 Farmers' Market item, currency, and decoration illustrations | Production |
| `shop-item-atlas.png` | 16 illustrated items for Blacksmith, Magic, Animal, Furniture, and Tailor shops | Production |
| `tailor-item-atlas.png` | 16 exact outfit and accessory cards for Aria's shop; see `TAILOR_ITEM_ATLAS.md` | Production |
| `farmers-market-header.png` | Hand-painted market booth, shopkeeper, produce, awning, and sign background | Production |
| `shops/general-store-header.png` | Mira and the General Store interior banner | Production |
| `shops/blacksmith-header.png` | Borin and the Blacksmith interior banner | Production |
| `shops/magic-shop-header.png` | Selene and the Magic Shop interior banner | Production |
| `shops/animal-shop-header.png` | Ploy and the Animal Shop interior banner | Production |
| `shops/furniture-shop-header.png` | Rowan and the Furniture Workshop interior banner | Production |
| `shops/tailor-jewelry-header.png` | Aria and the Tailor and Jewelry interior banner | Production |
| `lily-sprite-sheet.png` | Lily world animation states in a 4 × 2 atlas | Production |
| `lily-portraits.png` | Lily happy, surprised, sad, and talking portraits | Production |
| `npcs/{mira,borin,selene,ploy,rowan,aria}-sprite-sheet.png` | Independent transparent 4 × 2 world animation atlases for the six shopkeepers | Production |
| `npcs/{mira,borin,selene,ploy,rowan,aria}-portraits.png` | Independent four-expression dialogue portrait atlases | Production |
| `npcs.png` | Existing NPC portrait sheet used by legacy screens | Production; do not combine with the hand-painted market surface |

The market atlas is a 4 × 4 grid. Mapping and accessible names are defined in `ITEM_ASSETS`.

Shop and NPC dimensions, frame order, FPS, and naming are defined in `SHOP_NPC_ASSET_SPEC.md`.

The six-shop identity board and full-body NPC model sheet live in `design-preview/remaining-shops-npc-concept.png` and `design-preview/shopkeeper-npc-model-sheet.png`. They are production references; runtime code should use the individual exported banner, portrait, and sprite assets.

## Missing assets

The following are intentionally reported as missing and must be created before their systems are migrated:

- Dedicated wooden frame nine-slice textures
- Parchment background texture without baked text
- Standalone market decorations for screens outside the Farmers' Market header
- Button cap textures for normal, hover, pressed, and disabled states
- Dedicated wooden corner ornaments and list/grid view icons
- Equipment icons outside Aria's 16 illustrated outfit and accessory cards
- Crafting material and recipe illustrations beyond the current market set
- Auction House category and status art
- Housing furniture thumbnails
- Animal portraits, products, and feed illustrations
- Class, skill, spell, quest, and dialogue portraits
- Unique exterior building layers, signboards, props, and ambient effect atlases for shops outside the existing map art

Do not substitute these with emoji. Use an explicitly disabled “coming soon” card when the required gameplay item does not exist yet.

## Export requirements

- PNG or WebP with transparency for item and portrait art.
- No text baked into reusable art.
- No watermark, clipping, or inconsistent canvas size.
- Inspect alpha edges on both light parchment and dark green backgrounds.
- Keep a source note and generation prompt beside a future asset manifest when the library grows.

## Review checklist

Check silhouette, crop, scale, palette, alpha, Thai layout, desktop and mobile screenshots, and consistency with the Farmers' Market reference before marking an asset production ready.
