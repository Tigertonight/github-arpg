# crimson-hound — 赤血恶犬

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 5
- **family / rank**: demon / normal
- **当前已知坏点**: attack ratio=0.12 — 必须重出此行

## Subject

A large demon mastiff, glowing red eyes, black mane along neck and spine, blood-colored armor plates strapped along back, exposed fanged jaws, ~85 px at shoulder.

> **重点**：attack 4 帧体型严格一致，**不要某帧只剩头部或前爪**。

## Idle (cols 1–4)

1. Stand quadruped, head low, mane bristling.
2. Hackles rise.
3. Tail flicks.
4. Hackles settle.

## Walk (cols 5–8)

1. Front-right + back-left forward (trot).
2. Passing pose.
3. Front-left + back-right forward.
4. Passing pose mirror.

## Attack (cols 9–12)

> **关键**：四帧整体大小一致，每帧都包含完整的头/身/腿。

1. Crouch: **full body lowered**, hind legs coiled, jaws parting. **Entire silhouette visible.**
2. Lunge: **full body airborne**, forelegs reaching forward, jaws opening, mane flared. **Entire silhouette visible.**
3. Bite: **full body extended forward**, jaws clamped on imagined target, blood spray. **Entire silhouette visible.**
4. Recovery: **full body landing**, head pulling back, mane settling. **Entire silhouette visible.**

## Death (cols 13–16)

1. Stagger: head jerks, foreleg buckles.
2. Collapse: body falling sideways.
3. Lying still: head on ground.
4. Residue: pile of black fur with red armor plates.
