# bone-miner — 碎骨矿奴

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-01 row 0
- **family / rank**: undead / normal

## Subject

A skeletal undead miner, rusted iron helmet with crooked headlamp, ribcage exposed, holding a corroded pickaxe in one bony hand, a chained miner's lantern dangling from hip belt, hunched posture, ~110 px tall.

## Idle (cols 1–4)

1. Stand neutral, weight on right foot, lantern still.
2. Slight slump forward, lantern swings 5 px right.
3. Return to neutral, ribcage rises (breath sim).
4. Slight lean back, lantern swings 5 px left.

## Walk (cols 5–8)

1. Right foot forward contact, pickaxe shouldered, lantern swings back.
2. Passing pose, both feet near center, body rises slightly.
3. Left foot forward contact, pickaxe tilts opposite, lantern swings forward.
4. Passing pose mirror, body rises slightly.

## Attack (cols 9–12)

1. Anticipation: pickaxe raised overhead, both hands gripping, body coiled back.
2. Wind-up: pickaxe arcs over the shoulder, body rotating forward.
3. Impact: pickaxe slams downward at chest height, sparks at tip, body extended.
4. Recovery: pickaxe held low, body straightening, head tilted down.

## Death (cols 13–16)

1. Stagger: head jerks back, pickaxe slipping from grip.
2. Knee buckle: kneeling, pickaxe falling, lantern unhooked.
3. Collapse: skeleton splayed on ground, helmet tilted off skull.
4. Residue: small pile of bones with helmet on top, lantern beside.
