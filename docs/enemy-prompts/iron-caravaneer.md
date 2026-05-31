# iron-caravaneer — 沉铁车夫

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 3
- **family / rank**: construct / elite

## Subject

An iron-masked driver in heavy weatherbeaten cloak, single hand holding the reins (curving back into cell, no horse visible — just trailing reins), other hand holding a long whip, ~115 px tall.

## Idle (cols 1–4)

1. Stand still, whip at side, reins held loose.
2. Cloak sways.
3. Body shifts weight.
4. Cloak settles.

## Walk (cols 5–8)

1. Right foot forward, cloak back, whip at side.
2. Passing pose.
3. Left foot forward, cloak opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: whip drawn back, body coiling.
2. Wind-up: whip raised overhead, curling.
3. Impact: whip cracking forward, lightning crack at tip.
4. Recovery: whip trailing low, body extended.

## Death (cols 13–16)

1. Stagger: mask jerks, whip drops.
2. Knee buckle: kneeling, cloak puddling.
3. Collapse: figure on ground, mask askew.
4. Residue: pile of cloak with iron mask and broken whip.
