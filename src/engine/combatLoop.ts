import { enemiesById } from '../data/enemies'
import { zonesById } from '../data/enemies'
import { skillsById } from '../data/skills'
import { createId } from '../domain/ids'
import { addLog, deriveCombatStats } from '../domain/formulas'
import type { CombatStats, EnemyGroup, EnemyInstance, EntityId, GameState, Hero, SkillState } from '../domain/types'
import { bleedTickDamage, isExecuteReady, nextBleed, physicalHit } from './damage'
import { aggregateBleedStack, aggregateExecuteThreshold, getSkillCastTriggers } from './legendary'
import { markEncountered, recordKill } from './bestiary'
import { applyLootFilter, createItem, salvageValue } from './loot'
import { createEnemyForStage, createEnemyGroupForStage, ENCOUNTER_DISTANCE, tormentLootScalars, zoneIdForStage } from './progression'
import { createRng } from './rng'
import { addSkillXp, hasRune } from './skillProgression'
import { bumpDailyGoal, ensureDailyGoals } from './daily'
import { evaluateAchievements } from './achievements'
import { applyEventLifeMul, eventLootScalars, getActiveZoneMod, rollCrimsonTide, rollZoneModForZone } from './zoneEvents'
import { zoneModsById } from '../data/zoneEvents'
import { applyIncomingTrait, backlashDamage, counterMultiplier, interceptLethal } from './traits'

const TICK_MS = 900
/** 英雄世界坐标推进速度（单位/秒）。敌群在世界中静止，靠英雄走过去。 */
const HERO_TRAVEL_SPEED = 22

/** 综合 zone mod + 赤潮 的敌人生命缩放（按当前 state 与目标 zoneId 推断）。 */
function eventLifeMulFor(state: GameState, targetZoneId: string): number {
  const m = state.zoneMod && state.zoneMod.zoneId === targetZoneId
    ? zoneModsById[state.zoneMod.modId]
    : undefined
  const tide = state.crimsonTideActive ? 1.6 : 1
  return (m?.enemyLifeMul ?? 1) * tide
}
const ENEMY_REINFORCE_INTERVAL_MS = 1800
const ENEMY_REINFORCE_MAX_ACTIVE = 4

