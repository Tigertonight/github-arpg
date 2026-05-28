import { addLog, itemScore, rarityMeta } from '../domain/formulas'
import { affixesById } from '../data/affixes'
import type { EquipmentSlot, GameState, ItemInstance, LootFilterRule } from '../domain/types'
import { createStarterState } from '../persistence/starterState'
import type { GameAction } from './actions'
import { advanceCombat } from './combatLoop'
import { createRng } from './rng'
import { salvageValue } from './loot'
import { zoneIdForStage, createEnemyGroupForStage } from './progression'

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick':
      return state.running ? advanceCombat(state, action.dt) : state
    case 'equipItem':
      return equipItem(state, action.itemId)
    case 'salvageItem':
      return salvageItem(state, action.itemId)
    case 'toggleFilter':
      return toggleFilter(state, action.ruleId)
    case 'claimOffline':
      return claimOffline(state)
    case 'togglePause':
      return { ...state, running: !state.running }
    case 'reset':
      return createStarterState()
    case 'rerollAffix':
      return rerollAffix(state, action.itemId, action.affixIndex)
    case 'expandInventory':
      return expandInventory(state)
    case 'activateBurst':
      return activateBurst(state)
    case 'toggleAffixLock':
      return toggleAffixLock(state, action.itemId, action.affixIndex)
    case 'checkIn':
      return doCheckIn(state)
    case 'skipBoss': {
      const nextStage = state.progression.stage + 1
      const nextZoneId = zoneIdForStage(nextStage)
      const rng = createRng(state.rngSeed + Date.now())
      return {
        ...state,
        bossChoicePending: false,
        enemyGroup: createEnemyGroupForStage(nextZoneId, nextStage, rng, state.hero.x),
        progression: {
          ...state.progression,
          stage: nextStage,
          zoneId: nextZoneId,
          highestStage: Math.max(state.progression.highestStage, nextStage),
        },
        combatLog: addLog(state.combatLog, `选择绕过 Boss，推进至第 ${nextStage} 层。`),
      }
    }
    case 'resumeCombat':
      return { ...state, bossChoicePending: false }
    case 'retreat': {
      const currentStage = state.progression.stage
      const retreatStage = Math.max(1, Math.floor((currentStage - 1) / 10) * 10 + 1)
      if (retreatStage === currentStage) return state
      const retreatZoneId = zoneIdForStage(retreatStage)
      const rng = createRng(state.rngSeed + Date.now())
      return {
        ...state,
        bossChoicePending: false,
        enemyGroup: createEnemyGroupForStage(retreatZoneId, retreatStage, rng, state.hero.x),
        stageMode: 'travel',
        stageModeUntil: 0,
        progression: { ...state.progression, stage: retreatStage, zoneId: retreatZoneId },
        combatLog: addLog(state.combatLog, `主动撤退至第 ${retreatStage} 层。`),
      }
    }
    case 'salvageBelow':
      return salvageBelow(state, action.threshold)
    case 'dismissOfflineResult':
      return { ...state, pendingOfflineResult: undefined }
    case 'triggerMilestone':
      if ((state.triggeredMilestones ?? []).includes(action.milestoneId)) return state
      return {
        ...state,
        triggeredMilestones: [...(state.triggeredMilestones ?? []), action.milestoneId],
      }
    default:
      return state
  }
}

function equipItem(state: GameState, itemId: string): GameState {
  const item = state.itemsById[itemId]
  if (!item) return state

  const targetSlot = pickEquipSlot(state, item)
  const previous = state.hero.equipment[targetSlot]
  const inventoryIds = state.inventory.itemIds.filter((id) => id !== item.id)
  const pendingOfflineLootIds = state.inventory.pendingOfflineLootIds.filter((id) => id !== item.id)
  if (previous) inventoryIds.unshift(previous)

  return {
    ...state,
    hero: {
      ...state.hero,
      equipment: {
        ...state.hero.equipment,
        [targetSlot]: item.id,
      },
    },
    inventory: {
      ...state.inventory,
      itemIds: inventoryIds.slice(0, state.inventory.capacity),
      pendingOfflineLootIds,
    },
    combatLog: addLog(state.combatLog, `换上 ${item.name}，装备评分 ${itemScore(item)}。`),
  }
}

/**
 * 戒指允许进入 ring1 或 ring2。优先空槽，否则替换 instance.slot。
 * 其它槽位直接用 item.slot。
 */
function pickEquipSlot(state: GameState, item: ItemInstance): EquipmentSlot {
  if (item.slot === 'ring1' || item.slot === 'ring2') {
    if (!state.hero.equipment.ring1) return 'ring1'
    if (!state.hero.equipment.ring2) return 'ring2'
    return item.slot
  }
  return item.slot
}

function salvageItem(state: GameState, itemId: string): GameState {
  const item = state.itemsById[itemId]
  if (!item) return state

  const nextEquipment = { ...state.hero.equipment }
  for (const slot of Object.keys(nextEquipment) as EquipmentSlot[]) {
    if (nextEquipment[slot] === item.id) nextEquipment[slot] = null
  }
  const itemsById = { ...state.itemsById }
  delete itemsById[item.id]
  const shards = salvageValue(item)

  return {
    ...state,
    hero: {
      ...state.hero,
      equipment: nextEquipment,
    },
    resources: {
      ...state.resources,
      shards: state.resources.shards + shards,
      gold: state.resources.gold + item.itemLevel * rarityMeta[item.rarity].salvage,
    },
    inventory: {
      ...state.inventory,
      itemIds: state.inventory.itemIds.filter((id) => id !== item.id),
      pendingOfflineLootIds: state.inventory.pendingOfflineLootIds.filter((id) => id !== item.id),
    },
    itemsById,
    combatLog: addLog(state.combatLog, `分解 ${item.name}，获得 ${shards} 裂片。`),
  }
}

