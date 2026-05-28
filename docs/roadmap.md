# Forge Lane Roadmap：玩法与里程碑

> 版本：v2（2026-05-24）
> 取代 `game-design-and-tech-plan.md` 中的 §11-§12 路线图部分。原文档保留为 v1 历史参考。

## 1. 目标体验

最终画面：暗黑风 2.5D 横版自动战斗刷宝挂机。玩家锚定在屏幕左侧，敌人从右压入，地面斜俯视带光柱掉落。决策核心是 **Build 构筑**，不是走位。

爽点分三层，全部要做对：

| 层 | 内容 | 频率 |
|---|---|---|
| 微爽 | 飘字、技能特效、CD 转好、掉落光柱 | 1-2 秒 |
| 中爽 | 装备替换、词缀刷出、推过一层 | 1-3 分钟 |
| 大爽 | Build 成型、首次过 Boss、套装 / 暗金集齐 | 1-3 天 |

当前原型：微爽 OK，中爽弱，大爽缺失。Roadmap 的核心目标是把中爽和大爽补上。

## 2. 玩法系统取舍

| 系统 | 优先级 | 里程碑 | 说明 |
|---|---|---|---|
| 自动战斗 + 技能策略表 | P0 | M2.5 | 玩家配置「何时释放」，是 Build 表达 |
| 装备 + 词缀 tier 化 | P0 | M2.5 | 长期目标载体 |
| 传说装备改变机制 | P0 | M5 | 养成感的核心来源 |
| 章节 + 精英 + 章节 Boss | P0 | M4 | 关卡丰富度 |
| 掉落筛选规则 | P0 | 已有，M3 强化 | 信息密度门槛 |
| 离线收益 + 待鉴定箱 | P0 | 已有 | 挂机品类底线 |
| 怪物词缀化（精英带 affix） | P1 | M4 | 关卡丰富度的最便宜来源 |
| 章节主题机制（全场效果） | P1 | M4 | 例如毒沼地面、火墙 |
| 天赋盘 | P1 | M5 | Build 决策深度 |
| 重铸 / 锁词缀 | P2 | M5 | 粘性高，但容易让经济失控 |
| 套装 | P2 | M5 | 数据量大，平衡难 |
| 赛季 / 云存档 | P2 | M6+ | 没有玩家就没有赛季 |
| 随从系统 | 砍 | - | 多一倍战斗状态机，性价比低 |
| 转职 / 升华 | 砍 | - | 玩家到不了 |

## 3. 里程碑分解

### M2.5 — 结构与架构升级（**当前阶段**）

目标：在不破坏现有玩法的前提下，把数据结构和代码架构升级到能承载 M3-M5 的水平。

**实体结构**

- `EquipmentSlot` 拆 `ring1 / ring2`
- `AffixRoll` 加 `tier: number` + `values: number[]`
- `ItemInstance` 加占位字段：`legendaryPowerId? / setId? / sockets?`
- `ZoneDefinition` 加 `chapterId / globalAffixes`，新增 `Chapter` 顶层

**架构**

- 引入 action / reducer，App.tsx 不再直接 setGame patch
- 战斗循环时间用 `state.gameTimeMs`，不再依赖 `Date.now()`

**存档**

- save version 2 → 3，写迁移 + 单元测试

### M3 — 战斗系统切片 + 渲染层升级

目标：让战斗循环可以无痛新增机制（投射物、AoE、buff/debuff）；UI 性能不再是瓶颈。

- `advanceCombat` 拆成 system 切片：`tickBuffs / tickProjectiles / tickHero / tickEnemies / resolveCollisions / resolveDeaths`
- 引入 `BuffInstance`，把流血从 `EnemyInstance.bleed` 迁过来
- 引入 PixiJS（或 Canvas）渲染层，UI 仍用 React，单向数据流
- 静态数据迁到 `public/data/*.json`，运行时 fetch 加载

### M4 — 内容扩张：章节 / 精英 / Boss

目标：把"关卡丰富度"做到位。

- 3 个章节，每章 50 层，每 10 层一个小 Boss，每 50 层一个章节 Boss
- 15 种怪物，每种带攻击模式
- 精英怪带 1-3 个怪物词缀（冰甲、狂暴、雷电环…）
- 章节主题机制（沼泽地面伤害、熔炉周期火墙）
- Boss 专属掉落表

### M5 — Build 深度：传说 / 套装 / 天赋盘 / 重铸

目标：补齐"大爽"。

- 第一批 10 个传说机制（execute 阈值 / 流血爆炸 / 召唤光环…）
- 第一套套装（3 件套 + 5 件套）
- 天赋盘（小型，3 主路径 × 5 节点）
- 重铸：金币重随机、混沌石锁 1-2 条、灵魂灰萃取传说机制

### M6+ — 长线

- 赛季框架
- 云存档 / 账号系统
- 第二、第三个职业
- Build 排行榜

## 4. 当前阶段（M2.5）任务清单

按优先级列出，**P0 必须本阶段完成**：

| # | 任务 | 优先级 | 工作量 | 影响文件 |
|---|---|---|---|---|
| 1 | EquipmentSlot 拆 ring1/ring2 + 存档迁移 | P0 | 0.5d | types, items, migrations |
| 2 | AffixRoll 加 tier/values + 重写掉落 | P0 | 1d | types, loot, formulas, affixes 数据 |
| 3 | action/reducer 重构 App.tsx | P0 | 1d | 新增 actions/reducer，重写 App.tsx |
| 4 | 战斗时间用 gameTimeMs | P0 | 0.5d | combatLoop, types, persistence |
| 5 | StatModifier 加 op (add/increased/more) | P1 | 1.5d | types, formulas, affixes 数据 |
| 6 | ItemInstance 加占位字段 | P1 | 0.3d | types |
| 7 | ZoneDefinition 加 chapterId/globalAffixes | P1 | 0.5d | types, gameData |
| 8 | 写第一个传说机制打通链路 | P1 | 1d | 新增 legendaryPowers 数据 + 接入 |

总工作量约 6.3 人日。建议顺序：1 → 2 → 6 → 7 → 4 → 3 → 5 → 8。

## 5. 风险与边界

- **数值膨胀**：M5 引入 increased/more 乘区时必须重新校准全部公式，预留 1 天数值调试
- **存档兼容**：每个里程碑只允许一次 save version 升级，迁移代码要带测试
- **PixiJS 接入风险**：M3 要先做 spike 验证，不行回退 Canvas 2D
- **不要做的事**：不上 ECS、不上 Redux、不上 Zustand（除非 reducer 真的撑不住）、不写后端
