# Aria's tailor item atlas

`public/assets/ui/tailor-item-atlas.png` is a 4 × 4 fixed-grid, hand-painted catalog atlas. Runtime item keys and accessible names are in `src/ui/item-assets.ts`. Crop each cell with `background-size: 400% 400%` and its zero-based column and row.

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | --- | --- | --- | --- |
| 1 | Forest outfit | Royal outfit | Mage outfit | Explorer outfit |
| 2 | Starlight outfit | Ceremonial outfit | Flower hat | Wizard hat |
| 3 | Silver necklace | Moon amulet | Leather boots | Cloud boots |
| 4 | Gold bracelet | Star bracelet | Lucky charm | Crystal charm |

Source: generated with the built-in image generator on 2026-10-14, using `public/assets/ui/shop-item-atlas.png` as a style and grid reference. The selected generated image was copied into the project without cropping or recoloring.

Prompt: “Use case: stylized-concept. Asset type: a new 4 by 4 fixed-grid game shop item atlas for Aria's clothing and jewelry boutique in a cozy fantasy 2D browser game. Use the attached existing shop-item atlas ONLY as a visual style and grid-proportion reference; create completely NEW illustrations in every cell. Exact grid: four equal columns and four equal rows, no gutters, with consistent ornate thin wooden card border and parchment/blue/green hand-painted backgrounds as the reference. Each cell shows ONE centered, unmistakable product, entirely within its cell with generous padding. Reading left-to-right, top-to-bottom: row 1 (1) forest adventurer outfit, green tunic with leather belts; (2) royal outfit, blue and gold robe; (3) mage outfit, purple wizard robe; (4) explorer outfit, tan practical coat. Row 2 (5) starlight mage outfit, dark indigo constellation robe; (6) ceremonial royal outfit, red and gold formal robe; (7) flower hat, straw hat decorated with a clearly visible flower; (8) wizard hat, navy pointed hat with stars. Row 3 (9) silver necklace, simple silver chain with silver pendant; (10) moon amulet, crescent moon pendant with blue gem; (11) leather boots, matched pair of brown leather boots; (12) cloud boots, matched pair of pale blue and white enchanted boots. Row 4 (13) gold bracelet, gold bangle; (14) star bracelet, gold bracelet with star motif; (15) lucky charm, green clover charm; (16) crystal charm, purple crystal pendant charm. IMPORTANT: every item distinct and accurately matches its description. No people, no text, no letters, no numbers, no logos, no watermarks, no extra items; precise regular grid so CSS background-size 400% 400% can crop every cell. Warm painterly storybook rendering matching the provided reference.”
