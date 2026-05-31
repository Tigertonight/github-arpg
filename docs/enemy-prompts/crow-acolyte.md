# crow-acolyte — 鸦使祭僧

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 1
- **family / rank**: cultist / normal

## Subject

A robed acolyte wearing a long-beaked crow mask, black feathered cassock, one hand holding a bone staff, other hand cupped with a small crow perched on it, ~110 px tall.

## Idle (cols 1–4)

1. Stand still, crow on hand, staff vertical.
2. Crow flutters wings.
3. Body shifts weight, staff taps.
4. Crow settles, body still.

## Walk (cols 5–8)

1. Right foot forward, cassock back, staff striking ground.
2. Passing pose, body rises, crow flapping for balance.
3. Left foot forward, cassock opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: staff raised, crow taking off, body coiled.
2. Wind-up: staff arcing forward, crow diving toward target.
3. Impact: staff jabbed forward, crow striking with beak.
4. Recovery: staff pulled back, crow returning to hand.

## Death (cols 13–16)

1. Stagger: mask jerks aside, crow flying off.
2. Knee buckle: kneeling, staff propping body.
3. Collapse: figure on ground, mask askew.
4. Residue: pile of feathers and broken staff with mask.
