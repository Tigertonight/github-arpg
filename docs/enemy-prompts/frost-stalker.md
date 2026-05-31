# frost-stalker — 霜踪兽

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 0
- **family / rank**: beast / normal
- **当前已知坏点**: attack ratio=0.26 — 必须重出此行

## Subject

A four-legged frost panther, pale blue-grey fur, jagged ice spikes along spine, breath condensing into frost mist, glowing icy eyes, ~85 px at shoulder.

> **重点**：attack 4 帧体型保持一致，**不要某帧只剩前爪或头部**。

## Idle (cols 1–4)

1. Stand quadruped, head low, frost breath puffing.
2. Hackles rise, head still.
3. Tail flicks.
4. Hackles settle.

## Walk (cols 5–8)

1. Front-right + back-left forward (trot), frost trail.
2. Passing pose.
3. Front-left + back-right forward.
4. Passing pose mirror.

## Attack (cols 9–12)

> **关键**：四帧体型一致。

1. Crouch: full body lowered, hind legs coiled, jaws parting. **Full silhouette.**
2. Lunge: full body airborne, forelegs reaching, jaws opening. **Full silhouette.**
3. Slash/bite: full body extended forward, claws and jaws striking, frost spray. **Full silhouette.**
4. Recovery: full body landing, head pulling back. **Full silhouette.**

## Death (cols 13–16)

1. Stagger: head jerks aside, foreleg buckles.
2. Collapse: body falling, legs splayed.
3. Lying still: head on ground.
4. Residue: pile of frost mist and fur with ice spikes.
