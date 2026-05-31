import { affixesById, inferTierFromValue } from '../data/affixes'
import { createItem } from '../engine/loot'
import {
  createEnemyGroupForStage,
  ENEMY_SPAWN_AHEAD,
  HERO_START_X,
} from '../engine/progression'
import { randomRng } from '../engine/rng'
import { createEmptyEquipment } from '../domain/formulas'
import { createStarterState } from './starterState'
import type {
  EnemyGroup,
  EnemyInstance,
  EquipmentSlot,
  EquipmentState,
  GameState,
  ItemInstance,
  Rarity,
} from '../domain/types'

export const CURRENT_SAVE_VERSION = 10

export { createStarterState }

type LegacyItem = {
  id: string
  name: string
  slot: 'weapon' | 'armor' | 'charm'
  rarity: 'common' | 'magic' | 'rare' | 'epic' | 'legendary'
  power: number
  speed: number
  find: number
  level: number
}

type LegacyState = {
  stage?: number
  gold?: number
  shards?: number
  kills?: number
  xp?: number
  inventory?: LegacyItem[]
  equipment?: Partial<Record<LegacyItem['slot'], LegacyItem | null>>
  log?: string[]
  lastSeen?: number
}

const rarityMap: Record<LegacyItem['rarity'], Rarity> = {
  common: 'normal',
  magic: 'magic',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
}

const slotMap: Record<LegacyItem['slot'], EquipmentSlot> = {
  weapon: 'weapon',
  armor: 'chest',
  charm: 'relic',
}

export function migrateLegacyState(raw: string | null): GameState | null {
  if (!raw) return null
  try {
    const legacy = JSON.parse(raw) as LegacyState
    if (!legacy || typeof legacy !== 'object' || !('enemyHp' in legacy || 'stage' in legacy)) return null
    const state = createStarterState()
    const legacyItems = [...(legacy.inventory ?? []), ...Object.values(legacy.equipment ?? {}).filter((item): item is LegacyItem => Boolean(item))]
    const converted = legacyItems.map(convertLegacyItem)
    const itemsById = Object.fromEntries(converted.map((item) => [item.id, item]))
    const equipment = createEmptyEquipment()

    for (const [legacySlot, legacyItem] of Object.entries(legacy.equipment ?? {})) {
      if (!legacyItem) continue
      const convertedItem = converted.find((item) => item.id === legacyItem.id)
      if (convertedItem) equipment[slotMap[legacySlot as LegacyItem['slot']]] = convertedItem.id
    }

    return {
      ...state,
      version: CURRENT_SAVE_VERSION,
      hero: {
        ...state.hero,
        xp: legacy.xp ?? 0,
        level: Math.floor((legacy.xp ?? 0) / 140) + 1,
        equipment,
      },
      resources: {
        ...state.resources,
        gold: legacy.gold ?? 0,
        shards: legacy.shards ?? 0,
      },
      inventory: {
        ...state.inventory,
        itemIds: converted.map((item) => item.id).filter((id) => !Object.values(equipment).includes(id)).slice(0, state.inventory.capacity),
      },
      itemsById,
      enemyGroup: createEnemyGroupForStage('black_forge_mines', legacy.stage ?? 1, randomRng),
      progression: {
        zoneId: 'black_forge_mines',
        stage: legacy.stage ?? 1,
        highestStage: legacy.stage ?? 1,
        kills: legacy.kills ?? 0,
        torment: 0,
        maxTormentUnlocked: 0,
      },
      combatLog: [
        { id: 'migration_log', text: '旧版营地记录已迁移为黑炉矿道存档。' },
        ...(legacy.log ?? []).map((text, index) => ({ id: `legacy_log_${index}`, text })),
      ].slice(0, 8),
      lastSavedAt: legacy.lastSeen ?? Date.now(),
    }
  } catch {
    return null
  }
}

/**
 * v4 → v5 迁移：
 * - 加 rngSeed 字段（随机种子入存档）
 */
export function migrateV4ToV5(state: any): GameState {
  return {
    ...state,
    version: 5,
    rngSeed: Math.floor(Math.random() * 2147483646),
  } as GameState
}

/**
 * v5 → v6 迁移：
 * - 加 burstUntilMs 字段（战斗爆发状态）
 */
export function migrateV5ToV6(state: any): GameState {
  return {
    ...state,
    version: 6,
    burstUntilMs: state.burstUntilMs ?? 0,
  } as GameState
}

/**
 * v6 → v7 迁移：
 * - 加 lastCheckInDate / checkInStreak 字段（每日签到）
 */
export function migrateV6ToV7(state: any): GameState {
  return {
    ...state,
    version: 7,
    lastCheckInDate: undefined,
    checkInStreak: 0,
  } as GameState
}

/**
 * v7 → v8 迁移：
 * - 加 bossChoicePending 字段（Boss 层选择弹窗）
 */
export function migrateV7ToV8(state: any): GameState {
  return {
    ...state,
    version: 8,
    bossChoicePending: false,
  } as GameState
}

/**
 * v8 → v9 迁移：
 * - 加 hero.skillProgress：每个已装备技能初始化 lvl 1, xp 0, runeChoices 全空
 */
