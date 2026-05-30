# Complete Visual Asset Pack Requirements

## Scope

This document defines the complete art package for character richness, enemy richness, and scene richness. It also defines the first implementation batch used by the game immediately:

- Hero: one complete Oathbreaker action pack.
- Enemies: family-level fallback action packs for humanoid, beast, and brute classes so every enemy has idle/walk/attack/death visuals.
- Scenes: foreground/ambient strips for every current zone family.

Enemy-specific custom action packs remain the final target. The fallback packs are required first because they make the renderer complete and stable before generating 34 bespoke enemy packs.

## Global Sheet Rules

- All action sheets must use a flat #00ff00 chroma-key background for local alpha removal.
- Do not use #00ff00 inside the subject.
- One sheet row equals one action.
- Each frame cell must contain exactly one pose.
- Every frame cell must include generous empty padding on all sides.
- Leave at least 18-25% horizontal empty space around the character or effect inside each cell.
- Leave at least 12-18% top empty space and keep the foot baseline identical across every frame in a row.
- No white background, gray paper background, gradients, floor plane, cast shadow, watermark, labels, frame numbers, or text.
- No overlapping neighboring poses, ghost silhouettes, duplicate bodies, or motion trails crossing into adjacent frame cells.
- Same canvas size and same anchor for every frame in the same action.
- Hero faces right. Enemies face left.

## Hero Pack

Target directory:

`public/assets/game/heroes/oathbreaker/`

Required files:

- `idle-sheet.png`: 4 frames, 4 columns x 1 row.
- `walk-sheet.png`: 4 frames, 4 columns x 1 row.
- `cleave-sheet.png`: 4 frames, 4 columns x 1 row.
- `sweep-sheet.png`: 4 frames, 4 columns x 1 row.
- `execute-sheet.png`: 4 frames, 4 columns x 1 row.
- `shield-sheet.png`: 4 frames, 4 columns x 1 row.
- `hit-sheet.png`: 4 frames, 4 columns x 1 row.
- `death-sheet.png`: 4 frames, 4 columns x 1 row.

Hero style:

- Dark oathbreaker knight in blackened plate armor.
- Massive blood-rusted axe/halberd.
- Ember highlights, cloth strips, chains, gothic silhouette.
- Same character size across all actions.
- Feet locked to the same bottom baseline.
- Weapon must never be cropped.

## Enemy Fallback Packs

Target directory:

`public/assets/game/enemies/fallback/`

Required files:

- `humanoid-idle-sheet.png`
- `humanoid-walk-sheet.png`
- `humanoid-attack-sheet.png`
- `humanoid-death-sheet.png`
- `beast-idle-sheet.png`
- `beast-walk-sheet.png`
- `beast-attack-sheet.png`
- `beast-death-sheet.png`
- `brute-idle-sheet.png`
- `brute-walk-sheet.png`
- `brute-attack-sheet.png`
- `brute-death-sheet.png`

Each file:

- 4 frames, 4 columns x 1 row.
- Same foot baseline within the action.
- Facing left.
- Enough empty spacing so the renderer can crop cleanly.

Family mapping:

- Humanoid: undead, cultist, light armor enemies.
- Beast: hounds, drakes, serpents, low crawling enemies.
- Brute: constructs, demons, primordial heavy enemies.

## Enemy Specific Final Target

Every enemy should eventually receive:

- `idle-sheet.png`
- `walk-sheet.png`
- `attack-sheet.png`
- `hit-sheet.png`
- `death-sheet.png`

Priority enemies for bespoke replacement:

- `bone_miner`
- `rust_hound`
- `coal_cultist`
- `black_forge_guard`
- `furnace_brute`
- `slag_warden`
- `forge_serpent`
- `pale_chorister`
- `glasswraith`
- `bone_legion`
- `chained_titan`
- `the_first_oathbreaker`

## Scene Pack

Target directory:

`public/assets/game/zones/foregrounds/`

Required foreground strips:

- `forge-fg.png`
- `furnace-fg.png`
- `choir-fg.png`
- `ossuary-fg.png`
- `wastes-fg.png`
- `caravan-fg.png`
- `crimson-fg.png`
- `crypt-fg.png`
- `abyss-fg.png`
- `core-fg.png`

Each strip:

- Transparent PNG.
- Wide horizontal strip.
- Low foreground silhouettes only, not a full background.
- Must not cover the hero or enemy body above the knees.
- Designed for bottom 30-45% of the stage.

Scene motifs:

- Forge: black rails, chains, furnace sparks, iron silhouettes.
- Furnace: molten gutters, vents, red iron smoke.
- Choir: broken cathedral windows, cold mist, blue candles.
- Ossuary: bones, skull piles, banners, stone teeth.
- Wastes: snow drifts, ice shards, cold wind streaks.
- Caravan: frozen wagon silhouettes, iron wheels, broken spears.
- Crimson: blood moon stones, gargoyle bases, red banners.
- Crypt: sarcophagi, mirror pools, red moon reflections.
- Abyss: black chains, purple cracks, falling ash.
- Core: molten furnace jaw, hammer shapes, rising embers.

## First Implementation Batch

The current implementation batch must:

- Generate hero full action atlas, split it into the 8 hero sheets.
- Generate humanoid, beast, and brute fallback atlases, split each into 4 action sheets.
- Generate scene foreground atlas, split it into 10 foreground strips.
- Update `src/data/visuals.ts` so all missing enemy actions fall back to family packs.
- Update StageView/CSS to render foreground strips.
- Keep existing enemy-specific walk/attack sheets where available.
- Use fallback actions only where a specific enemy action is missing.

## Acceptance Criteria

- `npm run audit:visuals` passes.
- `npm test` passes.
- `npm run build` passes.
- Playwright 3-minute soak covers travel and combat without missing background or empty enemy image src.
- No action frame has obvious neighboring pose leakage.
- Hero visible scale does not jump between actions.
- Enemies do not switch identity when changing state.
