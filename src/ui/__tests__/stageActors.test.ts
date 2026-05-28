import { describe, expect, it } from 'vitest'
import { createStarterState } from '../../persistence/starterState'
import { deriveStageActors, ENEMY_ENTER_DURATION_MS } from '../stageActors'

describe('deriveStageActors', () => {
  it('uses walk resources while traveling', () => {
    const state = createStarterState()
    const scene = deriveStageActors(state, 0)

    expect(scene.isTraveling).toBe(true)
    expect(scene.hero.frame.kind).toBe('sheet')
    expect(scene.hero.transition).toBe('none')
    expect(scene.enemies.length).toBeGreaterThan(0)
    expect(scene.enemies[0].frame.kind).toBe('walk')
    expect(scene.enemies[0].frame.src).toContain(`${state.enemyGroup.members[0].enemyDefId.replaceAll('_', '-')}-walk-sheet.png`)
    expect(scene.enemies[0].transition).toBe('left 0.9s linear')
  })

  it('uses aligned attack frames and pauses the same enemy sheet in combat', () => {
    const state = {
      ...createStarterState(),
      stageMode: 'combat' as const,
    }
    const scene = deriveStageActors(state, 2)

    expect(scene.isTraveling).toBe(false)
    expect(scene.hero.frame.kind).toBe('image')
    if (scene.hero.frame.kind === 'image') {
      expect(scene.hero.frame.src).toContain('oathbreaker-attack-aligned-frame-2.png')
    }
    expect(scene.hitFrameActive).toBe(true)
    expect(scene.vfx?.src).toContain('/assets/game/')
    expect(scene.enemies[0].frame.kind).toBe('walk')
    expect(scene.enemies[0].frame.className).toContain('enemy-walk-sheet-idle')
    expect(scene.enemies[0].transition).toBe('none')
    expect(scene.enemies[0].showHealthbar).toBe(true)
  })

  it('marks combat hit feedback from floating text', () => {
    const state = {
      ...createStarterState(),
      stageMode: 'combat' as const,
      floatingTexts: [{ id: 'float_1', label: '99', kind: 'crit' as const }],
    }
    const scene = deriveStageActors(state, 2)

    expect(scene.shakeClass).toBe('shake-crit')
    expect(scene.isHitTick).toBe(true)
    expect(scene.enemies[0].rootClassName).toContain('is-hit')
    expect(scene.vfx?.className).toContain('skill-vfx-crit')
  })

  it('uses dedicated attack sheets for enemies that have generated attack assets', () => {
    const base = createStarterState()
    const state = {
      ...base,
      stageMode: 'combat' as const,
      gameTimeMs: 500,
      enemyGroup: {
        ...base.enemyGroup,
        members: [
          {
            ...base.enemyGroup.members[0],
            enemyDefId: 'forge_serpent',
          },
        ],
      },
    }
    const scene = deriveStageActors(state, 1)

    expect(scene.enemies[0].state).toBe('attack')
    expect(scene.enemies[0].frame.className).toBe('enemy-attack-sheet')
    expect(scene.enemies[0].frame.src).toContain('enemy-forge-serpent-attack-sheet.png')
  })

  it('uses generated attack sheets for high priority enemy types', () => {
    const base = createStarterState()
    const enemyIds = [
      'bone_miner',
      'black_forge_guard',
      'coal_cultist',
      'rust_hound',
      'furnace_brute',
      'slag_warden',
    ]

    for (const enemyDefId of enemyIds) {
      const scene = deriveStageActors({
        ...base,
        stageMode: 'combat' as const,
        gameTimeMs: 500,
        enemyGroup: {
          ...base.enemyGroup,
          members: [
            {
              ...base.enemyGroup.members[0],
              enemyDefId,
            },
          ],
        },
      }, 1)

      expect(scene.enemies[0].state).toBe('attack')
      expect(scene.enemies[0].frame.className).toBe('enemy-attack-sheet')
      expect(scene.enemies[0].frame.src).toContain(`enemy-${enemyDefId.replaceAll('_', '-')}-attack-sheet.png`)
    }
  })

  it('walks newly streamed enemies in from offscreen before combat actions', () => {
    const base = createStarterState()
    const state = {
      ...base,
      stageMode: 'combat' as const,
      gameTimeMs: 10_000,
      enemyGroup: {
        ...base.enemyGroup,
        members: [
          {
            ...base.enemyGroup.members[0],
            spawnedAtMs: 10_000 - ENEMY_ENTER_DURATION_MS + 1,
          },
        ],
      },
    }
    const scene = deriveStageActors(state, 2)

    expect(scene.enemies[0].state).toBe('walk')
    expect(scene.enemies[0].rootClassName).toContain('is-entering')
    expect(scene.enemies[0].rootClassName).not.toContain('is-attacking')
    expect(scene.enemies[0].frame.className).toBe('enemy-walk-sheet')
    expect(scene.enemies[0].showHealthbar).toBe(false)
  })
})
