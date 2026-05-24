import type { AffixDefinition } from '../domain/types'

export const affixes: AffixDefinition[] = [
  { id: 'cruel', name: '残酷', category: 'offense', stat: 'physicalDamage', min: 5, max: 28, tags: ['physical'] },
  { id: 'quick', name: '迅捷', category: 'offense', stat: 'attackSpeed', min: 4, max: 18, tags: ['speed'] },
  { id: 'gouging', name: '开膛', category: 'bleed', stat: 'bleedDamage', min: 6, max: 34, tags: ['bleed'] },
  { id: 'deep_wound', name: '深创', category: 'bleed', stat: 'bleedDuration', min: 3, max: 16, tags: ['bleed'] },
  { id: 'headsman', name: '断首者', category: 'bleed', stat: 'executeDamage', min: 8, max: 42, tags: ['execute', 'bleed'] },
  { id: 'vital', name: '坚韧', category: 'defense', stat: 'life', min: 18, max: 88, tags: ['defense'] },
  { id: 'plated', name: '铁壁', category: 'defense', stat: 'armor', min: 6, max: 42, tags: ['defense'] },
  { id: 'seeker', name: '寻宝者', category: 'loot', stat: 'magicFind', min: 4, max: 24, tags: ['loot'] },
  { id: 'avarice', name: '贪婪', category: 'loot', stat: 'goldFind', min: 6, max: 34, tags: ['loot'] },
]

export const affixesById = Object.fromEntries(affixes.map((affix) => [affix.id, affix]))
