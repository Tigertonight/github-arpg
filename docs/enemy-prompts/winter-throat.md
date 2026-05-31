# winter-throat — 寒喉巨兽

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 2
- **family / rank**: beast / boss

## Subject

A massive snowfield carnivore, pale fur, three rows of jagged teeth in gaping maw, frozen ice-blade mane along back, hulking quadruped, ~125 px at shoulder (boss-scale).

## Idle (cols 1–4)

1. Stand quadruped wide, head low, frost breath.
2. Mane shimmers.
3. Body shifts weight.
4. Frost breath settles.

## Walk (cols 5–8)

1. Front-right + back-left forward heavy stomp.
2. Passing pose, body rises.
3. Front-left + back-right forward heavy stomp.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Crouch: body lowered, hind legs coiled, jaws agape.
2. Lunge: forelegs lifting, all three rows of teeth visible.
3. Bite: head extended forward, jaws clamped, ice spray.
4. Recovery: head pulling back, frost mist.

## Death (cols 13–16)

1. Stagger: head jerks, foreleg buckles.
2. Knee buckle: front legs collapsed.
3. Collapse: body sideways, mane crumbling.
4. Residue: pile of fur and shattered ice-mane.
