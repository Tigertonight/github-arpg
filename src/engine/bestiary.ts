import type { BestiaryEntry, EnemyInstance, EntityId, GameState } from '../domain/types'

const EMPTY_ENTRY: BestiaryEntry = {
  encountered: false,
  kills: 0,
  eliteKills: 0,
  bossKills: 0,
  firstKillAtMs: 0,
}

function getEntry(bestiary: GameState['bestiary'], enemyDefId: EntityId): BestiaryEntry {
  return bestiary?.[enemyDefId] ?? EMPTY_ENTRY
}

export function markEncountered(
  bestiary: GameState['bestiary'],
  members: EnemyInstance[],
): GameState['bestiary'] {
  let next = bestiary
  for (const enemy of members) {
    const id = enemy.enemyDefId
    const prev = getEntry(next, id)
    if (!prev.encountered) {
      next = { ...(next ?? {}), [id]: { ...prev, encountered: true } }
    }
  }
  return next
}

export function recordKill(
  bestiary: GameState['bestiary'],
  enemy: EnemyInstance,
  gameTimeMs: number,
): GameState['bestiary'] {
  const id = enemy.enemyDefId
  const prev = getEntry(bestiary, id)
  const kills = prev.kills + 1
  const eliteKills = prev.eliteKills + (enemy.rank === 'elite' ? 1 : 0)
  const bossKills = prev.bossKills + (enemy.rank === 'boss' ? 1 : 0)
  const firstKillAtMs = prev.firstKillAtMs > 0 ? prev.firstKillAtMs : gameTimeMs
  return {
    ...(bestiary ?? {}),
    [id]: {
      encountered: true,
      kills,
      eliteKills,
      bossKills,
      firstKillAtMs,
    },
  }
}
