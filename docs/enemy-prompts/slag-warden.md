# slag-warden — 矿渣狱卒

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`。
> 投递路径：`public/assets/game/generated-source/enemies/slag-warden/{idle,walk,attack,death}.png`
> 每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。

- **family / rank**: construct / elite
- **zone**: 1（黑炉矿道）

## Subject

A tall gaunt jailer construct made of cooled slag and iron, featureless iron mask with single eye-slit, single arm gripping a length of heavy iron shackle-chain ending in manacle, lanky proportions. Subject occupies ~70% of cell height (~360 px in a 512 cell), foot at the bottom baseline (~488 y), head near top with ~64 px clearance.

## Common rules (apply to ALL 4 sheets)

- Total sheet size: **2048×512**, pure green background **#00ff00**, no shadow on background.
- 4 frames horizontally arranged left → right, each frame strictly within its 512×512 cell.
- Subject body (excluding chain swing) horizontally centered ±40 px.
- Foot baseline of all 4 frames aligned within ±20 px (chain trails do not count).
- Top 12% (≥ 60 px) of each cell must remain empty green — no head/chain contact with top edge.
- Chain may overflow beyond body bbox horizontally, but the chain tip must stay ≥ 24 px away from cell left/right edges.

## idle.png (2048×512)

1. Stand straight, chain hanging vertical, slight slack at end.
2. Chain sways slightly leftward, body unchanged.
3. Body shifts weight to right leg, chain settles back to vertical.
4. Chain settles, faint exhale of steam from mask slit.

Frame-to-frame motion ≤ 8 px. No locomotion.

## walk.png (2048×512)

1. Right foot forward, chain swinging back, body rotated slight right.
2. Passing pose, chain vertical, body at peak height (head ≤ 16 px above frame 1).
3. Left foot forward, chain swinging forward.
4. Passing pose mirror, chain vertical.

Foot baseline maintained — when leg lifts, baseline tracks the planted foot.

## attack.png (2048×512)

1. Anticipation: chain drawn back over right shoulder, body coiled, mask tilted down.
2. Wind-up: chain whipping over head in arc (chain tip near top-right of cell, ≥ 24 px from edges).
3. Impact: chain swept forward at chest height, manacle leading, body fully extended.
4. Recovery: chain trailing low across body, body returning to neutral.

Weapon (chain) is the most extreme overflow risk — keep tip ≥ 24 px from any edge.

## death.png (2048×512)

1. Stagger: mask jerks back, chain drops loose.
2. Knee buckle: kneeling, chain coiled at feet.
3. Collapse: body falling sideways (still within cell), chain across torso.
4. Residue: pile of slag fragments with mask resting on top, chain in heap. Visible alpha pixels still present (not pure green).

Death frames may have lower baseline (lying down) — that's expected and the build script handles it via per-frame bbox.

## Migration note

This file replaces the previous v1 8×2 atlas spec. Source atlas at
`public/assets/game/generated-source/enemy-single-atlases/slag-warden-atlas-chroma.png`
is deprecated and will not be re-imported.
