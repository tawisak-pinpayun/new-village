# Shop and Living NPC System Audit

Date: 2026-10-13

## Current architecture

- Phaser renders the world, collision, player, interactions, and NPC sprites.
- DOM overlays render dialogue and shop interiors.
- `maps.ts` owns interaction coordinates.
- `shops.ts` owns the Seed Shop and Lily definitions.
- `npc-system.ts` owns the reusable NPC animation state machine.
- `game-ui.ts` renders the shared `ShopWindow` used by the Seed Shop.

## Phase 1 findings

| Area | Seed Shop / Lily | Other shops |
| --- | --- | --- |
| World exterior | Existing market artwork and interaction zone | Unique exterior layers are missing |
| World NPC | Transparent 4×2 Lily animation atlas | Six independent transparent 4×2 shopkeeper atlases are connected to the same controller |
| Animation | Idle, breathing, blink, greeting, work, walk, talk and return states | Mira, Borin, Selene, Ploy, Rowan, and Aria use the reusable state machine |
| Dialogue | Large portrait, expressions, typewriter, choices | Six independent portrait atlases, greetings, jobs, and Buy/Sell/Talk/Goodbye choices are connected |
| Shop flow | NPC → dialogue → Buy/Sell → shop → dialogue | All seven shopkeepers now return to their own dialogue after the shop closes |
| Shop UI | Shared window, tabs, categories, quantities, transactions | Profession categories, banners, and item art are present; non-seed sell catalogs remain a later gameplay expansion |
| Item art | Complete market atlas | The 4×4 shop atlas is mapped to Blacksmith, Magic, Animal, Furniture, and Tailor cards |

## Target components

- `WorldShopEntity`: binds exterior, sign, props, ambient effects, NPC, entrance and interaction zone.
- `ShopExteriorRenderer`: renders profession-specific world layers without localized text baked into art.
- `NPCEntity`: owns position, facing, depth, collision and schedule.
- `NPCAnimationController`: deterministic state transitions and animation frames.
- `NPCDialogueController`: greeting, typewriter, choices and navigation.
- `NPCPortraitRenderer`: expression-specific independent portrait layer.
- `ShopWindow`: shared frame and controls with shop-specific theme and content.
- `ShopInventoryController` and `ShopTransactionController`: inventory filtering, quantities and safe transactions.

## Phase 2–4 Seed Shop status

Lily is the production vertical slice. Her controller now exposes `IDLE`, `WORKING`, `WALKING`, `PLAYER_NEARBY`, `GREETING`, `TALKING`, and `RETURN_TO_IDLE`. Approaching triggers greeting, dialogue locks talking, leaving returns her to idle, and the sprite frame changes over time. Interaction requires E, Space, click, or the mobile interaction button. Buy and Sell open their matching tab. Closing the shop returns to Lily's dialogue.

## Remaining asset blockers

The shopkeepers now have independent sprite and portrait atlases. The remaining art work is profession-specific exterior building layers, signboards, detachable props, and ambient effect atlases. Current map buildings stay in place until those layers exist so the interaction and collision maps remain stable.
