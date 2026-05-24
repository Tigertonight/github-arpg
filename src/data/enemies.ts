import type { EnemyDefinition, ZoneDefinition } from '../domain/types'

export const enemies: EnemyDefinition[] = [
  { id: 'bone_miner', name: '碎骨矿奴', family: 'undead', rank: 'normal', baseLife: 96, baseArmor: 3, lootTableId: 'black_forge' },
  { id: 'rust_hound', name: '锈刃猎犬', family: 'demon', rank: 'normal', baseLife: 82, baseArmor: 1, lootTableId: 'black_forge' },
  { id: 'coal_cultist', name: '煤烬教徒', family: 'cultist', rank: 'normal', baseLife: 108, baseArmor: 4, lootTableId: 'black_forge' },
  { id: 'black_forge_guard', name: '黑炉守卫', family: 'construct', rank: 'elite', baseLife: 210, baseArmor: 12, lootTableId: 'black_forge_elite' },
  { id: 'vein_butcher', name: '血脉屠夫', family: 'demon', rank: 'boss', baseLife: 520, baseArmor: 18, lootTableId: 'black_forge_boss' },
]

export const enemiesById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy]))

export const zones: ZoneDefinition[] = [
  {
    id: 'black_forge_mines',
    name: '黑炉矿道',
    biome: '废矿 / 熔炉 / 血锈铁轨',
    bossEveryStages: 10,
    enemyIds: ['bone_miner', 'rust_hound', 'coal_cultist', 'black_forge_guard'],
    bossEnemyId: 'vein_butcher',
  },
]

export const zonesById = Object.fromEntries(zones.map((zone) => [zone.id, zone]))
