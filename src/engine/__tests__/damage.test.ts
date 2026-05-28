import { describe, expect, it } from 'vitest'
import { deriveCombatStats } from '../../domain/formulas'
import { createStarterState } from '../../persistence/starterState'
import { bleedTickDamage, physicalHit } from '../damage'

describe('damage formulas', () => {
  it('applies physical mitigation and returns positive damage', () => {
    const state = createStarterState()
    const stats = deriveCombatStats(state.hero.equipment, state.itemsById, state.hero.level)
    const enemy = state.enemyGroup.members[0]
    const hit = physicalHit(stats, enemy, state.hero.skills[0])

    expect(hit.damage).toBeGreaterThan(0)
    expect(hit.damage).toBeLessThan(stats.physicalDamage * 2)
  })

  it('scales bleed damage with stacks', () => {
    const state = createStarterState()
    const stats = deriveCombatStats(state.hero.equipment, state.itemsById, state.hero.level)
    const enemy = state.enemyGroup.members[0]
    const oneStack = bleedTickDamage(stats, { ...enemy, bleed: { stacks: 1, remainingMs: 4000 } }, 1000)
    const fiveStacks = bleedTickDamage(stats, { ...enemy, bleed: { stacks: 5, remainingMs: 4000 } }, 1000)

    expect(fiveStacks).toBeGreaterThan(oneStack)
    expect(fiveStacks).toBeCloseTo(oneStack * 5, -1)
  })

  it('boosts execute against bleeding targets', () => {
    const state = createStarterState()
    const stats = deriveCombatStats(state.hero.equipment, state.itemsById, state.hero.level)
    const execute = state.hero.skills.find((skill) => skill.skillId === 'execute')!
    const enemy = state.enemyGroup.members[0]
    const normal = physicalHit(stats, enemy, execute)
    const wounded = physicalHit(stats, { ...enemy, bleed: { stacks: 6, remainingMs: 3000 } }, execute)

    expect(wounded.damage).toBeGreaterThan(normal.damage)
  })
})
