# furnace-brute — 熔炉重锤手

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-01 row 5
- **family / rank**: construct / normal

## Subject

A squat stocky stone-and-iron furnace construct, glowing orange-yellow furnace mouth in chest, riveted iron plating, single arm gripping a heavy cast hammer, ~95 px tall, wide silhouette.

## Idle (cols 1–4)

1. Stand wide, hammer head on ground, furnace dim.
2. Furnace flares orange.
3. Body shifts, hammer rocks slightly.
4. Furnace dims, body settles.

## Walk (cols 5–8)

1. Right foot forward stomp, furnace flickers, hammer at side.
2. Passing pose, body rises slightly.
3. Left foot forward stomp.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: hammer raised at side, furnace flaring bright.
2. Wind-up: hammer arcing over shoulder.
3. Impact: hammer slammed down forward, sparks at hammer head.
4. Recovery: hammer held low, body extended.

## Death (cols 13–16)

1. Stagger: body jerks, furnace flickering wildly.
2. Knee buckle: kneeling, furnace dimming.
3. Collapse: body falling sideways, hammer dropping.
4. Residue: pile of broken stone with cooled furnace mouth visible.
