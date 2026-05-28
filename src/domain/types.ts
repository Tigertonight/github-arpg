export type EntityId = string

export type Rarity = 'normal' | 'magic' | 'rare' | 'epic' | 'legendary'

export type EquipmentSlot =
  | 'weapon'
  | 'offhand'
  | 'helm'
  | 'chest'
  | 'gloves'
  | 'boots'
  | 'amulet'
  | 'ring1'
  | 'ring2'
  | 'relic'

// BaseItem 用的逻辑槽位（'ring' 在装备时会落到 ring1 或 ring2）
export type BaseItemSlot = Exclude<EquipmentSlot, 'ring1' | 'ring2'> | 'ring'

export type ZoneAffixId =
  | 'zone_forge_heat'
  | 'zone_bleed_ground'
  | 'zone_silence_curse'
  | 'zone_bone_curse'
  | 'zone_permafrost'
  | 'zone_iron_toll'
  | 'zone_blood_moon'
  | 'zone_undead_resurgence'
  | 'zone_abyss_rot'
  | 'zone_forgemaw_frenzy'

export type DamageType = 'physical' | 'bleed'

export type StatKey =
  | 'physicalDamage'
  | 'attackSpeed'
  | 'bleedDamage'
  | 'bleedDuration'
  | 'executeDamage'
  | 'life'
  | 'armor'
  | 'magicFind'
  | 'goldFind'
  | 'lifeSteal'
  | 'evasion'
  | 'critChance'
  | 'critMultiplier'

export type AffixCategory = 'offense' | 'bleed' | 'defense' | 'loot' | 'skill' | 'legendary'

export interface StatModifier {
  stat: StatKey
  value: number
}

export interface AffixRollSpec {
  min: number
  max: number
}

/**
 * AffixTier：tier 1 是最高 tier（最稀有、数值最强），tier 6 是最低。
 * 一条词缀可包含多个 rolls（如「+10-20 物理伤害」就是 2 个 roll spec）。
 */
export interface AffixTier {
  tier: number
  minItemLevel: number
  rolls: AffixRollSpec[]
}

export interface AffixDefinition {
  id: EntityId
  name: string
  category: AffixCategory
  stat: StatKey
  tiers: AffixTier[]
  tags: string[]
}

export interface AffixRoll {
  affixId: EntityId
  tier: number
  values: number[]
  locked?: boolean
}

export interface BaseItem {
  id: EntityId
  name: string
  slot: BaseItemSlot
  implicitStats: StatModifier[]
  tags: string[]
}

export interface SocketState {
  kind: 'rune' | 'gem' | 'empty'
  refId?: EntityId
}

/**
 * 传说机制接入点（hook）。M4 暂用轻量 hook：战斗循环关键点查询激活的 power。
 * M3 重构成完整事件总线时再升级。
 */
export type LegendaryHookId =
  | 'onExecuteThreshold'   // 处决判定：可改阈值或伤害倍率
  | 'onBleedStack'         // 流血叠层：可改层数上限或单层伤害
  | 'onSkillCast'          // 技能命中：可触发额外效果

export interface LegendaryPower {
  id: EntityId
  name: string
  description: string
  hookId: LegendaryHookId
  /** 仅在该槽位的装备会启用此 power（用于掉落分配）。 */
  allowedSlots: EquipmentSlot[]
  params: Record<string, number>
}

export interface ItemSetDefinition {
  id: EntityId
  name: string
  pieceItemIds: EntityId[]
  bonuses: { piecesRequired: number; modifiers: StatModifier[] }[]
}

export interface ItemInstance {
  id: EntityId
  baseItemId: EntityId
  name: string
  slot: EquipmentSlot
  rarity: Rarity
  itemLevel: number
  affixes: AffixRoll[]
  tags: string[]
  createdAt: number
  legendaryPowerId?: EntityId
  setId?: EntityId
  sockets?: SocketState[]
}

export type EquipmentState = Record<EquipmentSlot, EntityId | null>

export interface ResourceState {
  gold: number
  shards: number
  chaosStones: number
  ember: number
  soulAsh: number
}

export interface SkillDefinition {
  id: EntityId
  name: string
  description: string
  baseCooldownMs: number
  damageScale: number
  bleedStacks: number
  /** 命中目标数。1 = 单体，>1 = 多体，Infinity = 全体。0 = 不打怪（如护盾）。 */
  aoeTargets: number
  tags: string[]
  automation: string
  color: string
}

export interface RuneDefinition {
  id: EntityId
  name: string
  skillId: EntityId
  description: string
  tags: string[]
}

export interface SkillState {
  skillId: EntityId
  runeId: EntityId
  cooldownRemainingMs: number
}

export interface Hero {
  id: EntityId
  name: string
  classId: 'oathbreaker'
  level: number
  xp: number
  currentLife: number
  equipment: EquipmentState
  skills: SkillState[]
  /** 横向位置：0-100，沿 lane 从左到右。travel 时向 enemyGroup 推进，combat 时冻结。 */
  x: number
}

