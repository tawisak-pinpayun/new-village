# Pet atlas

`public/assets/ui/pet-atlas.png` is a transparent 3 × 3 atlas (1254 × 1254 pixels, 418 pixels per cell). `src/pet-data.ts` owns the seven species and frame indexes. `src/ui/item-assets.ts` maps each cell to shop, status, inventory, and egg or milk art. Phaser uses the same atlas for local and remote followers.

| Row | Column 1 | Column 2 | Column 3 |
| --- | --- | --- | --- |
| 1 | Village dog | Cat | Chicken |
| 2 | Cow | Goat | Magic dog |
| 3 | Bird | Egg | Milk |

Source: generated with the built-in image generator on 2026-10-15 in stylized-concept mode, then copied into the repository without cropping or recoloring.

Prompt: “Use case: stylized-concept. Asset type: 3 by 3 fixed-grid item atlas for a cozy fantasy farming RPG shop and pet status UI. Create exactly nine equal square cells, row-major: (1) friendly brown village dog, (2) ginger-and-cream cat, (3) small golden chicken, (4) gentle brown-and-white dairy cow, (5) cream goat, (6) blue-violet magical dog with a subtle glowing collar, (7) teal songbird, (8) one fresh cream egg, (9) one sealed milk bottle. Each subject centered separately within its own cell with ample padding, same scale, distinct silhouette. Warm hand-painted storybook fantasy style matching illustrated shop item cards, crisp readable details at 80 pixels. Straight-on three-quarter view of animals, isolated subjects. No cell borders, no dividers, no text, no letters, no symbols, no logos, no watermark, no additional subjects. Exact 3x3 alignment and equal cells. Transparent alpha background in every cell.”