function toggleFilter(state: GameState, ruleId: LootFilterRule['id']): GameState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      filter: state.inventory.filter.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    },
  }
}

function claimOffline(state: GameState): GameState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      itemIds: [...state.inventory.pendingOfflineLootIds, ...state.inventory.itemIds].slice(
        0,
        state.inventory.capacity,
      ),
      pendingOfflineLootIds: [],
    },
    combatLog: addLog(state.combatLog, '离线战利品已鉴定并放入背包。'),
  }
}

function rerollAffix(state: GameState, itemId: string, affixIndex: number): GameState {
  const item = state.itemsById[itemId]
  if (!item) return state
  const CHAOS_COST = 3
  if (state.resources.chaosStones < CHAOS_COST) return state

  const affix = item.affixes[affixIndex]
  if (!affix || affix.locked) return state

  const affixDef = affixesById[affix.affixId]
  const tierDef = affixDef?.tiers.find(t => t.tier === affix.tier)
  if (!affixDef || !tierDef) return state

  const rng = createRng(state.rngSeed + Math.floor(state.gameTimeMs))
  const newValues = tierDef.rolls.map(spec =>
    Math.round(spec.min + rng.next() * (spec.max - spec.min))
  )

  const newAffixes = item.affixes.map((a, i) =>
    i === affixIndex ? { ...a, values: newValues } : a
  )

  return {
    ...state,
    resources: { ...state.resources, chaosStones: state.resources.chaosStones - CHAOS_COST },
    itemsById: {
      ...state.itemsById,
      [itemId]: { ...item, affixes: newAffixes }
    },
    combatLog: addLog(state.combatLog, `重铸 ${affixDef.name}，消耗 ${CHAOS_COST} 混沌石。`),
  }
}

function expandInventory(state: GameState): GameState {
  const GOLD_COST = 500 + state.inventory.capacity * 200
  if (state.resources.gold < GOLD_COST) return state
  return {
    ...state,
    resources: { ...state.resources, gold: state.resources.gold - GOLD_COST },
    inventory: { ...state.inventory, capacity: state.inventory.capacity + 8 },
    combatLog: addLog(state.combatLog, `背包扩容至 ${state.inventory.capacity + 8} 格，消耗 ${GOLD_COST} 金币。`),
  }
}

function activateBurst(state: GameState): GameState {
  const GOLD_COST = 200
  if (state.resources.gold < GOLD_COST) return state
  if (state.burstUntilMs > state.gameTimeMs) return state
  return {
    ...state,
    resources: { ...state.resources, gold: state.resources.gold - GOLD_COST },
    burstUntilMs: state.gameTimeMs + 30_000,
    combatLog: addLog(state.combatLog, '激活战斗爆发！攻速+50%，持续 30 秒。'),
  }
}

function toggleAffixLock(state: GameState, itemId: string, affixIndex: number): GameState {
  const item = state.itemsById[itemId]
  if (!item) return state
  const newAffixes = item.affixes.map((a, i) =>
    i === affixIndex ? { ...a, locked: !a.locked } : a
  )
  return {
    ...state,
    itemsById: {
      ...state.itemsById,
      [itemId]: { ...item, affixes: newAffixes },
    },
  }
}

function doCheckIn(state: GameState): GameState {
  const today = new Date().toISOString().slice(0, 10)
  if (state.lastCheckInDate === today) return state
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const streak = state.lastCheckInDate === yesterday ? (state.checkInStreak ?? 0) + 1 : 1
  const reward = Math.min(streak, 7) * 100
  const shardReward = Math.min(streak, 7) * 5
  return {
    ...state,
    lastCheckInDate: today,
    checkInStreak: streak,
    resources: {
      ...state.resources,
      gold: state.resources.gold + reward,
      shards: state.resources.shards + shardReward,
    },
    combatLog: addLog(state.combatLog,
      `🎁 签到第 ${streak} 天！获得 ${reward} 金币 + ${shardReward} 裂片。`,
    ),
  }
}

function salvageBelow(state: GameState, threshold: number): GameState {
  const idsToSalvage = state.inventory.itemIds.filter((id) => {
    const item = state.itemsById[id]
    return item && itemScore(item) < threshold
  })
  if (idsToSalvage.length === 0) return state

  let totalShards = 0
  let totalGold = 0
  const itemsById = { ...state.itemsById }
  for (const id of idsToSalvage) {
    const item = itemsById[id]
    if (!item) continue
    totalShards += salvageValue(item)
    totalGold += item.itemLevel * rarityMeta[item.rarity].salvage
    delete itemsById[id]
  }
  return {
    ...state,
    hero: {
      ...state.hero,
      equipment: (() => {
        const eq = { ...state.hero.equipment }
        for (const slot of Object.keys(eq) as EquipmentSlot[]) {
          if (idsToSalvage.includes(eq[slot] as string)) eq[slot] = null
        }
        return eq
      })(),
    },
    resources: {
      ...state.resources,
      shards: state.resources.shards + totalShards,
      gold: state.resources.gold + totalGold,
    },
    inventory: {
      ...state.inventory,
      itemIds: state.inventory.itemIds.filter((id) => !idsToSalvage.includes(id)),
      pendingOfflineLootIds: state.inventory.pendingOfflineLootIds.filter((id) => !idsToSalvage.includes(id)),
    },
    itemsById,
    combatLog: addLog(state.combatLog, `批量分解 ${idsToSalvage.length} 件低评分道具，获得 ${totalShards} 裂片。`),
  }
}
