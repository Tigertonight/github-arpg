import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/migrations'
import { advanceCombat } from '../combatLoop'

describe('combat loop stage movement', () => {
  it('does not damage enemies while traveling', () => {
    const state = createStarterState()
    const next = advanceCombat({ ...state, stageMode: 'travel', stageModeUntil: Date.now() + 5000 }, 900)

    expect(next.stageMode).toBe('travel')
    expect(next.enemy.currentLife).toBe(state.enemy.currentLife)
  })

  it('switches from travel to combat after the encounter distance is covered', () => {
    const state = createStarterState()
    const next = advanceCombat({ ...state, stageMode: 'travel', stageModeUntil: Date.now() - 1 }, 900)

    expect(next.stageMode).toBe('combat')
    expect(next.enemy.currentLife).toBe(state.enemy.currentLife)
  })

  it('returns to travel after a kill so the next enemy is approached cleanly', () => {
    const state = createStarterState()
    const next = advanceCombat({
      ...state,
      stageMode: 'combat',
      stageModeUntil: 0,
      enemy: { ...state.enemy, currentLife: 1 },
    })

    expect(next.stageMode).toBe('travel')
    expect(next.stageModeUntil).toBeGreaterThan(Date.now())
  })
})
