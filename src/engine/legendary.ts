import { legendaryPowersById } from '../data/legendaryPowers'
import type { GameState, LegendaryHookId, LegendaryPower } from '../domain/types'

/**
 * 扫装备栏，返回所有命中指定 hook 的传说机制。
 * 当前实现是 O(slots)，规模小（10 个槽）每 tick 调几次无压力。
 */
export function getActivePowers(state: GameState, hookId: LegendaryHookId): LegendaryPower[] {
  const result: LegendaryPower[] = []
  for (const itemId of Object.values(state.hero.equipment)) {
    if (!itemId) continue
    const item = state.itemsById[itemId]
    if (!item?.legendaryPowerId) continue
    const power = legendaryPowersById[item.legendaryPowerId]
    if (power?.hookId === hookId) result.push(power)
  }
  return result
}

/**
 * Execute 阈值聚合：用最宽松的阈值（多件叠加取 max），伤害倍率累乘。
 */
export function aggregateExecuteThreshold(
  state: GameState,
  defaultThreshold: number,
  defaultDamageMult: number,
): { threshold: number; damageMult: number } {
  let threshold = defaultThreshold
  let damageMult = defaultDamageMult
  for (const power of getActivePowers(state, 'onExecuteThreshold')) {
    if (typeof power.params.threshold === 'number') {
      threshold = Math.max(threshold, power.params.threshold)
    }
    if (typeof power.params.damageMult === 'number') {
      damageMult *= power.params.damageMult
    }
  }
  return { threshold, damageMult }
}

/**
 * 流血叠层聚合：层数上限取 max，单层伤害加成累加（additive）。
 */
export function aggregateBleedStack(
  state: GameState,
  defaultMaxStacks: number,
): { maxStacks: number; perStackDamage: number } {
  let maxStacks = defaultMaxStacks
  let perStackDamage = 0
  for (const power of getActivePowers(state, 'onBleedStack')) {
    if (typeof power.params.maxStacks === 'number') {
      maxStacks = Math.max(maxStacks, power.params.maxStacks)
    }
    if (typeof power.params.perStackDamage === 'number') {
      perStackDamage += power.params.perStackDamage
    }
  }
  return { maxStacks, perStackDamage }
}

/**
 * 技能命中触发：返回所有 onSkillCast power（调用方负责 rng 判定与效果应用）。
 */
export function getSkillCastTriggers(state: GameState): LegendaryPower[] {
  return getActivePowers(state, 'onSkillCast')
}
