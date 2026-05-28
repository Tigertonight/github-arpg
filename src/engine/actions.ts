import type { EntityId, LootFilterRule } from '../domain/types'

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
