import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/starterState'
import { advanceCombat } from '../combatLoop'
import { ENCOUNTER_DISTANCE, ENEMY_SPAWN_AHEAD, zoneIdForStage } from '../progression'

describe('combat loop stage movement', () => {
  it('advances hero forward in world coords without damaging enemies during travel', () => {
    const state = createStarterState()
    expect(state.stageMode).toBe('travel')
    const heroXBefore = state.hero.x
    const enemyXBefore = state.enemyGroup.x
    const totalLifeBefore = state.enemyGroup.members.reduce((s, e) => s + e.currentLife, 0)

    const next = advanceCombat(state, 900)

    const totalLifeAfter = next.enemyGroup.members.reduce((s, e) => s + e.currentLife, 0)
    expect(totalLifeAfter).toBe(totalLifeBefore)
    // 英雄向前推进，敌群在世界中静止
    expect(next.hero.x).toBeGreaterThan(heroXBefore)
    expect(next.enemyGroup.x).toBe(enemyXBefore)
    expect(next.gameTimeMs).toBe(900)
  })

  it('switches travel → combat once distance < encounter threshold', () => {
    const state = createStarterState()
    const closing = {
      ...state,
      hero: { ...state.hero, x: state.enemyGroup.x - ENCOUNTER_DISTANCE - 1 },
    }
    const next = advanceCombat(closing, 900)
    expect(next.stageMode).toBe('combat')
  })

  it('clears the group, spawns next group ahead, and keeps hero.x advancing', () => {
    const state = createStarterState()
    const single = state.enemyGroup.members[0]
    const heroAtKill = state.enemyGroup.x - ENCOUNTER_DISTANCE
    const inCombat = {
      ...state,
      stageMode: 'combat' as const,
      stageModeUntil: 0,
      hero: { ...state.hero, x: heroAtKill },
      enemyGroup: {
        x: state.enemyGroup.x,
        members: [{ ...single, currentLife: 1, bleed: { ...single.bleed } }],
      },
    }
    const next = advanceCombat(inCombat)

    expect(next.stageMode).toBe('travel')
    // 新一波生成在英雄前方
    expect(next.enemyGroup.x).toBe(heroAtKill + ENEMY_SPAWN_AHEAD)
    // 英雄不回退
    expect(next.hero.x).toBe(heroAtKill)
    expect(next.enemyGroup.members.length).toBeGreaterThan(0)
  })

  it('does not instantly replace defeated enemies before the reinforcement timer', () => {
    const state = createStarterState()
    const [first, second] = state.enemyGroup.members
    const inCombat = {
      ...state,
      stageMode: 'combat' as const,
      stageModeUntil: 0,
      enemyGroup: {
        x: state.enemyGroup.x,
        members: [
          { ...first, currentLife: 0, bleed: { ...first.bleed } },
          { ...second, currentLife: second.maxLife, bleed: { ...second.bleed } },
        ],
        lastSpawnAtMs: state.gameTimeMs,
      },
    }

    const next = advanceCombat(inCombat)

    expect(next.stageMode).toBe('combat')
    expect(next.enemyGroup.members).toHaveLength(1)
    expect(next.enemyGroup.members.some((enemy) => enemy.id === second.id)).toBe(true)
  })

  it('streams reinforcement enemies by time during combat', () => {
    const state = createStarterState()
    const [first, second] = state.enemyGroup.members
    const inCombat = {
      ...state,
      stageMode: 'combat' as const,
      stageModeUntil: 0,
      gameTimeMs: 3_000,
      enemyGroup: {
        x: state.enemyGroup.x,
        members: [
          { ...first, currentLife: 0, bleed: { ...first.bleed } },
          { ...second, currentLife: second.maxLife, bleed: { ...second.bleed } },
        ],
        lastSpawnAtMs: 0,
      },
    }

    const next = advanceCombat(inCombat)

    expect(next.stageMode).toBe('combat')
    expect(next.enemyGroup.members).toHaveLength(2)
    const reinforcement = next.enemyGroup.members.find((enemy) => enemy.id !== second.id)
    expect(reinforcement?.spawnedAtMs).toBe(next.gameTimeMs)
    expect(next.enemyGroup.lastSpawnAtMs).toBe(next.gameTimeMs)
  })

  it('routes Act 1 stages into the correct zone assets', () => {
    expect(zoneIdForStage(1)).toBe('black_forge_mines')
    expect(zoneIdForStage(10)).toBe('black_forge_mines')
    expect(zoneIdForStage(11)).toBe('bleeding_furnace')
  })
})
