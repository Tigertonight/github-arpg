# gravewright — 掘墓巨工

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 6
- **family / rank**: construct / normal
- **当前已知坏点**: death ratio=0.12 — 必须重出此行

## Subject

A stocky stone giant gravedigger, granite skin, single arm carrying a shovel over shoulder, large wicker basket strapped to back filled with bones, ~100 px tall, wide silhouette.

> **重点**：death 4 帧体积差距太大（ratio 0.12），需要让前两帧仍然保留主体可见，**不要立刻消解成小石堆**。

## Idle (cols 1–4)

1. Stand wide, shovel shouldered, basket steady.
2. Bones rattle in basket.
3. Body shifts weight, shovel rocks.
4. Body settles.

## Walk (cols 5–8)

1. Right foot forward stomp, shovel shouldered, basket bouncing.
2. Passing pose, body rises slightly.
3. Left foot forward stomp.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: shovel taken off shoulder, both hands gripping, body coiled.
2. Wind-up: shovel raised overhead.
3. Impact: shovel slammed down forward, dirt/bone spray.
4. Recovery: shovel held low, body extended.

## Death (cols 13–16)

> **关键**：4 帧体积要平稳递减，不要骤减。

1. Stagger: large body, head jerks, shovel drops. **Full silhouette visible.**
2. Knee buckle: kneeling, basket tipping, bones spilling. **Body still ~80% original mass.**
3. Collapse: body falling sideways, basket emptied. **Body ~60% original mass, still recognizable.**
4. Residue: pile of stone fragments, shovel on top, scattered bones. **~30% mass.**
