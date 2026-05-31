import type { EnemyDefinition, EnemyInstance } from '../domain/types'
import { enemiesById } from '../data/enemies'

export type FamilyTrait =
  | 'bone_reform'
  | 'hellbacklash'
  | 'last_rite'
  | 'plate_armor'
  | 'bloodthirst'
  | 'primordial_cap'

const FAMILY_TRAIT: Record<EnemyDefinition['family'], FamilyTrait> = {
  undead: 'bone_reform',
  demon: 'hellbacklash',
  cultist: 'last_rite',
  construct: 'plate_armor',
  beast: 'bloodthirst',
  primordial: 'primordial_cap',
}

const TRAIT_LABEL: Record<FamilyTrait, string> = {
  bone_reform: '骸骨复生',
  hellbacklash: '炎狱反噬',
  last_rite: '末仪护盾',
  plate_armor: '重甲',
  bloodthirst: '嗜血',
  primordial_cap: '原初韧性',
}

export function traitOf(enemy: EnemyInstance): FamilyTrait | null {
  const def = enemiesById[enemy.enemyDefId]
  if (!def) return null
  return FAMILY_TRAIT[def.family] ?? null
}

export function traitLabel(trait: FamilyTrait): string {
  return TRAIT_LABEL[trait]
}

/**
 * 入伤修正：英雄打怪时的 incoming damage 调整。
 * - plate_armor: -8 平伤减免（结构系厚甲）
 * - primordial_cap: 单次伤害上限为 25% maxLife
 * - bloodthirst: 不在此处生效（影响反击）
 */
export function applyIncomingTrait(
  enemy: EnemyInstance,
  damage: number,
): number {
  const trait = traitOf(enemy)
  if (trait === 'plate_armor') return Math.max(1, damage - 8)
  if (trait === 'primordial_cap') {
    const cap = Math.round(enemy.maxLife * 0.25)
    return Math.min(damage, cap)
  }
  return damage
}

/**
 * 致命伤拦截：last_rite 第一次致命留 1 HP；bone_reform 死亡后 25% 复活到 25% HP。
 * 返回 { intercepted: true, newLife } 表示拦截，否则 null。
 */
export function interceptLethal(
  enemy: EnemyInstance,
  rng: { next: () => number },
): { newLife: number; label: string } | null {
  const trait = traitOf(enemy)
  if (trait === 'last_rite' && !enemy.traitConsumed) {
    enemy.traitConsumed = true
    return { newLife: 1, label: '末仪护盾' }
  }
  if (trait === 'bone_reform' && !enemy.traitConsumed && enemy.rank !== 'normal') {
    enemy.traitConsumed = true
    if (rng.next() < 0.25) {
      return { newLife: Math.round(enemy.maxLife * 0.25), label: '骸骨复生' }
    }
  }
  return null
}

/** 返回 hellbacklash 反伤量（每次命中 5% 反弹）。 */
export function backlashDamage(enemy: EnemyInstance, damageDealt: number): number {
  if (traitOf(enemy) !== 'hellbacklash') return 0
  return Math.round(damageDealt * 0.05)
}

/** bloodthirst 反击系数：低于 40% HP 时返回 1.3，否则 1。 */
export function counterMultiplier(enemy: EnemyInstance): number {
  if (traitOf(enemy) !== 'bloodthirst') return 1
  return enemy.currentLife / enemy.maxLife < 0.4 ? 1.3 : 1
}