export function advanceCombat(currentInput: GameState, deltaMs = TICK_MS): GameState {
  let current = ensureDailyGoals(currentInput)
  const stats = deriveCombatStats(current.hero.equipment, current.itemsById, current.hero.level)
  const isBurst = current.burstUntilMs > current.gameTimeMs
  const effectiveStats = isBurst ? { ...stats, attackSpeed: stats.attackSpeed * 1.5 } : stats
  const rng = createRng(current.rngSeed + Math.floor(current.gameTimeMs))
  let hero = coolDownSkills(current, deltaMs)
  const floatingTexts = current.floatingTexts.slice(0, 3)
  const gameTimeMs = current.gameTimeMs + deltaMs

  // === Zone debuff 应用 ===
  const zoneAffixIds = zonesById[current.progression.zoneId]?.globalAffixIds ?? []
  let zoneStats = { ...effectiveStats } as typeof effectiveStats & { _silenceCurse?: boolean }
  for (const affixId of zoneAffixIds) {
    switch (affixId) {
      case 'zone_silence_curse':
        zoneStats = { ...zoneStats, _silenceCurse: true }
        break
      case 'zone_bone_curse':
        zoneStats = { ...zoneStats, armor: zoneStats.armor * 0.85 }
        break
      case 'zone_permafrost':
        zoneStats = { ...zoneStats, attackSpeed: zoneStats.attackSpeed * 0.9 }
        break
      case 'zone_undead_resurgence':
        zoneStats = { ...zoneStats, armor: zoneStats.armor * 0.8 }
        break
      case 'zone_abyss_rot':
        zoneStats = { ...zoneStats, armor: Math.max(0, zoneStats.armor - 5) }
        break
      default:
        break
    }
  }

  // Iron oath rune buffs：armor + 50% 持续到 armorBuffUntilMs
  if (current.oathRuneState && current.oathRuneState.armorBuffUntilMs > current.gameTimeMs) {
    zoneStats = { ...zoneStats, armor: zoneStats.armor * 1.5 }
  }
  // Iron oath: lower_the_threshold 提阈在 execute 命中时局部处理；这里改 execute 阈值的全局参数
  const oathProgressGlobal = current.hero.skillProgress['execute']
  const lowerThreshActive = hasRune(oathProgressGlobal, 'lower_the_threshold')
  const execParams = aggregateExecuteThreshold(current, lowerThreshActive ? 0.55 : 0.35, 1)
  const bleedParams = aggregateBleedStack(current, 9)

  // zone_blood_moon 是元数据（流血层数上限），不在战斗循环直接处理，这里留空注释
  // 如需生效可在 aggregateBleedStack 的 maxStacks 参数里加 3

  // === Travel：英雄向前推进，敌群在世界中静止；距离 < ENCOUNTER_DISTANCE 切 combat ===
  if (current.stageMode === 'travel') {
    // QA 沙盒：清空成员后原地待机，等图鉴 picker 重新派怪。
    if (current.qaMode && current.enemyGroup.members.length === 0) {
      return {
        ...current,
        gameTimeMs,
        floatingTexts,
        lastDrop: undefined,
        cachedStats: stats,
      }
    }
    const dtSec = deltaMs / 1000
    const targetX = current.enemyGroup.x - ENCOUNTER_DISTANCE
    const newHeroX = Math.min(targetX, hero.x + HERO_TRAVEL_SPEED * dtSec)
    const distance = current.enemyGroup.x - newHeroX

    if (distance > ENCOUNTER_DISTANCE) {
      return {
        ...current,
        hero: { ...hero, x: newHeroX },
        gameTimeMs,
        floatingTexts,
        lastDrop: undefined,
        cachedStats: stats,
      }
    }

    // === Boss 层检测：在切入 combat 前弹出选择弹窗 ===
    const isBossStage = current.progression.stage % 10 === 0
    const hasBossEnemy = current.enemyGroup.members.some(e => e.rank === 'boss')
    if (isBossStage && hasBossEnemy && !current.bossChoicePending) {
      return {
        ...current,
        hero: { ...hero, x: newHeroX },
        enemyGroup: { ...current.enemyGroup, x: newHeroX + ENCOUNTER_DISTANCE },
        gameTimeMs,
        bossChoicePending: true,
        floatingTexts,
        lastDrop: undefined,
        cachedStats: stats,
      }
    }

    return {
      ...current,
      hero: { ...hero, x: newHeroX },
      gameTimeMs,
      stageMode: 'combat',
      stageModeUntil: 0,
      enemyGroup: { ...current.enemyGroup, x: newHeroX + ENCOUNTER_DISTANCE, lastSpawnAtMs: gameTimeMs },
      combatLog: addLog(current.combatLog, `遭遇 ${describeGroup(current.enemyGroup)}，矿道行军停止。`),
      floatingTexts,
      lastDrop: undefined,
      cachedStats: stats,
      bestiary: markEncountered(current.bestiary, current.enemyGroup.members),
    }
  }

  // === Combat：位置冻结，对群组施加伤害 ===
  const members = current.enemyGroup.members.map((enemy, index) => ({
    ...enemy,
    formationSlot: enemy.formationSlot ?? index,
    bleed: { ...enemy.bleed },
  }))

  // 1. 流血 tick（每只独立结算）
  for (const enemy of members) {
    const bleedDamage = bleedTickDamage(effectiveStats, enemy, deltaMs, bleedParams)
    if (bleedDamage > 0) {
      enemy.currentLife -= bleedDamage
      enemy.bleed.remainingMs = Math.max(0, enemy.bleed.remainingMs - deltaMs)
      if (enemy.bleed.remainingMs <= 0) enemy.bleed.stacks = 0
      floatingTexts.unshift({ id: createId('float'), label: `${bleedDamage}`, kind: 'bleed', xOffset: Math.floor(rng.next() * 48) - 24 })
    }
  }

  // 2. 选目标 + 选技能 + 命中
  const aliveBefore = members.filter((e) => e.currentLife > 0)
  if (aliveBefore.length > 0) {
    const primary = pickPrimaryTarget(aliveBefore)
    const skill = chooseSkill(hero.skills, primary, execParams, hero, zoneStats as typeof effectiveStats)
    let castSkillXp = 0
    let castSkillId: string | null = null
    if (skill) {
      castSkillId = skill.skillId
      // 命中 / 释放本身给 1 XP（避免高 cd 技能完全没成长）
      castSkillXp = 1
      const skillDef = skillsById[skill.skillId]
      if (skill.skillId === 'iron_oath') {
        const oathProgress = hero.skillProgress['iron_oath']
        const runeVigilant = hasRune(oathProgress, 'vigilant_oath')
        const runeEnduring = hasRune(oathProgress, 'enduring_oath')
        const runeShield = hasRune(oathProgress, 'oathbound_shield')
        const runePurging = hasRune(oathProgress, 'purging_vow')
        const runeRetribution = hasRune(oathProgress, 'vow_of_retribution')
        const runeEternal = hasRune(oathProgress, 'eternal_vow')
        const runeMartyr = hasRune(oathProgress, 'martyr_oath')

        let healPct = 0.12
        if (runeVigilant) healPct *= 0.7
        if (runeEnduring) healPct *= 1.5
        if (runeEternal) healPct *= 2

        // purging_vow：清除所有敌人 brand 并按层数补血
        let purgedLayers = 0
        if (runePurging) {
          for (const enemy of members) {
            if (enemy.brandStacks && enemy.brandStacks > 0) {
              purgedLayers += enemy.brandStacks
              enemy.brandStacks = 0
            }
          }
          if (purgedLayers > 0) healPct += purgedLayers * 0.05
        }

        hero = { ...hero, currentLife: Math.min(zoneStats.life, hero.currentLife + Math.round(zoneStats.life * healPct)) }
        floatingTexts.unshift({ id: createId('float'), label: '守护', kind: 'hit', xOffset: Math.floor(rng.next() * 48) - 24 })

        // oathRuneState：记录 buff 截止时间
        if (runeShield || runeRetribution || runeMartyr) {
          const prev = current.oathRuneState ?? { armorBuffUntilMs: 0, retributionUntilMs: 0, martyrUntilMs: 0 }
          current = {
            ...current,
            oathRuneState: {
              armorBuffUntilMs: runeShield ? gameTimeMs + 4000 : prev.armorBuffUntilMs,
              retributionUntilMs: runeRetribution ? gameTimeMs + 4000 : prev.retributionUntilMs,
              martyrUntilMs: runeMartyr ? gameTimeMs + 6000 : prev.martyrUntilMs,
            },
          } as GameState
        }
      } else {
        // === Cleave rune snapshot ===
        const cleaveProgress = skill.skillId === 'cleave' ? hero.skillProgress['cleave'] : undefined
        const isCleave = skill.skillId === 'cleave'
        const runeTempest = isCleave && hasRune(cleaveProgress, 'tempest_blade')
        const runeLunge = isCleave && hasRune(cleaveProgress, 'lunge_strike')
        const runeMomentum = isCleave && hasRune(cleaveProgress, 'momentum_charge')
        const runeCrimson = isCleave && hasRune(cleaveProgress, 'crimson_harvest')
        const runeChain = isCleave && hasRune(cleaveProgress, 'chain_reaver')
        const runeBrand = isCleave && hasRune(cleaveProgress, 'oath_brand')
        const runeDetonator = isCleave && hasRune(cleaveProgress, 'bleed_detonator')
        const runeRhythm = isCleave && hasRune(cleaveProgress, 'executioner_rhythm')
        const runeIronbound = isCleave && hasRune(cleaveProgress, 'ironbound_vow')

        // === Sweep rune snapshot ===
        const sweepProgress = skill.skillId === 'lacerating_sweep' ? hero.skillProgress['lacerating_sweep'] : undefined
        const isSweep = skill.skillId === 'lacerating_sweep'
        const runeWhirling = isSweep && hasRune(sweepProgress, 'whirling_grasp')
        const runeOverhead = isSweep && hasRune(sweepProgress, 'overhead_cleaver')
        const runeBleedingArc = isSweep && hasRune(sweepProgress, 'bleeding_arc')
        const runeGore = isSweep && hasRune(sweepProgress, 'gore_harvest')
        const runeTearing = isSweep && hasRune(sweepProgress, 'tearing_momentum')
        const runeFracturedVow = isSweep && hasRune(sweepProgress, 'fractured_vow')
        const runeBleedStorm = isSweep && hasRune(sweepProgress, 'bleed_storm')
        const runeCull = isSweep && hasRune(sweepProgress, 'cull_the_wounded')
        const runeMarrow = isSweep && hasRune(sweepProgress, 'marrow_split')

        // === Execute rune snapshot ===
        const executeProgress = skill.skillId === 'execute' ? hero.skillProgress['execute'] : undefined
        const isExecute = skill.skillId === 'execute'
        const runeQuickJ = isExecute && hasRune(executeProgress, 'quick_judgment')
        const runeWeighty = isExecute && hasRune(executeProgress, 'weighty_verdict')
        const runeChainedExec = isExecute && hasRune(executeProgress, 'chained_execution')
        const runeBleedReckoning = isExecute && hasRune(executeProgress, 'bleed_reckoning')
        const runeOathCollector = isExecute && hasRune(executeProgress, 'oath_collector')
        const runeExecBrand = isExecute && hasRune(executeProgress, 'executioner_brand')
        const runeLowerThresh = isExecute && hasRune(executeProgress, 'lower_the_threshold')
        const runeMassJudgment = isExecute && hasRune(executeProgress, 'mass_judgment')
        const runeFinalOath = isExecute && hasRune(executeProgress, 'final_oath')

        // === Iron oath chain_oath rune（在攻击命中时触发，所以放这里）===
        const oathProgress = hero.skillProgress['iron_oath']
        const runeChainOath = hasRune(oathProgress, 'chain_oath')

        const cleaveState = current.cleaveRuneState ?? {
          momentumStacks: 0,
          rhythmHitCount: 0,
          pendingChainHits: [],
        }
        let momentumStacks = cleaveState.momentumStacks
        let rhythmHitCount = cleaveState.rhythmHitCount
        let ironboundCdReductionMs = 0
        let chainOathCdReductionMs = 0

        // 任意持有 execute branded 的目标 → 命中时强制暴击
        const execBrandedSet = new Set(current.executeRuneState?.brandedTargetIds ?? [])

        // executioner_brand：本次新加的标记 id
        const newlyBrandedIds: EntityId[] = []

        // executeRuneState 取出，命中后写回
        const sweepState = current.sweepRuneState ?? { tearingStacks: 0, marrowTriggeredAtMs: -1 }
        let tearingStacks = sweepState.tearingStacks

        // 选 AOE 目标：以 primary 为首，再补足到 aoeTargets
        let aoeTargets = skillDef.aoeTargets
        if (runeTempest) aoeTargets = aliveBefore.length // 旋风斩：全场命中
        if (runeLunge) aoeTargets = Math.min(aliveBefore.length, skillDef.aoeTargets + 2) // 跃斩：AOE +50%
        if (runeChain) aoeTargets = Math.max(aoeTargets, skillDef.aoeTargets + 1) // 连锁裂创：弹射 1 个额外目标（即时近似版）
        if (runeWhirling) aoeTargets = Math.min(aoeTargets, 3) // 旋舞缠绕：限 3 个
        if (runeMassJudgment) aoeTargets = Math.min(aliveBefore.length, 3) // 群体审判：主目标 + 流血最高的 2 个
        const targetCount = Math.min(aoeTargets, aliveBefore.length)
        const targets: EnemyInstance[] = [primary]
        if (runeMassJudgment) {
          // 流血层数从高到低，排除 primary
          const byBleed = aliveBefore
            .filter((e) => e !== primary)
            .sort((a, b) => b.bleed.stacks - a.bleed.stacks)
          for (const enemy of byBleed) {
            if (targets.length >= targetCount) break
            targets.push(enemy)
          }
        } else {
          for (const enemy of aliveBefore) {
            if (targets.length >= targetCount) break
            if (enemy === primary) continue
            targets.push(enemy)
          }
        }

        // === 全局伤害乘子（rune 叠加） ===
        let globalMul = 1
        if (runeTempest) globalMul *= 1.5 / Math.max(1, targets.length) // 旋风斩总伤约 1.5×，分摊到所有目标
        if (runeLunge) globalMul *= 0.5 // 跃斩 -50% 单次
        if (runeIronbound) globalMul *= 0.75 // 铁誓共鸣 -25%
        if (runeMomentum && momentumStacks > 0) {
          globalMul *= 1 + 0.3 * momentumStacks // 蓄势：+30%/层
        }
        // Sweep 全局乘子
        if (runeOverhead) globalMul *= 1.5 // 顶劈刀 +50%
        if (runeTearing && tearingStacks > 0) globalMul *= 1 + 0.2 * tearingStacks // 撕裂势能：+20%/层
        if (runeBleedStorm) globalMul *= 1.8 // 血风暴：cd ×1.5 换 1.8× 总伤（数学上等价 4 段 0.45）
        // Execute 全局乘子
        if (runeQuickJ) globalMul *= 0.7 // 速断 -30%
        if (runeWeighty) globalMul *= 1.5 // 重审判 +50%

        let bonusStacksTotal = 0
        for (const target of targets) {
          const wasAlive = target.currentLife > 0

          // === 单目标 mod ===
          let targetMul = globalMul
          if (runeCrimson) {
            const missingPct = 1 - target.currentLife / target.maxLife
            if (missingPct < 0.5) targetMul *= 0.7 // 高血 -30%
            else targetMul *= 1 + missingPct * 0.5 // 0.5%/% missing
          }
          if (runeChain && target === primary) targetMul *= 0.7 // 连锁裂创首击 -30%
          // Sweep: overhead_cleaver 主目标额外 +30%
          if (runeOverhead && target === primary) targetMul *= 1.3
          // Sweep: bleeding_arc 命中流血目标 +25%/层（最多 +75%）
          if (runeBleedingArc && target.bleed.stacks > 0) {
            targetMul *= 1 + Math.min(3, target.bleed.stacks) * 0.25
          }
          // Execute: bleed_reckoning +30%/层（最多 +150%）
          if (runeBleedReckoning) {
            targetMul *= 1 + Math.min(5, target.bleed.stacks) * 0.3
          }
          // Execute: lower_the_threshold 阈值外 -40%
          if (runeLowerThresh && target.currentLife / target.maxLife > 0.55 && target.bleed.stacks < 5) {
            targetMul *= 0.6
          }

          // === executioner_rhythm：每第 4 击（仅对 primary 计数） ===
          let forceCrit = false
          let forceExecute = false
          if (runeRhythm && target === primary) {
            rhythmHitCount += 1
            if (rhythmHitCount % 4 === 0) {
              forceCrit = true
              forceExecute = true
            }
          }
          // weighty_verdict: 强制暴击
          if (runeWeighty) forceCrit = true
          // executioner_brand：标记过的目标，下次任意命中必暴击（消耗标记）
          if (execBrandedSet.has(target.id)) {
            forceCrit = true
            execBrandedSet.delete(target.id)
          }
          // cull_the_wounded: sweep 对低血目标享受处决倍率
          if (runeCull && target.currentLife / target.maxLife < 0.5) {
            forceExecute = true
          }
          // lower_the_threshold: 阈值提高 → 命中阈值内强制按处决结算
          if (runeLowerThresh && target.currentLife / target.maxLife <= 0.55) {
            forceExecute = true
          }

          const hitResult = physicalHit(
            zoneStats as typeof effectiveStats,
            target,
            skill,
            execParams,
            { damageMultiplier: targetMul, forceCrit, forceExecute },
          )
          const echoHit = skill.runeId === 'echo_sweep' ? Math.round(hitResult.damage * 0.45) : 0
          let damageDone = hitResult.damage + echoHit

          // === bleed_detonator：消耗目标全部流血层，每层引爆 80% 武器伤害 ===
          let detonateDmg = 0
          if (runeDetonator && target.bleed.stacks > 0) {
            detonateDmg = Math.round(zoneStats.physicalDamage * 0.8 * target.bleed.stacks)
            damageDone += detonateDmg
            target.bleed = { stacks: 0, remainingMs: 0 }
            floatingTexts.unshift({ id: createId('float'), label: `引爆 ${detonateDmg}`, kind: 'bleed', xOffset: Math.floor(rng.next() * 48) - 24 })
          }
          // === fractured_vow：命中带烙印的敌人，每层引爆 60% 武器伤害（不消耗烙印）===
          if (runeFracturedVow && target.brandStacks && target.brandStacks > 0) {
            const fracDmg = Math.round(zoneStats.physicalDamage * 0.6 * target.brandStacks)
            damageDone += fracDmg
            floatingTexts.unshift({ id: createId('float'), label: `碎誓 ${fracDmg}`, kind: 'execute', xOffset: Math.floor(rng.next() * 48) - 24 })
          }

          // === Family trait: 入伤修正（重甲减免 / 原初韧性封顶） ===
          damageDone = applyIncomingTrait(target, damageDone)

          target.currentLife -= damageDone

          // === Family trait: 致命拦截（last_rite 留 1HP / bone_reform 概率复生） ===
          if (wasAlive && target.currentLife <= 0) {
            const intercept = interceptLethal(target, rng)
            if (intercept) {
              target.currentLife = intercept.newLife
              floatingTexts.unshift({
                id: createId('float'),
                label: intercept.label,
                kind: 'execute',
                xOffset: Math.floor(rng.next() * 48) - 24,
              })
            }
          }

          // === Family trait: hellbacklash 反伤 ===
          const backlash = backlashDamage(target, damageDone)
          if (backlash > 0) {
            hero = { ...hero, currentLife: Math.max(0, hero.currentLife - backlash) }
          }

          // === 击杀 XP + 击杀飘字（用于 UI 触发击杀震屏） ===
          if (wasAlive && target.currentLife <= 0) {
            // 图鉴：记录本只击杀（precise per-kill，包括同 wave 多杀）
            current = { ...current, bestiary: recordKill(current.bestiary, target, gameTimeMs) }
            const baseXp = hitResult.isCrit ? 15 : 10
            const rankBonus = target.rank === 'boss' ? 40 : target.rank === 'elite' ? 15 : 0
            // oath_brand：处决击杀按 +50%/层奖励 XP
            const brandBonus = runeBrand && (forceExecute || isExecuteReady(skill, target, execParams))
              ? Math.round(baseXp * 0.5 * (target.brandStacks ?? 0))
              : 0
            castSkillXp += baseXp + rankBonus + brandBonus
            floatingTexts.unshift({
              id: createId('float'),
              label: target.rank === 'boss' ? 'BOSS DOWN' : target.rank === 'elite' ? 'KILL!' : 'kill',
              kind: 'kill',
              xOffset: Math.floor(rng.next() * 48) - 24,
            })

            // === Execute final_oath：处决击杀 elite/boss 回满 ===
            if (runeFinalOath && (target.rank === 'elite' || target.rank === 'boss')) {
              hero = { ...hero, currentLife: zoneStats.life }
              floatingTexts.unshift({ id: createId('float'), label: '终末之誓', kind: 'execute', xOffset: 0 })
            }
            // === Execute chained_execution：处决击杀重置 cd（每场仅一次）===
            if (runeChainedExec) {
              const prev = current.executeRuneState ?? { chainCharges: 1, brandedTargetIds: [] }
              if (prev.chainCharges > 0) {
                hero.skills = hero.skills.map((entry) =>
                  entry.skillId === 'execute' ? { ...entry, cooldownRemainingMs: 0 } : entry,
                )
                current = {
                  ...current,
                  executeRuneState: { ...prev, chainCharges: prev.chainCharges - 1 },
                } as GameState
                floatingTexts.unshift({ id: createId('float'), label: '连环处决', kind: 'execute', xOffset: 0 })
              }
            }
            // === Execute oath_collector：处决击杀给所有技能减 800ms cd ===
            if (runeOathCollector) {
              hero.skills = hero.skills.map((entry) => ({
                ...entry,
                cooldownRemainingMs: Math.max(0, entry.cooldownRemainingMs - 800),
              }))
            }
            // === Sweep marrow_split：击杀触发一次小型 sweep（同 tick 仅一次）===
            if (runeMarrow && (current.sweepRuneState?.marrowTriggeredAtMs ?? -1) !== gameTimeMs) {
              const splitMul = 0.6
              for (const collateral of aliveBefore) {
                if (collateral === target || collateral.currentLife <= 0) continue
                const splitDmg = Math.round(zoneStats.physicalDamage * splitMul)
                collateral.currentLife -= splitDmg
                floatingTexts.unshift({ id: createId('float'), label: `裂 ${splitDmg}`, kind: 'bleed', xOffset: Math.floor(rng.next() * 48) - 24 })
              }
              current = {
                ...current,
                sweepRuneState: { tearingStacks, marrowTriggeredAtMs: gameTimeMs },
              } as GameState
            }
          } else if (wasAlive && target.currentLife > 0) {
            // 未击杀：execute branded（仅 execute 技能命中且未杀）
            if (runeExecBrand && skill.skillId === 'execute') {
              newlyBrandedIds.push(target.id)
            }
          }

          // === oath_brand：累计烙印 ===
          if (runeBrand) {
            target.brandStacks = Math.min(3, (target.brandStacks ?? 0) + 1)
          }

          // === 生命偷取 ===
          if (zoneStats.lifeSteal > 0 && damageDone > 0) {
            const stolen = Math.min(zoneStats.lifeSteal, Math.max(0, zoneStats.life - hero.currentLife))
            if (stolen > 0) hero = { ...hero, currentLife: hero.currentLife + stolen }
          }

          // === 传说 power 触发额外流血 ===
          let bonusStacks = 0
          for (const power of getSkillCastTriggers(current)) {
            if (rng.next() < (power.params.triggerChance ?? 0)) {
              bonusStacks += power.params.bonusStacks ?? 0
              floatingTexts.unshift({ id: createId('float'), label: '传说', kind: 'execute' as const, xOffset: Math.floor(rng.next() * 48) - 24 })
            }
          }
          bonusStacksTotal += bonusStacks
          const baseStacks = skillDef.bleedStacks + (skill.runeId === 'deep_cut' ? 1 : 0)
          target.bleed = nextBleed(target, baseStacks + bonusStacks, zoneStats.bleedDurationMs, bleedParams)

          // === ironbound_vow：每命中减 iron_oath 200ms cd ===
          if (runeIronbound) ironboundCdReductionMs += 200
          // === chain_oath：cleave/sweep/execute 命中减 iron_oath 100ms cd ===
          if (runeChainOath) chainOathCdReductionMs += 100

          floatingTexts.unshift({
            id: createId('float'),
            label: hitResult.isCrit ? `${damageDone}!` : `${damageDone}`,
            kind: hitResult.isCrit ? 'crit' : (skill.skillId === 'execute' ? 'execute' : 'hit'),
            xOffset: Math.floor(rng.next() * 48) - 24,
          })
        }
        if (bonusStacksTotal > 0) {
          floatingTexts.unshift({ id: createId('float'), label: `+${bonusStacksTotal} 流血`, kind: 'bleed', xOffset: Math.floor(rng.next() * 48) - 24 })
        }

        // === Cleave rune 状态更新 ===
        if (isCleave && runeMomentum) {
          // 命中时若已有势能 → 加成已应用，清空；否则累加 1 层（下次结算）
          momentumStacks = momentumStacks > 0 ? 0 : Math.min(5, momentumStacks + 1)
        }

        // === Sweep tearing_momentum：命中流血目标累加，结算后清空 ===
        if (isSweep && runeTearing) {
          if (tearingStacks > 0) {
            tearingStacks = 0 // 已应用，清空
          } else {
            // 累加：命中流血目标 +1 层（最多 5）
            const flowingTargets = targets.filter((t) => t.bleed.stacks > 0).length
            tearingStacks = Math.min(5, tearingStacks + flowingTargets)
          }
          current = {
            ...current,
            sweepRuneState: { tearingStacks, marrowTriggeredAtMs: current.sweepRuneState?.marrowTriggeredAtMs ?? -1 },
          } as GameState
        }

        // === Sweep gore_harvest：按场上总流血层数 ×8 回血 ===
        if (isSweep && runeGore) {
          const totalBleed = members.reduce((sum, e) => sum + e.bleed.stacks, 0)
          if (totalBleed > 0) {
            const heal = totalBleed * 8
            hero = { ...hero, currentLife: Math.min(zoneStats.life, hero.currentLife + heal) }
            floatingTexts.unshift({ id: createId('float'), label: `+${heal}`, kind: 'hit', xOffset: 0 })
          }
        }

        // === Execute executioner_brand：写入新标记 ===
        if (isExecute && runeExecBrand && newlyBrandedIds.length > 0) {
          const prev = current.executeRuneState ?? { chainCharges: 1, brandedTargetIds: [] }
          current = {
            ...current,
            executeRuneState: {
              ...prev,
              brandedTargetIds: [...new Set([...prev.brandedTargetIds, ...newlyBrandedIds])],
            },
          } as GameState
        }
        // 若有 brand 在本 tick 被消耗，写回
        if (current.executeRuneState && execBrandedSet.size !== (current.executeRuneState.brandedTargetIds.length)) {
          current = {
            ...current,
            executeRuneState: {
              ...current.executeRuneState,
              brandedTargetIds: Array.from(execBrandedSet),
            },
          } as GameState
        }
        // 持久化更新后的 cleave state — 仅在持有任一 cleave rune 时创建，避免污染快照
        const hasAnyCleaveRune = isCleave && (
          runeTempest || runeLunge || runeMomentum || runeCrimson || runeChain ||
          runeBrand || runeDetonator || runeRhythm || runeIronbound
        )
        if (hasAnyCleaveRune) {
          current = {
            ...current,
            cleaveRuneState: {
              momentumStacks,
              rhythmHitCount,
              pendingChainHits: cleaveState.pendingChainHits,
            },
          } as GameState
        }

        // === 应用 cooldown，处理 momentum / tempest 的 cd 修正 ===
        let cdMul = 1
        if (runeTempest) cdMul *= 2
        if (runeMomentum) cdMul *= 0.5
        // Sweep cd 修正
        if (runeWhirling) cdMul *= 0.7
        if (runeOverhead) cdMul *= 1.3
        if (runeBleedStorm) cdMul *= 1.5
        // Execute cd 修正
        if (runeQuickJ) cdMul *= 0.6
        if (runeWeighty) cdMul *= 1.5
        if (runeFinalOath) cdMul *= 2
        const baseCd = skillDef.baseCooldownMs * cdMul
        hero.skills = hero.skills.map((entry) =>
          entry.skillId === skill.skillId
            ? { ...entry, cooldownRemainingMs: zoneStats._silenceCurse
                ? baseCd / effectiveStats.attackSpeed * 1.2
                : baseCd / effectiveStats.attackSpeed }
            : entry,
        )

        // === ironbound_vow + chain_oath：减少 iron_oath 冷却 ===
        const totalOathCdReduction = ironboundCdReductionMs + chainOathCdReductionMs
        if (totalOathCdReduction > 0) {
          hero.skills = hero.skills.map((entry) =>
            entry.skillId === 'iron_oath'
              ? { ...entry, cooldownRemainingMs: Math.max(0, entry.cooldownRemainingMs - totalOathCdReduction) }
              : entry,
          )
        }
      }
      // 非攻击技能（iron_oath）的 cooldown 复位仍按原逻辑，但 cleave 分支已自行处理；这里给 iron_oath 加上：
      if (skill.skillId === 'iron_oath') {
        hero.skills = hero.skills.map((entry) =>
          entry.skillId === skill.skillId
            ? { ...entry, cooldownRemainingMs: zoneStats._silenceCurse
                ? skillDef.baseCooldownMs / effectiveStats.attackSpeed * 1.2
                : skillDef.baseCooldownMs / effectiveStats.attackSpeed }
            : entry,
        )
      }

      // 应用本次施法的技能 XP（命中 +1，每个击杀 +10/+15/+精英 boss 加成）
      if (castSkillId && castSkillXp > 0) {
        const prev = hero.skillProgress[castSkillId]
        if (prev) {
          const nextProgress = addSkillXp(prev, castSkillXp)
          const leveledUp = nextProgress.level > prev.level
          hero = {
            ...hero,
            skillProgress: { ...hero.skillProgress, [castSkillId]: nextProgress },
          }
          if (leveledUp) {
            floatingTexts.unshift({ id: createId('float'), label: `${skillsById[castSkillId]?.name ?? '技能'} Lv.${nextProgress.level}`, kind: 'execute' as const, xOffset: 0 })
          }
        }
      }
    }
  }

  const aliveAfter = members.filter((e) => e.currentLife > 0)
  // 怪物反击：存活怪物按 rank 和 armor 造成伤害
  let totalEnemyDamage = 0
  const earlyGameMul = current.progression.stage <= 5 ? 0.5 : 1.0
  for (const enemy of aliveAfter) {
    const rankMul = enemy.rank === 'boss' ? 2.8 : enemy.rank === 'elite' ? 1.6 : 1
    const baseDmg = 4 + enemy.level * 0.8
    const mitigated = Math.max(1, baseDmg * rankMul * (100 / (100 + zoneStats.armor)))
    const zoneEnemyDmgMul = zoneAffixIds.includes('zone_forge_heat') ? 1.10 : zoneAffixIds.includes('zone_forgemaw_frenzy') ? 1.25 : 1.0
    const traitMul = counterMultiplier(enemy)
    if (rng.next() * 100 < zoneStats.evasion) {
      floatingTexts.unshift({ id: createId('float'), label: 'MISS', kind: 'miss' as const, xOffset: Math.floor(rng.next() * 48) - 24 })
    } else {
      totalEnemyDamage += Math.round(mitigated * zoneEnemyDmgMul * earlyGameMul * traitMul)
    }
  }
  if (totalEnemyDamage > 0) {
    hero = { ...hero, currentLife: Math.max(0, hero.currentLife - totalEnemyDamage) }

    // === Iron oath rune: reactive_oath 受到 ≥25% 上限伤害立即触发回血（覆盖 cd）===
    const oathProgRx = current.hero.skillProgress['iron_oath']
    if (hasRune(oathProgRx, 'reactive_oath') && totalEnemyDamage >= zoneStats.life * 0.25) {
      const ironOath = hero.skills.find((s) => s.skillId === 'iron_oath')
      if (ironOath && ironOath.cooldownRemainingMs > 0) {
        let healPct = 0.12
        if (hasRune(oathProgRx, 'vigilant_oath')) healPct *= 0.7
        if (hasRune(oathProgRx, 'enduring_oath')) healPct *= 1.5
        if (hasRune(oathProgRx, 'eternal_vow')) healPct *= 2
        hero = { ...hero, currentLife: Math.min(zoneStats.life, hero.currentLife + Math.round(zoneStats.life * healPct)) }
        hero.skills = hero.skills.map((s) =>
          s.skillId === 'iron_oath' ? { ...s, cooldownRemainingMs: skillsById['iron_oath'].baseCooldownMs / effectiveStats.attackSpeed } : s,
        )
        floatingTexts.unshift({ id: createId('float'), label: '应激守护', kind: 'hit', xOffset: 0 })
      }
    }

    // === Iron oath rune: vow_of_retribution 反弹 30% 给所有反击的怪 ===
    if (current.oathRuneState && current.oathRuneState.retributionUntilMs > current.gameTimeMs) {
      const reflect = Math.round(totalEnemyDamage * 0.3)
      if (reflect > 0 && aliveAfter.length > 0) {
        const perTarget = Math.max(1, Math.floor(reflect / aliveAfter.length))
        for (const enemy of aliveAfter) {
          enemy.currentLife = Math.max(0, enemy.currentLife - perTarget)
        }
        floatingTexts.unshift({ id: createId('float'), label: `反 ${reflect}`, kind: 'execute', xOffset: 0 })
      }
    }

    // === Iron oath rune: martyr_oath 受到伤害时按等量真实伤害打最近怪 ===
    if (current.oathRuneState && current.oathRuneState.martyrUntilMs > current.gameTimeMs) {
      const target = aliveAfter[0]
      if (target) {
        target.currentLife = Math.max(0, target.currentLife - totalEnemyDamage)
        floatingTexts.unshift({ id: createId('float'), label: `殉道 ${totalEnemyDamage}`, kind: 'execute', xOffset: 0 })
      }
    }
  }

  // zone_bleed_ground: 每 tick 对英雄造成额外 5 伤害
  if (zoneAffixIds.includes('zone_bleed_ground')) {
    const bleedGroundDmg = Math.max(1, Math.round(5 * (100 / (100 + zoneStats.armor))))
    hero = { ...hero, currentLife: Math.max(0, hero.currentLife - bleedGroundDmg) }
  }

  // 英雄死亡 → 退回当前 zone 第 1 层，重置血量，保留装备和背包
  if (hero.currentLife <= 0) {
    const deathStage = current.progression.stage
    const respawnZoneId = zoneIdForStage(deathStage)
    const respawnStage = Math.max(1, Math.floor((deathStage - 1) / 10) * 10 + 1)
    const rng2 = createRng(current.rngSeed + Math.floor(gameTimeMs) + 1)
    const respawnGroup = createEnemyGroupForStage(respawnZoneId, respawnStage, rng2, hero.x, current.progression.torment)
    const respawnScalars = eventLifeMulFor(current, respawnZoneId)
    return {
      ...current,
      hero: { ...hero, currentLife: effectiveStats.life }, // 满血复活
      enemyGroup: applyEventLifeMul(respawnGroup, respawnScalars),
      stageMode: 'travel',
      stageModeUntil: 0,
      progression: {
        ...current.progression,
        stage: respawnStage,
        zoneId: respawnZoneId,
      },
      gameTimeMs,
      floatingTexts: [{ id: createId('float'), label: '阵亡', kind: 'execute' as const, xOffset: 0 }],
      combatLog: addLog(current.combatLog, `英雄阵亡，退回 ${respawnZoneId} 第 ${respawnStage} 层。`),
      cachedStats: stats,
    }
  }

  // 群组未清空 → 继续战斗
  if (aliveAfter.length > 0) {
    const nextEnemyGroup = reinforceCombatStream(current, aliveAfter, gameTimeMs, rng)
    return {
      ...current,
      hero,
      enemyGroup: nextEnemyGroup,
      gameTimeMs,
      stageMode: 'combat',
      stageModeUntil: 0,
      floatingTexts: floatingTexts.slice(0, 5),
      lastDrop: undefined,
      cachedStats: stats,
    }
  }

  // 群组清空 → 结算掉落 + 推进关卡
  const tormentMF = tormentLootScalars(current.progression.torment).magicFind
  const eventLoot = eventLootScalars(current)
  return resolveGroupClear(
    { ...current, hero, enemyGroup: { ...current.enemyGroup, members }, gameTimeMs, floatingTexts: floatingTexts.slice(0, 5) },
    zoneStats.magicFind + tormentMF + eventLoot.magicFind,
    zoneStats.goldFind + eventLoot.goldFind,
    zoneAffixIds,
  )
}

