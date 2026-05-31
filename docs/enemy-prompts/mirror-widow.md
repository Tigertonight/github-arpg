# mirror-widow — 镜池寡妇

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-04 row 2
- **family / rank**: demon / elite

## Subject

A reflective glass-bodied female figure, face is a cracked mirror, long mirrored gown with shattered shards trailing the hem, slender, ~115 px tall.

## Idle (cols 1–4)

1. Stand still, gown shards still.
2. Gown shimmers, reflecting light.
3. Body sways slightly, shards drift.
4. Gown settles.

## Walk (cols 5–8)

1. Right foot forward (glass clinking), gown trailing.
2. Passing pose, shards rotating.
3. Left foot forward.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: arms crossing, mirror face cracking further.
2. Wind-up: arms extending, shards orbiting forward.
3. Impact: shard volley shot forward from gown hem.
4. Recovery: arms returning, mirror face reassembling.

## Death (cols 13–16)

1. Stagger: mirror face cracks fully.
2. Disintegration: gown shards flying outward.
3. Shatter: body breaking into shards.
4. Residue: pile of dim mirrored shards.
