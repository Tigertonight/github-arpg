# rust-hound — 锈刃猎犬

> v2 source spec：详见 `docs/sprite-source-spec-v2.md`，公共 prompt prefix 见 `_shared-rules.md`。
> 投递路径：`public/assets/game/generated-source/enemies/<slug>/{idle,walk,attack,death}.png`，每张 2048×512 = 4 帧 × 512×512，背景 #00ff00 纯绿。
> 旧 16 列 atlas 描述（如 cols 1–4 / cols 5–8 …）已废弃；按 v2 拆 4 张分动作 sheet 提交。

- **atlas**: group-01 row 1
- **family / rank**: beast / normal

## Subject

A rotting four-legged feral mastiff, mottled grey-brown fur with rusted iron spikes embedded along the spine, glowing crimson eyes, lower jaw exposed bone, slavering mouth, ~80 px tall at shoulder.

## Idle (cols 1–4)

1. Stand on all fours, head lowered, breathing.
2. Hackles rise slightly, head still.
3. Tail flicks once, body still.
4. Hackles settle, weight shifts to back legs.

## Walk (cols 5–8)

1. Front-right and back-left forward (trot contact).
2. Passing pose, all four legs gathered.
3. Front-left and back-right forward (trot contact mirror).
4. Passing pose mirror.

## Attack (cols 9–12)

1. Crouch: body lowered, hind legs coiled, jaws parting.
2. Lunge: forelegs leaving ground, jaws fully open, fangs visible.
3. Bite: jaws snapped forward, head extended past front paws.
4. Recovery: forelegs landing, head pulling back, blood drip at jaw.

## Death (cols 13–16)

1. Stagger: head jerks aside, one foreleg buckles.
2. Collapse: body falling sideways, legs splayed.
3. Lying still: head on ground, eyes dim.
4. Residue: small pile of fur and bone, one rusted spike sticking up.
