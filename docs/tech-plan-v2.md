# Forge Lane 技术方案 v2

> 版本：v2（2026-05-24）
> 取代 `game-design-and-tech-plan.md` 中的 §6-§10 技术方案部分。原文档保留为 v1 历史参考。
> 本方案的实施顺序见 `roadmap.md` §4。

## 1. 设计原则

1. **engine 是纯函数**：输入 state + delta，输出新 state。所有副作用（存档、Date.now）在边界。
2. **state 扁平化**：实体存进 `xxxById` map，引用只存 ID。避免引用同步、方便存档。
3. **数据驱动**：怪物、装备、词缀、技能、传说机制、章节都是配置，不是代码。
4. **不过度抽象**：不上 ECS / Redux / Zustand。reducer 撑得住就不换。每个抽象都要有"现在就需要"的理由。
5. **向前兼容**：每次实体结构变更走 save version + migration。删除旧字段要先在 migration 里映射。

## 2. 目录结构（M2.5 调整后）

```
src/
  app/
    App.tsx              -- 壳，只 dispatch action
    GameProvider.tsx     -- state + dispatch context
  data/
    affixes.ts           -- 词缀定义（含 tier）
    items.ts             -- BaseItem
    skills.ts
    enemies.ts
    lootTables.ts
    legendaryPowers.ts   -- 新增：传说机制
    chapters.ts          -- 新增：章节
    zones.ts             -- 从 enemies.ts 拆出
  domain/
    types.ts             -- 全部实体类型
    formulas.ts          -- 派生属性、装备评分
    ids.ts
  engine/
    combatLoop.ts        -- 顶层 advance(state, dt)
    systems/             -- 新增：拆分子 system
      tickBuffs.ts
      tickHero.ts
      tickEnemies.ts
      tickProjectiles.ts
      resolveCollisions.ts
      resolveDeaths.ts
    actions.ts           -- 新增：所有 player intent 的 action 类型
    reducer.ts           -- 新增：dispatch 入口
    damage.ts
    loot.ts
    progression.ts
    offline.ts
    rng.ts
  persistence/
    saveCodec.ts
    migrations.ts        -- v2 → v3 迁移
  ui/
    panels.tsx
    Stage.tsx            -- M3：PixiJS 渲染层入口
```

## 3. 实体结构（M2.5 目标版）

### 3.1 装备槽位

```ts
type EquipmentSlot =
  | 'weapon' | 'offhand'
  | 'helm' | 'chest' | 'gloves' | 'boots'
  | 'amulet' | 'ring1' | 'ring2' | 'relic'
```

变更：`ring` → `ring1 + ring2`。

### 3.2 词缀与 tier

```ts
type AffixCategory = 'offense' | 'defense' | 'bleed' | 'loot' | 'skill' | 'legendary'
type StatOp = 'add' | 'increased' | 'more'

interface AffixDefinition {
  id: EntityId
  name: string
  category: AffixCategory
  stat: StatKey
  op: StatOp                      // 新增：加法/百分比加/百分比乘
  tiers: AffixTier[]              // 新增：分 tier
  tags: string[]
  minItemLevel: number            // 新增：tier1 出现的最低物品等级
}

interface AffixTier {
  tier: number                    // 1 是最高 tier，6 是最低 tier
  minItemLevel: number
  rolls: AffixRollSpec[]          // 一条词缀可能滚多个数值（如 +10-20 物理伤害）
}

interface AffixRollSpec {
  min: number
  max: number
}

interface AffixRoll {
  affixId: EntityId
  tier: number
  values: number[]                // 与 AffixTier.rolls 一一对应
  locked?: boolean                // 重铸用
}
```

`StatModifier` 同步加 op：

```ts
interface StatModifier {
  stat: StatKey
  op: StatOp
  value: number
  condition?: ModifierCondition
}
```

**派生属性公式**（`deriveCombatStats`）变成两段式：

```ts
// 1. 收集 modifiers
const mods: Record<StatKey, { add: number, increased: number, more: number[] }>

// 2. 计算最终值
finalValue = (base + add) * (1 + increased / 100) * more.reduce((acc, m) => acc * (1 + m / 100), 1)
```

### 3.3 装备

```ts
interface ItemInstance {
  id: EntityId
  baseItemId: EntityId
  name: string
  slot: EquipmentSlot
  rarity: Rarity
  itemLevel: number
  affixes: AffixRoll[]
  tags: string[]
  createdAt: number
  // 新增占位字段（M2.5 加，M5 启用）
  legendaryPowerId?: EntityId
  setId?: EntityId
  sockets?: SocketState[]
}

interface SocketState {
  kind: 'rune' | 'gem' | 'empty'
  refId?: EntityId
}

interface LegendaryPower {
  id: EntityId
  name: string
  description: string
  // 战斗系统通过 hookId 识别需要在哪个时机触发
  hookId: 'onExecuteThreshold' | 'onBleedTick' | 'onSkillCast' | ...
  params: Record<string, number>
}
```

