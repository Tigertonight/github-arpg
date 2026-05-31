# Sprite Source Spec v2

> 敌人 sprite 切图链路 v2 的源资产规范。本文是阶段 0 的"投产前合同"——
> 满足这份规范的源资产能直接喂入 `scripts/build-enemy-runtime.mjs` 切图，
> 产出游戏运行时使用的 2048×512 sheet。

## 为什么是 v2（核心经验）

以下 7 条经验是 v2 区别于 v1 的根本原因，也是后续所有 slug 投产前必须遵守的固定流程：

1. **单动作 sheet > 单 atlas**。旧 8×2 / 16×1 单 atlas 最大问题是生成器经常不严格遵守网格（9/7 分布、行距不均、动作跨格）。v2 拆成 `{idle,walk,attack,death}.png` 四张，每张只管 4 帧，明显更可控。
2. **生成图不能直接信尺寸**。imagegen 输出常常不是严格 2048×512（实测 slag-warden v2 出图 1774×887）。**必须**走 `scripts/import-v2-enemy-action-sheet.mjs` 归一化：拆 4 帧 → 抠绿（同时容忍 #00ff00 与 #33d100）→ trim → 统一缩放 → south 底部对齐 → 拼回 2048×512。生图模型自报"已 2048×512"不要采信。
3. **横向可留安全边距，纵向不要跨 cell 裁切**。v1 时代为了防止头顶/武器被裁，给单 atlas 加了纵向安全边距，结果 8×2 把上一行动作残片带进下一行。v2 因为每张只 1 行 4 cell，从结构上规避了纵向跨行问题——但任何后续工具改动都不要再引入"跨 cell 裁"的逻辑。
4. **death 必须 south 底部居中，不要 southwest**。死亡动作初版用 southwest 对齐时，audit 报左边距=0（贴左边），观感像角色"侧躺出框"。v2 规范统一 south：倒地可以变矮，但水平居中，不贴边。
5. **批量前必须三段校验 + montage 抽检**。固定顺序：`audit-source-frames.mjs` → `build-enemy-runtime.mjs` → `validate-enemy-sheets.mjs --report`，再加一张 montage 视觉抽检。"通过但不好看"的问题只有截图能看出来。
6. **prompt 必须强约束 cell 内边距**。链锤、长枪、冲刺、飞扑类动作尤甚。约束项见后文「Prompt 必须包含的硬约束」一节，需要原样复制到 imagegen prompt 顶部。
7. **保留 source archive**。`generated-source/enemies/<slug>/` 必须保留，不要只留 runtime。后续如果发现尺寸/边距/抠绿参数有问题，可以从 source 重新 build，不必重新生图。

## 投递路径与命名

```
public/assets/game/generated-source/enemies/<slug>/
  ├── idle.png      # 4 帧 idle 横拼
  ├── walk.png      # 4 帧 walk 横拼
  ├── attack.png    # 4 帧 attack 横拼
  └── death.png     # 4 帧 death 横拼
```

- `<slug>` 必须与 `docs/enemy-prompts/<slug>.md` 中的 slug 完全一致
- 4 个文件缺一不可
- 文件名固定小写、无后缀变体（不要 `idle-source.png` / `idle-v2.png` 等）

## 单文件硬性规格

| 项 | 要求 |
|---|---|
| **分辨率** | **2048×512**（4 帧横拼，每帧 512×512） |
| **格式** | PNG，8-bit RGB 或 RGBA 均可（背景必须是绿幕，不依赖 alpha） |
| **背景色** | **#00ff00 纯绿** —— 唯一标准，不接受其它绿色 |
| **总位深** | ≥ 24 bit；不接受索引色 PNG |
| **方向** | 4 帧从左到右按时间顺序排列：frame 0 在最左，frame 3 在最右 |

## 单帧构图（每个 512×512 cell 内）

| 项 | 要求 |
|---|---|
| **主体高度** | 占 cell 高度的 60–80%（约 308–410 px） |
| **头顶留白** | 顶部至少留 12% 空白（≥ 60 px），用于容纳 walk/attack 的姿态溢出 |
| **脚部对齐** | 4 帧脚底中点应位于 cell 内**同一水平线 ±20 px** 之内（baseline 一致） |
| **横向居中** | 主体躯干（不含武器/链条等横向溢出物）水平居中于 cell ±40 px |
| **武器/部件溢出** | 允许伸出主体 bbox，但**不得触及 cell 任意边界**（左右各留 ≥ 24 px 安全区） |

