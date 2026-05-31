import type { EntityId, Hero, RuneSlotLevel, SkillProgress } from '../domain/types'

export const RUNE_SLOT_LEVELS: readonly RuneSlotLevel[] = [5, 10, 15]
export const MAX_SKILL_LEVEL = 20

/** XP 曲线：lvl n→n+1 需要 40 * n^1.6，向上取整。前期快后期慢。 */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0
  return Math.ceil(40 * Math.pow(level, 1.6))
}

/** 当前等级累计 XP 阈值（达到该 XP 即升到 level）。 */
export function totalXpAtLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i += 1) total += xpForLevel(i)
  return total
}

export function createInitialSkillProgress(skillId: EntityId): SkillProgress {
  return {
    skillId,
    level: 1,
    xp: 0,
    runeChoices: { 5: null, 10: null, 15: null },
  }
}

/** 给某技能加 XP；超过下一级阈值时 level + 1，xp 归零（不滚动累加，简单清晰）。 */
export function addSkillXp(progress: SkillProgress, amount: number): SkillProgress {
  if (amount <= 0 || progress.level >= MAX_SKILL_LEVEL) return progress
  let level = progress.level
  let xp = progress.xp + amount
  while (level < MAX_SKILL_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level)
    level += 1
  }
  if (level >= MAX_SKILL_LEVEL) xp = 0
  return { ...progress, level, xp }
}

/** 是否有未选 rune 的已解锁 slot（用于 UI 红点提示）。 */
export function hasPendingRuneChoice(progress: SkillProgress): boolean {
  for (const slot of RUNE_SLOT_LEVELS) {
    if (progress.level >= slot && progress.runeChoices[slot] === null) return true
  }
  return false
}

export function heroHasPendingRuneChoice(hero: Hero): boolean {
  for (const skill of hero.skills) {
    const progress = hero.skillProgress[skill.skillId]
    if (progress && hasPendingRuneChoice(progress)) return true
  }
  return false
}

/** 玩家是否在该技能的某 slot 已选定指定 rune。 */
export function hasRune(progress: SkillProgress | undefined, runeId: EntityId): boolean {
  if (!progress) return false
  for (const slot of RUNE_SLOT_LEVELS) {
    if (progress.runeChoices[slot] === runeId) return true
  }
  return false
}
