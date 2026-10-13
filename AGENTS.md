# Project New Village contributor rules

All UI work must comply with `docs/design-system/GAME_UI_DESIGN_SYSTEM.md` and `docs/design-system/ASSET_GUIDELINES.md`.

- Use tokens from `src/ui/design-tokens.css` before adding visual values.
- Reuse or extend components in `src/ui/`; do not create isolated component styles for a single screen.
- Resolve item art through `src/ui/item-assets.ts`.
- Never use enlarged emoji as production game art.
- Do not mix pixel and hand-painted art within one UI surface.
- Report missing assets explicitly. Do not hide missing art with emoji or generic placeholders.
- Preserve Thai readability and desktop/mobile layouts.
- Preserve gameplay logic, APIs, persistence, database behavior, and player data during UI migrations.
- Capture a real browser screenshot and compare it with the approved Farmers' Market reference before claiming visual fidelity.
- Migrate and validate one game system at a time.
- New shops and shopkeepers must use the schemas in `src/shops.ts` and the asset contract in `docs/design-system/SHOP_NPC_ASSET_SPEC.md`; each production shop needs its own identity and NPC assets.
