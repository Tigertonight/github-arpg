import type { AffixDefinition } from '../domain/types'

/**
 * Tier 设计规则（M2.5）：
 * - 每条词缀有 5 个 tier（T1 最高、T5 最低）
 * - T5 minItemLevel=1，T1 minItemLevel=40
 * - 每升一个 tier，数值约 +50%
 * - 单数值词缀只有一个 roll spec
 * 后续平衡时再单独调表，不要改结构。
 */
export const affixes: AffixDefinition[] = [
  {
    id: 'cruel',
    name: '残酷',
    category: 'offense',
    stat: 'physicalDamage',
    tags: ['physical'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 3, max: 8 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 6, max: 14 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 10, max: 22 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 16, max: 34 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 24, max: 52 }] },
    ],
  },
  {
    id: 'quick',
    name: '迅捷',
    category: 'offense',
    stat: 'attackSpeed',
    tags: ['speed'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 2, max: 4 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 4, max: 7 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 6, max: 11 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 9, max: 15 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 13, max: 22 }] },
    ],
  },
  {
    id: 'gouging',
    name: '开膛',
    category: 'bleed',
    stat: 'bleedDamage',
    tags: ['bleed'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 4, max: 9 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 7, max: 16 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 12, max: 24 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 18, max: 36 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 28, max: 56 }] },
    ],
  },
  {
    id: 'deep_wound',
    name: '深创',
    category: 'bleed',
    stat: 'bleedDuration',
    tags: ['bleed'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 2, max: 4 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 3, max: 6 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 5, max: 9 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 7, max: 13 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 10, max: 18 }] },
    ],
  },
  {
    id: 'headsman',
    name: '断首者',
    category: 'bleed',
    stat: 'executeDamage',
    tags: ['execute', 'bleed'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 5, max: 11 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 9, max: 19 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 15, max: 28 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 22, max: 42 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 32, max: 62 }] },
    ],
  },
  {
    id: 'vital',
    name: '坚韧',
    category: 'defense',
    stat: 'life',
    tags: ['defense'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 12, max: 24 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 22, max: 42 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 38, max: 64 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 58, max: 92 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 86, max: 130 }] },
    ],
  },
  {
    id: 'plated',
    name: '铁壁',
    category: 'defense',
    stat: 'armor',
    tags: ['defense'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 4, max: 9 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 8, max: 18 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 14, max: 30 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 22, max: 44 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 34, max: 64 }] },
    ],
  },
  {
    id: 'seeker',
    name: '寻宝者',
    category: 'loot',
    stat: 'magicFind',
    tags: ['loot'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 2, max: 5 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 4, max: 9 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 7, max: 14 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 11, max: 20 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 16, max: 28 }] },
    ],
  },
  {
    id: 'avarice',
    name: '贪婪',
    category: 'loot',
    stat: 'goldFind',
    tags: ['loot'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 4, max: 9 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 8, max: 17 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 14, max: 26 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 22, max: 40 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 32, max: 60 }] },
    ],
  },
  {
    id: 'nimble',
    name: '灵巧',
    category: 'defense',
    stat: 'evasion',
    tags: ['defense'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 2, max: 4 }] },
      { tier: 4, minItemLevel: 8, rolls: [{ min: 4, max: 7 }] },
      { tier: 3, minItemLevel: 18, rolls: [{ min: 6, max: 11 }] },
      { tier: 2, minItemLevel: 28, rolls: [{ min: 9, max: 15 }] },
      { tier: 1, minItemLevel: 40, rolls: [{ min: 13, max: 22 }] },
    ],
  },
  {
    id: 'lethal',
    name: '致命',
    category: 'offense',
    stat: 'critChance',
    tags: ['physical', 'crit'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 2, max: 4 }] },
      { tier: 4, minItemLevel: 10, rolls: [{ min: 4, max: 7 }] },
      { tier: 3, minItemLevel: 20, rolls: [{ min: 6, max: 11 }] },
      { tier: 2, minItemLevel: 30, rolls: [{ min: 9, max: 15 }] },
      { tier: 1, minItemLevel: 42, rolls: [{ min: 13, max: 22 }] },
    ],
  },
  {
    id: 'vicious',
    name: '凶残',
    category: 'offense',
    stat: 'critMultiplier',
    tags: ['physical', 'crit'],
    tiers: [
      { tier: 5, minItemLevel: 1, rolls: [{ min: 10, max: 20 }] },
      { tier: 4, minItemLevel: 10, rolls: [{ min: 20, max: 35 }] },
      { tier: 3, minItemLevel: 20, rolls: [{ min: 30, max: 55 }] },
      { tier: 2, minItemLevel: 30, rolls: [{ min: 45, max: 75 }] },
      { tier: 1, minItemLevel: 42, rolls: [{ min: 65, max: 100 }] },
    ],
  },
  {
    id: 'vampiric',
    name: '嗜血',
    category: 'defense',
    stat: 'lifeSteal',
    tags: ['physical', 'lifesteal'],
    tiers: [
      { tier: 5, minItemLevel: 5, rolls: [{ min: 1, max: 2 }] },
      { tier: 4, minItemLevel: 14, rolls: [{ min: 2, max: 3 }] },
      { tier: 3, minItemLevel: 24, rolls: [{ min: 3, max: 5 }] },
      { tier: 2, minItemLevel: 34, rolls: [{ min: 5, max: 7 }] },
      { tier: 1, minItemLevel: 44, rolls: [{ min: 7, max: 10 }] },
    ],
  },
]

export const affixesById = Object.fromEntries(affixes.map((affix) => [affix.id, affix]))

/**
 * 推断给定 itemLevel 下，词缀可以滚到的最高 tier（数字越小越好）。
 */
export function maxRollableTier(affix: AffixDefinition, itemLevel: number): number {
  const eligible = affix.tiers.filter((tier) => tier.minItemLevel <= itemLevel)
  if (eligible.length === 0) return affix.tiers[affix.tiers.length - 1].tier
  return Math.min(...eligible.map((tier) => tier.tier))
}

/**
 * 已有 value 反推 tier（用于存档迁移）。返回最贴近的 tier（默认 T3）。
 */
export function inferTierFromValue(affix: AffixDefinition, value: number): number {
  let best = affix.tiers[0]
  let bestDist = Infinity
  for (const tier of affix.tiers) {
    const center = (tier.rolls[0].min + tier.rolls[0].max) / 2
    const dist = Math.abs(value - center)
    if (dist < bestDist) {
      bestDist = dist
      best = tier
    }
  }
  return best.tier
}
