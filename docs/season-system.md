# Seasons

`src/calendar.ts` defines spring, summer, autumn and winter as four consecutive 28-day months. Season identifiers are stable strings used by festival and weather definitions. A version 2 save migrates calendar metadata only; player data and elapsed game days stay intact.

The current scene preserves map art and collision. Existing tint and ambient light use each season's palette and sunrise/sunset values. Snow particles are added for snowy weather. New tile, vegetation, roof, beach and pond assets are still required for full seasonal world transformations. Crop season restrictions, greenhouse exceptions, seasonal fish, animals and monsters are not active; adding those rules before their inventory and map assets exist would make current content inaccessible.
