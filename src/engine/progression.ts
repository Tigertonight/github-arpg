import { enemiesById, zonesById } from '../data/enemies'
import { createId } from '../domain/ids'
import type { EnemyInstance } from '../domain/types'
import type { Rng } from './rng'
import { pickOne } from './rng'

export function createEnemyForStage(zoneId: string, stage: number, rng: Rng): EnemyInstance {
  const zone = zonesById[zoneId] ?? zonesById.black_forge_mines
  const isBoss = stage > 0 && stage % zone.bossEveryStages === 0
  const enemyDefId = isBoss ? zone.bossEnemyId : pickOne(zone.enemyIds, rng)
  const definition = enemiesById[enemyDefId]
  const rankMultiplier = definition.rank === 'boss' ? 3.2 : definition.rank === 'elite' || stage % 5 === 0 ? 1.85 : 1
  const maxLife = Math.round((definition.baseLife + stage * 28 + Math.pow(stage, 1.35) * 7) * rankMultiplier)

  return {
    id: createId('enemy'),
    enemyDefId,
    name: definition.rank === 'boss' ? definition.name : stage % 5 === 0 ? `精英 ${definition.name}` : definition.name,
    rank: isBoss ? 'boss' : stage % 5 === 0 ? 'elite' : definition.rank,
    level: stage,
    currentLife: maxLife,
    maxLife,
    armor: definition.baseArmor + Math.floor(stage * 1.2),
    bleed: {
      stacks: 0,
      remainingMs: 0,
    },
  }
}