## 4 帧动作要求（按动作分别说明）

### idle（呼吸/微动）
- 4 帧之间位移 ≤ 8 px
- 主要表现：胸腔起伏、衣摆/链条/披风轻微摆动
- **不可**有大幅姿态变化，否则待机会"抖动"

### walk（位移）
- 4 帧构成一个完整步态周期：右脚前 → 过渡 → 左脚前 → 过渡
- 头部不可上下浮动 > 16 px（否则跨帧 baseline 漂）
- 脚底"假装"对齐同一线（实际抬腿那帧脚底比静止帧高，用 baseline 校正吸收）

### attack（蓄力 → 出招 → 命中 → 收招）
- 帧 0：蓄力（武器后拉、身体侧倾）
- 帧 1：抬手/挥起最高点
- 帧 2：命中瞬间（武器最前，身体伸展）
- 帧 3：收招（武器回流，身体回正）
- **武器溢出方向需在 cell 内**（攻击向右溢出时，留意右安全区）

### death（倒下 → 残骸）
- 帧 0：踉跄/中弹反馈
- 帧 1：膝盖弯曲/重心下沉
- 帧 2：完整倒地
- 帧 3：残骸/灰烬（可只剩部分主体，但仍应有可见 alpha 像素）

## 对 LLM 的提示词补充

每个 slug 的 prompt 文件（`docs/enemy-prompts/<slug>.md`）应基于本规范补充：

```
Render 4 frames of <action> in a single horizontal sheet, total size 2048×512 pixels.
Each frame is 512×512. Pure green background #00ff00 (chroma key).
Subject occupies 60–80% of cell height, foot baseline aligned across all 4 frames.
Top 12% of each cell must be empty (no head/weapon contact with top edge).
Subject body horizontally centered (weapon overflow allowed but must not touch cell edges).
```

## 朝向约定

- **生图**：所有 sheet 一律按"侧视、面朝右（facing RIGHT）"画，无论 idle/walk/attack/death。这是为了让画师/imagegen 输出风格一致、避免左右镜像的姿态混乱。
- **工程层**：`scripts/import-v2-enemy-action-sheet.mjs` 在归一化最后一步对每个 cell 做水平翻转（`magick -flop`），把"朝右"翻成"朝左"再拼回 2048×512。这样落地到 `generated-source/enemies/<slug>/` 的 sheet 已经是朝左的，运行时直接渲染即可，不需要 CSS `scaleX(-1)`。
- **逻辑**：游戏里敌人统一从屏幕右侧出现，朝左走向英雄。如果未来加入"敌人从左侧出现"的玩法，运行时再按需 `scaleX(-1)`，**source 资产仍保持朝左为唯一基准**。
- **校验**：source 翻转后再走 audit / build-runtime / validate；montage 抽检也要确认是朝左的（否则说明导入脚本被改坏了）。

## Prompt 必须包含的硬约束

每个 slug prompt 顶部都应原样包含以下约束块，避免漏项：

```
4 frames only, arranged 4 columns × 1 row, single horizontal sheet.
Each frame strictly inside its own 512×512 cell.
Pure green background #00ff00 only (no shadow, no gradient, no other green tones).
All 4 frames share the same scale, the same baseline, the same character design.
Body horizontally centered ±40 px in cell.
Top of cell ≥ 60 px empty (head must not touch top edge).
Weapon / chain / wing / tail tip must stay ≥ 24 px from any cell edge.
Do NOT render close-up frames, motion blur, soft glow, or anti-aliased edges.
Death frames are bottom-center aligned (south gravity), never bottom-left.
```

## 守门员（阶段 1 audit）

软警告（不阻断生产，仅提示问题）：

```bash
node scripts/audit-source-frames.mjs --slug=<slug>
```

检查项：
- ✓ 4 个文件存在
- ✓ 每个文件 = 2048×512
- ✓ 绿幕背景占比 > 30%
- ✓ 4 帧脚底（最低非绿像素 y）漂移 ≤ 20 px
- ✓ 4 帧顶部留白 ≥ 12%
- ✓ 主体未触帧边

任何一项不通过会输出黄色警告，但**仍允许进入阶段 2 切图**——切图阶段的硬阻断 audit 才是最终守门。

## 与切图的契约

