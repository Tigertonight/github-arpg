# lord-of-kept-oaths — 守誓领主

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 3
- **family / rank**: demon / boss

## Subject

A stately demon lord in long gown with silver chains draped across shoulders, golden face mask, both hands gripping a long oath-whip (braided silver and chain), ~125 px tall (boss-scale).

## Idle (cols 1–4)

1. Stand still, whip coiled at side.
2. Chains rattle softly.
3. Body shifts weight.
4. Chains settle.

## Walk (cols 5–8)

1. Right foot forward, gown back, whip trailing.
2. Passing pose.
3. Left foot forward, gown opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: whip drawn back overhead, chains glowing.
2. Wind-up: whip curling, body coiling.
3. Impact: whip cracking forward, golden oath-light at tip.
4. Recovery: whip trailing low, body extended.

## Death (cols 13–16)

1. Stagger: mask jerks, whip dropping.
2. Knee buckle: kneeling, chains clattering.
3. Collapse: figure on ground, mask askew.
4. Residue: heap of robe with golden mask, chains, and whip.
