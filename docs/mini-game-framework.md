# Mini-game framework plan

Flower Arrangement is playable as a local practice run from the Flower Festival calendar entry. `src/mini-games/session.mjs` provides an explicit lifecycle (idle, ready, countdown, playing, paused, completed, cancelled), timed moves and configurable rank thresholds. `src/mini-games/flower.mjs` generates reproducible targets and normalizes scores to 0–1000. `src/ui/mini-game-ui.ts` contains the DOM overlay, controls and result display.

The next implementation needs authenticated server-issued sessions, an input replay validator and durable per-occurrence claim limits before the game can award anything. The next distinct game slices remain Fishing Tournament, Dance Rhythm and Ghost Catcher.

The project does not have fishing or elemental magic systems. Those mechanics and their art must be built before claiming integration. Practice runs should issue no currency; reward runs require an authenticated account and a unique claim key.
