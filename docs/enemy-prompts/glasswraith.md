# glasswraith — 残窗游魂

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 2
- **family / rank**: undead / elite
- **当前已知坏点**: idle ratio=0.29 — 必须重出此行

## Subject

A semi-transparent cyan-blue ghost figure, body composed of fragmented stained-glass shards floating in humanoid silhouette, partial face visible, no legs (lower body trails into shards), ~115 px tall.

> **重点**：idle 4 帧每帧都要保持完整的人形碎片轮廓，**不要让某帧只剩零散碎片**。

## Idle (cols 1–4)

1. Float in place, shards arranged in clear humanoid form.
2. Shards rotate slightly, humanoid form intact.
3. Shards drift outward 5 px, humanoid form still readable.
4. Shards return inward, humanoid form intact.

## Walk (cols 5–8)

1. Hover-glide forward, lower shards trailing back, humanoid form leading.
2. Glide pose, shards shifted forward, form intact.
3. Glide forward, lower shards trailing opposite, humanoid form leading.
4. Glide pose mirror.

## Attack (cols 9–12)

1. Anticipation: shards drawing inward, condensing, humanoid form sharper.
2. Wind-up: arms extending forward as glass blade.
3. Impact: glass blade thrust forward, shards spraying.
4. Recovery: shards reassembling, blade retracting.

## Death (cols 13–16)

1. Stagger: humanoid form shudders, shards flickering.
2. Disintegration: shards flying apart, form breaking.
3. Scatter: shards strewn outward, form gone.
4. Residue: small pile of dim glass fragments.
