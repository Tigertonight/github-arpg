# pale-chorister — 缄默唱诗者

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-02 row 0
- **family / rank**: cultist / normal

## Subject

A pale-skinned chorister in long off-white robe, mouth sewn shut with black thread, face veiled by translucent gauze, both hands clutching a torn hymnal pressed to chest, ~110 px tall.

## Idle (cols 1–4)

1. Stand still, hymnal at chest, robe straight.
2. Robe sways slightly, gauze flutters.
3. Head tilts down toward hymnal.
4. Robe settles, head rises.

## Walk (cols 5–8)

1. Right foot forward, robe billowing back, hymnal at chest.
2. Passing pose, robe gathered.
3. Left foot forward, robe billowing opposite.
4. Passing pose mirror.

## Attack (cols 9–12)

1. Anticipation: hymnal raised overhead, body coiled.
2. Wind-up: hymnal opens, pages fluttering, body rising.
3. Impact: hymnal swept forward, ghostly notes streaming out.
4. Recovery: hymnal pulled back to chest, body extended.

## Death (cols 13–16)

1. Stagger: head jerks back, hymnal slipping.
2. Knee buckle: kneeling, robe puddling, hymnal dropping.
3. Collapse: figure flat, hymnal beside.
4. Residue: pile of pale robe and torn pages.
