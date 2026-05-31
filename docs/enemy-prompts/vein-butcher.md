# vein-butcher — 血脉屠夫

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-01 row 4
- **family / rank**: demon / boss

## Subject

A headless muscular demon brute, ribcage and shoulder muscles exposed, chains of pulsing blood-vessels draped across chest, a massive spiked maul shouldered, hulking proportions, ~120 px tall (boss-scale, fills cell).

## Idle (cols 1–4)

1. Stand wide, maul shouldered, chest rising.
2. Blood-chains pulse, brighter red.
3. Body shifts weight, maul tilts.
4. Blood-chains dim, body settles.

## Walk (cols 5–8)

1. Right foot forward heavy contact, ground impact, maul shouldered.
2. Passing pose, body rises, blood-chains swinging.
3. Left foot forward heavy contact, ground impact mirror.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: maul drawn back over shoulder, body coiled, blood-chains flaring.
2. Wind-up: maul arcing overhead, free hand extended forward.
3. Impact: maul slammed down forward, blood spray at impact point.
4. Recovery: maul held diagonally low, body extended.

## Death (cols 13–16)

1. Stagger: torso jerks, maul tip drops.
2. Knee buckle: kneeling, maul propping body.
3. Collapse: body sprawled, maul flung aside.
4. Residue: pile of muscle and chain with maul across.
