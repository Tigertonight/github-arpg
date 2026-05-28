import type { LegendaryPower } from '../domain/types'

/**
 * 第一批 3 个传说机制。每个绑定固定槽位 + 触发 hook + 参数。
 * 命名规则：黑炉系列暗金，名字带"血/铁/誓"暗示 build 倾向。
 */
export const legendaryPowers: LegendaryPower[] = [
  {
    id: 'oath_guillotine',
    name: '血誓断头台',
    description: '处决可在敌人 50% 生命时触发，但伤害降低 25%。',
    hookId: 'onExecuteThreshold',
    allowedSlots: ['weapon'],
    params: { threshold: 0.5, damageMult: 0.75 },
  },
  {
    id: 'heart_strangler',
    name: '心绞诅咒',
    description: '流血层数上限提升至 10，每层流血伤害额外 +8%。',
    hookId: 'onBleedStack',
    allowedSlots: ['amulet'],
    params: { maxStacks: 10, perStackDamage: 0.08 },
  },
  {
    id: 'butcher_seal',
    name: '屠夫凶印',
    description: '技能命中时有 25% 概率额外叠加 2 层流血。',
    hookId: 'onSkillCast',
    allowedSlots: ['ring1', 'ring2'],
    params: { triggerChance: 0.25, bonusStacks: 2 },
  },
]

export const legendaryPowersById = Object.fromEntries(
  legendaryPowers.map((power) => [power.id, power]),
)

/**
 * 给定槽位，返回所有匹配的 power。掉落时用于挑选给 legendary 装备的机制。
 */
export function legendaryPowersForSlot(slot: string): LegendaryPower[] {
  return legendaryPowers.filter((power) => power.allowedSlots.includes(slot as any))
}
