# Project New Village Game UI Design System

## Visual direction

The primary target is the approved Farmers' Market reference: a cozy fantasy farming RPG with hand-painted illustration, warm wood, parchment, leaf green controls, soft depth, and compact inventory cards. Thai copy must remain legible at game scale.

## Architecture

The client is a Vite + TypeScript application using Phaser for the game world and DOM overlays for interface screens. Shared UI lives in `src/ui/`:

- `design-tokens.css`: canonical colors, spacing, radii, typography, borders, shadows, and motion.
- `game-ui.css`: reusable window, shop, navigation, card, currency, and responsive patterns.
- `game-ui.ts`: typed HTML renderers for DOM overlays.
- `item-assets.ts`: the only item-to-art registry.

Feature code may own data and event handlers. It must not create a second visual language.

## Foundations

- Use `--game-*` tokens. Add a token only when the value is reusable and visually approved.
- Display type uses the serif display token; Thai body and controls use the UI font token.
- All windows use parchment surfaces, wood framing, and the shared window shadow.
- Green is the primary action. Amber is reserved for selling. Red is reserved for destructive actions.
- Game UI uses illustrated assets. Emoji may appear only in temporary debug text and must never act as final item art.

## Shared patterns

### Game window

Use `.game-window` for every full overlay. A window includes one clear heading, one close control, a framed content area, and responsive overflow.

### Shop shell

Use `renderShopWindow(shop)` with `.game-market`, `.game-awning`, `.game-shop-nav`, `.game-shop-hero`, and `.game-shop-content`. Each `ShopDefinition` supplies its identity, banner, banner crop, palette, NPC portrait, buy stock, accepted sell items, and categories. Shop data and transaction handlers remain outside the component renderer.

Every shop window uses two explicit modes. Buy lists that shop's stock. Sell lists only accepted items currently owned by the player, includes owned quantities, and displays the shared empty state when none qualify. Switching mode or item resets quantity to one; search and categories operate only inside the active mode.

### Item card

Use `.game-item-card`, `.game-item-art`, `.game-item-copy`, `.game-quantity`, and `.game-coin-icon`. Art is resolved by a key from `ITEM_ASSETS`. Cards must include an accessible action label and asset alt text.

### Other systems

Inventory, crafting, auction, equipment, classes, skills, housing, animals, quests, and NPC dialogue should compose the same window, panel, card, tab, badge, currency, and button primitives. Migrate one validated screen at a time.

## Responsive rules

- Desktop: category rail plus three product columns.
- Tablet: horizontal category rail plus two product columns.
- Mobile: one product column, compact hero, hidden decorative speech bubble.
- Interactive controls retain at least 40 px height.
- Overlays scroll internally and never push gameplay layout.

## Definition of done

1. Uses design tokens and the central asset registry.
2. Uses real artwork with a documented license/source and consistent style.
3. Preserves Thai readability and keyboard accessibility.
4. Is checked at desktop and mobile widths in a real browser.
5. Has a captured screenshot reviewed against the Farmers' Market reference.
6. Preserves gameplay behavior and passes the existing automated tests.

## Farmers' Market validation — 2026-10-13

The migrated market was opened in the running Vite application at `http://localhost:5173/?preview=2&shopPreview=market` and captured through the real in-app browser at 1312 × 888. The capture was compared with the supplied Farmers' Market reference.

Matched characteristics: striped canopy, wood framed full-screen shop, illustrated wooden sign, coherent hand-painted shopkeeper and market booth, left category rail with illustrated icons, parchment search and sorting controls, three-column illustrated product cards, functional quantity controls, green purchase action, coin balance, and internal scrolling.

Known differences: the reference includes additional bespoke wooden corner ornaments and separate list/grid display icons. Those assets remain explicitly listed for future production rather than being replaced with emoji or generic placeholders.

Browser interaction validation: searching for `ดาบ` reduced the active Buy mode to the sword card and hid Radish. Switching Buy → Sell → Buy reset the edited quantity from two to one. With no accepted sell items owned, Sell displayed the illustrated empty state. An attempted 8 Coin purchase with a 2 Coin balance preserved the balance and displayed the Thai insufficient-funds message.