function reinforceCombatStream(
  current: GameState,
  aliveMembers: EnemyInstance[],
  gameTimeMs: number,
  rng: ReturnType<typeof createRng>,
): GameState['enemyGroup'] {
  const baseGroup = { ...current.enemyGroup, members: aliveMembers }
  if (current.qaMode) return baseGroup
  if (aliveMembers.some((enemy) => enemy.rank === 'boss')) return baseGroup
  if (aliveMembers.length >= ENEMY_REINFORCE_MAX_ACTIVE) return baseGroup

  const lastSpawnAtMs = current.enemyGroup.lastSpawnAtMs ?? current.gameTimeMs
  if (gameTimeMs - lastSpawnAtMs < ENEMY_REINFORCE_INTERVAL_MS) return baseGroup

  const enemy = createEnemyForStage(current.progression.zoneId, current.progression.stage, rng, current.progression.torment)
  enemy.spawnedAtMs = gameTimeMs
  enemy.formationSlot = pickOpenFormationSlot(aliveMembers)
  if (ENEMY_REINFORCE_MAX_ACTIVE > 1) {
    enemy.maxLife = Math.round(enemy.maxLife * 0.55)
    enemy.currentLife = enemy.maxLife
  }
  // zone mod + 赤潮 生命缩放
  const reinforceLifeMul = eventLifeMulFor(current, current.progression.zoneId)
  if (reinforceLifeMul !== 1) {
    enemy.maxLife = Math.max(1, Math.round(enemy.maxLife * reinforceLifeMul))
    enemy.currentLife = enemy.maxLife
  }

  return {
    ...baseGroup,
    members: [...aliveMembers, enemy],
    lastSpawnAtMs: gameTimeMs,
  }
}

