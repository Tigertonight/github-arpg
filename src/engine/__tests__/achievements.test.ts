import { describe, expect, it } from 'vitest'
import { evaluateAchievements } from '../achievements'
import { createStarterState } from '../../persistence/starterState'

describe('evaluateAchievements', () => {
  it('does not unlock anything for a fresh starter state', () => {
    const state = createStarterState()
    const after = evaluateAchievements(state)
    expect(after.unlockedAchievements ?? {}).toEqual({})
  })

  it('unlocks kills_100 once kill threshold reached and grants reward', () => {
    const state = createStarterState()
    const seeded = {
      ...state,
      progression: { ...state.progression, kills: 100 },
    }
    const after = evaluateAchievements(seeded)
    expect(after.unlockedAchievements?.kills_100).toBeTruthy()
    expect(after.resources.gold).toBe(state.resources.gold + 500)
    expect(after.resources.shards).toBe(state.resources.shards + 20)
  })

  it('does not double-grant a reward already unlocked', () => {
    const state = createStarterState()
    const seeded = {
      ...state,
      progression: { ...state.progression, kills: 100 },
      unlockedAchievements: { kills_100: { unlockedAtMs: 0 } },
    }
    const after = evaluateAchievements(seeded)
    expect(after.resources.gold).toBe(state.resources.gold)
  })

  it('unlocks stage and torment achievements together when both conditions met', () => {
    const state = createStarterState()
    const seeded = {
      ...state,
      progression: { ...state.progression, highestStage: 100, maxTormentUnlocked: 1 },
    }
    const after = evaluateAchievements(seeded)
    expect(after.unlockedAchievements?.stage_100).toBeTruthy()
    expect(after.unlockedAchievements?.stage_30).toBeTruthy()
    expect(after.unlockedAchievements?.torment_1).toBeTruthy()
  })

  it('skips event-trigger achievements during polled evaluation', () => {
    const state = createStarterState()
    const after = evaluateAchievements(state)
    expect(after.unlockedAchievements?.first_crit_100k).toBeUndefined()
  })
})
