# bone-legion — 骸塔士兵

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 4
- **family / rank**: undead / normal

## Subject

A skeletal soldier in tarnished plate armor, mossy chest emblem, holding a long polearm halberd one-handed at side, helm with empty visor, ~110 px tall.

## Idle (cols 1–4)

1. Stand at rest, halberd vertical at side.
2. Body shifts, halberd taps ground.
3. Slight slump.
4. Body straightens.

## Walk (cols 5–8)

1. Right foot forward, halberd at side, body rotated.
2. Passing pose, body rises.
3. Left foot forward, halberd opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: halberd drawn back, body coiled, both hands now gripping.
2. Wind-up: halberd raised overhead.
3. Impact: halberd thrust forward at chest height.
4. Recovery: halberd held diagonally, body extended.

## Death (cols 13–16)

1. Stagger: helm jerks, halberd drops.
2. Knee buckle: kneeling, armor clattering.
3. Collapse: skeleton splayed, halberd across.
4. Residue: pile of bones and rusted plate with helm.
