# oath-brander — 誓痕烙印者

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 4
- **family / rank**: demon / normal

## Subject

A bare-chested demon thug with body covered in glowing fire-rune brands, single hand holding a glowing branding iron, shoulder bearing freshly burned brand mark, broad bestial frame, ~115 px tall.

## Idle (cols 1–4)

1. Stand wide, brand iron at side, body still.
2. Brands on body pulse orange.
3. Body shifts weight, brand iron rocks.
4. Brands dim.

## Walk (cols 5–8)

1. Right foot forward, body rotated, brand iron at side.
2. Passing pose.
3. Left foot forward.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: brand iron drawn back glowing white-hot.
2. Wind-up: brand iron raised diagonally.
3. Impact: brand iron jabbed forward, sear-flame at tip.
4. Recovery: brand iron trailing, body extended.

## Death (cols 13–16)

1. Stagger: body jerks, brand iron drops.
2. Knee buckle: kneeling, brands fading.
3. Collapse: figure prone, body cooling.
4. Residue: pile of charred flesh with cooled brand iron.
