# World Calendar implementation progress

## Phase 0 — architecture audit (complete)

- Client: Vite, TypeScript and Phaser 3. `src/main.ts` owns scene and HUD orchestration; `src/domain.ts` owns local and account save shape, inventory and farming; `src/calendar.ts` owns display time and seasons.
- Server: Node HTTP and `ws` in `server/index.mjs`; `server/world.mjs` owns shared plots, monsters and the current day. World rooms currently live in memory and disappear when empty.
- Persistence: browser localStorage for offline play and MongoDB `accounts`, `account_sessions`, `game_saves` and `game_save_backups` for authenticated saves. There is no world-clock or event store yet.
- Existing systems to reuse: 24-minute day, smooth lighting, rain particles and watering, six farm plots, inventory and shop catalogs, NPC dialogue and animated portraits, shared room broadcasts, a daily harvest donation event. The donation event is distinct from the proposed annual Harvest Festival and must remain functional.
- Missing: 28-day months and four-season year; interactive calendar; durable shared world epoch; configurable weather; annual festival registry and occurrence claims; playable mini-game framework and games; festival-specific NPC schedules, shops, quests, achievements and leaderboards. Fishing, relationships and auctions do not currently exist and cannot be integrated without adding those systems first.

## Module and migration plan

1. `src/calendar.ts`: pure calendar rules, day periods and 7×28 month data. Keep `src/domain.ts` as the source of local save day elapsed time; migrate calendar metadata without changing coins, inventory, characters or position.
2. `server/world-clock.mjs`: authoritative epoch, day length, version and time derivation. Persist an anchor per server in a MongoDB collection with a unique server ID; send epoch and server time in world snapshots. Use a stable fallback anchor when MongoDB is unavailable.
3. `src/weather.ts` and server counterpart: shared deterministic season-aware weather periods, crop watering and bounded visual effects.
4. `src/festivals.ts` and server counterpart: twelve static definitions, recurrence and occurrence IDs; separate the existing daily harvest donation state.
5. `src/mini-games/`: registry, lifecycle, shared UI and independently testable score rules. Store claims and results on the server before awarding account progress.
6. Extend `server/accounts.mjs` with indexed occurrence, session, score, claim and transaction collections. Keep the existing save document and optimistic revision API; use unique `(account, occurrence, game, claim)` keys and atomic claim updates. Do not add new client-trusted coin or token writes.

## Checklist, complexity and dependencies

| Phase | Deliverable | Complexity | Dependency / risk |
| --- | --- | --- | --- |
| 1 | Clock, four-season calendar, HUD and day details | High | Existing five-season timing and old saves |
| 2 | Weighted weather, seasonal map variants, crop rules | High | Seasonal art and crop assets are missing |
| 3 | Festival registry, calendar entries and scheduling | Medium | Map locations absent for beach, observatory and haunted forest |
| 4 | Validated mini-game session and reward framework | High | Account identity and server persistence |
| 5 | Fishing, rhythm and ghost games | High | Fishing and elemental magic do not exist yet |
| 6 | Other nine playable games | Very high | Art, input, balancing and individual validation |
| 7 | NPC events, shops, quests and achievements | Very high | Seven NPC schedules and missing reward art |
| 8 | Leaderboards and multiplayer competitions | High | Replay or server-verifiable inputs; durable score storage |
| 9 | Visual/audio polish and mobile performance | High | Approved assets and device testing |

## Release gate

The attached request requires explicit approval before public deployment. Implementation stays local until that approval. Tests and local previews are permitted.

## Current implementation

- Phase 1 complete locally: version 3 four-season calendar, 28-day month, 112-day year, weekday and time periods, clickable 28-day calendar and compact HUD button. Multiplayer derives time from the server epoch and offset. The server stores the shared epoch in MongoDB when available; a fixed fallback epoch keeps local/no-DB time stable across restarts. Version 2 saves retain their elapsed day, character and coins.
- Phase 2 partial: deterministic weighted weather types, six-minute transitions, server broadcasts, rain-driven shared farming, client HUD and rain/snow particles. Dedicated seasonal terrain, vegetation, buildings and crop/fish/monster rule tables await art and gameplay systems.
- Phase 3 partial: all twelve annual festival definitions, recurrence IDs and calendar day detail/status. Festival locations, NPC schedules, rewards and playable activities are not active yet. The pre-existing daily harvest donation remains separate.
- Phase 4 started locally: the Flower Festival calendar entry opens a playable flower-arrangement practice game. Its reusable session handles ready, countdown, playing, paused, completed and cancelled states. Four flower slots, deterministic targets, mouse/touch and keyboard controls, a 30-second timer, score and rank are implemented in separate mini-game and UI modules.
- Practice mode intentionally grants no coins, tokens, items or EXP. The client is not trusted to award account progress. Authenticated server validation, durable result records and idempotent reward claims are still required before live festival rewards can be enabled.
- Phases 5–9 and the other eleven mini-games have not been implemented.
- Last local verification: TypeScript typecheck, Vite build and 53 automated tests passed. Local browser verified calendar navigation, Flower Festival practice entry, countdown, play, score result and desktop/mobile layout. No public deployment was made.
