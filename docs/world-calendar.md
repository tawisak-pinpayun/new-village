# World calendar

`src/calendar.ts` derives a leap-free fictional date from an absolute game day. Days are 24 real minutes. Four 28-day seasons form a 112-day year, with seven weekdays repeating every week. The game day starts at 06:00. `calendarAt(day, progress)` is pure and computes date, time period and season-dependent light.

Offline saves keep `dayStartedAt` and `calendarVersion: 3` in the existing v2 save document; version 2 calendar saves preserve elapsed days when loaded. Online worlds use `server/world-clock.mjs` and a shared epoch stored in MongoDB `world_clocks` (`_id: shared`). The fallback epoch is a fixed UTC timestamp, so a restart without MongoDB does not reset the calendar. Snapshots include epoch, day length, version and server time. Clients display an interpolated clock but the server owns shared actions.

The HUD date opens `src/ui/calendar-ui.ts`, a 7-column, 28-day window. Days, past/current/upcoming labels and festival details are clickable. Time is never advanced by one player's sleep. The pre-existing rest action only refills the individual player's stats.

Tests: `node --experimental-strip-types --test tests/calendar.test.mjs`.