### 3.4 章节与区域

```ts
interface Chapter {
  id: EntityId
  name: string
  themeId: EntityId
  zoneIds: EntityId[]
  bossEnemyId: EntityId
  unlockStage: number             // 进入条件：上一章的最高层
}

interface ZoneDefinition {
  id: EntityId
  chapterId: EntityId             // 新增
  name: string
  biome: string
  bossEveryStages: number
  enemyIds: EntityId[]
  bossEnemyId: EntityId
  globalAffixIds: EntityId[]      // 新增：章节主题机制（如 'poison_ground'）
}
```

### 3.5 战斗实体（M3 升级）

```ts
interface EnemyInstance {
  id: EntityId
  enemyDefId: EntityId
  name: string
  rank: 'normal' | 'elite' | 'boss'
  level: number
  currentLife: number
  maxLife: number
  armor: number
  // M3 新增
  affixes: EntityId[]              // 怪物词缀
  buffs: BuffInstance[]            // 流血也走这里
  position: { x: number; y: number }
}

interface BuffInstance {
  id: EntityId
  buffDefId: EntityId
  sourceEntityId: EntityId
  stacks: number
  remainingMs: number
  modifiers: StatModifier[]
}

interface ProjectileInstance {
  id: EntityId
  ownerEntityId: EntityId
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  damageScale: number
  remainingMs: number
}

interface AreaEffectInstance {
  id: EntityId
  ownerEntityId: EntityId
  position: { x: number; y: number }
  radius: number
  tickIntervalMs: number
  remainingMs: number
}
```

### 3.6 GameState 顶层

```ts
interface GameState {
  version: number                 // 3
  running: boolean
  gameTimeMs: number              // 新增：累计游戏时间（不是 Date.now）
  stageMode: StageMode
  stageModeUntil: number          // 改成 gameTimeMs 单位
  hero: Hero
  resources: ResourceState
  inventory: InventoryState
  itemsById: Record<EntityId, ItemInstance>
  enemy: EnemyInstance
  // M3 新增
  projectiles: ProjectileInstance[]
  areaEffects: AreaEffectInstance[]
  progression: ProgressionState
  combatLog: CombatLogEntry[]
  floatingTexts: FloatingText[]
  lastDrop?: ItemInstance
  lastSavedAt: number             // 仍然是 Date.now，仅用于离线收益
}
```

## 4. 战斗循环架构

### 4.1 顶层入口

```ts
// engine/combatLoop.ts
export function advance(state: GameState, dt: number): GameState {
  state = { ...state, gameTimeMs: state.gameTimeMs + dt }

  if (state.stageMode === 'travel') return tickTravel(state, dt)

  state = tickBuffs(state, dt)
  state = tickProjectiles(state, dt)
  state = tickAreaEffects(state, dt)
  state = tickHero(state, dt)        // 选技能 + 释放
  state = tickEnemies(state, dt)     // 怪 AI（M3+）
  state = resolveCollisions(state)
  state = resolveDeaths(state)       // 死亡 + 掉落 + 推进

  return state
}
```

每个 system 是纯函数 `(state, dt) => state`，互不依赖，方便测试和组合。

### 4.2 buff 系统替换 bleed 字段

M2.5 仍保留 `enemy.bleed` 兼容，M3 迁移到通用 buff 系统：

```ts
function tickBuffs(state: GameState, dt: number): GameState {
  // 1. 衰减所有 buff 的 remainingMs
  // 2. 触发 tick 类 buff 的伤害（流血、毒、燃烧）
  // 3. 移除过期 buff
}
```

新机制（毒、燃烧、冰冻）只是新加一个 BuffDef，不改 system 代码。

### 4.3 传说机制接入点

战斗系统在关键时刻 emit 「hook」，传说装备登记到 hook 上：

```ts
// 例子：execute 技能
function tryCastExecute(state, hero, enemy) {
  let threshold = 0.35
  let damageMult = 1
  for (const power of getActiveLegendaryPowers(state, 'onExecuteThreshold')) {
    threshold = power.params.threshold ?? threshold
    damageMult *= power.params.damageMult ?? 1
  }
  if (enemy.currentLife / enemy.maxLife <= threshold) {
    // 释放 execute
  }
}
```

每个 hook 是 enum 字符串，新加传说就是新加一个 hook 调用点。

