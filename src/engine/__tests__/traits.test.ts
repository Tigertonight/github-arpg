import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/starterState'
import { advanceCombat } from '../combatLoop'
import {
  applyIncomingTrait,
  backlashDamage,
  counterMultiplier,
  interceptLethal,
  traitOf,
} from '../traits'
import type { EnemyInstance, GameState } from '../../domain/types'

function makeEnemy(overrides: Partial<EnemyInstance> & { enemyDefId: string }): EnemyInstance {
  return {
    id: 'e1',
    name: 'test',
    rank: 'normal',
    level: 1,
    currentLife: 100,
    maxLife: 100,
    armor: 0,
    bleed: { stacks: 0, remainingMs: 0 },
    ...overrides,
  } as EnemyInstance
}

describe('family traits — pure helpers', () => {
  it('plate_armor (construct) reduces incoming damage by 8 with floor 1', () => {
    const enemy = makeEnemy({ enemyDefId: 'black_forge_guard' }) // construct
    expect(applyIncomingTrait(enemy, 50)).toBe(42)
    expect(applyIncomingTrait(enemy, 5)).toBe(1)
  })

  it('primordial_cap caps damage at 25% maxLife', () => {
    const enemy = makeEnemy({ enemyDefId: 'forge_serpent', maxLife: 400, currentLife: 400 })
    expect(applyIncomingTrait(enemy, 200)).toBe(100) // 25% of 400
    expect(applyIncomingTrait(enemy, 50)).toBe(50)
  })

  it('undead bone_reform may revive elite at 25% HP', () => {
    const enemy = makeEnemy({ enemyDefId: 'glasswraith', rank: 'elite', maxLife: 200, currentLife: 0 })
    const rng = { next: () => 0.1 } // < 0.25 → triggers
    const result = interceptLethal(enemy, rng)
    expect(result?.newLife).toBe(50)
    expect(enemy.traitConsumed).toBe(true)
  })

  it('bone_reform consumed flag prevents second revive', () => {
    const enemy = makeEnemy({ enemyDefId: 'glasswraith', rank: 'elite', traitConsumed: true })
    const rng = { next: () => 0 }
    expect(interceptLethal(enemy, rng)).toBeNull()
  })

  it('bone_reform does NOT trigger on normal-rank undead', () => {
    const enemy = makeEnemy({ enemyDefId: 'bone_miner', rank: 'normal' })
    const rng = { next: () => 0 }
    expect(interceptLethal(enemy, rng)).toBeNull()
  })

  it('cultist last_rite leaves enemy at 1 HP first lethal', () => {
    const enemy = makeEnemy({ enemyDefId: 'coal_cultist' })
    const rng = { next: () => 0.99 }
    const result = interceptLethal(enemy, rng)
    expect(result?.newLife).toBe(1)
    expect(enemy.traitConsumed).toBe(true)
    expect(interceptLethal(enemy, rng)).toBeNull()
  })

  it('demon hellbacklash returns 5% reflect', () => {
    const enemy = makeEnemy({ enemyDefId: 'ember_imp' })
    expect(backlashDamage(enemy, 100)).toBe(5)
  })

  it('beast bloodthirst counter mul triggers below 40% HP', () => {
    const high = makeEnemy({ enemyDefId: 'rust_hound', currentLife: 60, maxLife: 100 })
    const low = makeEnemy({ enemyDefId: 'rust_hound', currentLife: 30, maxLife: 100 })
    expect(counterMultiplier(high)).toBe(1)
    expect(counterMultiplier(low)).toBe(1.3)
  })

  it('traitOf maps families correctly', () => {
    expect(traitOf(makeEnemy({ enemyDefId: 'bone_miner' }))).toBe('bone_reform') // undead
    expect(traitOf(makeEnemy({ enemyDefId: 'ember_imp' }))).toBe('hellbacklash') // demon
    expect(traitOf(makeEnemy({ enemyDefId: 'coal_cultist' }))).toBe('last_rite') // cultist
    expect(traitOf(makeEnemy({ enemyDefId: 'black_forge_guard' }))).toBe('plate_armor') // construct
    expect(traitOf(makeEnemy({ enemyDefId: 'rust_hound' }))).toBe('bloodthirst') // beast
    expect(traitOf(makeEnemy({ enemyDefId: 'forge_serpent' }))).toBe('primordial_cap') // primordial
  })
})

describe('family traits — combat integration', () => {
  it('hellbacklash damages hero when attacking demon', () => {
    const base = createStarterState()
    // 把首敌换成 demon (ember_imp)
    const enemy = { ...base.enemyGroup.members[0], enemyDefId: 'ember_imp', currentLife: 9999, maxLife: 9999 }
    const state: GameState = {
      ...base,
      stageMode: 'combat',
      hero: {
        ...base.hero,
        x: base.enemyGroup.x - 12,
        currentLife: 1000,
      },
      enemyGroup: { x: base.enemyGroup.x, members: [enemy] },
    }
    const heroBefore = state.hero.currentLife
    const after = advanceCombat(state, 900)
    // hero 应该受到 backlash + 怪物反击；至少损失一些 HP
    expect(after.hero.currentLife).toBeLessThan(heroBefore)
  })
})
