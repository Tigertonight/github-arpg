import { affixesById } from '../data/affixes'
import { buildArchetypes, type BuildArchetypeDefinition } from '../data/buildArchetypes'
import { legendaryPowersById } from '../data/legendaryPowers'
import { runesById } from '../data/skills'
import type { EntityId, GameState, ItemInstance } from '../domain/types'

/**
 * 收集英雄"已装备"装备上的所有 affix id（去重）。
 * 不计入背包道具：只看实际穿戴的，更贴合"流派达成度"语义。
 */
function equippedAffixIds(state: GameState): Set<EntityId> {
  const ids = new Set<EntityId>()
  for (const slot of Object.keys(state.hero.equipment)) {
    const itemId = state.hero.equipment[slot as keyof typeof state.hero.equipment]
    if (!itemId) continue
    const item = state.itemsById[itemId]
    if (!item) continue
    for (const affix of item.affixes) ids.add(affix.affixId)
  }
  return ids
}

/**
 * 收集英雄"已装备"上的 legendary power id。
 * Note: 只看穿戴的，因为 legendary 必须装备才生效。
 */
function equippedLegendaryIds(state: GameState): Set<EntityId> {
  const ids = new Set<EntityId>()
  for (const slot of Object.keys(state.hero.equipment)) {
    const itemId = state.hero.equipment[slot as keyof typeof state.hero.equipment]
    if (!itemId) continue
    const item = state.itemsById[itemId]
    if (!item || !item.legendaryPowerId) continue
    ids.add(item.legendaryPowerId)
  }
  return ids
}

/**
 * 收集所有"已掉落但未装备"的 legendary power id（背包里）。
 * 用于 UI 提示"已掉落，戴上即生效"。
 */
function ownedLegendaryIds(state: GameState): Set<EntityId> {
  const ids = new Set<EntityId>()
  for (const id of Object.keys(state.itemsById)) {
    const item: ItemInstance = state.itemsById[id]
    if (item.legendaryPowerId) ids.add(item.legendaryPowerId)
  }
  return ids
}

/**
 * 收集英雄已选定的 rune id（跨所有技能、所有 slot）。
 */
function chosenRuneIds(state: GameState): Set<EntityId> {
  const ids = new Set<EntityId>()
  for (const skillId of Object.keys(state.hero.skillProgress)) {
    const progress = state.hero.skillProgress[skillId]
    for (const slot of [5, 10, 15] as const) {
      const runeId = progress.runeChoices[slot]
      if (runeId) ids.add(runeId)
    }
  }
  return ids
}

export type RequirementStatus = 'have' | 'owned' | 'missing' | 'unknown'

export interface RequirementItem {
  id: EntityId
  label: string
  kind: 'affix' | 'legendary' | 'rune'
  status: RequirementStatus
}

export interface BuildArchetypeStatus {
  definition: BuildArchetypeDefinition
  /** 0..1 完成度。`owned`（背包里有但没装）算 0.5 个达成。 */
  completion: number
  /** 完整需求清单 + 状态（UI 渲染用）。 */
  items: RequirementItem[]
  /** 已达成数 / 总需求数（仅供 UI 显示，不参与 completion 计算）。 */
  haveCount: number
  totalCount: number
}

export function analyzeArchetype(state: GameState, def: BuildArchetypeDefinition): BuildArchetypeStatus {
  const equippedAffixes = equippedAffixIds(state)
  const equippedLegs = equippedLegendaryIds(state)
  const ownedLegs = ownedLegendaryIds(state)
  const runes = chosenRuneIds(state)

  const items: RequirementItem[] = []

  for (const id of def.requirements.affixIds) {
    const def_ = affixesById[id]
    items.push({
      id,
      label: def_?.name ?? id,
      kind: 'affix',
      status: equippedAffixes.has(id) ? 'have' : 'missing',
    })
  }
  for (const id of def.requirements.legendaryIds) {
    const def_ = legendaryPowersById[id]
    const status: RequirementStatus = equippedLegs.has(id)
      ? 'have'
      : ownedLegs.has(id)
        ? 'owned'
        : 'missing'
    items.push({
      id,
      label: def_?.name ?? id,
      kind: 'legendary',
      status,
    })
  }
  for (const id of def.requirements.runeIds) {
    const def_ = runesById[id]
    items.push({
      id,
      label: def_?.name ?? id,
      kind: 'rune',
      status: runes.has(id) ? 'have' : 'missing',
    })
  }

  let score = 0
  for (const item of items) {
    if (item.status === 'have') score += 1
    else if (item.status === 'owned') score += 0.5
  }
  const totalCount = items.length
  const haveCount = items.filter((i) => i.status === 'have').length
  const completion = totalCount > 0 ? score / totalCount : 0

  return { definition: def, completion, items, haveCount, totalCount }
}

export function analyzeAllArchetypes(state: GameState): BuildArchetypeStatus[] {
  return buildArchetypes.map((def) => analyzeArchetype(state, def))
}
