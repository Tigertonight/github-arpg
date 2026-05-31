# silenced-cantor — 缄默主咏

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 3
- **family / rank**: cultist / boss

## Subject

A towering bishop in pale gauze robes, throat sewn shut with prominent stitches, both hands gripping a tall cross-shaped prayer staff, mitre with veil, hulking but slender silhouette, ~120 px tall (boss-scale).

## Idle (cols 1–4)

1. Stand still, staff vertical, robe hanging.
2. Robe billows softly.
3. Head bows slightly.
4. Robe settles.

## Walk (cols 5–8)

1. Right foot forward, robe back, staff striking ground.
2. Passing pose, body rises.
3. Left foot forward, robe opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: staff raised vertically, body extending.
2. Wind-up: staff swept overhead, ghostly choir sigils above.
3. Impact: staff slammed forward, sound-wave ring at impact.
4. Recovery: staff held diagonally, body extended.

## Death (cols 13–16)

1. Stagger: mitre falls aside, staff drops.
2. Knee buckle: kneeling, staff propping.
3. Collapse: figure flat, staff across body.
4. Residue: pile of pale robe with mitre on top.
