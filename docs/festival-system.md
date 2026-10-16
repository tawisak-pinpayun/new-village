# Festival definitions

`src/festivals.ts` lists all twelve requested annual dates, hours, locations, NPC IDs, mini-game IDs and proposed rewards. `festivalOccurrenceId(definition, year)` gives a stable yearly key. The calendar displays a mark and a date detail for each event, with status calculated from the current game date and time.

Flower Festival and Friendship Day offer practice mini-games on any calendar visit and server-validated reward runs while each event is active. The remaining ten entries are information only. Events do not yet move NPCs, open shops or award proposed items. Some proposed locations do not yet exist on the map. The existing daily market harvest donation is a separate feature and remains available.
