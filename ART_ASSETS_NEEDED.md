# 美术资产需求清单

> **游戏：** 破誓骑士（Oathbreaker ARPG）
> **美术风格：** 黑暗奇幻 / 暗黑破坏神3 / 流放之路混合风格
> **色调：** 深色为主，金铜色高光，血红/余烬橙为强调色
> **技术规格：** PNG 格式（透明背景），除背景图外均需透明背景
> **路径：** 项目 `public/assets/game/` 目录下

---

## 一、英雄动作帧（当前缺失）

目前只有 4 帧攻击动作（`oathbreaker-attack-frame-0/1/2/3.png`），缺少以下关键帧：

### hero-idle-frame.png
- **尺寸：** 128×192px
- **内容：** 破誓骑士站立待机姿态，单手持大剑斜下方，轻微呼吸起伏感（静止帧）
- **风格：** 暗黑破坏神3 骑士风，重甲，破损的誓约纹章在肩甲上依稀可见
- **颜色：** 主体深灰黑色铠甲，金铜色边饰，眼部有幽蓝光芒
- **用途：** `.hero-frame-viewport` 待机时显示

### hero-death-frame.png
- **尺寸：** 128×192px
- **内容：** 骑士倒地，单膝跪地、身体前倾撑剑，誓约纹章碎裂发光
- **参考：** 魂类游戏死亡动画定格帧
- **颜色：** 暗色调为主，碎裂纹章发出微弱金色残光
- **用途：** 英雄死亡时显示（需后续接入）

### hero-burst-frame.png
- **尺寸：** 128×192px
- **内容：** 骑士激活爆发状态，全身环绕金焰/战意光环，剑刃发光，蓄势待发
- **颜色：** 橙金色光芒环绕，铠甲缝隙透出炽热光线
- **用途：** 战斗爆发模式（burstUntilMs 激活期间）切换显示

---

## 二、技能特效（当前已有占位图，需要独立高质量版本）

### vfx-cleave-impact.png
- **尺寸：** 128×128px（透明背景）
- **内容：** 单斩命中特效，血红色斜向刀光 + 少量血液飞溅
- **风格：** 写实暗黑风，非卡通
- **用途：** cleave 技能命中时的 `.slash` 元素

### vfx-sweep-trail.png
- **尺寸：** 200×80px（透明背景，横向）
- **内容：** 横扫特效，蓝白色弧形斩击轨迹 + 冰霜粒子，弧度从左到右
- **用途：** lacerating_sweep 技能命中时横向覆盖怪物组

### vfx-execute-burst.png
- **尺寸：** 160×160px（透明背景）
- **内容：** 处决爆发，紫黑色阴影漩涡 + 金色破碎纹理从中心向外扩散
- **感觉：** 终结技的终极感，POE 技能特效风格
- **用途：** execute 技能命中 boss 时的爆发特效

### vfx-oath-shield.png
- **尺寸：** 128×128px（透明背景）
- **内容：** 护盾激活特效，蓝白色六边形护盾纹路 + 圣光光晕
- **用途：** iron_oath 技能激活时在英雄身上显示

### vfx-crit-flash.png
- **尺寸：** 96×96px（透明背景）
- **内容：** 暴击命中闪光，黄金色星爆 + 4条放射光线
- **用途：** 暴击时叠加在命中点上

---

## 三、UI 装饰元素

### ui-panel-corner.png
- **尺寸：** 32×32px
- **内容：** 金铜色面板角装饰，传奇游戏/暗黑风格的角落花纹
- **用途：** 面板四角装饰，CSS border-image 或绝对定位

### ui-divider-ornament.png
- **尺寸：** 200×12px
- **内容：** 金铜色横向分割线，中间有一个菱形宝石装饰
- **用途：** 面板内各区域的分隔线

### ui-slot-empty-weapon.png
- **尺寸：** 64×64px（透明背景）
- **内容：** 武器槽空置状态，剑的轮廓线框（描边风格），中心有虚线
- **用途：** 装备面板空武器槽显示

### ui-slot-empty-chest.png / ui-slot-empty-helm.png / ui-slot-empty-ring.png
- **尺寸：** 各 64×64px（共3张）
- **内容：** 对应槽位的轮廓线框（胸甲轮廓 / 头盔轮廓 / 戒指轮廓）
- **用途：** 装备面板对应空槽位

---

## 四、背景与场景补充

### bg-forgemaw-core.webp（可能已存在，如缺失则需要）
- **尺寸：** 1200×400px
- **内容：** 熔炉核心场景，巨大熔岩齿轮，橙红色熔岩背景，工业恶魔风
- **参考：** Diablo 3 熔炉关卡
- **用途：** zone-forgemaw_core 背景

