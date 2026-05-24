import { enemiesById } from '../data/enemies'
import { deriveCombatStats, rarityMeta } from '../domain/formulas'
import type { GameState } from '../domain/types'
import { applyLootFilter, createItem, salvageValue } from './loot'
import { createRng } from './rng'

const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000

export function applyOfflineProgress(state: GameState, now = Date.now()): GameState {
  const elapsed = Math.max(0, Math.min(OFFLINE_CAP_MS, now - state.lastSavedAt))
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return { ...state, running: true, lastSavedAt: now }

  const stats = deriveCombatStats(state.hero.equipment, state.itemsById, state.hero.level)
  const safeStage = Math.max(1, state.progression.highestStage - (state.progression.highestStage % 10 === 0 ? 1 : 0))
  const estimatedKills = Math.max(1, Math.floor(minutes * Math.min(1.8, 0.45 + stats.itemScore / 900 + stats.attackSpeed * 0.12)))
  const rng = createRng(now + safeStage)
  const next = {
    ...state,
    resources: { ...state.resources },
    inventory: { ...state.inventory, pendingOfflineLootIds: [...state.inventory.pendingOfflineLootIds] },
    itemsById: { ...state.itemsById },
    combatLog: [...state.combatLog],
    running: true,
    lastSavedAt: now,
  }

  for (let index = 0; index < estimatedKills; index += 1) {
    const table = index % 5 === 4 ? 'black_forge_elite' : enemiesById.bone_miner.lootTableId
    const item = createItem(table, safeStage, stats.magicFind * 0.7, rng)
    const action = applyLootFilter(item, next)
    if (action === 'keep' && next.inventory.pendingOfflineLootIds.length < 24) {
      next.itemsById[item.id] = item
      next.inventory.pendingOfflineLootIds.unshift(item.id)
    } else {
      next.resources.shards += salvageValue(item)
    }
    next.resources.gold += Math.round((8 + safeStage * 4) * (1 + stats.goldFind / 100))
  }

  const best = next.inventory.pendingOfflineLootIds
    .map((id) => next.itemsById[id])
    .sort((a, b) => rarityMeta[b.rarity].salvage - rarityMeta[a.rarity].salvage)[0]

  next.combatLog = [
    { id: `offline_${now}`, text: `离线巡猎 ${minutes} 分钟，刷过已通过层并带回 ${estimatedKills} 份战利品。${best ? `最佳掉落：${best.name}。` : ''}` },
    ...next.combatLog,
  ].slice(0, 8)

  return next
}
