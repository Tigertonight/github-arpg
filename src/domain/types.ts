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
  /** 解锁该 rune 所需的技能等级槽位（5/10/15）。旧 rune 未指定时按 5 处理。 */
  slot?: 5 | 10 | 15
}

export interface SkillState {
  skillId: EntityId
  runeId: EntityId
  cooldownRemainingMs: number
}

/** 技能等级 + 已选 rune 分支。每级 5/10/15 解锁一个 rune slot，玩家 3 选 1。 */
export interface SkillProgress {
  skillId: EntityId
  level: number
  xp: number
  /** 各 slot 已选 rune；未达解锁等级时为 null。slot key 即解锁等级。 */
  runeChoices: { 5: EntityId | null; 10: EntityId | null; 15: EntityId | null }
}

export type RuneSlotLevel = 5 | 10 | 15

export interface Hero {
  id: EntityId
  name: string
  classId: 'oathbreaker' | 'ash_hunter' | 'grave_votary' | 'iron_gaoler'
  level: number
  xp: number
  currentLife: number
  equipment: EquipmentState
  skills: SkillState[]
  /** 每个技能的 XP/等级/已选 rune。键为 skillId。 */
  skillProgress: Record<EntityId, SkillProgress>
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

export type SpriteAction = 'idle' | 'walk' | 'attack' | 'cleave' | 'sweep' | 'execute' | 'shield' | 'hit' | 'death'

export interface SpriteSheetDefinition {
  src: string
  frames: number
  durationMs: number
}

export interface HeroVisualDefinition {
  id: EntityId
  portrait: string
  anchor: { x: number; y: number }
  scale: number
  actions: Partial<Record<SpriteAction, SpriteSheetDefinition>>
  attackFrames: string[]
  vfx: Record<string, string>
}

export interface EnemyVisualDefinition {
  enemyDefId: EntityId
  familyClass: 'enemy-sheet-humanoid' | 'enemy-sheet-beast' | 'enemy-sheet-brute'
  anchor: { x: number; y: number }
  scale: number
  actions: Partial<Record<SpriteAction, SpriteSheetDefinition>>
}

export interface ZoneVisualDefinition {
  zoneId: EntityId
  backgroundLoop: string
  backgroundSize: string
  ground: string
  groundOpacity: number
  foreground: string
  foregroundOpacity: number
  ambient: 'embers' | 'snow' | 'mist' | 'bloodMoon' | 'abyssAsh'
  palette: 'forge' | 'furnace' | 'choir' | 'ossuary' | 'wastes' | 'caravan' | 'crimson' | 'crypt' | 'abyss' | 'core'
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
  /** oath_brand rune：被烙印的层数（最多 3）。仅持有该 rune 时累计。 */
  brandStacks?: number
  /** family trait 单次性状态：last_rite 留 1HP / bone_reform 复生概率，每场战斗仅触发一次。 */
  traitConsumed?: boolean
  /** 队形槽位。渲染位置按这个稳定槽位计算，避免前排死亡后后排因数组下标变化瞬移。 */
  formationSlot?: number
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

/** 每日目标种类：杀敌数、推进层数、捡到稀有+ 物品 */
export type DailyGoalKind = 'kill' | 'stage' | 'rareLoot'

export interface DailyGoal {
  id: DailyGoalKind
  label: string
  target: number
  progress: number
  rewardGold: number
  rewardShards: number
  /** 已领取奖励 */
  claimed: boolean
}

export interface DailyGoalsState {
  /** 当前一组目标对应的 YYYY-MM-DD 日期。新日期会重置 goals。 */
  date: string
  goals: DailyGoal[]
}

export interface ProgressionState {
  zoneId: EntityId
  stage: number
  highestStage: number
  kills: number
  /** 当前难度档（0 = 普通；每档 +60% HP / +12 MF / +8 ilvl） */
  torment: number
  /** 已解锁的最高难度档；解锁条件：在该档下击败 stage 100 boss */
  maxTormentUnlocked: number
}

export interface FloatingText {
  id: EntityId
  label: string
  kind: 'hit' | 'bleed' | 'execute' | 'loot' | 'levelup' | 'miss' | 'crit' | 'kill'
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
  /** 每日目标进度（每天首次进入游戏时刷新）。 */
  dailyGoals?: DailyGoalsState
  /** Cleave rune 战斗状态：势能层、命中计数等。仅在持有相应 rune 时使用。 */
  cleaveRuneState?: {
    /** momentum_charge：当前势能层数（0-5）。 */
    momentumStacks: number
    /** executioner_rhythm：cleave 命中计数（用于每 4 次强制暴击+处决）。 */
    rhythmHitCount: number
    /** chain_reaver：待结算的弹射列表（spawn 时写入，下个 tick 结算）。 */
    pendingChainHits: { targetId: EntityId; damage: number; bleedStacks: number; resolveAtMs: number }[]
  }
  /** Sweep rune 战斗状态。仅在持有相应 rune 时使用。 */
  sweepRuneState?: {
    /** tearing_momentum：撕裂势能层数（0-5），下次 sweep 命中时按 +20%/层结算后清空。 */
    tearingStacks: number
    /** marrow_split：当前 tick 内已触发过裂射（防同 tick 多次）。 */
    marrowTriggeredAtMs: number
  }
  /** Execute rune 战斗状态。仅在持有相应 rune 时使用。 */
  executeRuneState?: {
    /** chained_execution：本场战斗内还能再用 1 次链式处决。每次进战重置为 1。 */
    chainCharges: number
    /** executioner_brand：被处决标记的目标 id 集合（下次任意命中必暴击后清除）。 */
    brandedTargetIds: EntityId[]
  }
  /** Iron oath rune 战斗状态。仅在持有相应 rune 时使用。 */
  oathRuneState?: {
    /** oathbound_shield：armor +50% 持续到该时间（gameTimeMs）。 */
    armorBuffUntilMs: number
    /** vow_of_retribution：反伤 30% 持续到该时间。 */
    retributionUntilMs: number
    /** martyr_oath：殉道反弹持续到该时间。 */
    martyrUntilMs: number
  }
  /** 敌人图鉴：每只 enemy 的遇见/击杀计数。key 为 enemyDefId。 */
  bestiary?: Record<EntityId, BestiaryEntry>
  /** 已解锁成就：key=achievementId, value 为解锁时间戳（gameTimeMs）。 */
  unlockedAchievements?: Record<EntityId, { unlockedAtMs: number }>
  /** 当前 zone 的临时词条事件（每 10 stage 进新 zone 时 roll 一次）。 */
  zoneMod?: { zoneId: EntityId; modId: string; rolledAtStage: number }
  /** 当前 stage 是否处于赤潮事件中（每个 stage 战斗触发时独立 roll）。 */
  crimsonTideActive?: boolean
  /** QA 沙盒模式：开启后跳过推关/写存档/zone事件，纯做美术验证。 */
  qaMode?: boolean
}

export interface BestiaryEntry {
  /** 是否曾经遇到（即使未击杀）。 */
  encountered: boolean
  /** 总击杀次数。 */
  kills: number
  /** 精英击杀。 */
  eliteKills: number
  /** boss 击杀。 */
  bossKills: number
  /** 首次击杀的 gameTimeMs；未击杀为 0。 */
  firstKillAtMs: number
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
