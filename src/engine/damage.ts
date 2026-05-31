import { skillsById } from '../data/skills'
import type { CombatStats, EnemyInstance, SkillState } from '../domain/types'

export interface ExecuteParams {
  threshold: number
  damageMult: number
}

export interface BleedParams {
  maxStacks: number
  perStackDamage: number
}

const DEFAULT_EXECUTE: ExecuteParams = { threshold: 0.35, damageMult: 1 }
const DEFAULT_BLEED: BleedParams = { maxStacks: 9, perStackDamage: 0 }

export function isExecuteReady(skill: SkillState, enemy: EnemyInstance, exec: ExecuteParams = DEFAULT_EXECUTE) {
  if (skill.skillId !== 'execute') return false
  return enemy.currentLife / enemy.maxLife <= exec.threshold || enemy.bleed.stacks >= 5
}

export interface HitMods {
  /** 强制暴击（executioner_rhythm 等 rune 用）。 */
  forceCrit?: boolean
  /** 强制按处决伤害结算（executioner_rhythm 等 rune 用）。 */
  forceExecute?: boolean
  /** 额外伤害乘子（momentum_charge / lunge_strike / crimson_harvest / ironbound_vow 等）。 */
  damageMultiplier?: number
}

export function physicalHit(
  stats: CombatStats,
  enemy: EnemyInstance,
  skill: SkillState,
  exec: ExecuteParams = DEFAULT_EXECUTE,
  mods: HitMods = {},
): { damage: number; isCrit: boolean } {
  const definition = skillsById[skill.skillId]
  const armorReduction = enemy.armor / (enemy.armor + 180 + enemy.level * 12)
  const base = stats.physicalDamage * definition.damageScale
  const executeReady = mods.forceExecute || isExecuteReady(skill, enemy, exec)
  const bleedExecuteBonus = skill.runeId === 'blood_debt' ? enemy.bleed.stacks * 0.12 : 0
  const executeMultiplier = executeReady ? (1.8 + stats.executeDamage + bleedExecuteBonus) * exec.damageMult : 1
  const isCrit = mods.forceCrit ? true : Math.random() * 100 < stats.critChance
  const critMul = isCrit ? stats.critMultiplier : 1
  const runeMul = mods.damageMultiplier ?? 1
  return { damage: Math.max(0, Math.round(base * executeMultiplier * (1 - armorReduction) * critMul * runeMul)), isCrit }
}

export function bleedTickDamage(
  stats: CombatStats,
  enemy: EnemyInstance,
  deltaMs: number,
  bleed: BleedParams = DEFAULT_BLEED,
) {
  if (enemy.bleed.stacks <= 0 || enemy.bleed.remainingMs <= 0) return 0
  const stackBonus = 1 + enemy.bleed.stacks * bleed.perStackDamage
  const damagePerSecond = stats.bleedDamage * enemy.bleed.stacks * stackBonus
  return Math.round((damagePerSecond * deltaMs) / 1000)
}

export function nextBleed(
  enemy: EnemyInstance,
  stacks: number,
  durationMs: number,
  bleed: BleedParams = DEFAULT_BLEED,
) {
  return {
    stacks: Math.min(bleed.maxStacks, enemy.bleed.stacks + stacks),
    remainingMs: Math.max(enemy.bleed.remainingMs, durationMs),
  }
}
