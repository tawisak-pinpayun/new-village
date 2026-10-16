# Festival definitions

`src/festivals.ts` lists all twelve requested annual dates, hours, locations, NPC IDs, mini-game IDs and proposed rewards. `festivalOccurrenceId(definition, year)` gives a stable yearly key. The calendar displays a mark and a date detail for each event, with status calculated from the current game date and time.

These entries are information only. An event does not currently move NPCs, open a shop, award items or run a mini-game. Some proposed locations do not yet exist on the map. The existing daily market harvest donation is a separate feature and remains available. Server event processing and durable occurrence records must be added before activating rewards.