export interface CombatStats {
  life: number
  armor: number
  physicalDamage: number
  attackSpeed: number
  bleedDamage: number
  bleedDurationMs: number
  executeDamage: number
  magicFind: number
  goldFind: number
  lifeSteal: number
  itemScore: number
  evasion: number
  critChance: number
  critMultiplier: number
}

export interface EnemyDefinition {
  id: EntityId
  name: string
  family: 'undead' | 'demon' | 'cultist' | 'construct' | 'beast' | 'primordial'
  rank: 'normal' | 'elite' | 'boss'
  baseLife: number
  baseArmor: number
  lootTableId: EntityId
}

export interface BleedState {
  stacks: number
  remainingMs: number
}

export interface EnemyInstance {
  id: EntityId
  enemyDefId: EntityId
  name: string
  rank: EnemyDefinition['rank']
  level: number
  currentLife: number
  maxLife: number
  armor: number
  bleed: BleedState
  /** 战斗中补位刷新的入场时间。存在时 UI 会先播放从屏幕外走入的动作。 */
  spawnedAtMs?: number
}

/** 一波敌人。整组共享一个横向锚点 x，组内成员相对锚点错开排列。 */
export interface EnemyGroup {
  /** 横向锚点 0-100，沿 lane 从右向左推进。 */
  x: number
  members: EnemyInstance[]
  /** 最近一次战斗中增援刷新时间。用于按时间流式刷怪，而不是死亡即补。 */
  lastSpawnAtMs?: number
}

export interface Chapter {
  id: EntityId
  name: string
  themeId: EntityId
  zoneIds: EntityId[]
  bossEnemyId: EntityId
  unlockStage: number
}

export interface ZoneDefinition {
  id: EntityId
  chapterId: EntityId
  name: string
  biome: string
  bossEveryStages: number
  enemyIds: EntityId[]
  bossEnemyId: EntityId
  globalAffixIds: EntityId[]
}

export interface LootTable {
  id: EntityId
  baseItemIds: EntityId[]
  currencyWeight: number
}

export interface LootFilterRule {
  id: 'keepRarePlus' | 'keepBleedAffixes' | 'autoSalvageNormal' | 'keepUpgrades'
  label: string
  enabled: boolean
}

export interface InventoryState {
  capacity: number
  itemIds: EntityId[]
  pendingOfflineLootIds: EntityId[]
  filter: LootFilterRule[]
}

export interface ProgressionState {
  zoneId: EntityId
  stage: number
  highestStage: number
  kills: number
}

export interface FloatingText {
  id: EntityId
  label: string
  kind: 'hit' | 'bleed' | 'execute' | 'loot' | 'levelup' | 'miss' | 'crit'
  xOffset?: number
}

export interface CombatLogEntry {
  id: EntityId
  text: string
}

export type StageMode = 'travel' | 'combat'

export interface GameState {
  version: number
  running: boolean
  /** 累计游戏内时间（毫秒）。每个 tick `+= dt`。不依赖 Date.now()，方便回放和离线模拟。 */
  gameTimeMs: number
  stageMode: StageMode
  /** stageModeUntil 是 gameTimeMs 单位（不是 Date.now()）。 */
  stageModeUntil: number
  hero: Hero
  resources: ResourceState
  inventory: InventoryState
  itemsById: Record<EntityId, ItemInstance>
  enemyGroup: EnemyGroup
  progression: ProgressionState
  combatLog: CombatLogEntry[]
  floatingTexts: FloatingText[]
  lastDrop?: ItemInstance
  lastSavedAt: number
  /** 缓存的战斗属性，避免每次渲染重新计算。 */
  cachedStats?: CombatStats
  /** RNG 种子，保证可重复的随机序列。 */
  rngSeed: number
  /** 战斗爆发状态截止时间（gameTimeMs 单位，0 表示不在爆发中）。 */
  burstUntilMs: number
  /** 最近一次 BOSS 击杀信息，用于 UI 弹窗展示。 */
  lastBossKill?: { bossName: string; stage: number; rewardText: string }
  /** 每日签到：上次签到日期（YYYY-MM-DD）。 */
  lastCheckInDate?: string
  /** 每日签到：连续签到天数。 */
  checkInStreak?: number
  /** Boss 层选择弹窗：是否正在等待玩家选择迎战/绕过。 */
  bossChoicePending?: boolean
  pendingOfflineResult?: { elapsedMs: number; kills: number; goldGained: number; itemsFound: number }
  /** 已触发里程碑 ID 集合。 */
  triggeredMilestones?: string[]
}

export interface DerivedItem {
  item: ItemInstance
  score: number
  affixLabels: string[]
  buildTags: string[]
}

export interface TickResult {
  state: GameState
  rewards: {
    gold: number
    shards: number
    xp: number
    keptItemIds: EntityId[]
    salvaged: number
  }
}
