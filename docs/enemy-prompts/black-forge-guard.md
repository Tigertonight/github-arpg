# black-forge-guard — 黑炉守卫

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-01 row 3
- **family / rank**: construct / elite

## Subject

A heavily armored guard in full black-iron plate, helm with horizontal slit, white smoke wisping from pauldrons, gripping a massive two-handed greatsword point-down, ~120 px tall.

## Idle (cols 1–4)

1. Stand at rest, sword tip on ground, smoke trickling.
2. Smoke puffs upward from pauldrons.
3. Slight body shift, sword tip taps.
4. Smoke settles, body still.

## Walk (cols 5–8)

1. Right foot forward, sword carried at hip, body rotated.
2. Passing pose, sword vertical, body rises.
3. Left foot forward, sword carried opposite hip.
4. Passing pose mirror, sword vertical.

## Attack (cols 9–12)

1. Anticipation: sword raised over right shoulder, body coiled.
2. Wind-up: sword arcing overhead, smoke trailing.
3. Impact: sword slammed down vertically in front, sparks at blade.
4. Recovery: sword held low diagonally, body straightening.

## Death (cols 13–16)

1. Stagger: helm jerks, sword tilts.
2. Knee buckle: kneeling on one knee, sword braced.
3. Collapse: armor falling sideways, sword clattering.
4. Residue: pile of black plate fragments with helm on top.
