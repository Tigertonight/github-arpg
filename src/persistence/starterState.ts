import { defaultLootFilter } from '../engine/loot'
import {
  createEnemyGroupForStage,
  HERO_START_X,
} from '../engine/progression'
import { randomRng } from '../engine/rng'
import { createEmptyEquipment, deriveCombatStats } from '../domain/formulas'
import { createId } from '../domain/ids'
import type {
  GameState,
  ItemInstance,
} from '../domain/types'

/** 与 migrations.ts 的 CURRENT_SAVE_VERSION 保持一致。 */
const _STARTER_VERSION = 8

export function createStarterState(): GameState {
  const now = Date.now()
  const starterWeaponId = createId('item')
  const starterWeapon: ItemInstance = {
    id: starterWeaponId,
    baseItemId: 'rusted_cleaver',
    name: '破旧铁剑',
    slot: 'weapon',
    rarity: 'normal',
    itemLevel: 1,
    affixes: [
      { affixId: 'cruel', tier: 5, values: [3], locked: false },
    ],
    tags: ['axe', 'physical'],
    createdAt: now,
  }

  const starterChestId = createId('item')
  const starterChest: ItemInstance = {
    id: starterChestId,
    baseItemId: 'charred_plate',
    name: '破旧皮甲',
    slot: 'chest',
    rarity: 'normal',
    itemLevel: 1,
    affixes: [
      { affixId: 'vital', tier: 5, values: [12], locked: false },
    ],
    tags: ['armor'],
    createdAt: now,
  }

  const equipment = createEmptyEquipment()
  equipment.weapon = starterWeaponId
  equipment.chest = starterChestId

  const starterStats = deriveCombatStats(equipment, { [starterWeaponId]: starterWeapon, [starterChestId]: starterChest }, 1)

  return {
    version: _STARTER_VERSION,
    running: true,
    gameTimeMs: 0,
    stageMode: 'travel',
    stageModeUntil: 1800,
    lastCheckInDate: undefined,
    checkInStreak: 0,
    hero: {
      id: 'hero_oathbreaker',
      name: '破誓骑士',
      classId: 'oathbreaker',
      level: 1,
      xp: 0,
      currentLife: starterStats.life,
      equipment,
      x: HERO_START_X,
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
      [starterWeaponId]: starterWeapon,
      [starterChestId]: starterChest,
    },
    enemyGroup: createEnemyGroupForStage('black_forge_mines', 1, randomRng),
    progression: {
      zoneId: 'black_forge_mines',
      stage: 1,
      highestStage: 1,
      kills: 0,
    },
    combatLog: [{ id: 'starter_log', text: '破誓骑士踏入黑炉矿道，流血构筑已装配。' }],
    floatingTexts: [],
    lastSavedAt: now,
    rngSeed: Math.floor(Math.random() * 2147483646),
    burstUntilMs: 0,
    bossChoicePending: false,
    triggeredMilestones: [],
  }
}
