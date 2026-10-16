# Mini-game framework plan

Flower Arrangement is playable as a local practice run from the Flower Festival calendar entry. `src/mini-games/session.mjs` provides an explicit lifecycle (idle, ready, countdown, playing, paused, completed, cancelled), timed moves and configurable rank thresholds. `src/mini-games/flower.mjs` generates reproducible targets and normalizes scores to 0–1000. `src/ui/mini-game-ui.ts` contains the DOM overlay, controls and result display.

Flower Festival and Friendship Day reward routes issue sessions to authenticated accounts only during their server-clock event windows. They validate bounded, ordered moves, calculate server-time scores and use one atomic MongoDB progress update per account and yearly occurrence to prevent duplicate claims. Flower grants Festival Tokens and Festival EXP; Gift Match grants Friendship EXP. Gift Match uses `src/mini-games/gift-match.mjs` for deck/replay/score rules and `gift-session.mjs` for timed play. A real MongoDB integration run and active-event browser tests remain release gates. The next distinct game slices remain Fishing Tournament, Dance Rhythm and Ghost Catcher.

The project does not have fishing or elemental magic systems. Those mechanics and their art must be built before claiming integration. Practice runs should issue no currency; reward runs require an authenticated account and a unique claim key.
