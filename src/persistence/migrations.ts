import { createItem, defaultLootFilter } from '../engine/loot'
import { createEnemyForStage } from '../engine/progression'
import { randomRng } from '../engine/rng'
import { createEmptyEquipment } from '../domain/formulas'
import type { EquipmentSlot, GameState, ItemInstance, Rarity } from '../domain/types'

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
      enemy: createEnemyForStage('black_forge_mines', legacy.stage ?? 1, randomRng),
      progression: {
        zoneId: 'black_forge_mines',
        stage: legacy.stage ?? 1,
        highestStage: legacy.stage ?? 1,
        kills: legacy.kills ?? 0,
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

export function createStarterState(): GameState {
  const firstWeapon = createItem('black_forge', 1, 0, randomRng)
  const firstGloves = createItem('black_forge_elite', 1, 8, randomRng)
  firstWeapon.rarity = 'magic'
  firstWeapon.affixes = [{ affixId: 'cruel', value: 8 }, { affixId: 'deep_wound', value: 5 }]
  firstGloves.rarity = 'magic'
  firstGloves.affixes = [{ affixId: 'gouging', value: 9 }, { affixId: 'quick', value: 5 }]
  const equipment = createEmptyEquipment()
  equipment.weapon = firstWeapon.id
  equipment.gloves = firstGloves.id

  return {
    version: 2,
    running: true,
    hero: {
      id: 'hero_oathbreaker',
      name: '破誓骑士',
      classId: 'oathbreaker',
      level: 1,
      xp: 0,
      currentLife: 120,
      equipment,
      skills: [
        { skillId: 'cleave', runeId: 'deep_cut', cooldownRemainingMs: 0 },
        { skillId: 'lacerating_sweep', runeId: 'echo_sweep', cooldownRemainingMs: 1200 },
        { skillId: 'execute', runeId: 'blood_debt', cooldownRemainingMs: 2600 },
        { skillId: 'iron_oath', runeId: 'guardian_oath', cooldownRemainingMs: 5000 },
      ],
    },
    resources: {
      gold: 0,
      shards: 0,
      chaosStones: 0,
      ember: 0,
      soulAsh: 0,
    },
    inventory: {
      capacity: 30,
      itemIds: [],
      pendingOfflineLootIds: [],
      filter: defaultLootFilter,
    },
    itemsById: {
      [firstWeapon.id]: firstWeapon,
      [firstGloves.id]: firstGloves,
    },
    enemy: createEnemyForStage('black_forge_mines', 1, randomRng),
    progression: {
      zoneId: 'black_forge_mines',
      stage: 1,
      highestStage: 1,
      kills: 0,
    },
    combatLog: [{ id: 'starter_log', text: '破誓骑士踏入黑炉矿道，流血构筑已装配。' }],
    floatingTexts: [],
    lastSavedAt: Date.now(),
  }
}

function convertLegacyItem(item: LegacyItem): ItemInstance {
  const mapped = createItem('black_forge', item.level, item.find, randomRng)
  return {
    ...mapped,
    id: item.id,
    name: item.name,
    slot: slotMap[item.slot],
    rarity: rarityMap[item.rarity],
    itemLevel: item.level,
    affixes: [
      { affixId: 'cruel', value: Math.max(1, item.power) },
      { affixId: 'quick', value: Math.round(item.speed * 100) },
      { affixId: 'seeker', value: item.find },
    ],
    tags: ['migrated'],
  }
}