function pickOpenFormationSlot(aliveMembers: EnemyInstance[]): number {
  const occupied = new Set(aliveMembers.map((enemy, index) => enemy.formationSlot ?? index))
  for (let slot = 0; slot < ENEMY_REINFORCE_MAX_ACTIVE; slot += 1) {
    if (!occupied.has(slot)) return slot
  }
  return aliveMembers.length
}

function coolDownSkills(current: GameState, deltaMs: number) {
  return {
    ...current.hero,
    skills: current.hero.skills.map((skill) => ({
      ...skill,
      cooldownRemainingMs: Math.max(0, skill.cooldownRemainingMs - deltaMs),
    })),
  }
}

/** 优先打 boss → elite → 最低血量。 */
function pickPrimaryTarget(alive: EnemyInstance[]): EnemyInstance {
  const boss = alive.find((e) => e.rank === 'boss')
  if (boss) return boss
  const elite = alive.find((e) => e.rank === 'elite')
  if (elite) return elite
  return [...alive].sort((a, b) => a.currentLife - b.currentLife)[0]
}

function chooseSkill(
  skills: SkillState[],
  primary: EnemyInstance,
  execParams: { threshold: number; damageMult: number },
  hero: Hero,
  stats: CombatStats,
) {
  const ready = (id: string) => skills.find((skill) => skill.skillId === id && skill.cooldownRemainingMs <= 0)
  const execute = ready('execute')
  if (execute && isExecuteReady(execute, primary, execParams)) return execute
  // 紧急救援：血量 < 40% 时优先于攻击
  const shield = ready('iron_oath')
  if (shield && hero.currentLife < stats.life * 0.4) return shield
  const sweep = ready('lacerating_sweep')
  if (sweep) return sweep
  // 非紧急：elite/boss 或血 < 60%
  if (shield && (hero.currentLife < stats.life * 0.6 || primary.rank !== 'normal')) return shield
  return ready('cleave')
}

