# forge-serpent — 炉脉巨蛇

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 7
- **family / rank**: primordial / elite

## Subject

A massive python-like serpent, dark scales with glowing molten orange cracks running between scales, golden vertical-slit eyes, long coiled body fitting cell (3-4 visible coils), ~120 px length when coiled.

## Idle (cols 1–4)

1. Body coiled, head raised, tongue flicks.
2. Body undulates, molten cracks brighter.
3. Head sways.
4. Body returns to coil.

## Walk (cols 5–8)

1. Body slithering forward S-curve.
2. Mid-slither.
3. Body slithering forward opposite phase.
4. Mid-slither mirror.

## Attack (cols 9–12)

1. Anticipation: head reared back, jaws parting, molten glow inside throat.
2. Wind-up: body coiling for strike.
3. Impact: head lunging forward, jaws gaping with fire breath spraying.
4. Recovery: head pulling back, smoke trailing.

## Death (cols 13–16)

1. Stagger: head jerks, molten cracks dimming.
2. Spasm: body coiling tightly.
3. Collapse: body unwinding limp.
4. Residue: dark coiled body with molten cracks gone cold.
