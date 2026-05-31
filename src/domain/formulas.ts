import { affixesById } from '../data/affixes'
import { baseItemsById } from '../data/items'
import { itemSets } from '../data/sets'
import { createId } from './ids'
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
  ring1: '戒指 I',
  ring2: '戒指 II',
  relic: '遗物',
}

export const equipmentSlots = Object.keys(slotLabels) as (keyof typeof slotLabels)[]

export const statLabels: Record<StatKey, string> = {
  physicalDamage: '物理伤害',
  attackSpeed: '攻击速度',
  bleedDamage: '流血伤害',
  bleedDuration: '流血持续',
  executeDamage: '处决伤害',
  life: '生命',
  armor: '护甲',
  magicFind: '魔法发现',
  goldFind: '金币发现',
  evasion: '闪避率',
  critChance: '暴击率',
  critMultiplier: '暴击伤害',
  lifeSteal: '生命偷取',
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
    ring1: null,
    ring2: null,
    relic: null,
  }
}

/**
 * 单个 affix roll 的总贡献：把 values[] 求和。
 * （多 roll 词缀如「+10-20 物理」用平均值或求和取决于词缀语义；
 * M2.5 阶段所有词缀都是单 roll，先用求和实现。）
 */
export function affixRollTotal(roll: ItemInstance['affixes'][number]): number {
  return roll.values.reduce((sum, v) => sum + v, 0)
}

export function getItemStat(item: ItemInstance, stat: StatKey) {
  const base = baseItemsById[item.baseItemId]
  const implicit = base.implicitStats
    .filter((modifier) => modifier.stat === stat)
    .reduce((sum, modifier) => sum + modifier.value, 0)
  const affixValue = item.affixes
    .filter((roll) => affixesById[roll.affixId]?.stat === stat)
    .reduce((sum, roll) => sum + affixRollTotal(roll), 0)
  return implicit + affixValue
}

export function getActiveSetBonuses(equipped: ItemInstance[]): { setId: string; pieces: number; modifiers: { stat: StatKey; value: number }[] }[] {
  const counts: Record<string, number> = {}
  for (const item of equipped) {
    if (item.setId) counts[item.setId] = (counts[item.setId] ?? 0) + 1
  }
  const active: { setId: string; pieces: number; modifiers: { stat: StatKey; value: number }[] }[] = []
  for (const set of itemSets) {
    const pieces = counts[set.id] ?? 0
    if (pieces < 2) continue
    const mods: { stat: StatKey; value: number }[] = []
    for (const bonus of set.bonuses) {
      if (pieces >= bonus.piecesRequired) mods.push(...bonus.modifiers)
    }
    if (mods.length > 0) active.push({ setId: set.id, pieces, modifiers: mods })
  }
  return active
}

export function deriveCombatStats(equipment: EquipmentState, itemsById: Record<string, ItemInstance>, level: number): CombatStats {
  const equipped = Object.values(equipment)
    .map((id) => (id ? itemsById[id] : null))
    .filter((item): item is ItemInstance => Boolean(item))

  const setBonuses = getActiveSetBonuses(equipped)
  const setSum = (stat: StatKey) =>
    setBonuses.reduce(
      (total, b) => total + b.modifiers.filter((m) => m.stat === stat).reduce((s, m) => s + m.value, 0),
      0,
    )
  const sum = (stat: StatKey) =>
    equipped.reduce((total, item) => total + getItemStat(item, stat), 0) + setSum(stat)
  const physicalDamage = 18 + level * 4 + sum('physicalDamage')
  const attackSpeed = Number((1 + sum('attackSpeed') / 100).toFixed(2))
  const bleedDamage = 8 + level * 1.8 + sum('bleedDamage')
  const life = 120 + level * 18 + sum('life')
  const armor = 8 + level * 2 + sum('armor')

  // 每级额外提升：+3 生命、+0.5 物理伤害、+0.3 护甲
  const levelBonusLife = level * 3
  const levelBonusPhys = level * 0.5
  const levelBonusArmor = Math.floor(level * 0.3)

  return {
    life: life + levelBonusLife,
    armor: armor + levelBonusArmor,
    physicalDamage: physicalDamage + levelBonusPhys,
    attackSpeed,
    bleedDamage,
    bleedDurationMs: 4200 + sum('bleedDuration') * 100,
    executeDamage: 1 + sum('executeDamage') / 100,
    magicFind: 8 + sum('magicFind'),
    goldFind: sum('goldFind'),
    itemScore: equipped.reduce((total, item) => total + itemScore(item), 0),
    evasion: Math.min(75, sum('evasion')),
    critChance: Math.min(75, sum('critChance')),
    critMultiplier: 1.5 + sum('critMultiplier') / 100,
    lifeSteal: sum('lifeSteal'),
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
    getItemStat(item, 'evasion') * 1.2 +
    getItemStat(item, 'critChance') * 1.5 +
    getItemStat(item, 'critMultiplier') * 0.8 +
    getItemStat(item, 'lifeSteal') * 2.0 +
    item.itemLevel * 4 +
    rarityBonus

  return Math.round(score)
}

export function formatAffix(item: ItemInstance): { label: string; tier: number }[] {
  return item.affixes.map((roll) => {
    const affix = affixesById[roll.affixId]
    const suffix = affix.stat === 'attackSpeed' || affix.stat === 'executeDamage' ? '%' : ''
    const total = affixRollTotal(roll)
    return {
      label: `[T${roll.tier}] +${total}${suffix} ${statLabels[affix.stat]}`,
      tier: roll.tier,
    }
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
  return [{ id: createId('log'), text }, ...log].slice(0, 8)
}
