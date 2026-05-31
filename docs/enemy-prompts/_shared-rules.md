# 公共风格 / 约束（v2 通用 prompt prefix）

> 与 `docs/sprite-source-spec-v2.md` 配套使用。每次给 imagegen 提交时，把本文「公共 prefix」+「Negative prompt」+ 单怪 `<slug>.md` 的 Subject/4 段动作描述拼接成完整 prompt。

## 公共 prefix

```
Pixel art sprite for a dark fantasy 2.5D side-scrolling ARPG.

Output: FOUR separate PNG sheets, one per action:
  - idle.png    (4 frames, breathing / weight shift)
  - walk.png    (4 frames, contact-passing-contact-passing)
  - attack.png  (4 frames, anticipation-windup-impact-recovery)
  - death.png   (4 frames, stagger-buckle-collapse-residue)

Each sheet:
  - Single horizontal strip, 4 columns × 1 row.
  - Each frame strictly inside its own 512×512 cell.
  - Pure green background #00ff00 only (no shadow, no gradient, no other green tones).

Style:
  - Hard pixel edges, NO anti-aliasing, NO motion blur, NO soft glow.
  - Low saturation dark fantasy palette: iron rust, blood red, ember orange, dim gold.
  - Side view, creature facing RIGHT, full body visible.
    (Engineering note: the import pipeline horizontally flips every frame so the
     in-game sprite faces LEFT. Always draw facing RIGHT here — do NOT pre-flip.)
  - Strong silhouette, readable from distance.

Per-frame constraints (strict, see sprite-source-spec-v2.md):
  1. All 4 frames share the same scale, baseline, and character design.
  2. Subject occupies 60–80% of cell height (~308–410 px).
  3. Foot baseline aligned across 4 frames within ±20 px.
  4. Body horizontally centered ±40 px in cell.
  5. Top of cell ≥ 60 px empty (head must not touch top edge).
  6. Weapon / chain / wing / tail tip stays ≥ 24 px from any cell edge.
  7. Death frames are bottom-center aligned (south gravity), never bottom-left.
  8. No close-up frames; mass per frame stays roughly constant (death exception: monotonic shrink allowed).
```

## Negative prompt

```
text, letters, watermark, logo, UI, frame, border, gradient background,
soft shadow, ground plane, motion blur, glow, anti-aliasing, blurry,
cropped limbs, cropped weapon, partial silhouette, off-center body,
inconsistent baseline, shrinking figure mid-action, frame-to-frame size jitter,
duplicate creatures in one cell, multiple cells merged, close-up, portrait crop,
southwest aligned death frame, body touching cell edge
```

## 单怪 prompt 文件结构

每个 `<slug>.md` 在「Subject」之外，需提供 4 段动作描述：

- **idle**：4 帧呼吸/微动
- **walk**：4 帧步态（右脚前 → 过渡 → 左脚前 → 过渡）
- **attack**：4 帧出招（蓄力 → 抬手 → 命中 → 收招）
- **death**：4 帧倒地（踉跄 → 屈膝 → 倒地 → 残骸）

prompt 提交顺序：公共 prefix + Negative prompt + Subject + 当前要生成的那一动作的 4 帧描述（一次只生 1 张 sheet，避免模型把 4 个动作挤成 1 张图）。

## 注意：旧 16 列规范已废弃

v1 的 `2048×128 / 16 列 × 1 行 / 128×128 cell / 背景 #33d100` 的规范不再使用。如果接到任何引用旧 layout 的 prompt 文件或脚本，按本规范覆盖。
