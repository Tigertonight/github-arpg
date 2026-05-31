import { describe, expect, it } from 'vitest'
import { deriveCombatStats, getActiveSetBonuses } from '../../domain/formulas'
import type { EquipmentState, ItemInstance } from '../../domain/types'

function makeItem(overrides: Partial<ItemInstance> & { baseItemId: string; setId?: string }): ItemInstance {
  const { baseItemId, ...rest } = overrides
  return {
    id: baseItemId + '_inst',
    baseItemId,
    name: baseItemId,
    slot: (overrides.slot ?? 'weapon') as ItemInstance['slot'],
    rarity: 'rare',
    itemLevel: 10,
    affixes: [],
    tags: [],
    createdAt: 0,
    ...rest,
  }
}

describe('item sets', () => {
  it('getActiveSetBonuses returns nothing with < 2 pieces', () => {
    const items = [makeItem({ baseItemId: 'oath_claymore', slot: 'weapon', setId: 'oathbreaker_set' })]
    expect(getActiveSetBonuses(items)).toEqual([])
  })

  it('2-piece bonus activates', () => {
    const items = [
      makeItem({ baseItemId: 'oath_claymore', slot: 'weapon', setId: 'oathbreaker_set' }),
      makeItem({ baseItemId: 'oath_shield', slot: 'offhand', setId: 'oathbreaker_set' }),
    ]
    const bonuses = getActiveSetBonuses(items)
    expect(bonuses).toHaveLength(1)
    expect(bonuses[0].pieces).toBe(2)
    expect(bonuses[0].modifiers).toEqual([{ stat: 'executeDamage', value: 20 }])
  })

  it('4-piece adds both 2pc and 4pc bonuses', () => {
    const items = [
      makeItem({ baseItemId: 'oath_claymore', slot: 'weapon', setId: 'oathbreaker_set' }),
      makeItem({ baseItemId: 'oath_shield', slot: 'offhand', setId: 'oathbreaker_set' }),
      makeItem({ baseItemId: 'oath_breastplate', slot: 'chest', setId: 'oathbreaker_set' }),
      makeItem({ baseItemId: 'iron_oath_band', slot: 'ring1', setId: 'oathbreaker_set' }),
    ]
    const bonuses = getActiveSetBonuses(items)
    expect(bonuses[0].pieces).toBe(4)
    const stats = bonuses[0].modifiers.map((m) => m.stat).sort()
    expect(stats).toEqual(['critMultiplier', 'executeDamage'])
  })

  it('non-set items contribute nothing to set bonuses', () => {
    const items = [
      makeItem({ baseItemId: 'rusted_cleaver', slot: 'weapon' }),
      makeItem({ baseItemId: 'oath_shield', slot: 'offhand' }), // setId missing → 不算入套装
    ]
    expect(getActiveSetBonuses(items)).toEqual([])
  })

  it('deriveCombatStats applies set executeDamage bonus', () => {
    const equipment: EquipmentState = {
      weapon: 'w', offhand: 's', helm: null, chest: null,
      gloves: null, boots: null, amulet: null, ring1: null, ring2: null, relic: null,
    }
    const items: Record<string, ItemInstance> = {
      w: makeItem({ id: 'w', baseItemId: 'oath_claymore', slot: 'weapon', setId: 'oathbreaker_set' }),
      s: makeItem({ id: 's', baseItemId: 'oath_shield', slot: 'offhand', setId: 'oathbreaker_set' }),
    }
    const withSet = deriveCombatStats(equipment, items, 1)
    // 2pc bonus = +20 executeDamage (% via 100); deriveCombatStats divides by 100
    // baseline executeDamage = 1 + 0/100 = 1, with set = 1 + (10 implicit + 20 set)/100 = 1.30
    expect(withSet.executeDamage).toBeCloseTo(1.30, 2)
  })
})
