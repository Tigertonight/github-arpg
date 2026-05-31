import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/starterState'
import { advanceCombat } from '../combatLoop'
import type { GameState, SkillProgress } from '../../domain/types'

/**
 * 构造「英雄站到位、cleave 立即可释放、敌人前方满血」的对战快照。
 * 用 cleave 的 rune 测试单 tick 命中后果。
 */
function makeCombatState(overrides: {
  cleaveRune?: 'tempest_blade' | 'lunge_strike' | 'momentum_charge' | 'crimson_harvest' | 'chain_reaver' | 'oath_brand' | 'bleed_detonator' | 'executioner_rhythm' | 'ironbound_vow'
  cleaveRuneSlot?: 5 | 10 | 15
  cleaveLevel?: number
  enemyOverrides?: { currentLife?: number; bleedStacks?: number; bleedRemainingMs?: number }
}): GameState {
  const base = createStarterState()
  // 用没有特殊 family trait 干扰的 normal-rank undead，避免 bone_reform / last_rite 拦截致命伤
  const enemy = { ...base.enemyGroup.members[0], enemyDefId: 'bone_miner', rank: 'normal' as const }
  if (overrides.enemyOverrides) {
    if (overrides.enemyOverrides.currentLife !== undefined) enemy.currentLife = overrides.enemyOverrides.currentLife
    enemy.bleed = {
      stacks: overrides.enemyOverrides.bleedStacks ?? enemy.bleed.stacks,
      remainingMs: overrides.enemyOverrides.bleedRemainingMs ?? enemy.bleed.remainingMs,
    }
  }

  const cleaveProgress: SkillProgress = {
    skillId: 'cleave',
    level: overrides.cleaveLevel ?? 5,
    xp: 0,
    runeChoices: { 5: null, 10: null, 15: null },
  }
  if (overrides.cleaveRune && overrides.cleaveRuneSlot) {
    cleaveProgress.runeChoices[overrides.cleaveRuneSlot] = overrides.cleaveRune
  }

  return {
    ...base,
    rngSeed: 12345, // 固定种子，避免 starter Math.random() 引入的 flaky
    stageMode: 'combat',
    hero: {
      ...base.hero,
      x: base.enemyGroup.x - 12, // 在 ENCOUNTER_DISTANCE 内
      // 让 sweep / execute / iron_oath 留在 cd，使 chooseSkill 退到 cleave
      skills: base.hero.skills.map((s) => ({
        ...s,
        cooldownRemainingMs: s.skillId === 'cleave' ? 0 : 99_999,
      })),
      skillProgress: { ...base.hero.skillProgress, cleave: cleaveProgress },
    },
    enemyGroup: {
      x: base.enemyGroup.x,
      members: [enemy],
    },
  }
}

describe('cleave runes', () => {
  it('bleed_detonator consumes all bleed stacks on hit', () => {
    const state = makeCombatState({
      cleaveRune: 'bleed_detonator',
      cleaveRuneSlot: 15,
      cleaveLevel: 15,
      enemyOverrides: { bleedStacks: 5, bleedRemainingMs: 4000 },
    })
    const next = advanceCombat(state, 900)
    const enemy = next.enemyGroup.members[0]
    // 命中后流血层应被引爆消耗（再被技能本身的 bleedStacks=1 重新叠加 1 层）
    expect(enemy.bleed.stacks).toBeLessThanOrEqual(1)
  })

  it('momentum_charge accumulates stacks on hit', () => {
    const state = makeCombatState({
      cleaveRune: 'momentum_charge',
      cleaveRuneSlot: 5,
      cleaveLevel: 10,
    })
    const after1 = advanceCombat(state, 900)
    // 命中后应有 1 层势能（首次未消耗，因为命中前是 0 层）
    expect(after1.cleaveRuneState?.momentumStacks).toBe(1)
  })

  it('executioner_rhythm increments hit count toward 4-cycle', () => {
    const state = makeCombatState({
      cleaveRune: 'executioner_rhythm',
      cleaveRuneSlot: 15,
      cleaveLevel: 15,
    })
    const after = advanceCombat(state, 900)
    expect(after.cleaveRuneState?.rhythmHitCount).toBe(1)
  })

  it('oath_brand stacks brand on enemy', () => {
    const state = makeCombatState({
      cleaveRune: 'oath_brand',
      cleaveRuneSlot: 10,
      cleaveLevel: 10,
    })
    const after = advanceCombat(state, 900)
    const enemy = after.enemyGroup.members[0]
    expect(enemy.brandStacks).toBe(1)
  })

  it('ironbound_vow reduces iron_oath cooldown after cleave hit', () => {
    const state = makeCombatState({
      cleaveRune: 'ironbound_vow',
      cleaveRuneSlot: 15,
      cleaveLevel: 15,
    })
    // makeCombatState 已把 iron_oath 设为 99999 cd → 受 ironbound_vow 命中后 -200ms
    // 注意：cooldown 还会因 deltaMs=900 自然递减，所以总减少 = 200(rune) + 900(自然) = 1100
    const after = advanceCombat(state, 900)
    const ironOath = after.hero.skills.find((s) => s.skillId === 'iron_oath')!
    // 99999 - 900(自然) - 200(rune) = 98899
    expect(ironOath.cooldownRemainingMs).toBeLessThanOrEqual(99999 - 900 - 200)
  })

  it('no rune selected → cleave behaves as baseline (no cleaveRuneState created)', () => {
    const state = makeCombatState({ cleaveLevel: 1 })
    const after = advanceCombat(state, 900)
    // 未选 rune 时不应初始化 cleaveRuneState
    expect(after.cleaveRuneState).toBeUndefined()
  })
})
