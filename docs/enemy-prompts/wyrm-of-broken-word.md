# wyrm-of-broken-word — 断言之蠕

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 6
- **family / rank**: demon / boss
- **当前已知坏点**: death ratio=0.09 — 必须重出此行（最严重）

## Subject

A long segmented serpent demon, multiple body segments visible (3-4 segments fitting in cell), each segment has a small human face on its underside as feeding mouth, tail wrapped around a torn oath scroll, ~120 px long body coiled in cell (boss-scale).

> **重点**：death ratio 0.09 是所有坏点里最严重的，**4 帧体积必须平稳递减**，第 4 帧不能直接消失到几乎空白。

## Idle (cols 1–4)

1. Body coiled in S-shape, segments visible.
2. Body undulates slightly, segment faces blink.
3. Tail flicks scroll.
4. Body returns to coil.

## Walk (cols 5–8)

1. Body forward-undulating, tail trailing.
2. Mid-undulation, body straightening.
3. Body forward-undulating opposite phase.
4. Mid-undulation, body straightening mirror.

## Attack (cols 9–12)

1. Anticipation: front of body rearing back, head opening, segment faces opening.
2. Wind-up: body coiling, ready to strike.
3. Impact: front segment lunging forward, all faces biting outward.
4. Recovery: body retracting, faces closing.

## Death (cols 13–16)

> **关键**：四帧体积平稳递减，每帧主体都要清晰可见。

1. Stagger: body jerks, all segment faces gaping in agony. **Full multi-segment body visible.**
2. Spasm: body twisting, segments writhing. **Body ~80% original mass, all segments still visible.**
3. Collapse: body falling, segments going limp, scroll slipping. **Body ~60% original mass.**
4. Residue: coiled body remains on ground, faces closed, scroll torn beside. **~40% mass — NOT empty.**
