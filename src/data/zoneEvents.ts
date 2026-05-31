/**
 * Zone 词条事件双路：
 *  1) Zone Mod：进入新 zone（每 10 stage 一档）时 roll 一条临时词条，整个 zone 持续。
 *     设计风格仿 PoE map mod —— 全是"敌人变强 + 玩家奖励变多"的取舍。
 *  2) 赤潮事件：每个 stage 进入战斗时独立 10% 概率触发，掉率 +100%，需在 createEnemyGroup 时把敌人放大。
 */

export interface ZoneModDefinition {
  id: string
  name: string
  description: string
  /** 敌人生命缩放（1 = 不变）。 */
  enemyLifeMul: number
  /** 敌人攻速缩放（应用在玩家被攻击间隔上）。 */
  enemyAttackSpeedMul: number
  /** 敌人物理伤害缩放。 */
  enemyDamageMul: number
  /** 玩家额外 magic find（百分比加法叠加）。 */
  bonusMagicFind: number
  /** 玩家额外 gold find（百分比加法叠加）。 */
  bonusGoldFind: number
  /** 掉落金币最终乘数（1 = 不变）。用于"奖励翻倍"型 mod。 */
  lootGoldMul: number
}

export const zoneMods: ZoneModDefinition[] = [
  {
    id: 'molten_pulse',
    name: '熔岩脉动',
    description: '敌人生命 +30%，金币掉落 +50%。',
    enemyLifeMul: 1.3,
    enemyAttackSpeedMul: 1.0,
    enemyDamageMul: 1.0,
    bonusMagicFind: 0,
    bonusGoldFind: 0,
    lootGoldMul: 1.5,
  },
  {
    id: 'wraith_pact',
    name: '幽魂契约',
    description: '敌人攻速 +25%，magic find +30。',
    enemyLifeMul: 1.0,
    enemyAttackSpeedMul: 1.25,
    enemyDamageMul: 1.0,
    bonusMagicFind: 30,
    bonusGoldFind: 0,
    lootGoldMul: 1.0,
  },
  {
    id: 'wrathborn_tide',
    name: '怒潮涌动',
    description: '敌人伤害 +30%，gold find +40。',
    enemyLifeMul: 1.0,
    enemyAttackSpeedMul: 1.0,
    enemyDamageMul: 1.3,
    bonusMagicFind: 0,
    bonusGoldFind: 40,
    lootGoldMul: 1.0,
  },
  {
    id: 'iron_dirge',
    name: '铁葬挽歌',
    description: '敌人生命 +20%、伤害 +20%，magic find +20、金币 +25%。',
    enemyLifeMul: 1.2,
    enemyAttackSpeedMul: 1.0,
    enemyDamageMul: 1.2,
    bonusMagicFind: 20,
    bonusGoldFind: 0,
    lootGoldMul: 1.25,
  },
  {
    id: 'sanguine_chant',
    name: '血祷诗章',
    description: '敌人生命 +50%，magic find +50。',
    enemyLifeMul: 1.5,
    enemyAttackSpeedMul: 1.0,
    enemyDamageMul: 1.0,
    bonusMagicFind: 50,
    bonusGoldFind: 0,
    lootGoldMul: 1.0,
  },
  {
    id: 'broken_chains',
    name: '断链之嚎',
    description: '敌人攻速 +15%、伤害 +15%，金币 +30%、magic find +15。',
    enemyLifeMul: 1.0,
    enemyAttackSpeedMul: 1.15,
    enemyDamageMul: 1.15,
    bonusMagicFind: 15,
    bonusGoldFind: 0,
    lootGoldMul: 1.3,
  },
  {
    id: 'forge_calm',
    name: '炉火安魂',
    description: '敌人生命 -10%，掉落不变（少数"友善"档，给挫败时缓口气）。',
    enemyLifeMul: 0.9,
    enemyAttackSpeedMul: 1.0,
    enemyDamageMul: 1.0,
    bonusMagicFind: 0,
    bonusGoldFind: 0,
    lootGoldMul: 1.0,
  },
]

export const zoneModsById: Record<string, ZoneModDefinition> = (() => {
  const map: Record<string, ZoneModDefinition> = {}
  for (const m of zoneMods) map[m.id] = m
  return map
})()

/** 赤潮事件：每 stage 进入战斗时独立触发概率（0..1）。 */
export const CRIMSON_TIDE_CHANCE = 0.1
/** 赤潮敌人生命缩放（在 zone mod 之上叠加）。 */
export const CRIMSON_TIDE_LIFE_MUL = 1.6
/** 赤潮敌人伤害缩放。 */
export const CRIMSON_TIDE_DAMAGE_MUL = 1.4
/** 赤潮 magic find 加成。 */
export const CRIMSON_TIDE_MAGIC_FIND = 80
/** 赤潮金币掉落乘数。 */
export const CRIMSON_TIDE_GOLD_MUL = 2.0