源资产满足本规范 → `build-enemy-runtime.mjs` 保证产出：
- runtime sheet 2048×512
- 4 帧 baseline drift ≤ 16 px
- 4 帧 center drift ≤ 80 px
- 头部完整（无截头）、肢体完整（无裁切）
- Lanczos 单次下采样，不存在二次插值伪影

源资产**不**满足规范 → 切图也不保证质量。算法不应该承担"修复 LLM 画错的源"职责。

## 失败案例参考（v1 教训）

- **8×2 atlas 网格被强制 `! resize`**：源 1774×887 拉到 2048×512 → 比例失真 → v2 改为按动作分文件、每帧已是目标分辨率
- **specific 中间产物多一次缩放**：v2 取消，源 → runtime 一次到位
- **bbox 提取丢头**（如 vow-handmaiden）：v2 切图脚本改用 alpha 形态学闭运算，不再依赖纯连通分量
- **源单帧仅 ~222 px**：v2 强制 ≥ 512 px，从源头杜绝上采样模糊

## 给 LLM / 画师的对接模板

每次新 slug 投产时，把下面这段直接复制粘贴给生图模型，把 `<slug>` 替换成实际名字即可。

````
请按 docs/enemy-prompts/<slug>.md 的描述生成 4 张 PNG：
  - idle.png
  - walk.png
  - attack.png
  - death.png

技术规格（必须严格满足，不达标会被 audit 阻断）：
  - 每张严格 2048×512 像素，PNG 格式
  - 纯绿色 #00ff00 背景（chroma key 抠图用，不要任何阴影/渐变）
  - 4 帧从左到右横拼，每帧 512×512 像素的 cell
  - 每帧主体高度占 cell 高度的 60–80%（约 308–410 px）
  - 4 帧脚底必须对齐到同一水平线 ±20 px
  - 每帧顶部至少留 60 px 空白（头/武器不能顶到帧顶）
  - 主体躯干水平居中于 cell ±40 px
  - 武器/披风/链条等部件可超出主体 bbox，但不得触及 cell 左右边界
    （任意元素到 cell 边缘距离 ≥ 24 px）
  - 4 帧之间主体绘制风格、配色、比例完全一致

每个动作的具体姿态描述见 prompt 文件中对应章节（idle/walk/attack/death）。
请逐张生成、每张内 4 帧动作连贯、4 张之间是同一个角色。
````

投递路径（生成完按此放置）：
```
public/assets/game/generated-source/enemies/<slug>/
  ├── idle.png
  ├── walk.png
  ├── attack.png
  └── death.png
```

## 投产流程速查

```bash
# 0. imagegen 出 4 张原图（任意尺寸），落地到任一临时目录

# 1. 归一化导入 → generated-source/enemies/<slug>/<action>.png（2048×512）
node scripts/import-v2-enemy-action-sheet.mjs <slug> idle   <path-to-idle.png>
node scripts/import-v2-enemy-action-sheet.mjs <slug> walk   <path-to-walk.png>
node scripts/import-v2-enemy-action-sheet.mjs <slug> attack <path-to-attack.png>
node scripts/import-v2-enemy-action-sheet.mjs <slug> death  <path-to-death.png>

# 2. 软警告 audit（不阻断，只提示）
node scripts/audit-source-frames.mjs --slug=<slug>

# 3. 切图（一次 Lanczos，输出到 enemies/runtime/<slug>/）
node scripts/build-enemy-runtime.mjs --only=<slug>

# 4. 硬阻断 audit（不通过 → 退码 1）
node scripts/validate-enemy-sheets.mjs --report

# 5. montage 视觉抽检（"通过但不好看"只有眼睛能看出来）
open public/assets/game/enemies/runtime/<slug>/{idle,walk,attack,death}-sheet.png

# 6. 跑 dev server 人工 A/B 验证
npm run dev
```

如果第 4 步 audit 报：
- **baseline drift / center drift** → LLM 出的源没满足"脚底对齐 / 主体居中"，回 LLM 重生
- **截头（top clearance 不足）** → LLM 没给头顶留白，prompt 里加重头顶留白要求重生
- **edge touch（触边界）** → 武器/披风太宽，prompt 里加重"≥24 px 安全区"

如果 audit 通过但 dev server 看仍丑 → 算法问题，反馈到代码层调参。

## 历史归档

v1 的源 atlas（8×2 / 16×1 单文件）保留在 `public/assets/game/generated-source/enemy-single-atlases/` 用于追溯，但新链路不再消费这个目录。

待 34 个 slug 全部按 v2 重生后，v1 目录可删除。
