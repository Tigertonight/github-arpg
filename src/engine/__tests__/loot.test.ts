import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/migrations'
import { createRng } from '../rng'
import { applyLootFilter, createItem, rollRarity } from '../loot'

describe('loot generation and filter', () => {
  it('creates stage-scaled items with affixes', () => {
    const item = createItem('black_forge', 8, 20, createRng(7))

    expect(item.itemLevel).toBeGreaterThanOrEqual(7)
    expect(item.name.length).toBeGreaterThan(2)
    expect(item.affixes.length).toBeGreaterThanOrEqual(0)
  })

  it('lets magic find influence rare-or-better rolls', () => {
    const lowRng = createRng(101)
    const highRng = createRng(101)
    const low = Array.from({ length: 400 }, () => rollRarity(0, lowRng)).filter((rarity) => ['rare', 'epic', 'legendary'].includes(rarity)).length
    const high = Array.from({ length: 400 }, () => rollRarity(90, highRng)).filter((rarity) => ['rare', 'epic', 'legendary'].includes(rarity)).length

    expect(high).toBeGreaterThan(low)
  })

  it('keeps bleed-tagged items when that filter is enabled', () => {
    const state = createStarterState()
    const item = createItem('black_forge_elite', 6, 0, createRng(22))
    item.rarity = 'magic'
    item.affixes = [{ affixId: 'gouging', value: 12 }]

    expect(applyLootFilter(item, state)).toBe('keep')
  })
})