## 5. action / reducer

### 5.1 action 定义

```ts
// engine/actions.ts
export type GameAction =
  | { type: 'tick'; dt: number }
  | { type: 'equipItem'; itemId: EntityId }
  | { type: 'salvageItem'; itemId: EntityId }
  | { type: 'toggleFilter'; ruleId: LootFilterRule['id'] }
  | { type: 'claimOffline' }
  | { type: 'togglePause' }
  | { type: 'reset' }
  // M5+
  | { type: 'rerollAffixes'; itemId: EntityId; lockedAffixIds: EntityId[] }
  | { type: 'allocateTalent'; talentId: EntityId }
```

### 5.2 reducer 入口

```ts
// engine/reducer.ts
export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick': return advance(state, action.dt)
    case 'equipItem': return equipItem(state, action.itemId)
    case 'salvageItem': return salvageItem(state, action.itemId)
    case 'toggleFilter': return toggleFilter(state, action.ruleId)
    case 'claimOffline': return claimOffline(state)
    case 'togglePause': return { ...state, running: !state.running }
    case 'reset': return createStarterState()
    default: return state
  }
}
```

每个 case 委托到 `engine/` 的纯函数。App.tsx 只剩 `dispatch`：

```tsx
const [state, dispatch] = useReducer(reduce, undefined, loadGameState)
useEffect(() => saveGameState(state), [state])
useTick(900, () => dispatch({ type: 'tick', dt: 900 }))

<button onClick={() => dispatch({ type: 'togglePause' })}>...</button>
<InventoryPanel onEquip={(item) => dispatch({ type: 'equipItem', itemId: item.id })} />
```

## 6. 时间模型

### 6.1 现状的问题

`combatLoop.ts:21` 直接 `Date.now() > stageModeUntil`：
- 离线模拟跑不快（被时钟卡住）
- 单测要 mock Date
- 无法回放

### 6.2 改造

- `state.gameTimeMs` 累计游戏内时间，每个 tick `+= dt`
- `stageModeUntil` 改为 `gameTimeMs` 单位（绝对游戏时间）
- `state.lastSavedAt` 仍然是 `Date.now()`，**只**用于计算「离线了多久」
- `Date.now()` 只在 saveCodec / offline 边界出现

```ts
// 离线收益入口
function applyOfflineProgress(state: GameState, now = Date.now()) {
  const elapsedRealMs = Math.min(8 * 3600 * 1000, now - state.lastSavedAt)
  // 用 elapsedRealMs 估算 kill 数（不再逐 tick 跑战斗循环）
  // 或者：用 advance(state, 900) 跑一定数量的 tick
}
```

## 7. 渲染层方案（M3）

### 7.1 现状

UI 全 React，Stage 在 `panels.tsx` 里用 div + img 画。5+ 实体 + 飘字会开始掉帧。

### 7.2 方案

**Stage 用 PixiJS，UI 用 React，单向数据流：**

```
GameState
  ├─→ React UI  (背包、装备、技能、筛选、log)
  └─→ Stage Snapshot → PixiJS Renderer (角色、敌人、飘字、特效)
```

每帧 React 把 `gameState` 提取出 `StageSnapshot`：

```ts
interface StageSnapshot {
  hero: { sprite: string; animFrame: number; position: Vec2; hpRatio: number }
  enemies: { id, sprite, animFrame, position, hpRatio, buffIcons }[]
  projectiles: { sprite, position }[]
  areaEffects: { sprite, position, radius }[]
  floatingTexts: { text, kind, position, age }[]
  background: string
  cameraX: number
}
```

`StageSnapshot` 推给 PixiJS 应用，PixiJS 不持有游戏状态，只画。

### 7.3 接入步骤

1. spike：装 `pixi.js` + `@pixi/react`，把现有 hero 精灵画上去验证可行
2. 把 `StageView` 替换成 PixiJS 容器，propagate `StageSnapshot`
3. 飘字、伤害数字、技能特效逐个迁移
4. 保留 React 的 UI 面板，不动

### 7.4 回退方案

如果 PixiJS 接入超过 3 天，回退到 Canvas 2D 自己撸（精灵图绘制 + 简单粒子），不引入额外依赖。

## 8. 数据驱动（M3）

### 8.1 静态数据 JSON 化

现状：`src/data/*.ts` 是 TS 模块字面量。问题：
- 改数值要重新 build
- AI 协助生成 JSON 比 TS 稳
- 将来做赛季 / 活动数据热推无路

目标：

```
public/data/
  affixes.json
  items.json
  skills.json
  runes.json
  enemies.json
  zones.json
  chapters.json
  legendaryPowers.json
  lootTables.json
```

