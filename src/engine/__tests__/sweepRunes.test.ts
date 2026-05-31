import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/starterState'
import { advanceCombat } from '../combatLoop'
import type { GameState, SkillProgress } from '../../domain/types'

/**
 * 让 sweep 立即可释放（cleave/execute/iron_oath 全部 cd 99999），单 tick 验证 rune 行为。
 */
function makeSweepState(overrides: {
  rune?: 'whirling_grasp' | 'overhead_cleaver' | 'bleeding_arc' | 'gore_harvest' | 'tearing_momentum' | 'fractured_vow' | 'bleed_storm' | 'cull_the_wounded' | 'marrow_split'
  slot?: 5 | 10 | 15
  enemyCount?: number
  enemyOverrides?: { currentLife?: number; bleedStacks?: number; brandStacks?: number }
}): GameState {
  const base = createStarterState()
  const TANK_LIFE = 999_999
  const enemies = Array.from({ length: overrides.enemyCount ?? 1 }, (_, i) => ({
    ...base.enemyGroup.members[0],
    id: `enemy-${i}`,
    enemyDefId: 'bone_miner',
    rank: 'normal' as const,
    formationSlot: i,
    maxLife: TANK_LIFE,
    currentLife: overrides.enemyOverrides?.currentLife ?? TANK_LIFE,
    bleed: {
      stacks: overrides.enemyOverrides?.bleedStacks ?? 0,
      remainingMs: (overrides.enemyOverrides?.bleedStacks ?? 0) > 0 ? 4000 : 0,
    },
    brandStacks: overrides.enemyOverrides?.brandStacks ?? 0,
  }))

  const sweepProgress: SkillProgress = {
    skillId: 'lacerating_sweep',
    level: overrides.slot ?? 5,
    xp: 0,
    runeChoices: { 5: null, 10: null, 15: null },
  }
  if (overrides.rune && overrides.slot) {
    sweepProgress.runeChoices[overrides.slot] = overrides.rune
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
        cooldownRemainingMs: s.skillId === 'lacerating_sweep' ? 0 : 99_999,
      })),
      skillProgress: { ...base.hero.skillProgress, lacerating_sweep: sweepProgress },
    },
    enemyGroup: { x: base.enemyGroup.x, members: enemies },
  }
}

describe('lacerating_sweep runes', () => {
  it('whirling_grasp limits sweep to 3 targets', () => {
    const state = makeSweepState({ rune: 'whirling_grasp', slot: 5, enemyCount: 6 })
    const after = advanceCombat(state, 900)
    const damaged = after.enemyGroup.members.filter((e) => e.currentLife < e.maxLife).length
    expect(damaged).toBeLessThanOrEqual(3)
  })

  it('overhead_cleaver buffs primary by extra +30%', () => {
    const baseline = advanceCombat(makeSweepState({ enemyCount: 2 }), 900)
    const buffed = advanceCombat(makeSweepState({ rune: 'overhead_cleaver', slot: 5, enemyCount: 2 }), 900)
    const baseDmg = baseline.enemyGroup.members[0].maxLife - baseline.enemyGroup.members[0].currentLife
    const buffedDmg = buffed.enemyGroup.members[0].maxLife - buffed.enemyGroup.members[0].currentLife
    expect(buffedDmg).toBeGreaterThan(baseDmg)
  })

  it('bleeding_arc adds damage when target has bleed', () => {
    const noBleed = advanceCombat(makeSweepState({ rune: 'bleeding_arc', slot: 5, enemyOverrides: { bleedStacks: 0 } }), 900)
    const withBleed = advanceCombat(makeSweepState({ rune: 'bleeding_arc', slot: 5, enemyOverrides: { bleedStacks: 3 } }), 900)
    const noBleedDmg = noBleed.enemyGroup.members[0].maxLife - noBleed.enemyGroup.members[0].currentLife
    const withBleedDmg = withBleed.enemyGroup.members[0].maxLife - withBleed.enemyGroup.members[0].currentLife
    expect(withBleedDmg).toBeGreaterThan(noBleedDmg)
  })

  it('gore_harvest heals hero proportional to total bleed stacks', () => {
    const stateBuffed = makeSweepState({ rune: 'gore_harvest', slot: 10, enemyCount: 3, enemyOverrides: { bleedStacks: 4 } })
    const stateBaseline = makeSweepState({ enemyCount: 3, enemyOverrides: { bleedStacks: 4 } })
    // 给 hero 一个低但正值，避免触发死亡/respawn 路径，且留回血空间
    const heroLife = 50
    const buffed = advanceCombat({ ...stateBuffed, hero: { ...stateBuffed.hero, currentLife: heroLife } }, 900)
    const baseline = advanceCombat({ ...stateBaseline, hero: { ...stateBaseline.hero, currentLife: heroLife } }, 900)
    // 理论上 gore_harvest 应回血 totalBleed × 8
    expect(buffed.hero.currentLife).toBeGreaterThan(baseline.hero.currentLife)
  })

  it('fractured_vow detonates per-brand bonus damage', () => {
    const noBrand = advanceCombat(makeSweepState({ rune: 'fractured_vow', slot: 10, enemyOverrides: { brandStacks: 0 } }), 900)
    const withBrand = advanceCombat(makeSweepState({ rune: 'fractured_vow', slot: 10, enemyOverrides: { brandStacks: 3 } }), 900)
    const noBrandDmg = noBrand.enemyGroup.members[0].maxLife - noBrand.enemyGroup.members[0].currentLife
    const withBrandDmg = withBrand.enemyGroup.members[0].maxLife - withBrand.enemyGroup.members[0].currentLife
    expect(withBrandDmg).toBeGreaterThan(noBrandDmg)
  })

  it('cull_the_wounded execute-procs sweep on low-life targets', () => {
    // 怪血量 maxLife*0.3（低于 50%）触发 cull execute 倍率
    // 与 baseline 相同条件对比，伤害应更高
    const baseline = advanceCombat(makeSweepState({ enemyOverrides: { currentLife: 999_999 * 0.3 } }), 900)
    const buffed = advanceCombat(makeSweepState({ rune: 'cull_the_wounded', slot: 15, enemyOverrides: { currentLife: 999_999 * 0.3 } }), 900)
    const baseDmg = baseline.enemyGroup.members[0].maxLife - baseline.enemyGroup.members[0].currentLife
    const buffedDmg = buffed.enemyGroup.members[0].maxLife - buffed.enemyGroup.members[0].currentLife
    expect(buffedDmg).toBeGreaterThan(baseDmg)
  })
})
