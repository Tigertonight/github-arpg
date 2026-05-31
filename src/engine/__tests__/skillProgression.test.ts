import { describe, expect, it } from 'vitest'
import {
  addSkillXp,
  createInitialSkillProgress,
  hasPendingRuneChoice,
  xpForLevel,
} from '../skillProgression'

describe('skillProgression', () => {
  it('xp curve grows monotonically', () => {
    let prev = 0
    for (let lvl = 1; lvl <= 19; lvl += 1) {
      const cost = xpForLevel(lvl)
      expect(cost).toBeGreaterThan(prev)
      prev = cost
    }
  })

  it('addSkillXp levels up and rolls over', () => {
    const p0 = createInitialSkillProgress('cleave')
    expect(p0.level).toBe(1)
    expect(p0.xp).toBe(0)

    const cost1 = xpForLevel(1) // = 40
    const p1 = addSkillXp(p0, cost1)
    expect(p1.level).toBe(2)
    expect(p1.xp).toBe(0)

    // 一次性多级
    const big = xpForLevel(1) + xpForLevel(2) + 5
    const p2 = addSkillXp(p0, big)
    expect(p2.level).toBe(3)
    expect(p2.xp).toBe(5)
  })

  it('addSkillXp clamps at MAX_SKILL_LEVEL', () => {
    let p = createInitialSkillProgress('cleave')
    p = addSkillXp(p, 999_999)
    expect(p.level).toBe(20)
    expect(p.xp).toBe(0)
  })

  it('hasPendingRuneChoice flags unlocked-but-unselected slots', () => {
    const p0 = createInitialSkillProgress('cleave')
    expect(hasPendingRuneChoice(p0)).toBe(false)

    const p5 = { ...p0, level: 5 }
    expect(hasPendingRuneChoice(p5)).toBe(true)

    const p5picked = { ...p5, runeChoices: { 5: 'rune_x', 10: null, 15: null } as const }
    expect(hasPendingRuneChoice(p5picked)).toBe(false)

    const p10 = { ...p5picked, level: 10 }
    expect(hasPendingRuneChoice(p10)).toBe(true)
  })
})
