# ember-imp — 烬翼小鬼

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-01 row 6
- **family / rank**: demon / normal
- **当前已知坏点**: walk ratio=0.17 — 必须重出此行

## Subject

A small bat-winged imp demon, golden curving horns, ash-grey body with dim red underbelly, leathery wings half-spread, only ~70 px tall (occupies upper half of cell — leave green floor below baseline 110 within the cell).

> **重点**：因为体型小，4 帧 walk 必须保持身体大小一致，不要某些帧画得更小或省略翅膀。

## Idle (cols 1–4)

1. Hover in place, wings half-spread, tail curled.
2. Wings flap once down.
3. Wings flap once up.
4. Hover, tail flicks.

## Walk (cols 5–8)

> **关键**：walk 是 hover-glide，全 4 帧体型一致，翅膀循环，**不要让任何帧只剩翅膀残影**。

1. Forward glide, wings down-stroke, body level. Full body visible.
2. Forward glide, wings up-stroke, body level. Full body visible.
3. Forward glide, wings mid-stroke, body slight tilt forward. Full body visible.
4. Forward glide, wings mid-stroke opposite, body slight tilt back. Full body visible.

## Attack (cols 9–12)

1. Anticipation: wings flared back, claws drawn in, body coiled.
2. Wind-up: claws extending forward, body lunging.
3. Impact: claws raked forward, body fully extended.
4. Recovery: claws retracting, wings beating to hover.

## Death (cols 13–16)

1. Stagger: wings spasm, tail jerks.
2. Falling: body tumbling, wings folding.
3. Crashed: body on ground, wings crumpled, embers escaping.
4. Residue: small pile of grey ash with golden horns on top.
