import { describe, expect, it } from 'vitest'
import { migrateLegacyState } from '../migrations'

describe('legacy save migration', () => {
  it('maps v1 local storage saves into versioned v2 state', () => {
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

    expect(migrated?.version).toBe(2)
    expect(migrated?.resources.gold).toBe(120)
    expect(migrated?.progression.stage).toBe(6)
    expect(migrated?.hero.equipment.chest).toBe('old_armor')
    expect(migrated?.inventory.itemIds).toContain('old_weapon')
  })
})
