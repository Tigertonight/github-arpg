import { describe, expect, it } from 'vitest'
import { CURRENT_SAVE_VERSION, migrateLegacyState, migrateV2ToV3, migrateV3ToV4 } from '../migrations'
import { ENEMY_SPAWN_AHEAD, HERO_START_X } from '../../engine/progression'

describe('legacy save migration', () => {
  it('maps v1 local storage saves into the current save version', () => {
    const legacy = JSON.stringify({
      stage: 6,
      gold: 120,
      shards: 9,
      kills: 24,
      xp: 260,
      inventory: [{ id: 'old_weapon', name: '旧制阔刃', slot: 'weapon', rarity: 'rare', power: 18, speed: 0.1, find: 3, level: 5 }],
      equipment: {
        armor: { id: 'old_armor', name: '旧制皮甲', slot: 'armor', rarity: 'magic', power: 10, speed: 0.05, find: 2, level: 4 },
      },
      log: ['旧日志'],
      lastSeen: 1000,
    })

    const migrated = migrateLegacyState(legacy)

    expect(migrated?.version).toBe(CURRENT_SAVE_VERSION)
    expect(migrated?.resources.gold).toBe(120)
    expect(migrated?.progression.stage).toBe(6)
    expect(migrated?.hero.equipment.chest).toBe('old_armor')
    expect(migrated?.inventory.itemIds).toContain('old_weapon')
  })
})

describe('v2 → v3 migration', () => {
  it('moves equipment.ring to ring1 and adds an empty ring2 slot', () => {
    const v2 = {
      version: 2,
      hero: {
        equipment: {
          weapon: 'w1',
          offhand: null,
          helm: null,
          chest: null,
          gloves: null,
          boots: null,
          amulet: null,
          ring: 'ring_a',
          relic: null,
        },
      },
      itemsById: {
        ring_a: { id: 'ring_a', slot: 'ring', name: '骨戒', rarity: 'magic', itemLevel: 4 },
      },
    }

    const v3 = migrateV2ToV3(v2)

    expect(v3.version).toBe(3)
    expect(v3.hero.equipment.ring1).toBe('ring_a')
    expect(v3.hero.equipment.ring2).toBeNull()
    expect((v3.hero.equipment as any).ring).toBeUndefined()
    expect(v3.itemsById.ring_a.slot).toBe('ring1')
  })

  it('upgrades v2 AffixRoll {affixId, value} to v3 {affixId, tier, values}', () => {
    const v2 = {
      version: 2,
      hero: { equipment: { ring: null } },
      itemsById: {
        sword: {
          id: 'sword',
          slot: 'weapon',
          affixes: [{ affixId: 'cruel', value: 14 }],
        },
      },
    }
    const v3 = migrateV2ToV3(v2)
    const upgraded = v3.itemsById.sword.affixes[0]
    expect(upgraded.values).toEqual([14])
    expect(typeof upgraded.tier).toBe('number')
    expect(upgraded.tier).toBeGreaterThanOrEqual(1)
    expect(upgraded.tier).toBeLessThanOrEqual(5)
  })

  it('preserves existing ring1/ring2 slots if they already exist', () => {
    const v2 = {
      version: 2,
      hero: {
        equipment: {
          weapon: null, offhand: null, helm: null, chest: null,
          gloves: null, boots: null, amulet: null,
          ring1: 'ra', ring2: 'rb', relic: null,
        },
      },
      itemsById: {},
    }

    const v3 = migrateV2ToV3(v2)
    expect(v3.hero.equipment.ring1).toBe('ra')
    expect(v3.hero.equipment.ring2).toBe('rb')
  })
})

describe('v3 → v4 migration', () => {
  it('wraps the single enemy into an enemyGroup and adds hero.x', () => {
    const v3 = {
      version: 3,
      gameTimeMs: 0,
      stageMode: 'combat',
      stageModeUntil: 0,
      hero: { id: 'h', equipment: {}, skills: [] },
      enemy: {
        id: 'e1',
        enemyDefId: 'bone_miner',
        name: '骨工',
        rank: 'normal',
        level: 1,
        currentLife: 50,
        maxLife: 80,
        armor: 5,
        bleed: { stacks: 0, remainingMs: 0 },
      },
      progression: { zoneId: 'black_forge_mines', stage: 1, highestStage: 1, kills: 0 },
    }
    const v4 = migrateV3ToV4(v3)
    expect(v4.version).toBe(CURRENT_SAVE_VERSION)
    expect(v4.enemyGroup.x).toBe(HERO_START_X + ENEMY_SPAWN_AHEAD)
    expect(v4.enemyGroup.members).toHaveLength(1)
    expect(v4.enemyGroup.members[0].id).toBe('e1')
    expect(v4.hero.x).toBe(HERO_START_X)
    expect((v4 as any).enemy).toBeUndefined()
  })

  it('regenerates the group if v3 state has no enemy field, preserves explicit hero.x', () => {
    const v3 = {
      version: 3,
      hero: { equipment: {}, skills: [], x: 22 },
      progression: { zoneId: 'black_forge_mines', stage: 4, highestStage: 4, kills: 0 },
    }
    const v4 = migrateV3ToV4(v3)
    expect(v4.enemyGroup.members.length).toBeGreaterThan(0)
    expect(v4.hero.x).toBe(22)
  })
})
