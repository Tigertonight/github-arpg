import { affixesById } from '../data/affixes'
import { baseItemsById } from '../data/items'
import type { CombatStats, EquipmentState, ItemInstance, StatKey } from './types'

export const rarityOrder = ['normal', 'magic', 'rare', 'epic', 'legendary'] as const

export const rarityMeta = {
  normal: { label: '普通', color: '#aeb4bb', affixCount: 0, salvage: 1 },
  magic: { label: '魔法', color: '#58a6ff', affixCount: 2, salvage: 2 },
  rare: { label: '稀有', color: '#f2c94c', affixCount: 4, salvage: 4 },
  epic: { label: '史诗', color: '#b980ff', affixCount: 5, salvage: 7 },
  legendary: { label: '传说', color: '#ff8a3d', affixCount: 6, salvage: 12 },
}

export const slotLabels = {
  weapon: '武器',
  offhand: '副手',
  helm: '头盔',
  chest: '胸甲',
  gloves: '手套',
  boots: '靴子',
  amulet: '项链',
  ring: '戒指',
  relic: '遗物',
}

export const equipmentSlots = Object.keys(slotLabels) as (keyof typeof slotLabels)[]

const statLabels: Record<StatKey, string> = {
  physicalDamage: '物理伤害',
  attackSpeed: '攻击速度',
  bleedDamage: '流血伤害',
  bleedDuration: '流血持续',
  executeDamage: '处决伤害',
  life: '生命',
  armor: '护甲',
  magicFind: '魔法发现',
  goldFind: '金币发现',
}

export function createEmptyEquipment(): EquipmentState {
  return {
    weapon: null,
    offhand: null,
    helm: null,
    chest: null,
    gloves: null,
    boots: null,
    amulet: null,
    ring: null,
    relic: null,
  }
}

export function getItemStat(item: ItemInstance, stat: StatKey) {
  const base = baseItemsById[item.baseItemId]
  const implicit = base.implicitStats
    .filter((modifier) => modifier.stat === stat)
    .reduce((sum, modifier) => sum + modifier.value, 0)
  const affixValue = item.affixes
    .filter((roll) => affixesById[roll.affixId]?.stat === stat)
    .reduce((sum, roll) => sum + roll.value, 0)
  return implicit + affixValue
}

export function deriveCombatStats(equipment: EquipmentState, itemsById: Record<string, ItemInstance>, level: number): CombatStats {
  const equipped = Object.values(equipment)
    .map((id) => (id ? itemsById[id] : null))
    .filter((item): item is ItemInstance => Boolean(item))

  const sum = (stat: StatKey) => equipped.reduce((total, item) => total + getItemStat(item, stat), 0)
  const physicalDamage = 18 + level * 4 + sum('physicalDamage')
  const attackSpeed = Number((1 + sum('attackSpeed') / 100).toFixed(2))
  const bleedDamage = 8 + level * 1.8 + sum('bleedDamage')
  const life = 120 + level * 18 + sum('life')
  const armor = 8 + level * 2 + sum('armor')

  return {
    life,
    armor,
    physicalDamage,
    attackSpeed,
    bleedDamage,
    bleedDurationMs: 4200 + sum('bleedDuration') * 100,
    executeDamage: 1 + sum('executeDamage') / 100,
    magicFind: 8 + sum('magicFind'),
    goldFind: sum('goldFind'),
    itemScore: equipped.reduce((total, item) => total + itemScore(item), 0),
  }
}

export function itemScore(item: ItemInstance) {
  const rarityBonus = rarityOrder.indexOf(item.rarity) * 18
  const score =
    getItemStat(item, 'physicalDamage') * 2.2 +
    getItemStat(item, 'attackSpeed') * 1.8 +
    getItemStat(item, 'bleedDamage') * 2.4 +
    getItemStat(item, 'bleedDuration') * 1.2 +
    getItemStat(item, 'executeDamage') * 1.8 +
    getItemStat(item, 'life') * 0.34 +
    getItemStat(item, 'armor') * 0.8 +
    getItemStat(item, 'magicFind') * 1.1 +
    getItemStat(item, 'goldFind') * 0.8 +
    item.itemLevel * 4 +
    rarityBonus

  return Math.round(score)
}

export function formatAffix(item: ItemInstance) {
  return item.affixes.map((roll) => {
    const affix = affixesById[roll.affixId]
    const suffix = affix.stat === 'attackSpeed' || affix.stat === 'executeDamage' ? '%' : ''
    return `+${roll.value}${suffix} ${statLabels[affix.stat]}`
  })
}

export function getBuildTags(item: ItemInstance) {
  const tags = new Set<string>()
  for (const roll of item.affixes) {
    for (const tag of affixesById[roll.affixId].tags) {
      if (tag === 'bleed') tags.add('流血')
      if (tag === 'execute') tags.add('处决')
      if (tag === 'speed') tags.add('攻速')
    }
  }
  return [...tags]
}

export function addLog(log: { id: string; text: string }[], text: string) {
  return [{ id: `log_${Date.now()}_${Math.random().toString(16).slice(2)}`, text }, ...log].slice(0, 8)
}
