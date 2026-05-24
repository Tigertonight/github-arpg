import { affixes, affixesById } from '../data/affixes'
import { baseItemsById } from '../data/items'
import { lootTablesById } from '../data/lootTables'
import { createId } from '../domain/ids'
import { getBuildTags, itemScore, rarityMeta, rarityOrder } from '../domain/formulas'
import type { AffixRoll, GameState, ItemInstance, LootFilterRule, Rarity } from '../domain/types'
import type { Rng } from './rng'
import { pickOne, rollInt } from './rng'

export const defaultLootFilter: LootFilterRule[] = [
  { id: 'keepRarePlus', label: '保留稀有以上', enabled: true },
  { id: 'keepBleedAffixes', label: '保留流血/处决词缀', enabled: true },
  { id: 'autoSalvageNormal', label: '自动分解普通装', enabled: false },
  { id: 'keepUpgrades', label: '只保留明显升级', enabled: false },
]

const rarityWeights: Record<Rarity, number> = {
  normal: 48,
  magic: 28,
  rare: 15,
  epic: 7,
  legendary: 2,
}

export function createItem(tableId: string, stage: number, magicFind: number, rng: Rng): ItemInstance {
  const table = lootTablesById[tableId] ?? lootTablesById.black_forge
  const base = baseItemsById[pickOne(table.baseItemIds, rng)]
  const rarity = rollRarity(magicFind, rng)
  const affixCount = Math.min(rarityMeta[rarity].affixCount, affixes.length)
  const rolls = rollAffixes(affixCount, stage, rng)
  const prefix = rarity === 'legendary' ? '血誓' : rarity === 'epic' ? '裂脉' : rarity === 'rare' ? '残红' : rarity === 'magic' ? '铭刻' : '旧制'

  return {
    id: createId('item'),
    baseItemId: base.id,
    name: `${prefix}${base.name}`,
    slot: base.slot,
    rarity,
    itemLevel: Math.max(1, stage + rollInt(-1, 2, rng)),
    affixes: rolls,
    tags: [...base.tags, ...rolls.flatMap((roll) => affixesById[roll.affixId].tags)],
    createdAt: Date.now(),
  }
}

export function rollRarity(magicFind: number, rng: Rng): Rarity {
  const adjusted = { ...rarityWeights }
  adjusted.rare += magicFind * 0.26
  adjusted.epic += magicFind * 0.09
  adjusted.legendary += magicFind * 0.025
  adjusted.normal = Math.max(10, adjusted.normal - magicFind * 0.18)

  const total = rarityOrder.reduce((sum, rarity) => sum + adjusted[rarity], 0)
  let roll = rng.next() * total
  for (const rarity of rarityOrder) {
    roll -= adjusted[rarity]
    if (roll <= 0) return rarity
  }
  return 'normal'
}

function rollAffixes(count: number, stage: number, rng: Rng): AffixRoll[] {
  const pool = [...affixes]
  const rolls: AffixRoll[] = []
  for (let index = 0; index < count; index += 1) {
    const affix = pool.splice(Math.floor(rng.next() * pool.length), 1)[0]
    const value = rollInt(affix.min, affix.max + Math.floor(stage * 1.4), rng)
    rolls.push({ affixId: affix.id, value })
  }
  return rolls
}

export function applyLootFilter(item: ItemInstance, state: GameState) {
  const enabled = new Set(state.inventory.filter.filter((rule) => rule.enabled).map((rule) => rule.id))
  if (item.rarity === 'legendary') return 'keep'
  if (enabled.has('autoSalvageNormal') && item.rarity === 'normal') return 'salvage'
  if (enabled.has('keepRarePlus') && rarityOrder.indexOf(item.rarity) >= rarityOrder.indexOf('rare')) return 'keep'
  if (enabled.has('keepBleedAffixes') && getBuildTags(item).length > 0) return 'keep'
  if (enabled.has('keepUpgrades')) {
    const equipped = state.hero.equipment[item.slot]
    const equippedScore = equipped ? itemScore(state.itemsById[equipped]) : 0
    return itemScore(item) > equippedScore + 12 ? 'keep' : 'salvage'
  }
  return state.inventory.itemIds.length < state.inventory.capacity ? 'keep' : 'salvage'
}

export function salvageValue(item: ItemInstance) {
  return rarityMeta[item.rarity].salvage + Math.floor(item.itemLevel / 4)
}
