import { describe, expect, it } from 'vitest'
import { analyzeAllArchetypes, analyzeArchetype } from '../buildPlanner'
import { buildArchetypesById } from '../../data/buildArchetypes'
import { createStarterState } from '../../persistence/starterState'
import type { GameState } from '../../domain/types'

describe('buildPlanner', () => {
  it('analyzes every archetype defined in catalog', () => {
    const state = createStarterState()
    const result = analyzeAllArchetypes(state)
    expect(result.length).toBeGreaterThan(0)
    for (const r of result) {
      expect(r.completion).toBeGreaterThanOrEqual(0)
      expect(r.completion).toBeLessThanOrEqual(1)
      expect(r.items.length).toBe(r.totalCount)
    }
  })

  it('treasure_hunter has only affix requirements', () => {
    const state = createStarterState()
    const def = buildArchetypesById.treasure_hunter
    const status = analyzeArchetype(state, def)
    expect(status.items.every((i) => i.kind === 'affix')).toBe(true)
  })

  it('rune chosen on a skill counts as have', () => {
    const state = createStarterState()
    const cleave = state.hero.skills[0]
    const seeded: GameState = {
      ...state,
      hero: {
        ...state.hero,
        skillProgress: {
          ...state.hero.skillProgress,
          [cleave.skillId]: {
            ...state.hero.skillProgress[cleave.skillId],
            runeChoices: { 5: 'tearing_momentum', 10: null, 15: null },
          },
        },
      },
    }
    const status = analyzeArchetype(seeded, buildArchetypesById.bleed_stack)
    const tearing = status.items.find((i) => i.id === 'tearing_momentum')
    expect(tearing?.status).toBe('have')
  })

  it('legendary in inventory but unequipped is reported as owned (half score)', () => {
    const state = createStarterState()
    const newId = 'fake_lego_item'
    const seeded: GameState = {
      ...state,
      itemsById: {
        ...state.itemsById,
        [newId]: {
          id: newId,
          baseItemId: 'oath_claymore',
          name: '心绞诅咒护符',
          slot: 'amulet',
          rarity: 'legendary',
          itemLevel: 30,
          affixes: [],
          tags: [],
          createdAt: 0,
          legendaryPowerId: 'heart_strangler',
        },
      },
    }
    const status = analyzeArchetype(seeded, buildArchetypesById.bleed_stack)
    const heart = status.items.find((i) => i.id === 'heart_strangler')
    expect(heart?.status).toBe('owned')
  })
})
