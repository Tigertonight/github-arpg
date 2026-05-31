import type { DailyGoalKind, EntityId, LootFilterRule, RuneSlotLevel } from '../domain/types'

/**
 * 玩家意图与系统驱动的所有 state 变更入口。
 * 战斗 tick 也走这里，方便回放与录像。
 */
export type GameAction =
  | { type: 'tick'; dt: number }
  | { type: 'equipItem'; itemId: EntityId }
  | { type: 'salvageItem'; itemId: EntityId }
  | { type: 'toggleFilter'; ruleId: LootFilterRule['id'] }
  | { type: 'claimOffline' }
  | { type: 'togglePause' }
  | { type: 'reset' }
  | { type: 'rerollAffix'; itemId: EntityId; affixIndex: number }
  | { type: 'expandInventory' }
  | { type: 'activateBurst' }
  | { type: 'toggleAffixLock'; itemId: EntityId; affixIndex: number }
  | { type: 'checkIn' }
  | { type: 'salvageBelow'; threshold: number }
  | { type: 'dismissOfflineResult' }
  | { type: 'skipBoss' }
  | { type: 'resumeCombat' }
  | { type: 'retreat' }
  | { type: 'triggerMilestone'; milestoneId: string }
  | { type: 'selectHero'; heroId: 'oathbreaker' | 'ash_hunter' | 'grave_votary' | 'iron_gaoler'; heroName: string }
  | { type: 'chooseSkillRune'; skillId: EntityId; slot: RuneSlotLevel; runeId: EntityId }
  | { type: 'claimDailyGoal'; goalId: DailyGoalKind }
  | { type: 'setTorment'; torment: number }
  | { type: 'qaSetMode'; enabled: boolean }
  | { type: 'qaSpawn'; enemyDefIds: EntityId[] }
