import { affixes, affixesById } from '../data/affixes'
import { baseItemsById } from '../data/items'
import { legendaryPowersForSlot } from '../data/legendaryPowers'
import { lootTablesById } from '../data/lootTables'
import { createId } from '../domain/ids'
import { getBuildTags, itemScore, rarityMeta, rarityOrder } from '../domain/formulas'
import type { AffixRoll, BaseItemSlot, EntityId, EquipmentSlot, GameState, ItemInstance, LootFilterRule, Rarity } from '../domain/types'
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
  const itemLevel = Math.max(1, stage + rollInt(-1, 2, rng))
  const rolls = rollAffixes(affixCount, itemLevel, rng)
  const slot = resolveInstanceSlot(base.slot, rng)
  const legendaryPowerId = rarity === 'legendary' ? rollLegendaryPower(slot, rng) : undefined
  const prefix = rarity === 'legendary' ? '血誓' : rarity === 'epic' ? '裂脉' : rarity === 'rare' ? '残红' : rarity === 'magic' ? '铭刻' : '旧制'

  return {
    id: createId('item'),
    baseItemId: base.id,
    name: `${prefix}${base.name}`,
    slot,
    rarity,
    itemLevel,
    affixes: rolls,
    tags: [...base.tags, ...rolls.flatMap((roll) => affixesById[roll.affixId].tags)],
    createdAt: Date.now(),
    legendaryPowerId,
  }
}

function rollLegendaryPower(slot: EquipmentSlot, rng: Rng): EntityId | undefined {
  const candidates = legendaryPowersForSlot(slot)
  if (candidates.length === 0) return undefined
  return candidates[Math.floor(rng.next() * candidates.length)].id
}

function resolveInstanceSlot(baseSlot: BaseItemSlot, rng: Rng): EquipmentSlot {
  if (baseSlot === 'ring') return rng.next() < 0.5 ? 'ring1' : 'ring2'
  return baseSlot
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

/**
 * Tier 权重曲线：
 * - 基础：weight = 1.7 ^ (tier - 1)，让相邻 tier 落差比 2^n 平滑
 *   T5≈8.4, T4≈4.9, T3≈2.9, T2≈1.7, T1=1
 * - itemLevel 加成：itemLevel 超过 tier.minItemLevel 越多，越倾向解锁的高 tier
 *   每多 10 级，该 tier 权重 × 1.15
 * - 最终概率（itemLevel=1）≈ T5 43%, T4 25%, T3 15%, T2 9%, T1 5% — 更稳定的中段命中
 *   itemLevel=40 时 T1 权重提升 ~2x，T2 ~1.5x，让高层装备明显更容易升 tier
 */
function tierWeight(tier: number, minItemLevel: number, itemLevel: number): number {
  const base = Math.pow(1.7, tier - 1)
  const levelOver = Math.max(0, itemLevel - minItemLevel)
  const levelBonus = 1 + (levelOver / 10) * 0.15
  return base * levelBonus
}

function rollAffixes(count: number, itemLevel: number, rng: Rng): AffixRoll[] {
  const pool = [...affixes]
  const rolls: AffixRoll[] = []
  for (let index = 0; index < count; index += 1) {
    if (pool.length === 0) break
    const affix = pool.splice(Math.floor(rng.next() * pool.length), 1)[0]
    const eligibleTiers = affix.tiers.filter((tier) => tier.minItemLevel <= itemLevel)
    const tierPool = eligibleTiers.length > 0 ? eligibleTiers : [affix.tiers[affix.tiers.length - 1]]
    const weights = tierPool.map((t) => tierWeight(t.tier, t.minItemLevel, itemLevel))
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let pick = rng.next() * totalWeight
    let chosen = tierPool[tierPool.length - 1]
    for (let i = 0; i < tierPool.length; i += 1) {
      pick -= weights[i]
      if (pick <= 0) {
        chosen = tierPool[i]
        break
      }
    }
    const values = chosen.rolls.map((spec) => rollInt(spec.min, spec.max, rng))
    rolls.push({ affixId: affix.id, tier: chosen.tier, values })
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
