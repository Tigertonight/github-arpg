# tomb-revenant — 墓血亡灵

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 1
- **family / rank**: undead / normal

## Subject

A half-rotten armored revenant, dented breastplate with visible bloody chest hole, exposed ribs, single rusted longsword in hand, slumped helm, ~110 px tall.

## Idle (cols 1–4)

1. Stand at rest, sword tip on ground.
2. Body sways slightly.
3. Slight slump.
4. Body returns.

## Walk (cols 5–8)

1. Right foot forward dragging, sword at side.
2. Passing pose.
3. Left foot forward dragging, sword opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: sword raised diagonally.
2. Wind-up: sword arcing back overhead.
3. Impact: sword slashed forward at waist height.
4. Recovery: sword trailing low.

## Death (cols 13–16)

1. Stagger: helm jerks, sword drops.
2. Knee buckle: kneeling.
3. Collapse: armor falling sideways.
4. Residue: pile of rusted plate and bone with sword across.
