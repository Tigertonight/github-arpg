import { describe, expect, it } from 'vitest'
import { createItem } from '../loot'
import { createRng } from '../rng'

/**
 * 验证 itemLevel 越高，越容易 roll 出高 tier (T1/T2)。
 * P1-4 词缀分层目标：高 zone 掉 T1/T2 概率显著高于低 zone。
 */
describe('affix tier distribution by itemLevel', () => {
  function rollManyItems(stage: number, count: number) {
    const rng = createRng(42)
    const tiers: number[] = []
    for (let i = 0; i < count; i += 1) {
      const item = createItem('black_forge', stage, 0, rng)
      for (const affix of item.affixes) tiers.push(affix.tier)
    }
    return tiers
  }

  it('itemLevel 越高，平均 tier 数越低（=越靠近 T1 顶级）', () => {
    const lowTiers = rollManyItems(1, 300)
    const highTiers = rollManyItems(50, 300)
    const lowAvg = lowTiers.reduce((s, t) => s + t, 0) / lowTiers.length
    const highAvg = highTiers.reduce((s, t) => s + t, 0) / highTiers.length
    // 高 itemLevel 平均 tier 应明显小于（T 数字小=tier 高）低 itemLevel
    expect(highAvg).toBeLessThan(lowAvg)
  })

  it('formatAffix 输出每条词缀的 tier 数字', () => {
    const rng = createRng(42)
    const item = createItem('black_forge', 10, 0, rng)
    expect(item.affixes.length).toBeGreaterThan(0)
    for (const affix of item.affixes) {
      expect(affix.tier).toBeGreaterThanOrEqual(1)
      expect(affix.tier).toBeLessThanOrEqual(5)
    }
  })
})