function describeGroup(group: EnemyGroup): string {
  if (group.members.length === 1) return group.members[0].name
  const lead = group.members[0]
  return `${lead.name} 等 ${group.members.length} 名敌人`
}

/**
 * 整波清空后结算：每只贡献金币/经验，主目标（最强 rank）掉落物品。
 */
function resolveGroupClear(current: GameState, magicFind: number, goldFind: number, zoneAffixIds: string[]): GameState {
  // QA 沙盒：清场后不推关、不掉落，等玩家重新从图鉴选。
  if (current.qaMode) {
    return {
      ...current,
      enemyGroup: { ...current.enemyGroup, members: [] },
      stageMode: 'travel',
      stageModeUntil: 0,
      combatLog: addLog(current.combatLog, 'QA 一波清空，请重新选怪。'),
    }
  }
  const stage = current.progression.stage
  const members = current.enemyGroup.members
  const lead = members.reduce((best, e) => (rankWeight(e.rank) > rankWeight(best.rank) ? e : best), members[0])
  const hadBoss = members.some((e) => e.rank === 'boss')
  const nextStage = hadBoss || current.progression.kills % 3 === 2 ? stage + 1 : stage
  const nextZoneId = zoneIdForStage(nextStage)

  const enemyDefinition = enemiesById[lead.enemyDefId]
  const rng = createRng(current.rngSeed + Math.floor(current.gameTimeMs))
  const dropped = createItem(enemyDefinition.lootTableId, stage, magicFind, rng)
  const filterResult = applyLootFilter(dropped, current)

  let goldTotal = 0
  let xpTotal = 0
  for (const enemy of members) {
    const rankMul = enemy.rank === 'boss' ? 3 : enemy.rank === 'elite' ? 1.7 : 1
    goldTotal += Math.round((12 + stage * 7) * (1 + goldFind / 100) * rankMul)
    xpTotal += Math.round(24 + stage * 6 + (enemy.rank === 'boss' ? 80 : enemy.rank === 'elite' ? 20 : 0))
  }

  // zone_iron_toll：金币 -20%
  const goldMul = zoneAffixIds.includes('zone_iron_toll') ? 0.8 : 1.0
  goldTotal = Math.round(goldTotal * goldMul)
  // zone_forgemaw_frenzy：金币 +30%
  if (zoneAffixIds.includes('zone_forgemaw_frenzy')) goldTotal = Math.round(goldTotal * 1.3)
  // zone mod / 赤潮事件金币最终乘数
  const eventLootMul = eventLootScalars(current).goldMul
  if (eventLootMul !== 1) goldTotal = Math.round(goldTotal * eventLootMul)

  const shards = filterResult === 'salvage' ? salvageValue(dropped) : hadBoss ? 3 : 0
  const hasElite = members.some(e => e.rank === 'elite')
  const chaosStones = current.resources.chaosStones +
    (hadBoss ? 1 : hasElite && rng.next() < 0.3 ? 1 : !hadBoss && !hasElite && rng.next() < 0.05 ? 1 : 0)
  const itemsById = filterResult === 'keep' ? { ...current.itemsById, [dropped.id]: dropped } : current.itemsById
  const itemIds = filterResult === 'keep' ? [dropped.id, ...current.inventory.itemIds].slice(0, current.inventory.capacity) : current.inventory.itemIds
  const heroXp = current.hero.xp + xpTotal
  const nextLevel = Math.floor(Math.sqrt(heroXp / 50)) + 1
  const leveledUp = nextLevel > current.hero.level
  const logText =
    filterResult === 'keep'
      ? `${describeGroupName(members)} 倒下，掉落 ${dropped.name}。`
      : `${describeGroupName(members)} 倒下，掉落被筛选规则分解。`

  let nextState: GameState = {
    ...current,
    hero: {
      ...current.hero,
      xp: heroXp,
      level: nextLevel,
    },
    resources: {
      ...current.resources,
      gold: current.resources.gold + goldTotal,
      shards: current.resources.shards + shards,
      chaosStones,
    },
    inventory: {
      ...current.inventory,
      itemIds,
    },
    itemsById,
    enemyGroup: createEnemyGroupForStage(nextZoneId, nextStage, rng, current.hero.x, current.progression.torment),
    stageMode: 'travel',
    stageModeUntil: 0,
    progression: {
      ...current.progression,
      zoneId: nextZoneId,
      stage: nextStage,
      highestStage: Math.max(current.progression.highestStage, nextStage),
      kills: current.progression.kills + members.length,
      maxTormentUnlocked: hadBoss && stage % 100 === 0 && current.progression.torment + 1 <= 16
        ? Math.max(current.progression.maxTormentUnlocked, current.progression.torment + 1)
        : current.progression.maxTormentUnlocked,
    },
    combatLog: addLog(current.combatLog, logText),
    floatingTexts: [
      ...(leveledUp ? [{ id: createId('float'), label: 'LEVEL UP!' as const, kind: 'levelup' as const, xOffset: 0 }] : []),
      { id: createId('float'), label: filterResult === 'keep' ? '掉落' : `+${shards} 裂片`, kind: 'loot' as const, xOffset: Math.floor(rng.next() * 48) - 24 },
      ...current.floatingTexts,
    ].slice(0, 5),
    lastDrop: filterResult === 'keep' ? dropped : undefined,
    lastBossKill: hadBoss
      ? { bossName: lead.name, stage, rewardText: `+3 裂片 +1 混沌石` }
      : undefined,
  }

  // 每日目标 bump：杀敌、推进层数、捡到 rare+ 物品
  nextState = bumpDailyGoal(nextState, 'kill', members.length)
  if (nextStage > stage) nextState = bumpDailyGoal(nextState, 'stage', nextStage - stage)
  if (filterResult === 'keep' && (dropped.rarity === 'rare' || dropped.rarity === 'epic' || dropped.rarity === 'legendary')) {
    nextState = bumpDailyGoal(nextState, 'rareLoot', 1)
  }
  nextState = evaluateAchievements(nextState)

  // === Zone 词条事件双路：zone mod + 赤潮，整 zone / 每 stage 触发 ===
  if (nextStage > stage) {
    const zoneChanged = nextZoneId !== current.progression.zoneId
    const eventRng = createRng(current.rngSeed + Math.floor(nextState.gameTimeMs) + nextStage * 7919)
    const rolledMod = rollZoneModForZone(nextState, nextZoneId, nextStage, eventRng)
    const tideActive = rollCrimsonTide(eventRng)
    const newZoneMod = (zoneChanged || rolledMod.isNewRoll || !nextState.zoneMod || nextState.zoneMod.zoneId !== nextZoneId)
      ? { zoneId: nextZoneId, modId: rolledMod.modId, rolledAtStage: nextStage }
      : nextState.zoneMod
    let log = nextState.combatLog
    if (zoneChanged && newZoneMod) {
      const def = zoneModsById[newZoneMod.modId]
      if (def) log = addLog(log, `进入 ${nextZoneId}：${def.name} —— ${def.description}`)
    }
    if (tideActive) {
      log = addLog(log, `⚠ 赤潮事件：敌人生命 +60% / 伤害 +40%，magic find +80、金币 ×2。`)
    }
    nextState = {
      ...nextState,
      zoneMod: newZoneMod,
      crimsonTideActive: tideActive,
      combatLog: log,
    }
    // 把生命缩放叠加到刚生成的 enemyGroup
    const scalars = (() => {
      const m = newZoneMod ? zoneModsById[newZoneMod.modId] : undefined
      const lifeMul = (m?.enemyLifeMul ?? 1) * (tideActive ? 1.6 : 1)
      return lifeMul
    })()
    if (scalars !== 1) {
      nextState = { ...nextState, enemyGroup: applyEventLifeMul(nextState.enemyGroup, scalars) }
    }
  }
  return nextState
}

function rankWeight(rank: EnemyInstance['rank']): number {
  return rank === 'boss' ? 3 : rank === 'elite' ? 2 : 1
}

function describeGroupName(members: EnemyInstance[]): string {
  if (members.length === 1) return members[0].name
  return `${members[0].name} 等 ${members.length} 名敌人`
}
