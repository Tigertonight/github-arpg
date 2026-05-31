import { achievementsCatalog, type AchievementDefinition } from '../data/achievements'
import { addLog } from '../domain/formulas'
import type { GameState } from '../domain/types'

/**
 * 评估所有 polled 类成就，结算新解锁的奖励并写入战斗日志。
 * 调用时机：每次 boss 击杀后、推进 stage 后。频率不高，逐项 condition 评估开销可忽略。
 */
export function evaluateAchievements(state: GameState): GameState {
  const unlocked = state.unlockedAchievements ?? {}
  const newlyUnlocked: AchievementDefinition[] = []
  for (const def of achievementsCatalog) {
    if (def.trigger !== 'polled') continue
    if (unlocked[def.id]) continue
    if (!def.condition?.(state)) continue
    newlyUnlocked.push(def)
  }
  if (newlyUnlocked.length === 0) return state

  let next = state
  let nextUnlocked = { ...unlocked }
  let resources = next.resources
  let combatLog = next.combatLog
  for (const def of newlyUnlocked) {
    nextUnlocked[def.id] = { unlockedAtMs: next.gameTimeMs }
    resources = {
      ...resources,
      gold: resources.gold + (def.reward.gold ?? 0),
      shards: resources.shards + (def.reward.shards ?? 0),
      chaosStones: resources.chaosStones + (def.reward.chaosStones ?? 0),
    }
    const rewardParts: string[] = []
    if (def.reward.gold) rewardParts.push(`+${def.reward.gold} 金币`)
    if (def.reward.shards) rewardParts.push(`+${def.reward.shards} 裂片`)
    if (def.reward.chaosStones) rewardParts.push(`+${def.reward.chaosStones} 混沌石`)
    combatLog = addLog(combatLog, `成就解锁：${def.title}（${rewardParts.join(' ')}）`)
  }
  next = {
    ...next,
    unlockedAchievements: nextUnlocked,
    resources,
    combatLog,
  }
  return next
}

/**
 * 事件钩子：未来在具体事件点（巨额暴击、无伤通关）调用。
 * MVP 仅留入口，不挂任何事件源。
 */
export function unlockAchievement(state: GameState, id: string): GameState {
  if (state.unlockedAchievements?.[id]) return state
  const def = achievementsCatalog.find((a) => a.id === id)
  if (!def) return state
  const reward = def.reward
  return {
    ...state,
    unlockedAchievements: {
      ...(state.unlockedAchievements ?? {}),
      [id]: { unlockedAtMs: state.gameTimeMs },
    },
    resources: {
      ...state.resources,
      gold: state.resources.gold + (reward.gold ?? 0),
      shards: state.resources.shards + (reward.shards ?? 0),
      chaosStones: state.resources.chaosStones + (reward.chaosStones ?? 0),
    },
    combatLog: addLog(state.combatLog, `成就解锁：${def.title}`),
  }
}
