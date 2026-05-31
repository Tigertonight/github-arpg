# cardinal-husk — 骸塔红衣主教

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 7
- **family / rank**: undead / boss
- **当前已知坏点**: death ratio=0.24 — 必须重出此行

## Subject

A tall skeletal cardinal in flowing crimson robes, golden mitre worn askew, single bony hand holding a long bead-rosary, hollow eye sockets glowing, hulking robed silhouette, ~120 px tall (boss-scale).

> **重点**：death 4 帧不要让骷髅消失太快，至少前 3 帧要看得清主体。

## Idle (cols 1–4)

1. Stand still, robe straight, rosary hanging.
2. Robe billows softly.
3. Rosary swings.
4. Robe settles.

## Walk (cols 5–8)

1. Right foot forward, robe back, rosary swinging.
2. Passing pose, robe gathered, body rises.
3. Left foot forward, robe opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: rosary raised, free hand extending forward, body coiling.
2. Wind-up: rosary swung in arc, beads glowing.
3. Impact: rosary lashed forward, golden curse-light at impact.
4. Recovery: rosary trailing, body extended.

## Death (cols 13–16)

> **关键**：4 帧体积平稳递减。

1. Stagger: head jerks, mitre tilts, rosary drops. **Full silhouette visible.**
2. Knee buckle: kneeling, robe puddling, mitre falling. **Body ~80% mass.**
3. Collapse: skeleton sprawled, robe spread. **Body ~60% mass, robe still visible.**
4. Residue: heap of crimson robe with skull and mitre on top, rosary across. **~35% mass.**
