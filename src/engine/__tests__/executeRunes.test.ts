import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/starterState'
import { advanceCombat } from '../combatLoop'
import type { GameState, SkillProgress } from '../../domain/types'

/**
 * 让 execute 立即可释放，cleave/sweep/iron_oath cd 99999。
 * 默认目标低血（35% 内）确保进入处决判定。
 */
function makeExecState(overrides: {
  rune?: 'quick_judgment' | 'weighty_verdict' | 'chained_execution' | 'bleed_reckoning' | 'oath_collector' | 'executioner_brand' | 'lower_the_threshold' | 'mass_judgment' | 'final_oath'
  slot?: 5 | 10 | 15
  enemyCount?: number
  enemyOverrides?: { currentLife?: number; maxLife?: number; bleedStacks?: number; rank?: 'normal' | 'elite' | 'boss'; lifePct?: number }
}): GameState {
  const base = createStarterState()
  const TANK_LIFE = 999_999
  const maxLife = overrides.enemyOverrides?.maxLife ?? TANK_LIFE
  const lifePct = overrides.enemyOverrides?.lifePct ?? 0.2
  const enemies = Array.from({ length: overrides.enemyCount ?? 1 }, (_, i) => ({
    ...base.enemyGroup.members[0],
    id: `enemy-${i}`,
    enemyDefId: 'bone_miner',
    rank: overrides.enemyOverrides?.rank ?? ('normal' as const),
    formationSlot: i,
    maxLife,
    currentLife: overrides.enemyOverrides?.currentLife ?? Math.floor(maxLife * lifePct),
    bleed: {
      stacks: overrides.enemyOverrides?.bleedStacks ?? 0,
      remainingMs: (overrides.enemyOverrides?.bleedStacks ?? 0) > 0 ? 4000 : 0,
    },
  }))

  const executeProgress: SkillProgress = {
    skillId: 'execute',
    level: overrides.slot ?? 5,
    xp: 0,
    runeChoices: { 5: null, 10: null, 15: null },
  }
  if (overrides.rune && overrides.slot) {
    executeProgress.runeChoices[overrides.slot] = overrides.rune
  }

  return {
    ...base,
    rngSeed: 12345,
    stageMode: 'combat',
    hero: {
      ...base.hero,
      x: base.enemyGroup.x - 12,
      skills: base.hero.skills.map((s) => ({
        ...s,
        cooldownRemainingMs: s.skillId === 'execute' ? 0 : 99_999,
      })),
      skillProgress: { ...base.hero.skillProgress, execute: executeProgress },
    },
    enemyGroup: { x: base.enemyGroup.x, members: enemies },
  }
}

