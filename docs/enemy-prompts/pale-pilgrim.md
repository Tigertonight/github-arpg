# pale-pilgrim — 苍白朝圣者

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 1
- **family / rank**: undead / normal
- **当前已知坏点**: attack ratio=0.29 — 必须重出此行

## Subject

A blindfolded undead pilgrim wrapped in tattered grey-white linen, gaunt frame, single hand holding a copper pilgrim staff, ~110 px tall.

> **重点**：attack 4 帧主体覆盖率保持一致。

## Idle (cols 1–4)

1. Stand still, staff vertical, linen hanging.
2. Linen sways.
3. Body shifts weight.
4. Linen settles.

## Walk (cols 5–8)

1. Right foot forward, linen back, staff striking ground.
2. Passing pose.
3. Left foot forward, linen opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

> **关键**：四帧主体保持完整。

1. Anticipation: staff raised vertically, body extending. **Full body visible.**
2. Wind-up: staff raised overhead, both hands gripping. **Full body visible.**
3. Impact: staff thrust forward at chest height, copper glow at tip. **Full body visible.**
4. Recovery: staff held low diagonally, body extended. **Full body visible.**

## Death (cols 13–16)

1. Stagger: head jerks back, staff drops.
2. Knee buckle: kneeling, linen puddling.
3. Collapse: figure flat, staff across.
4. Residue: pile of linen wrap with copper staff visible.
