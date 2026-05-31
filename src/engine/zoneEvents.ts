import {
  CRIMSON_TIDE_CHANCE,
  CRIMSON_TIDE_DAMAGE_MUL,
  CRIMSON_TIDE_GOLD_MUL,
  CRIMSON_TIDE_LIFE_MUL,
  CRIMSON_TIDE_MAGIC_FIND,
  zoneMods,
  zoneModsById,
  type ZoneModDefinition,
} from '../data/zoneEvents'
import type { EnemyGroup, GameState } from '../domain/types'
import { pickOne, type Rng } from './rng'

/**
 * 在进入新 zone 时调用：如果当前 state.zoneMod 不属于即将进入的 zone（或没有），
 * 则 roll 一条新 mod 并写入 state；否则保留。
 * 纯函数：返回 partial 字段供调用方合并到 next state。
 */
export function rollZoneModForZone(
  state: GameState,
  nextZoneId: string,
  nextStage: number,
  rng: Rng,
): { modId: string; mod: ZoneModDefinition; isNewRoll: boolean } {
  const prev = state.zoneMod
  if (prev && prev.zoneId === nextZoneId) {
    const mod = zoneModsById[prev.modId]
    if (mod) return { modId: prev.modId, mod, isNewRoll: false }
  }
  const mod = pickOne(zoneMods, rng)
  return { modId: mod.id, mod, isNewRoll: true }
}

/** 取当前 state 生效的 zone mod（zoneId 不匹配则视为无）。 */
export function getActiveZoneMod(state: GameState): ZoneModDefinition | undefined {
  if (!state.zoneMod) return undefined
  if (state.zoneMod.zoneId !== state.progression.zoneId) return undefined
  return zoneModsById[state.zoneMod.modId]
}

/** 赤潮判定：每个 stage 战斗触发时调用。 */
export function rollCrimsonTide(rng: Rng): boolean {
  return rng.next() < CRIMSON_TIDE_CHANCE
}

/**
 * 综合敌人生命/伤害缩放。结合 zone mod 与 crimson tide。
 * 返回 { lifeMul, damageMul, attackSpeedMul }，由 createEnemyForStage 与战斗 tick 消费。
 */
export function eventEnemyScalars(state: GameState): {
  lifeMul: number
  damageMul: number
  attackSpeedMul: number
} {
  const mod = getActiveZoneMod(state)
  const tide = state.crimsonTideActive ? {
    life: CRIMSON_TIDE_LIFE_MUL,
    damage: CRIMSON_TIDE_DAMAGE_MUL,
    attackSpeed: 1.0,
  } : { life: 1, damage: 1, attackSpeed: 1 }
  return {
    lifeMul: (mod?.enemyLifeMul ?? 1) * tide.life,
    damageMul: (mod?.enemyDamageMul ?? 1) * tide.damage,
    attackSpeedMul: (mod?.enemyAttackSpeedMul ?? 1) * tide.attackSpeed,
  }
}

/**
 * 综合战利品加成（magic find / gold find / 金币最终乘数）。
 * 用于 resolveGroupClear 时叠加到 zone 既有计算之上。
 */
export function eventLootScalars(state: GameState): {
  magicFind: number
  goldFind: number
  goldMul: number
} {
  const mod = getActiveZoneMod(state)
  const tideMagicFind = state.crimsonTideActive ? CRIMSON_TIDE_MAGIC_FIND : 0
  const tideGoldMul = state.crimsonTideActive ? CRIMSON_TIDE_GOLD_MUL : 1
  return {
    magicFind: (mod?.bonusMagicFind ?? 0) + tideMagicFind,
    goldFind: mod?.bonusGoldFind ?? 0,
    goldMul: (mod?.lootGoldMul ?? 1) * tideGoldMul,
  }
}

/**
 * 把生命缩放应用到一个已生成的 enemy group 上（保持 currentLife==maxLife）。
 * 用于 createEnemyGroupForStage 之后注入事件层缩放，避免改 spawn API 签名。
 */
export function applyEventLifeMul(group: EnemyGroup, lifeMul: number): EnemyGroup {
  if (lifeMul === 1) return group
  return {
    ...group,
    members: group.members.map((m) => {
      const newMax = Math.max(1, Math.round(m.maxLife * lifeMul))
      return { ...m, maxLife: newMax, currentLife: newMax }
    }),
  }
}
