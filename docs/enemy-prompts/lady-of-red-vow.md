# lady-of-red-vow — 赤誓夫人

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 0
- **family / rank**: demon / boss

## Subject

A tall noble demon lady in flowing crimson gown, gold ornate face mask, blood-colored cloak unfurled behind shoulders, slender silhouette, ~125 px tall (boss-scale).

## Idle (cols 1–4)

1. Stand poised, cloak settled.
2. Cloak billows slightly.
3. Body sways gracefully.
4. Cloak settles.

## Walk (cols 5–8)

1. Right foot forward, gown trailing, cloak flowing back.
2. Passing pose.
3. Left foot forward, gown opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: arms crossing across chest, cloak flaring.
2. Wind-up: arms extending forward, cloak whipping out.
3. Impact: blood-tendrils lashing forward from gown hem.
4. Recovery: arms returning, cloak settling.

## Death (cols 13–16)

1. Stagger: mask jerks, cloak collapsing.
2. Knee buckle: kneeling, gown puddling.
3. Collapse: figure prone, cloak spread.
4. Residue: pile of crimson fabric with golden mask on top.