describe('execute runes', () => {
  it('weighty_verdict deals more damage than baseline (forced crit + 1.5×)', () => {
    const baseline = advanceCombat(makeExecState({}), 900)
    const buffed = advanceCombat(makeExecState({ rune: 'weighty_verdict', slot: 5 }), 900)
    const baseDmg = baseline.enemyGroup.members[0].maxLife - baseline.enemyGroup.members[0].currentLife
    const buffedDmg = buffed.enemyGroup.members[0].maxLife - buffed.enemyGroup.members[0].currentLife
    expect(buffedDmg).toBeGreaterThanOrEqual(baseDmg)
  })

  it('quick_judgment shortens cooldown vs baseline', () => {
    const baseline = advanceCombat(makeExecState({}), 900)
    const buffed = advanceCombat(makeExecState({ rune: 'quick_judgment', slot: 5 }), 900)
    const baseCd = baseline.hero.skills.find((s) => s.skillId === 'execute')!.cooldownRemainingMs
    const buffedCd = buffed.hero.skills.find((s) => s.skillId === 'execute')!.cooldownRemainingMs
    expect(buffedCd).toBeLessThan(baseCd)
  })

  it('bleed_reckoning scales execute damage with target bleed stacks', () => {
    // 默认 lifePct=0.2 → 触发处决；TANK_LIFE 防止一击秒杀
    const noBleed = advanceCombat(makeExecState({ rune: 'bleed_reckoning', slot: 10, enemyOverrides: { bleedStacks: 0 } }), 900)
    const withBleed = advanceCombat(makeExecState({ rune: 'bleed_reckoning', slot: 10, enemyOverrides: { bleedStacks: 5 } }), 900)
    const noBleedDmg = noBleed.enemyGroup.members[0].maxLife - noBleed.enemyGroup.members[0].currentLife
    const withBleedDmg = withBleed.enemyGroup.members[0].maxLife - withBleed.enemyGroup.members[0].currentLife
    expect(withBleedDmg).toBeGreaterThan(noBleedDmg)
  })

  it('lower_the_threshold expands execute window to 55% life', () => {
    // 50% 血：baseline 不触发处决（>35%），lowered 触发处决倍率
    const baseline = advanceCombat(makeExecState({ enemyOverrides: { lifePct: 0.5 } }), 900)
    const lowered = advanceCombat(makeExecState({ rune: 'lower_the_threshold', slot: 15, enemyOverrides: { lifePct: 0.5 } }), 900)
    const baseDmg = baseline.enemyGroup.members[0].maxLife - baseline.enemyGroup.members[0].currentLife
    const loweredDmg = lowered.enemyGroup.members[0].maxLife - lowered.enemyGroup.members[0].currentLife
    expect(loweredDmg).toBeGreaterThan(baseDmg)
  })

  it('mass_judgment hits up to 3 targets', () => {
    // 让 5 个 tank 怪都低血但血量足够吃伤害（不被一击秒杀让 maxLife - currentLife = 0）
    const base = createStarterState()
    const TANK = 999_999
    const enemies = Array.from({ length: 5 }, (_, i) => ({
      ...base.enemyGroup.members[0],
      id: `enemy-${i}`,
      enemyDefId: 'bone_miner',
      rank: 'normal' as const,
      formationSlot: i,
      maxLife: TANK,
      currentLife: TANK * 0.2, // 低血，触发 execute
      // remainingMs=0 → 流血 tick 不产生伤害，但 stacks 仍参与 mass_judgment 排序
      bleed: { stacks: i, remainingMs: 0 },
    }))
    const executeProgress: SkillProgress = {
      skillId: 'execute',
      level: 15,
      xp: 0,
      runeChoices: { 5: null, 10: null, 15: 'mass_judgment' },
    }
    const state: GameState = {
      ...base,
      rngSeed: 12345,
      stageMode: 'combat',
      hero: {
        ...base.hero,
        x: base.enemyGroup.x - 12,
        skills: base.hero.skills.map((s) => ({ ...s, cooldownRemainingMs: s.skillId === 'execute' ? 0 : 99_999 })),
        skillProgress: { ...base.hero.skillProgress, execute: executeProgress },
      },
      enemyGroup: { x: base.enemyGroup.x, members: enemies },
    }
    const after = advanceCombat(state, 900)
    const damaged = after.enemyGroup.members.filter((e) => e.currentLife < TANK * 0.2).length
    expect(damaged).toBeGreaterThan(1)
    expect(damaged).toBeLessThanOrEqual(3)
  })

  it('final_oath fully heals hero on elite/boss execute kill', () => {
    // 用 construct 系（plate_armor，没有致命拦截）+ elite 确保被处决一击杀
    const base = createStarterState()
    const elite = {
      ...base.enemyGroup.members[0],
      enemyDefId: 'black_forge_guard', // construct/elite
      rank: 'elite' as const,
      currentLife: 1,
      maxLife: 100,
    }
    const executeProgress: SkillProgress = {
      skillId: 'execute',
      level: 15,
      xp: 0,
      runeChoices: { 5: null, 10: null, 15: 'final_oath' },
    }
    const woundedHeroLife = 100
    const state: GameState = {
      ...base,
      rngSeed: 12345,
      stageMode: 'combat',
      hero: {
        ...base.hero,
        x: base.enemyGroup.x - 12,
        currentLife: woundedHeroLife,
        skills: base.hero.skills.map((s) => ({ ...s, cooldownRemainingMs: s.skillId === 'execute' ? 0 : 99_999 })),
        skillProgress: { ...base.hero.skillProgress, execute: executeProgress },
      },
      enemyGroup: { x: base.enemyGroup.x, members: [elite] },
    }
    const after = advanceCombat(state, 900)
    expect(after.hero.currentLife).toBeGreaterThan(woundedHeroLife)
  })
})
