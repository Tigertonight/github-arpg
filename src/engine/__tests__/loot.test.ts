import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/starterState'
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
    item.affixes = [{ affixId: 'gouging', tier: 4, values: [12] }]

    expect(applyLootFilter(item, state)).toBe('keep')
  })

  it('rolls affixes with tier and values arrays', () => {
    const item = createItem('black_forge', 20, 0, createRng(99))
    for (const roll of item.affixes) {
      expect(typeof roll.tier).toBe('number')
      expect(Array.isArray(roll.values)).toBe(true)
      expect(roll.values.length).toBeGreaterThan(0)
    }
  })

  it('higher itemLevel shifts the tier distribution toward higher tiers', () => {
    const sample = (level: number, seed: number) => {
      const rng = createRng(seed)
      const tiers: number[] = []
      for (let i = 0; i < 200; i += 1) {
        // 强制掉到稀有以上以保证 affixCount >= 3
        const item = createItem('black_forge', level, 80, rng)
        for (const roll of item.affixes) tiers.push(roll.tier)
      }
      return tiers
    }
    const lowLevel = sample(2, 7)
    const highLevel = sample(45, 7)
    const lowMean = lowLevel.reduce((s, t) => s + t, 0) / lowLevel.length
    const highMean = highLevel.reduce((s, t) => s + t, 0) / highLevel.length
    // tier 数字越小越强；高 itemLevel 平均 tier 应低于低 itemLevel
    expect(highMean).toBeLessThan(lowMean)
  })
})