### 8.2 加载方式

启动时一次性 fetch 所有 JSON，组装成 `StaticData` 容器，注入 React context：

```ts
interface StaticData {
  affixesById: Record<EntityId, AffixDefinition>
  baseItemsById: Record<EntityId, BaseItem>
  skillsById: Record<EntityId, SkillDefinition>
  // ...
}

const StaticDataContext = createContext<StaticData | null>(null)
```

engine 的纯函数接受 `(state, staticData, dt)` 形参，不再 import 数据模块。

### 8.3 schema 校验

加载时用 Zod 校验 JSON，schema 错就开发期报错。生产环境没玩家自定义 JSON，不用线上校验。

## 9. 存档与迁移

### 9.1 版本表

| version | 引入时机 | 关键变更 |
|---|---|---|
| 1 | 初版 | LegacyState |
| 2 | 当前 | 实体类型化、扁平 state |
| 3 | M2.5 | ring1/ring2 + AffixRoll.tier + gameTimeMs |
| 4 | M3 | EnemyInstance.buffs/affixes，移除 enemy.bleed |
| 5 | M5 | 传说机制启用、套装 |

### 9.2 v2 → v3 迁移要点

- `equipment.ring` → `equipment.ring1`，`ring2` 设 null
- `AffixRoll { affixId, value }` → `AffixRoll { affixId, tier: 推断, values: [value] }`
  - tier 推断规则：根据 value 落在 affix 的哪个 tier 区间
- 新增 `gameTimeMs: 0`
- `stageModeUntil` 重置为 0（避免跨版本时间戳错乱）

### 9.3 单元测试要求

每个 migration 至少一个测试 case，从该版本的存档样本迁移到下一版本，验证关键字段保持。

## 10. 测试策略

| 层 | 工具 | 覆盖范围 |
|---|---|---|
| domain/formulas | vitest | 派生属性、装备评分、词缀计算 |
| engine/loot | vitest | 稀有度滚动、词缀 tier、筛选规则 |
| engine/damage | vitest | 伤害公式、buff 叠加 |
| engine/combatLoop | vitest | 完整 tick 流程，多种 build 跑 30 tick |
| engine/offline | vitest | 离线时间归一化、上限、待鉴定箱 |
| persistence/migrations | vitest | 每个版本一对样本 |
| ui | playwright（M4+） | 装备替换、筛选切换、Boss 击杀 |

每次改 engine 公式都要附测试。`__tests__/` 目录已经在 engine 和 persistence 下，沿用结构。

## 11. 性能预算

- React 重渲染：tick 900ms 一次，UI 整树重算无压力。M3 PixiJS 接入后 stage 自管刷新，React 只重算 UI 面板
- 离线模拟：8 小时 × 0.9s tick = 32000 次 tick。如果完整跑战斗循环约 300ms（可接受）。如不够再换聚合公式
- 实体数量：单屏最多 5 怪 + 10 投射物 + 5 AoE，不需要空间索引
- 存档大小：背包 30 件 × 8 词缀 ≈ 5KB，localStorage 无压力

## 12. 不做清单（重要）

| 不做 | 原因 |
|---|---|
| ECS | 实体规模 < 50，纯函数 + system 切片够用 |
| Redux / Redux Toolkit | reducer 已经能解决 |
| Zustand / Jotai | 单一 reducer 够用，避免引入异步状态 |
| 后端 / 云存档 | 单机阶段，localStorage 够用 |
| WebGL 自己写 | PixiJS 已经覆盖，省 1-2 个月 |
| ECS 物理引擎 | 横版自动战斗不需要碰撞物理 |
| 多职业 | 先把破誓骑士做透 |
| PvP / 社交 | 砍 |

## 13. 实施顺序（接 roadmap §4）

按依赖关系：

1. **#6 ItemInstance 占位字段** — 0.3d，无依赖，先加进去后面就不用动
2. **#1 ring1/ring2 + 迁移** — 0.5d，独立，建立 v2→v3 迁移框架
3. **#7 ZoneDefinition + Chapter** — 0.5d，独立
4. **#2 AffixRoll tier** — 1d，依赖 #1 的迁移框架
5. **#4 gameTimeMs** — 0.5d，依赖 #1 的迁移框架
6. **#3 action/reducer** — 1d，依赖前面所有结构稳定
7. **#5 StatModifier op** — 1.5d，独立做但需要数值平衡，最后做
8. **#8 第一个传说机制** — 1d，依赖 #6 的占位字段，验证整条链路

总 6.3 人日。每完成一项发一次提交，单测必须过。
