# 可玩角色美术资产需求 v1

本文件用于后续 img gen 出图与切图接入。核心目标不是“单张好看”，而是保证横版游戏中的体积感稳定、动作连续、可精准切片。

## 通用出图规格

- 画风：黑暗哥特 ARPG，半写实 2D side-scroller sprite，暗金属、血锈、骨质、烬火和冷光。
- 朝向：全部面向右侧，适配英雄从左向右推进。
- 背景：源图使用纯色 chroma key `#00ff00`，角色和特效不要使用接近该颜色。
- 单帧：建议 256x256 px；角色主体脚底对齐到底部安全线，头顶和武器保留足够空间。
- sheet：每个动作独立横向 4 帧 sheet，最终尺寸 1024x256 px。
- 留白：每帧左右至少 36px 透明安全边距；大武器攻击允许更宽，但人物主体位置不许缩放。
- 锚点：所有帧脚底中心保持在同一世界坐标；不得因为攻击、死亡、移动改变底部位置。
- 阴影：不要烘焙地面阴影，阴影由 CSS/游戏层统一处理。
- 禁止：白底、渐变底、透明矩形残留、同一 sheet 内出现其他角色、帧之间互相遮挡、武器被裁断、动作换装。

## 文件命名

```text
public/assets/game/heroes/<class-id>/idle-sheet.png
public/assets/game/heroes/<class-id>/walk-sheet.png
public/assets/game/heroes/<class-id>/attack-sheet.png
public/assets/game/heroes/<class-id>/hit-sheet.png
public/assets/game/heroes/<class-id>/death-sheet.png
public/assets/game/heroes/<class-id>/portrait.png
public/assets/game/heroes/<class-id>/skill-<skill-id>.png
```

源图保留在：

```text
public/assets/game/generated-source/heroes/<class-id>/
```

## 动作定义

| 动作 | 帧数 | 时长建议 | 画面要求 |
| --- | ---: | ---: | --- |
| idle | 4 | 1000ms | 呼吸、披风或手部微动，脚底不动 |
| walk | 4 | 720ms | 明确步态循环，身体高度波动小于 6px |
| attack | 4 | 760-920ms | 蓄力、挥出、命中、回收完整；角色主体大小不变 |
| hit | 4 | 320ms | 轻微后仰或护具震动，不改变站位 |
| death | 4 | 900ms | 倒地或跪倒，最后一帧稳定，不穿出帧边界 |

## 角色资产清单

### 破誓骑士 oathbreaker

现有角色，作为尺度基线。后续若重制，必须以当前游戏内站立高度为准，不再放大。

技能特效：

- `skill-cleave.png`：红黑斧刃弧光，近战扇形。
- `skill-sweep.png`：横向血痕扫击。
- `skill-execute.png`：短促断头爆闪。
- `skill-shield.png`：暗金誓约护盾。

### 灰烬猎手 ash_hunter

轮廓：瘦高、兜帽、烬红围巾、黑皮甲和焦铜护具，右手短刃，左手小弩或第二把短刃。

色彩：暗灰、焦铜、烬红、小面积橙火。

动作重点：

- walk：轻快前压，小步幅，有披风和围巾拖尾。
- attack：短刃斩击接弩箭火线，特效不能盖住人物主体。
- death：向前跪倒，武器落下。

技能特效：

- `skill-ash-chain.png`：短红弧线连斩。
- `skill-ember-mark.png`：目标身上的小型燃烧印记。
- `skill-piercing-line.png`：细长橙红穿刺线。
- `skill-ash-step.png`：脚下灰烬残步。

### 墓誓修女 grave_votary

轮廓：中等身高，破损修女袍，骨质圣冠，单手提墓灯，另一手持短杖或祷告链。

色彩：黑布、骨白、暗银、幽紫冷光。

动作重点：

- walk：缓慢仪式步伐，墓灯轻摆。
- attack：举灯/祷告释放紫色诅咒环，动作连续。
- death：灯熄灭，身体向后倒或跪伏。

技能特效：

- `skill-grave-lantern.png`：幽紫墓灯魂火。
- `skill-black-prayer.png`：地面诅咒法阵。
- `skill-bone-servant.png`：半透明骸侍短暂显形。
- `skill-grave-veil.png`：骨白半圆护幕。

### 铁狱执行官 iron_gaoler

轮廓：最高最重，铁面罩，厚重链甲和肩甲，双手链锤/巨锤，背后有铁链。

色彩：黑铁、暗银、铁锈红、少量热橙炉光。

动作重点：

- walk：沉重步态，肩部有重量下沉，但脚底锚点稳定。
- attack：巨锤从后向前横砸，必须有完整蓄力和回收帧。
- death：单膝跪地再倒下，重甲保持大轮廓。

技能特效：

- `skill-chain-crush.png`：铁链拖拽冲击。
- `skill-bone-break.png`：断骨裂纹冲击。
- `skill-cage-slam.png`：矩形铁狱冲击波。
- `skill-sentence-burst.png`：暗金判刑爆发。

## 首批 img gen 产出范围

为降低接入风险，首批先生成 3 个新增角色的动作源 atlas：

- `ash_hunter/action-atlas-chroma.png`
- `grave_votary/action-atlas-chroma.png`
- `iron_gaoler/action-atlas-chroma.png`

每个 atlas 为 4x4 网格：

```text
第 1 行：idle 4 帧
第 2 行：walk 4 帧
第 3 行：attack 4 帧
第 4 行：death 4 帧
```

验收通过后再切出独立动作 sheet。若 atlas 存在角色大小不一致、白底、帧互相覆盖，则不进入游戏，只保留为失败样本。

## 回归检查

- [ ] 透明背景检查：无白底、无纯色底残留。
- [ ] 帧边界检查：武器和披风不被裁断。
- [ ] 底部锚点检查：idle/walk/attack 脚底 y 坐标偏差不超过 4px。
- [ ] 体积感检查：同角色各动作头顶到脚底高度偏差不超过 6%。
- [ ] 连续性检查：attack 必须有挥出和回收，不得只抬手不落下。
- [ ] 系列一致性检查：运动中和停止后必须是同一角色、同一武器、同一装备。