export function migrateV8ToV9(state: any): GameState {
  const skills = state.hero?.skills ?? []
  const skillProgress: Record<string, any> = {}
  for (const skill of skills) {
    skillProgress[skill.skillId] = {
      skillId: skill.skillId,
      level: 1,
      xp: 0,
      runeChoices: { 5: null, 10: null, 15: null },
    }
  }
  return {
    ...state,
    version: 9,
    hero: {
      ...state.hero,
      skillProgress,
    },
  } as GameState
}

/**
 * v9 → v10 迁移：
 * - ProgressionState 加 torment / maxTormentUnlocked（默认 0）
 */
export function migrateV9ToV10(state: any): GameState {
  return {
    ...state,
    version: 10,
    progression: {
      ...state.progression,
      torment: state.progression?.torment ?? 0,
      maxTormentUnlocked: state.progression?.maxTormentUnlocked ?? 0,
    },
  } as GameState
}

/**
 * v2 → v3 迁移：
 * - equipment.ring → equipment.ring1（ring2 设 null）
 * - ItemInstance.slot === 'ring' 的实例落到 ring1
 * - AffixRoll: { value } → { tier, values: [value] }
 */
export function migrateV2ToV3(state: any): any {
  if (!state || typeof state !== 'object') return createStarterState()

  const itemsById: Record<string, any> = { ...(state.itemsById ?? {}) }
  for (const id of Object.keys(itemsById)) {
    const item = itemsById[id]
    let next = item
    if (next.slot === 'ring') next = { ...next, slot: 'ring1' }
    next = { ...next, affixes: (next.affixes ?? []).map(migrateAffixRoll) }
    itemsById[id] = next
  }

  const oldEquipment = state.hero?.equipment ?? {}
  const equipment: EquipmentState = {
    weapon: oldEquipment.weapon ?? null,
    offhand: oldEquipment.offhand ?? null,
    helm: oldEquipment.helm ?? null,
    chest: oldEquipment.chest ?? null,
    gloves: oldEquipment.gloves ?? null,
    boots: oldEquipment.boots ?? null,
    amulet: oldEquipment.amulet ?? null,
    ring1: oldEquipment.ring1 ?? oldEquipment.ring ?? null,
    ring2: oldEquipment.ring2 ?? null,
    relic: oldEquipment.relic ?? null,
  }

  return {
    ...state,
    version: 3,
    gameTimeMs: state.gameTimeMs ?? 0,
    // 跨版本迁移 stageModeUntil 是旧的 Date.now() 时间戳，重置为 0 避免错乱。
    stageModeUntil: 0,
    hero: {
      ...state.hero,
      equipment,
    },
    itemsById,
  }
}

/**
 * v3 → v4 迁移：
 * - state.enemy 单只 → state.enemyGroup { x, members: [enemy] }
 * - hero.x 默认值（HERO_START_X）
 * - stageModeUntil 不再使用，重置为 0
 */
export function migrateV3ToV4(state: any): GameState {
  if (!state || typeof state !== 'object') return createStarterState()

  const heroX = typeof state.hero?.x === 'number' ? state.hero.x : HERO_START_X
  const legacyEnemy: EnemyInstance | undefined = state.enemy
  const enemyGroup: EnemyGroup = legacyEnemy
    ? { x: heroX + ENEMY_SPAWN_AHEAD, members: [legacyEnemy] }
    : createEnemyGroupForStage(state.progression?.zoneId ?? 'black_forge_mines', state.progression?.stage ?? 1, randomRng, heroX)

  const { enemy: _omit, ...rest } = state

  return {
    ...rest,
    version: CURRENT_SAVE_VERSION,
    stageModeUntil: 0,
    hero: {
      ...state.hero,
      x: heroX,
    },
    enemyGroup,
  } as GameState
}

function migrateAffixRoll(raw: any) {
  if (!raw || typeof raw !== 'object') return raw
  // 已经是 v3 形态
  if (Array.isArray(raw.values) && typeof raw.tier === 'number') return raw
  // v2 形态：{ affixId, value }
  const def = affixesById[raw.affixId]
  if (!def) return { affixId: raw.affixId, tier: 5, values: [raw.value ?? 0] }
  const value = raw.value ?? 0
  return { affixId: raw.affixId, tier: inferTierFromValue(def, value), values: [value] }
}

function convertLegacyItem(item: LegacyItem): ItemInstance {
  const mapped = createItem('black_forge', item.level, item.find, randomRng)
  const power = Math.max(1, item.power)
  const speed = Math.round(item.speed * 100)
  return {
    ...mapped,
    id: item.id,
    name: item.name,
    slot: slotMap[item.slot],
    rarity: rarityMap[item.rarity],
    itemLevel: item.level,
    affixes: [
      { affixId: 'cruel', tier: inferTierFromValue(affixesById.cruel, power), values: [power] },
      { affixId: 'quick', tier: inferTierFromValue(affixesById.quick, speed), values: [speed] },
      { affixId: 'seeker', tier: inferTierFromValue(affixesById.seeker, item.find), values: [item.find] },
    ],
    tags: ['migrated'],
  }
}
