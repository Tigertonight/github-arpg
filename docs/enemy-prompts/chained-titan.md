# chained-titan — 锁誓提坦

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 5
- **family / rank**: construct / elite

## Subject

A grey stone titan statue, all four limbs wrapped in heavy iron chains, oath-runes carved into chest, chains trail outward (anchor points off-cell — keep chain ends inside cell border), ~120 px tall.

## Idle (cols 1–4)

1. Stand wide, chains slack.
2. Chains rattle once.
3. Body strains slightly.
4. Chains settle.

## Walk (cols 5–8)

1. Right foot forward heavy stomp, chains dragging.
2. Passing pose.
3. Left foot forward heavy stomp.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: arms drawn back, chains taut.
2. Wind-up: arms swinging overhead, chains whipping.
3. Impact: fist slammed forward, chains following, dust burst.
4. Recovery: arms returning, chains slack.

## Death (cols 13–16)

1. Stagger: head jerks, chains snapping taut.
2. Crumble: cracks across stone limbs.
3. Shatter: body breaking, chains coiling among rubble.
4. Residue: pile of stone fragments with chain coils.
