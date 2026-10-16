# Weather

`src/weather.mjs` is shared by browser and server. `weatherAt(day, slot)` chooses from clear, cloudy, rain, heavy rain, thunderstorm, windy, fog, snow and blizzard using deterministic season-weighted values. Each 24-minute day has four six-minute slots. `weatherAtTime(now, epoch)` returns the next transition timestamp.

`server/world.mjs` places authoritative weather in each world snapshot and broadcasts transitions. Rain, heavy rain and thunderstorms water planted shared crops. Offline farming uses the same weather table; snow is currently visual only. The HUD shows current weather; existing rain particles and new lightweight snow particles animate outdoors.

Future work: crop-specific weather modifiers, visibility, NPC schedule responses, audio and GPU-friendly seasonal art. Tests: `node --experimental-strip-types --test tests/weather.test.mjs`.
