import { enemiesById, zonesById } from '../data/enemies'
import { createId } from '../domain/ids'
import type { EnemyGroup, EnemyInstance } from '../domain/types'
import type { Rng } from './rng'
import { pickOne, rollInt } from './rng'

/**
 * 世界坐标：英雄沿正方向无限累加（hero.x 单调递增），敌群在世界中静止等待。
 * 视口（屏幕）渲染时英雄固定在 HERO_VIEW_X，敌群按相对距离绘制。
 */
export const HERO_START_X = 0
/** 英雄在视口的固定锚点（百分比）。镜头始终跟随英雄。 */
export const HERO_VIEW_X = 30
/** 新一波敌群相对英雄当前位置生成在世界右侧多远。需要大于视口宽度，保证从屏幕外走入。 */
export const ENEMY_SPAWN_AHEAD = 86
/** 英雄与敌群世界距离 < 此值，触发遭遇战。 */
export const ENCOUNTER_DISTANCE = 32
export const STAGES_PER_ZONE = 10

const zoneIdsByStage = ['black_forge_mines', 'bleeding_furnace', 'silent_choir', 'ossuary_keep', 'pale_wastes', 'iron_caravan', 'crimson_keep', 'moonblood_crypt', 'oath_abyss', 'forgemaw_core'] as const

export function zoneIdForStage(stage: number): string {
  const index = Math.min(zoneIdsByStage.length - 1, Math.max(0, Math.floor((stage - 1) / STAGES_PER_ZONE)))
  return zoneIdsByStage[index]
}

/** 计算敌群在视口的横向位置（百分比）。返回值可能 > 100，表示尚未进入视口。 */
export function enemyViewX(heroX: number, enemyWorldX: number): number {
  return HERO_VIEW_X + (enemyWorldX - heroX)
}

export function createEnemyForStage(zoneId: string, stage: number, rng: Rng): EnemyInstance {
  const zone = zonesById[zoneId] ?? zonesById[zoneIdForStage(stage)] ?? zonesById.black_forge_mines
  const isBoss = stage > 0 && stage % zone.bossEveryStages === 0
  const enemyDefId = isBoss ? zone.bossEnemyId : pickOne(zone.enemyIds, rng)
  const definition = enemiesById[enemyDefId]
  const isElite = !isBoss && stage % 5 === 0
  const rankMultiplier = isBoss ? 3.2 : isElite ? 1.85 : 1
  const maxLife = Math.round((definition.baseLife + stage * 22 + Math.pow(stage, 1.25) * 6) * rankMultiplier)

  return {
    id: createId('enemy'),
    enemyDefId,
    name: isBoss ? definition.name : isElite ? `精英 ${definition.name}` : definition.name,
    rank: isBoss ? 'boss' : isElite ? 'elite' : definition.rank,
    level: stage,
    currentLife: maxLife,
    maxLife,
    armor: definition.baseArmor + Math.floor(stage * 1.2),
    bleed: { stacks: 0, remainingMs: 0 },
  }
}

/**
 * 一波怪：boss 单刷，精英 1-2 只，普通怪 2-4 只。
 * 单只小怪生命减半以平衡群体伤害。世界坐标 = heroX + ENEMY_SPAWN_AHEAD。
 */
export function createEnemyGroupForStage(
  zoneId: string,
  stage: number,
  rng: Rng,
  heroWorldX = 0,
): EnemyGroup {
  const resolvedZoneId = zonesById[zoneId] ? zoneId : zoneIdForStage(stage)
  const zone = zonesById[resolvedZoneId] ?? zonesById.black_forge_mines
  const isBoss = stage > 0 && stage % zone.bossEveryStages === 0
  const isElite = !isBoss && stage % 5 === 0

  let count: number
  if (isBoss) count = 1
  else if (isElite) count = stage >= 30 ? 1 : rollInt(1, 2, rng)
  else count = stage >= 50 ? rollInt(2, 3, rng) : rollInt(2, 4, rng)

  const members: EnemyInstance[] = []
  for (let i = 0; i < count; i += 1) {
    const enemy = createEnemyForStage(resolvedZoneId, stage, rng)
    if (count > 1 && !isBoss) {
      enemy.maxLife = Math.round(enemy.maxLife * 0.55)
      enemy.currentLife = enemy.maxLife
    }
    members.push(enemy)
  }
  return { x: heroWorldX + ENEMY_SPAWN_AHEAD, members }
}
