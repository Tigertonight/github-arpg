import { describe, expect, it } from 'vitest'
import { createId } from '../../domain/ids'
import { createStarterState } from '../../persistence/starterState'
import type { GameState, ItemInstance } from '../../domain/types'
import { aggregateBleedStack, aggregateExecuteThreshold, getActivePowers, getSkillCastTriggers } from '../legendary'

function equipLegendary(state: GameState, slot: keyof GameState['hero']['equipment'], legendaryPowerId: string): GameState {
  const item: ItemInstance = {
    id: createId('item'),
    baseItemId: 'forge_cleaver',
    name: '测试传说',
    slot: slot as ItemInstance['slot'],
    rarity: 'legendary',
    itemLevel: 1,
    affixes: [],
    tags: [],
    createdAt: 0,
    legendaryPowerId,
  }
  return {
    ...state,
    hero: { ...state.hero, equipment: { ...state.hero.equipment, [slot]: item.id } },
    itemsById: { ...state.itemsById, [item.id]: item },
  }
}

describe('legendary aggregation', () => {
  it('returns defaults when no legendary equipped', () => {
    const state = createStarterState()
    expect(aggregateExecuteThreshold(state, 0.35, 1)).toEqual({ threshold: 0.35, damageMult: 1 })
    expect(aggregateBleedStack(state, 9)).toEqual({ maxStacks: 9, perStackDamage: 0 })
    expect(getSkillCastTriggers(state)).toEqual([])
  })

  it('oath_guillotine raises execute threshold and lowers damageMult', () => {
    const base = createStarterState()
    const state = equipLegendary(base, 'weapon', 'oath_guillotine')
    const exec = aggregateExecuteThreshold(state, 0.35, 1)

    expect(exec.threshold).toBe(0.5)
    expect(exec.damageMult).toBeCloseTo(0.75, 5)
  })

  it('heart_strangler raises bleed cap and adds per-stack damage', () => {
    const base = createStarterState()
    const state = equipLegendary(base, 'amulet', 'heart_strangler')
    const bleed = aggregateBleedStack(state, 9)

    expect(bleed.maxStacks).toBe(10)
    expect(bleed.perStackDamage).toBeCloseTo(0.08, 5)
  })

  it('butcher_seal surfaces as onSkillCast trigger', () => {
    const base = createStarterState()
    const state = equipLegendary(base, 'ring1', 'butcher_seal')
    const triggers = getSkillCastTriggers(state)

    expect(triggers).toHaveLength(1)
    expect(triggers[0].id).toBe('butcher_seal')
    expect(triggers[0].params.triggerChance).toBe(0.25)
    expect(triggers[0].params.bonusStacks).toBe(2)
  })

  it('aggregates multiple powers across slots', () => {
    let state = createStarterState()
    state = equipLegendary(state, 'weapon', 'oath_guillotine')
    state = equipLegendary(state, 'amulet', 'heart_strangler')
    state = equipLegendary(state, 'ring1', 'butcher_seal')

    expect(aggregateExecuteThreshold(state, 0.35, 1).threshold).toBe(0.5)
    expect(aggregateBleedStack(state, 9).maxStacks).toBe(10)
    expect(getActivePowers(state, 'onSkillCast')).toHaveLength(1)
  })

  it('takes max threshold and multiplies damageMult when stacking same hook', () => {
    // 模拟双 weapon 槽不存在，但通过手动塞同一 hook 的两件装备到不同槽，验证聚合行为
    const base = createStarterState()
    let state = equipLegendary(base, 'weapon', 'oath_guillotine')
    // 把同一 power 强行塞到 amulet 槽以测试聚合（绕开 allowedSlots，仅测试聚合函数）
    state = equipLegendary(state, 'amulet', 'oath_guillotine')

    const exec = aggregateExecuteThreshold(state, 0.35, 1)
    expect(exec.threshold).toBe(0.5)
    expect(exec.damageMult).toBeCloseTo(0.75 * 0.75, 5)
  })
})
