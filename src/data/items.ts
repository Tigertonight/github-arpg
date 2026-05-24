import type { BaseItem } from '../domain/types'

export const baseItems: BaseItem[] = [
  { id: 'rusted_cleaver', name: '锈蚀斩斧', slot: 'weapon', implicitStats: [{ stat: 'physicalDamage', value: 12 }], tags: ['axe', 'physical'] },
  { id: 'black_iron_sword', name: '黑铁长剑', slot: 'weapon', implicitStats: [{ stat: 'attackSpeed', value: 6 }, { stat: 'physicalDamage', value: 8 }], tags: ['sword', 'speed'] },
  { id: 'oath_shield', name: '破誓盾', slot: 'offhand', implicitStats: [{ stat: 'armor', value: 18 }, { stat: 'life', value: 22 }], tags: ['shield'] },
  { id: 'miner_helm', name: '矿灯盔', slot: 'helm', implicitStats: [{ stat: 'armor', value: 10 }], tags: ['armor'] },
  { id: 'charred_plate', name: '焦黑胸甲', slot: 'chest', implicitStats: [{ stat: 'armor', value: 24 }, { stat: 'life', value: 18 }], tags: ['armor'] },
  { id: 'butcher_gloves', name: '屠夫手套', slot: 'gloves', implicitStats: [{ stat: 'bleedDamage', value: 7 }], tags: ['bleed'] },
  { id: 'ashwalkers', name: '踏灰靴', slot: 'boots', implicitStats: [{ stat: 'attackSpeed', value: 4 }], tags: ['speed'] },
  { id: 'red_cord', name: '赤绳项链', slot: 'amulet', implicitStats: [{ stat: 'bleedDuration', value: 4 }], tags: ['bleed'] },
  { id: 'bone_ring', name: '骨印戒指', slot: 'ring', implicitStats: [{ stat: 'executeDamage', value: 8 }], tags: ['execute'] },
  { id: 'forgotten_relic', name: '遗忘圣物', slot: 'relic', implicitStats: [{ stat: 'magicFind', value: 8 }], tags: ['loot'] },
]

export const baseItemsById = Object.fromEntries(baseItems.map((item) => [item.id, item]))
