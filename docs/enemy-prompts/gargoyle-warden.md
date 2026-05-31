# gargoyle-warden — 落瓦石翼

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 7
- **family / rank**: construct / elite

## Subject

A crouched stone gargoyle, grey granite skin, folded leathery stone wings, fanged spout-mouth dripping water, hunched bipedal stance with claws on ground for support, ~105 px tall.

## Idle (cols 1–4)

1. Crouch still, wings folded, water drip.
2. Wings flick.
3. Body shifts.
4. Water drip again.

## Walk (cols 5–8)

1. Right foot forward, wings half-spread for balance.
2. Passing pose.
3. Left foot forward.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: wings flaring back, claws raised, body coiled.
2. Wind-up: claws drawn back, jaws opening with water gathering.
3. Impact: claws slashing forward + water jet from mouth.
4. Recovery: claws retracting, wings folding.

## Death (cols 13–16)

1. Stagger: head jerks, wing collapses.
2. Crumble: cracks spreading across body.
3. Shatter: body breaking into chunks.
4. Residue: pile of stone fragments with one wing tip protruding.