### lane-ground-black-forge.png
- **尺寸：** 960×80px（透明背景或深色）
- **内容：** 黑炉矿道的地面纹理，黑色石板 + 熔岩裂缝发光
- **用途：** 替换当前的 `.lane` CSS 伪元素地面效果

---

## 五、角色头像（UI HUD 用）

### hero-portrait.png
- **尺寸：** 64×64px
- **内容：** 破誓骑士头盔特写，头盔面甲半开，眼睛有幽蓝色光，表情严肃
- **用途：** 左上角英雄 HUD 的 `.hero-hud-portrait` 头像框
- **备注：** 当前已有 `oathbreaker-hero.png`，此图为更精致的 HUD 专用版本

---

## 六、道具图标补充

当前缺少部分道具槽的图标，需要补充：

### item-rusted-cleaver.png（可能已有，确认 `public/assets/game/` 目录）
- **尺寸：** 64×64px（透明背景）
- **内容：** 破损的铁锹形斩刀，低级铁质武器，略有缺口
- **风格：** 低级道具，略显破旧，但细节清晰

### item-charred-plate.png（新手初始胸甲，可能已有）
- **尺寸：** 64×64px（透明背景）
- **内容：** 烧焦的皮甲/铁片胸甲，焦黑纹理
- **风格：** 新手初始装备，低稀有度 visual

---

## 七、状态效果图标

### icon-bleed.png
- **尺寸：** 32×32px（透明背景）
- **内容：** 血滴形状，深红色，有流动感
- **用途：** 怪物流血层数 UI 旁边的图标

### icon-evasion.png
- **尺寸：** 32×32px（透明背景）
- **内容：** 风/残影形状，白色半透明，有速度感
- **用途：** 属性面板闪避率图标

### icon-chaos-stone.png
- **尺寸：** 32×32px（透明背景）
- **内容：** 混沌漩涡宝石，紫色/深蓝色，有裂缝和内部旋转光效
- **用途：** 资源条混沌石图标（当前用 🌀 emoji 替代）

---

## 生图 Prompt 参考（英文）

通用基础 prompt：
```
dark fantasy ARPG game asset, Diablo 3 / Path of Exile style, dark background, high detail, game-ready sprite
```

英雄相关追加：
```
oathbreaker knight, heavy black armor with gold trim, broken oath crest on pauldron, glowing blue eyes, 2D game sprite, side view
```

特效相关追加：
```
transparent background, game VFX effect, dark fantasy, particle effect, [specific description]
```

UI 元素追加：
```
game UI element, dark panel, gold bronze ornament, RPG inventory style, isolated on transparent background
```

---

## 八、动作系统关键资产（当前最优先）

> 下面这组是为了解决“英雄忽大忽小、敌人没有真实走路动作”的核心需求。之前的 `oathbreaker-attack-frame-*` 和 `enemy-*-walk-sheet.png` 多数是从单张图裁切/派生，不能从根本上保证动作连续。

### 治理目标
- **英雄体积感变化：** 所有 hero 动作必须使用同一个画布、同一个脚底锚点、同一个身体比例。禁止“攻击帧画布变宽后人物被缩小”、禁止脚底上下跳、禁止武器/身体被裁掉。
- **敌人走路不真实：** 敌人 walk 必须是肢体/躯干姿态逐帧变化，不接受从静态图做旋转、平移、缩放形成的假走路。
- **状态切换无闪烁：** 同一个敌人的 travel、idle、attack 必须来自同一张 motion sheet，不能 travel 用 A 图、combat 用 B 图。
- **落地格式：** 所有 motion sheet 使用透明 PNG；如果生图工具不能直接透明，先使用纯色 chroma-key 背景，后处理为透明。

### hero-oathbreaker-combat-sheet.png
- **尺寸：** 8 帧横向 spritesheet，每帧 560×620px，总尺寸 4480×620px
- **帧顺序：** idle_0、idle_1、attack_windup、attack_downswing、attack_impact、attack_recover、hit、death
- **硬性要求：**
  - 每帧必须是同一个角色、同一个朝向、同一个透视
  - 脚底锚点固定在每帧同一坐标：`x=280, y=600`
  - 人物身体高度保持一致，禁止不同帧整体缩放
  - 武器允许超出身体，但必须在 560×620 画布内完整显示
  - 透明背景 PNG，不能有其他人物残片、矩形边界、脏像素

### enemy-[enemyId]-motion-sheet.png
- **尺寸：** 8 帧横向 spritesheet，每帧 360×420px，总尺寸 2880×420px
- **帧顺序：** idle_0、idle_1、walk_0、walk_1、walk_2、walk_3、attack_windup、attack_impact
- **适用对象：** 每个敌人至少一张；优先 `forge_serpent`、`bone_miner`、`black_forge_guard`、`furnace_brute`、各 boss
- **硬性要求：**
  - 每帧必须是同一只怪，不要按“家族通用怪”替换
  - 脚底锚点固定在每帧同一坐标：`x=180, y=405`
  - walk 帧必须有真实肢体/躯干姿态变化，不要只做整体平移、缩放、旋转
  - idle 和 combat 帧使用同一画布规格，避免进入遭遇时闪烁
  - 透明背景 PNG，无矩形底、无其他怪物残片

