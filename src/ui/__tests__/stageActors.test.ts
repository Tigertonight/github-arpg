import { describe, expect, it } from 'vitest'
import { ENCOUNTER_DISTANCE } from '../../engine/progression'
import { createStarterState } from '../../persistence/starterState'
import { deriveStageActors, ENEMY_ENTER_DURATION_MS, ENEMY_POSITION_TRANSITION } from '../stageActors'

describe('deriveStageActors', () => {
  it('uses walk resources while traveling', () => {
    const state = createStarterState()
    const scene = deriveStageActors(state, 0)

    expect(scene.isTraveling).toBe(true)
    expect(scene.hero.frame.kind).toBe('sheet')
    expect(scene.hero.transition).toBe('none')
    expect(scene.enemies.length).toBeGreaterThan(0)
    expect(scene.enemies[0].frame.kind).toBe('walk')
    expect(scene.enemies[0].frame.src).toContain(`enemy-${state.enemyGroup.members[0].enemyDefId.replaceAll('_', '-')}-walk-sheet.png`)
    expect(scene.enemies[0].transition).toBe(ENEMY_POSITION_TRANSITION)
  })

  it('uses generated attack sheets and skill vfx on the hero hit frame', () => {
    const state = {
      ...createStarterState(),
      stageMode: 'combat' as const,
    }
    const scene = deriveStageActors(state, 2)

    expect(scene.isTraveling).toBe(false)
    expect(scene.hero.frame.kind).toBe('sheet')
    if (scene.hero.frame.kind === 'sheet') {
      expect(scene.hero.frame.src).toContain('heroes/oathbreaker/')
      expect(scene.hero.frame.src).toContain('-sheet.png')
      expect(scene.hero.frame.frames).toBe(4)
    }
    expect(scene.hitFrameActive).toBe(true)
    expect(scene.vfx?.src).toContain('/assets/game/')
    expect(scene.enemies[0].transition).toBe(ENEMY_POSITION_TRANSITION)
    expect(scene.enemies[0].showHealthbar).toBe(true)
  })

  it('keeps enemies idle before the presentation attack window', () => {
    const state = {
      ...createStarterState(),
      stageMode: 'combat' as const,
    }
    const scene = deriveStageActors(state, 0)

    expect(scene.enemies[0].state).toBe('idle')
    expect(scene.enemies[0].frame.kind).toBe('walk')
    expect(scene.enemies[0].frame.className).toContain('enemy-walk-sheet-idle')
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

  it('keeps expanded enemy attacks on stable root sheets until specific attack art is cleaned', () => {
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
    const scene = deriveStageActors(state, 2)

    expect(scene.enemies[0].state).toBe('attack')
    expect(scene.enemies[0].frame.className).toContain('enemy-attack-sheet')
    expect(scene.enemies[0].frame.src).toContain('enemies/runtime/forge-serpent/attack-sheet.png')
  })

  it('keeps stable root action sheets for the first-zone enemy set', () => {
    const base = createStarterState()
    const enemyIds = [
      'bone_miner',
      'black_forge_guard',
      'coal_cultist',
      'rust_hound',
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
      }, 2)

      expect(scene.enemies[0].state).toBe('attack')
      expect(scene.enemies[0].frame.className).toContain('enemy-attack-sheet')
      expect(scene.enemies[0].frame.src).toContain(`enemy-${enemyDefId.replaceAll('_', '-')}-attack-sheet.png`)
    }
  })

  it('uses motion-rich specific walk sheets for later-zone enemy types', () => {
    const base = createStarterState()
    const enemyIds = ['pale_chorister', 'crimson_hound', 'wyrm_of_broken_word']

    for (const enemyDefId of enemyIds) {
      const scene = deriveStageActors({
        ...base,
        stageMode: 'travel' as const,
        enemyGroup: {
          ...base.enemyGroup,
          members: [
            {
              ...base.enemyGroup.members[0],
              enemyDefId,
            },
          ],
        },
      }, 0)

      expect(scene.enemies[0].state).toBe('walk')
      expect(scene.enemies[0].frame.className).toBe('enemy-walk-sheet')
      expect(scene.enemies[0].frame.src).toContain(`enemies/runtime/${enemyDefId.replaceAll('_', '-')}/walk-sheet.png`)
    }
  })

  it('keeps a surviving enemy on its assigned formation slot after earlier slots are empty', () => {
    const base = createStarterState()
    const state = {
      ...base,
      stageMode: 'combat' as const,
      enemyGroup: {
        ...base.enemyGroup,
        x: base.hero.x + ENCOUNTER_DISTANCE,
        members: [
          {
            ...base.enemyGroup.members[0],
            formationSlot: 2,
          },
        ],
      },
    }
    const scene = deriveStageActors(state, 0)

    expect(scene.enemies[0].xPct).toBe(78)
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
