import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/migrations'
import { applyOfflineProgress } from '../offline'

describe('offline progress', () => {
  it('grants aggregate rewards without advancing past boss gates', () => {
    const state = createStarterState()
    const savedAt = Date.now() - 90 * 60 * 1000
    const next = applyOfflineProgress({ ...state, lastSavedAt: savedAt, progression: { ...state.progression, highestStage: 10, stage: 10 } }, Date.now())

    expect(next.resources.gold).toBeGreaterThan(state.resources.gold)
    expect(next.progression.stage).toBe(10)
    expect(next.inventory.pendingOfflineLootIds.length).toBeGreaterThan(0)
  })
})
