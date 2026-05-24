import { skillsById } from '../data/skills'
import type { CombatStats, EnemyInstance, SkillState } from '../domain/types'

export function physicalHit(stats: CombatStats, enemy: EnemyInstance, skill: SkillState) {
  const definition = skillsById[skill.skillId]
  const armorReduction = enemy.armor / (enemy.armor + 180 + enemy.level * 12)
  const base = stats.physicalDamage * definition.damageScale
  const executeReady = skill.skillId === 'execute' && (enemy.currentLife / enemy.maxLife <= 0.35 || enemy.bleed.stacks >= 5)
  const bleedExecuteBonus = skill.runeId === 'blood_debt' ? enemy.bleed.stacks * 0.12 : 0
  const executeMultiplier = executeReady ? 1.8 + stats.executeDamage + bleedExecuteBonus : 1
  return Math.max(0, Math.round(base * executeMultiplier * (1 - armorReduction)))
}

export function bleedTickDamage(stats: CombatStats, enemy: EnemyInstance, deltaMs: number) {
  if (enemy.bleed.stacks <= 0 || enemy.bleed.remainingMs <= 0) return 0
  const damagePerSecond = stats.bleedDamage * enemy.bleed.stacks
  return Math.round((damagePerSecond * deltaMs) / 1000)
}

export function nextBleed(enemy: EnemyInstance, stacks: number, durationMs: number) {
  return {
    stacks: Math.min(9, enemy.bleed.stacks + stacks),
    remainingMs: Math.max(enemy.bleed.remainingMs, durationMs),
  }
}
