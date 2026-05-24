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
  | 'ring'
  | 'relic'

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

export type AffixCategory = 'offense' | 'bleed' | 'defense' | 'loot'

export interface StatModifier {
  stat: StatKey
  value: number
}

export interface AffixDefinition {
  id: EntityId
  name: string
  category: AffixCategory
  stat: StatKey
  min: number
  max: number
  tags: string[]
}

export interface AffixRoll {
  affixId: EntityId
  value: number
}

export interface BaseItem {
  id: EntityId
  name: string
  slot: EquipmentSlot
  implicitStats: StatModifier[]
  tags: string[]
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
  tags: string[]
  automation: string
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
  itemScore: number
}

export interface EnemyDefinition {
  id: EntityId
  name: string
  family: 'undead' | 'demon' | 'cultist' | 'construct'
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
}

export interface ZoneDefinition {
  id: EntityId
  name: string
  biome: string
  bossEveryStages: number
  enemyIds: EntityId[]
  bossEnemyId: EntityId
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
  kind: 'hit' | 'bleed' | 'execute' | 'loot'
}

export interface CombatLogEntry {
  id: EntityId
  text: string
}

export type StageMode = 'travel' | 'combat'

export interface GameState {
  version: number
  running: boolean
  stageMode: StageMode
  stageModeUntil: number
  hero: Hero
  resources: ResourceState
  inventory: InventoryState
  itemsById: Record<EntityId, ItemInstance>
  enemy: EnemyInstance
  progression: ProgressionState
  combatLog: CombatLogEntry[]
  floatingTexts: FloatingText[]
  lastDrop?: ItemInstance
  lastSavedAt: number
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
