import { describe, expect, it } from 'vitest'
import { markEncountered, recordKill } from '../bestiary'
import { createStarterState } from '../../persistence/starterState'
import { advanceCombat } from '../combatLoop'
import type { EnemyInstance } from '../../domain/types'

function makeEnemy(over: Partial<EnemyInstance> & { id: string; enemyDefId: string }): EnemyInstance {
  const base = createStarterState().enemyGroup.members[0]
  return { ...base, formationSlot: 0, rank: 'normal' as const, ...over }
}

describe('bestiary helpers', () => {
  it('markEncountered creates entry for first-seen enemy', () => {
    const after = markEncountered(undefined, [
      makeEnemy({ id: 'a', enemyDefId: 'bone_miner' }),
      makeEnemy({ id: 'b', enemyDefId: 'rust_hound' }),
    ])
    expect(after?.bone_miner.encountered).toBe(true)
    expect(after?.rust_hound.encountered).toBe(true)
    expect(after?.bone_miner.kills).toBe(0)
  })

  it('markEncountered keeps existing kill counts', () => {
    const initial = recordKill(undefined, makeEnemy({ id: 'a', enemyDefId: 'bone_miner' }), 1000)
    const after = markEncountered(initial, [makeEnemy({ id: 'b', enemyDefId: 'bone_miner' })])
    expect(after?.bone_miner.kills).toBe(1)
    expect(after?.bone_miner.encountered).toBe(true)
  })

  it('recordKill increments kills + rank-specific counters', () => {
    let state = recordKill(undefined, makeEnemy({ id: 'a', enemyDefId: 'bone_miner', rank: 'normal' }), 100)
    state = recordKill(state, makeEnemy({ id: 'b', enemyDefId: 'bone_miner', rank: 'elite' }), 200)
    state = recordKill(state, makeEnemy({ id: 'c', enemyDefId: 'bone_miner', rank: 'boss' }), 300)
    const entry = state!.bone_miner
    expect(entry.kills).toBe(3)
    expect(entry.eliteKills).toBe(1)
    expect(entry.bossKills).toBe(1)
    expect(entry.firstKillAtMs).toBe(100)
  })
})

describe('bestiary integration with combatLoop', () => {
  it('records kill when enemy dies during advanceCombat', () => {
    const base = createStarterState()
    const enemy = {
      ...base.enemyGroup.members[0],
      enemyDefId: 'bone_miner',
      rank: 'normal' as const,
      currentLife: 1,
      maxLife: 1,
    }
    const state = {
      ...base,
      stageMode: 'combat' as const,
      hero: { ...base.hero, x: base.enemyGroup.x - 12 },
      enemyGroup: { x: base.enemyGroup.x, members: [enemy] },
    }
    const after = advanceCombat(state, 900)
    const entry = after.bestiary?.bone_miner
    expect(entry?.kills ?? 0).toBeGreaterThanOrEqual(1)
    expect(entry?.encountered).toBe(true)
  })
})
