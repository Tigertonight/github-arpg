# marrow-drake — 髓骨小龙

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 5
- **family / rank**: undead / elite

## Subject

A half-sized skeletal drake, semi-transparent rotted membrane wings stretched between bone struts, exposed spine, jaws open showing vertebrae through throat, quadrupedal stance, ~95 px at shoulder.

## Idle (cols 1–4)

1. Stand quadruped, wings folded, head low.
2. Wings flutter once.
3. Head lifts, jaws open showing spine-throat.
4. Head lowers, wings settle.

## Walk (cols 5–8)

1. Front-right + back-left forward (trot), wings half-spread.
2. Passing pose, all legs gathered.
3. Front-left + back-right forward.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Crouch: body lowered, wings flared back, jaws open.
2. Lunge: forelegs lifting, jaws gaping with bone-flame breath inhale.
3. Bite/breath: head extended, bone shards/breath spraying forward.
4. Recovery: head pulling back, forelegs landing.

## Death (cols 13–16)

1. Stagger: wing collapses, head drops.
2. Falling: body sliding sideways, wings crumpling.
3. Lying still: skeleton on side, jaws open.
4. Residue: pile of bones and torn membrane.
