# vow-handmaiden — 誓约女仆

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-03 row 6
- **family / rank**: demon / normal

## Subject

A masked demon handmaiden in black-and-blood-red dress, lace veil over face, one hand holding a tall candelabra (lit), other hand holding a curved kris dagger, slim silhouette, ~115 px tall.

## Idle (cols 1–4)

1. Stand still, candelabra raised, dagger at hip.
2. Candle flames flicker.
3. Body curtsy slightly.
4. Body returns, flames settle.

## Walk (cols 5–8)

1. Right foot forward, dress hem back, candelabra steady.
2. Passing pose.
3. Left foot forward, dress hem opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: dagger drawn back, candelabra raised, body coiling.
2. Wind-up: dagger raised diagonally, candelabra extending forward.
3. Impact: dagger slashing forward, candle flame trail.
4. Recovery: dagger trailing, body extended.

## Death (cols 13–16)

1. Stagger: veil jerks, candelabra dropping.
2. Knee buckle: kneeling, dress puddling.
3. Collapse: figure on ground, veil askew.
4. Residue: pile of dress with broken candelabra and dagger.
