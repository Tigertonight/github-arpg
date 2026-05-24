# Art Direction: Black Forge Mines Asset Batch

## Style Target

- Dark fantasy 2.5D side-scrolling ARPG.
- Realistic illustrated game assets, low saturation, iron rust, blood red cloth, ember orange and dark gold accents.
- Combat readability comes first: strong silhouettes, clear facing direction, full-body sprites, generous transparent padding.
- No text, logos, UI frames, watermarks, cast shadows, or environment fragments in transparent sprites.

## Generated Assets

Assets are saved in `public/assets/game/`.

- `black-forge-stage-bg.webp`: wide Black Forge Mines combat background.
- `oathbreaker-hero.png`: Oathbreaker Knight hero sprite.
- `enemy-bone-miner.png`: Bone Miner enemy sprite.
- `enemy-rust-hound.png`: Rust Hound enemy sprite.
- `enemy-coal-cultist.png`: Coal Cultist enemy sprite.
- `enemy-black-forge-guard.png`: Black Forge Guard elite sprite.
- `enemy-vein-butcher.png`: Vein Butcher boss sprite.
- `loot-drop-beam.png`: rare/legendary loot beam VFX sprite.
- `blood-slash-effect.png`: bleed slash VFX sprite.
- `oathbreaker-walk-sheet.png`: four-frame Oathbreaker Knight walking sheet.
- `enemy-humanoid-walk-sheet.png`: four-frame humanoid enemy walking sheet.
- `enemy-beast-walk-sheet.png`: four-frame Rust Hound style walking sheet.
- `enemy-brute-walk-sheet.png`: four-frame heavy elite/Boss walking sheet.

## Shared Transparent Sprite Prompt Pattern

```text
Use case: stylized-concept
Asset type: transparent PNG game sprite source, chroma-key background
Primary request: Create a full-body dark fantasy 2.5D side-scrolling ARPG [subject].
Subject: [specific character, monster, or effect], facing [left/right], side 3/4 view with slight top-down perspective.
Style: realistic Diablo-like dark fantasy game sprite, crisp silhouette, high detail, low saturation, iron rust, blood red and ember accents.
Background: perfectly flat solid #00ff00 chroma-key background for background removal. Uniform color only, no shadows, gradients, texture, reflections, floor plane, or lighting variation. Do not use #00ff00 in the subject. Full body visible with generous padding.
Output constraints: no text, no watermark, no UI frame, no cast shadow, no contact shadow.
```

## Shared Walk Sheet Prompt Pattern

```text
Use case: stylized-concept
Asset type: transparent PNG 4-frame walking sprite sheet source, chroma-key background
Primary request: Create a 4-frame horizontal walking animation sprite sheet for [subject].
Subject: [character/monster description], walking forward to the [left/right]. Four distinct walk-cycle frames in a single row: contact, down, passing, up. Full body visible in every frame, consistent scale, side 3/4 view with slight top-down perspective.
Style: realistic Diablo-like dark fantasy game sprite sheet, crisp silhouettes, high detail, low saturation, iron rust, blood red and ember accents.
Layout: exactly 4 evenly spaced frames, one horizontal row, no grid lines, no labels, no numbers, no frame boxes.
Background: perfectly flat solid #00ff00 chroma-key background for background removal. Uniform color only, no shadows, gradients, texture, reflections, floor plane, or lighting variation. Do not use #00ff00 in the subject. Generous padding around each frame.
Output constraints: no text, no watermark, no UI frame, no cast shadow, no contact shadow.
```

## Background Prompt

```text
Create a dark fantasy 2.5D side-scrolling dungeon stage background called Black Forge Mines. Abandoned mine tunnel with rusted rail tracks crossing the lower foreground, black basalt walls, broken timber supports, distant forge furnace glow, chains, coal dust, faint red embers, gothic Diablo-like mood, low saturation, iron rust, blood red and dark gold accents. Wide horizontal game background, readable combat lane across the bottom half, darker empty mid-lane where characters can stand, strong depth with foreground ground plane and distant rock wall. No UI, no characters, no monsters, no text, no watermark.
```

## Processing Notes

- Built-in `image_gen` was used for all assets.
- Transparent sprites were generated on chroma-key backgrounds and processed with:

```bash
python /Users/Tigertonight/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py \
  --input <source.png> \
  --out <asset.png> \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill \
  --force
```

- VFX sprites used a slightly lower opaque threshold and `--edge-contract 1` to reduce green fringes.
