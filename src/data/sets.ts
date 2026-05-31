import type { ItemSetDefinition } from '../domain/types'

/**
 * 套装：装备 N 件激活对应 bonus（modifiers 按 stat 累加进 deriveCombatStats）。
 * 每件套装基底道具掉落时有 ~12% 概率 roll 上 setId。
 */
export const itemSets: ItemSetDefinition[] = [
  {
    id: 'oathbreaker_set',
    name: '破誓套',
    pieceItemIds: ['oath_claymore', 'oath_shield', 'oath_breastplate', 'iron_oath_band'],
    bonuses: [
      { piecesRequired: 2, modifiers: [{ stat: 'executeDamage', value: 20 }] },
      { piecesRequired: 4, modifiers: [{ stat: 'critMultiplier', value: 30 }] },
    ],
  },
  {
    id: 'crimson_blood_set',
    name: '赤誓血脉套',
    pieceItemIds: ['widow_scythe', 'crimson_doublet', 'crimson_signet', 'red_cord'],
    bonuses: [
      { piecesRequired: 2, modifiers: [{ stat: 'bleedDamage', value: 12 }] },
      { piecesRequired: 4, modifiers: [{ stat: 'bleedDuration', value: 20 }] },
    ],
  },
]

export const itemSetsById = Object.fromEntries(itemSets.map((s) => [s.id, s]))

/** 反查：base item id → set id（如果属于某套装）。 */
export const setIdByBaseItemId: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const set of itemSets) {
    for (const baseId of set.pieceItemIds) map[baseId] = set.id
  }
  return map
})()
