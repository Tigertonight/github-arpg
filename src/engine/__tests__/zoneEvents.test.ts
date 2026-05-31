import { describe, expect, it } from 'vitest'
import { applyEventLifeMul, eventLootScalars, getActiveZoneMod, rollCrimsonTide, rollZoneModForZone } from '../zoneEvents'
import { createStarterState } from '../../persistence/starterState'
import { createRng } from '../rng'
import { CRIMSON_TIDE_GOLD_MUL, CRIMSON_TIDE_MAGIC_FIND, zoneModsById } from '../../data/zoneEvents'

describe('zoneEvents', () => {
  it('rollZoneModForZone returns existing mod when zoneId matches', () => {
    const state = createStarterState()
    const seeded = {
      ...state,
      zoneMod: { zoneId: 'black_forge_mines', modId: 'molten_pulse', rolledAtStage: 1 },
    }
    const result = rollZoneModForZone(seeded, 'black_forge_mines', 5, createRng(123))
    expect(result.modId).toBe('molten_pulse')
    expect(result.isNewRoll).toBe(false)
  })

  it('rollZoneModForZone rolls fresh mod when zoneId mismatches', () => {
    const state = createStarterState()
    const seeded = {
      ...state,
      zoneMod: { zoneId: 'black_forge_mines', modId: 'molten_pulse', rolledAtStage: 1 },
    }
    const result = rollZoneModForZone(seeded, 'bleeding_furnace', 11, createRng(456))
    expect(result.isNewRoll).toBe(true)
    expect(zoneModsById[result.modId]).toBeDefined()
  })

  it('getActiveZoneMod returns undefined when zoneMod zoneId differs from progression.zoneId', () => {
    const state = createStarterState()
    const seeded = {
      ...state,
      zoneMod: { zoneId: 'bleeding_furnace', modId: 'molten_pulse', rolledAtStage: 11 },
      progression: { ...state.progression, zoneId: 'black_forge_mines' },
    }
    expect(getActiveZoneMod(seeded)).toBeUndefined()
  })

  it('eventLootScalars stacks tide bonuses on top of zone mod', () => {
    const state = createStarterState()
    const seeded = {
      ...state,
      zoneMod: { zoneId: 'black_forge_mines', modId: 'sanguine_chant', rolledAtStage: 1 },
      crimsonTideActive: true,
    }
    const scalars = eventLootScalars(seeded)
    // sanguine_chant: bonusMagicFind=50, lootGoldMul=1.0
    expect(scalars.magicFind).toBe(50 + CRIMSON_TIDE_MAGIC_FIND)
    expect(scalars.goldMul).toBeCloseTo(1.0 * CRIMSON_TIDE_GOLD_MUL)
  })

  it('applyEventLifeMul scales every member uniformly and resets currentLife', () => {
    const state = createStarterState()
    const before = state.enemyGroup
    const after = applyEventLifeMul(before, 1.5)
    for (let i = 0; i < before.members.length; i += 1) {
      expect(after.members[i].maxLife).toBe(Math.round(before.members[i].maxLife * 1.5))
      expect(after.members[i].currentLife).toBe(after.members[i].maxLife)
    }
  })

  it('applyEventLifeMul is identity when mul is 1', () => {
    const state = createStarterState()
    const result = applyEventLifeMul(state.enemyGroup, 1)
    expect(result).toBe(state.enemyGroup)
  })

  it('rollCrimsonTide produces a boolean', () => {
    const result = rollCrimsonTide(createRng(789))
    expect(typeof result).toBe('boolean')
  })
})
