# coal-cultist — 煤烬教徒

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-01 row 2
- **family / rank**: cultist / normal

## Subject

A hooded human cultist in soot-black robes, face veiled with embers glowing in the eye-slits, single hand raised holding a corroded firewood saw, robe hem trailing ash, ~110 px tall.

## Idle (cols 1–4)

1. Stand still, robe hangs straight, ember eyes dim.
2. Robe sways slightly, ember eyes brighten.
3. Slight head tilt, saw shifts.
4. Robe settles, ember eyes dim again.

## Walk (cols 5–8)

1. Right foot forward, robe billows back, saw at side.
2. Passing pose, robe gathered, body rises.
3. Left foot forward, robe billows opposite, saw at side.
4. Passing pose mirror, robe gathered, body rises.

## Attack (cols 9–12)

1. Anticipation: saw drawn back, body coiling, hood tilted forward.
2. Wind-up: saw raised diagonally, free hand extended.
3. Impact: saw swept forward at waist height, ember eyes flaring.
4. Recovery: saw held low across body, hood righting.

## Death (cols 13–16)

1. Stagger: hood jerks back, saw drops half.
2. Knee buckle: kneeling, robe puddling, saw on ground.
3. Collapse: figure flattening, hood empty.
4. Residue: pile of black robe and ash with saw across it.
