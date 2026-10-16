# Festival definitions

`src/festivals.ts` lists all twelve requested annual dates, hours, locations, NPC IDs, mini-game IDs and proposed rewards. `festivalOccurrenceId(definition, year)` gives a stable yearly key. The calendar displays a mark and a date detail for each event, with status calculated from the current game date and time.

Flower Festival now offers a practice mini-game on any calendar visit and a server-validated reward run while the event is active. The remaining eleven entries are information only. Events do not yet move NPCs, open shops or award proposed items. Some proposed locations do not yet exist on the map. The existing daily market harvest donation is a separate feature and remains available.
