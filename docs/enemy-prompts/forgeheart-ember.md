# forgeheart-ember — 炉心烬王

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-05 row 2
- **family / rank**: construct / boss
- **当前已知坏点**: attack ratio=0.24 — 必须重出此行

## Subject

A massive stone-furnace boss construct, large rectangular furnace mouth in chest blazing with white-yellow ember fire, both arms gripping twin lava-chain morningstars (chains red-hot), towering ~125 px tall (boss-scale, fills cell).

> **重点**：attack 4 帧主体保持完整，**不要某帧只剩链锤或火焰**，构造体本体必须每帧可见。

## Idle (cols 1–4)

1. Stand wide, morningstars at side, furnace pulsing.
2. Furnace flares.
3. Body shifts weight.
4. Furnace dims.

## Walk (cols 5–8)

1. Right foot forward heavy stomp, morningstars swinging.
2. Passing pose, furnace flickering.
3. Left foot forward heavy stomp.
4. Passing pose mirror.

## Attack (cols 9–12)

> **关键**：四帧整体大小一致，每帧都包含构造体本体 + 链锤。

1. Anticipation: **full body** + both morningstars drawn back overhead, furnace flaring bright. **Full silhouette.**
2. Wind-up: **full body** + morningstars arcing forward, lava chains trailing. **Full silhouette.**
3. Impact: **full body extended** + both morningstars slammed forward, lava splash at impact. **Full silhouette.**
4. Recovery: **full body** + morningstars trailing low, body straightening. **Full silhouette.**

## Death (cols 13–16)

1. Stagger: body jerks, furnace flickering wildly, morningstars dropping.
2. Knee buckle: kneeling, furnace dimming, chains coiling.
3. Collapse: body falling sideways, furnace dark, chains across.
4. Residue: pile of broken stone with cooled furnace mouth and tangled chains.
