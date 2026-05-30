# Character and Scene Richness Plan

## Direction

The next content pass should make every zone feel like a distinct side-scrolling combat lane, while keeping the motion system stable. New art must enter through a registry first, then through rendering. No component should infer asset paths from ids once the registry has the information.

## Content Pillars

### Scene Richness

Each zone should own four visual layers:

- Background loop: wide seamless scene image for travel movement.
- Ground strip: the foot-contact layer that keeps actors anchored.
- Foreground props: optional dark silhouettes, chains, pillars, frost, bones, or ruins.
- Ambient VFX: embers, snow, mist, blood moon particles, or abyss ash.

The existing 10 zones map into 5 visual acts:

- Act 1: black forge mines, bleeding furnace.
- Act 2: silent choir, ossuary keep.
- Act 3: pale wastes, iron caravan.
- Act 4: crimson keep, moonblood crypt.
- Act 5: oath abyss, forgemaw core.

### Enemy Richness

Enemy art should be produced as per-enemy action sheets:

- `walk`: 4 frames, facing left.
- `idle`: 2-4 frames, same canvas and foot anchor.
- `attack`: 2-4 frames, same canvas and foot anchor.
- `hit`: 1 frame or CSS flash fallback.
- `death`: 2-4 frames before removal.

Priority enemies for the first full pass:

- Black forge: bone miner, rust hound, coal cultist, black forge guard, forgeheart ember.
- Cathedral/ossuary: pale chorister, glasswraith, bone legion, marrow drake, cardinal husk.
- Endgame: oath brander, chained titan, the first oathbreaker.

### Hero Richness

The Oathbreaker needs a complete, aligned action pack:

- `idle`, `walk`, `cleave`, `sweep`, `execute`, `shield`, `hit`, `death`, `burst`.
- Every action uses the same canvas size and the same foot anchor.
- Weapon reach may extend inside the canvas, but never beyond it.
- Skill actions are isolated sheets, not frames cut out of a mixed collage.

## Technical Implementation

Implemented foundation:

- `src/data/visuals.ts`: registry for hero, enemy, and zone visuals.
- `ZoneVisualDefinition`, `EnemyVisualDefinition`, `HeroVisualDefinition`: typed visual contracts.
- `StageView`: zone background and ground are now injected with CSS variables from the registry.
- `stageActors.ts`: hero and enemy art now resolve from the registry instead of path string inference.
- `npm run audit:visuals`: checks visual registry references, enemy sheet existence, PNG icon dimensions, alpha, and basic sheet divisibility.

## Asset Generation Contract

Use this spec for new AI-generated action sheets:

- Transparent PNG or flat green chroma-key source for local removal.
- One action per sheet.
- 4 horizontal frames unless the registry specifies otherwise.
- All frames have equal cell width.
- Character faces the correct direction: hero right, enemies left.
- Feet stay on the same baseline across every frame.
- No white background, cast-shadow floor, cropped weapon, duplicate ghost body, or mixed unrelated pose in a frame.

## Todo

- [x] Create visual registry and typed contracts.
- [x] Migrate current scene background and ground rendering to registry variables.
- [x] Migrate hero and enemy asset resolution to registry.
- [x] Add visual asset audit script.
- [ ] Add foreground props layer.
- [ ] Add ambient VFX variants per zone.
- [ ] Add idle/death action support in actor state.
- [ ] Generate first complete hero action pack.
- [ ] Generate first 12 priority enemy action packs.
- [ ] Add automated bbox stability checks for hero and enemy frames.
- [ ] Add Playwright 3-minute travel/combat/boss visual regression run.
