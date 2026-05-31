# frostforge-warden — 苍铸狱长

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 4
- **family / rank**: construct / boss

## Subject

A massive cold-cast iron jailer, pale-blue armor with engraved oath-runes on chestplate, both hands gripping a giant two-headed battleaxe, helm with vertical slit, ~125 px tall (boss-scale).

## Idle (cols 1–4)

1. Stand wide, axe head on ground.
2. Frost mist puffs from helm slit.
3. Body shifts weight.
4. Frost mist settles.

## Walk (cols 5–8)

1. Right foot forward heavy stomp, axe at hip.
2. Passing pose, body rises.
3. Left foot forward heavy stomp.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: axe raised diagonally over right shoulder.
2. Wind-up: axe arcing overhead, frost trail.
3. Impact: axe slammed down vertically forward, ice shards spraying.
4. Recovery: axe held low diagonally, body extended.

## Death (cols 13–16)

1. Stagger: helm jerks, axe tilts.
2. Knee buckle: kneeling, axe braced.
3. Collapse: armor falling sideways, axe clattering.
4. Residue: pile of pale-blue plate with helm and axe on top.