### enemy-[enemyId]-attack-sheet.png（当前缺口）
- **尺寸：** 2-4 帧横向 spritesheet，每帧 360×420px；2 帧总尺寸 720×420px，4 帧总尺寸 1440×420px
- **当前状态：** 只有 `forge_serpent` 已接入独立 attack sheet；其他敌人进入攻击状态时仍使用 walk sheet 暂停帧 + CSS lunge 近似表现。
- **优先级：** 高。用于治理“敌人进入遭遇后突然切状态、攻击像静态平移”的问题。
- **适用对象：** `bone_miner`、`black_forge_guard`、`coal_cultist`、`rust_hound`、`furnace_brute`、`slag_warden`、各 boss。
- **硬性要求：**
  - 必须和对应 walk sheet 是同一个怪物造型、同一视角、同一比例。
  - 脚底锚点固定：每帧底线一致，不能攻击时变大/变小。
  - 攻击动作要有明确的 windup 和 impact，不要只做整体前移。
  - 画布透明，不要背景矩形、白底、绿底残边。
- 攻击帧可以有武器/爪击/冲撞拖影，但不能遮住怪物主体轮廓。

#### 已补齐并接入
- `enemy-bone-miner-attack-sheet.png`
- `enemy-black-forge-guard-attack-sheet.png`
- `enemy-coal-cultist-attack-sheet.png`
- `enemy-rust-hound-attack-sheet.png`
- `enemy-furnace-brute-attack-sheet.png`
- `enemy-slag-warden-attack-sheet.png`

### enemy 入场治理补充
- 新敌人应从屏幕右侧外生成，先播放 walk 动作进入队形点。
- 入场期间不播放 attack，不显示血条/精英牌，避免“凭空出现”和“刚出现就攻击”的突兀感。
- 美术上每个敌人的 walk sheet 必须能单独支撑 1.5 秒入场动画，因此至少 4 帧真实走路动作。

### 推荐 Prompt（英雄动作表）
```
dark fantasy ARPG 2D spritesheet, oathbreaker knight in heavy black armor with bronze gold trim, side view facing right, consistent character scale across all frames, fixed feet anchor point, transparent background, 8 animation frames in one horizontal spritesheet: idle, idle breathing, attack windup with axe raised, downswing, impact, recover, hit reaction, death kneel, no extra characters, no cropped weapon, no frame border, game-ready sprite sheet
```

### 推荐 Prompt（敌人动作表）
```
dark fantasy ARPG enemy 2D spritesheet, same monster in every frame, side view facing left, fixed feet anchor point, transparent background, 8 animation frames in one horizontal spritesheet: idle, idle breathing, walk frame 1, walk frame 2, walk frame 3, walk frame 4, attack windup, attack impact, real limb movement, no frame border, no extra monsters, game-ready sprite sheet
```

---

## 资产汇总清单（共 25 项）

| # | 文件名 | 尺寸 | 优先级 |
|---|--------|------|--------|
| 1 | hero-idle-frame.png | 128×192 | 高 |
| 2 | hero-death-frame.png | 128×192 | 中 |
| 3 | hero-burst-frame.png | 128×192 | 高 |
| 4 | vfx-cleave-impact.png | 128×128 | 高 |
| 5 | vfx-sweep-trail.png | 200×80 | 高 |
| 6 | vfx-execute-burst.png | 160×160 | 高 |
| 7 | vfx-oath-shield.png | 128×128 | 中 |
| 8 | vfx-crit-flash.png | 96×96 | 中 |
| 9 | ui-panel-corner.png | 32×32 | 低 |
| 10 | ui-divider-ornament.png | 200×12 | 低 |
| 11 | ui-slot-empty-weapon.png | 64×64 | 中 |
| 12 | ui-slot-empty-chest.png | 64×64 | 中 |
| 13 | ui-slot-empty-helm.png | 64×64 | 中 |
| 14 | ui-slot-empty-ring.png | 64×64 | 中 |
| 15 | bg-forgemaw-core.webp | 1200×400 | 中（确认是否已有） |
| 16 | lane-ground-black-forge.png | 960×80 | 低 |
| 17 | hero-portrait.png | 64×64 | 中 |
| 18 | item-rusted-cleaver.png | 64×64 | 确认是否已有 |
| 19 | item-charred-plate.png | 64×64 | 确认是否已有 |
| 20 | icon-bleed.png | 32×32 | 中 |
| 21 | icon-evasion.png | 32×32 | 中 |
| 22 | icon-chaos-stone.png | 32×32 | 中 |
