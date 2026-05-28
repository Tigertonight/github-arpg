import { enemiesById } from '../data/enemies'
import { zonesById } from '../data/enemies'
import { skillsById } from '../data/skills'
import { createId } from '../domain/ids'
import { addLog, deriveCombatStats } from '../domain/formulas'
import type { CombatStats, EnemyGroup, EnemyInstance, GameState, Hero, SkillState } from '../domain/types'
import { bleedTickDamage, isExecuteReady, nextBleed, physicalHit } from './damage'
import { aggregateBleedStack, aggregateExecuteThreshold, getSkillCastTriggers } from './legendary'
import { applyLootFilter, createItem, salvageValue } from './loot'
import { createEnemyForStage, createEnemyGroupForStage, ENCOUNTER_DISTANCE, zoneIdForStage } from './progression'
import { createRng } from './rng'

const TICK_MS = 900
/** 英雄世界坐标推进速度（单位/秒）。敌群在世界中静止，靠英雄走过去。 */
const HERO_TRAVEL_SPEED = 22
const ENEMY_REINFORCE_INTERVAL_MS = 1800
const ENEMY_REINFORCE_MAX_ACTIVE = 4

export function advanceCombat(current: GameState, deltaMs = TICK_MS): GameState {
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

  const execParams = aggregateExecuteThreshold(current, 0.35, 1)
  const bleedParams = aggregateBleedStack(current, 9)

  // zone_blood_moon 是元数据（流血层数上限），不在战斗循环直接处理，这里留空注释
  // 如需生效可在 aggregateBleedStack 的 maxStacks 参数里加 3

  // === Travel：英雄向前推进，敌群在世界中静止；距离 < ENCOUNTER_DISTANCE 切 combat ===
  if (current.stageMode === 'travel') {
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
      enemyGroup: { ...current.enemyGroup, lastSpawnAtMs: gameTimeMs },
      combatLog: addLog(current.combatLog, `遭遇 ${describeGroup(current.enemyGroup)}，矿道行军停止。`),
      floatingTexts,
      lastDrop: undefined,
      cachedStats: stats,
    }
  }

  // === Combat：位置冻结，对群组施加伤害 ===
  const members = current.enemyGroup.members.map((enemy) => ({ ...enemy, bleed: { ...enemy.bleed } }))

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
    if (skill) {
      const skillDef = skillsById[skill.skillId]
      if (skill.skillId === 'iron_oath') {
        hero = { ...hero, currentLife: Math.min(zoneStats.life, hero.currentLife + Math.round(zoneStats.life * 0.12)) }
        floatingTexts.unshift({ id: createId('float'), label: '守护', kind: 'hit', xOffset: Math.floor(rng.next() * 48) - 24 })
      } else {
        // 选 AOE 目标：以 primary 为首，再补足到 aoeTargets
        const targetCount = Math.min(skillDef.aoeTargets, aliveBefore.length)
        const targets: EnemyInstance[] = [primary]
        for (const enemy of aliveBefore) {
          if (targets.length >= targetCount) break
          if (enemy === primary) continue
          targets.push(enemy)
        }

        let bonusStacksTotal = 0
        for (const target of targets) {
          const hitResult = physicalHit(zoneStats as typeof effectiveStats, target, skill, execParams)
          const echoHit = skill.runeId === 'echo_sweep' ? Math.round(hitResult.damage * 0.45) : 0
          const damageDone = hitResult.damage + echoHit
          target.currentLife -= damageDone

          // 生命偷取：按 damageDone 的 lifeSteal 值回复生命（不超过已损血量）
          if (zoneStats.lifeSteal > 0 && damageDone > 0) {
            const stolen = Math.min(zoneStats.lifeSteal, Math.max(0, zoneStats.life - hero.currentLife))
            if (stolen > 0) hero = { ...hero, currentLife: hero.currentLife + stolen }
          }

          let bonusStacks = 0
          for (const power of getSkillCastTriggers(current)) {
            if (rng.next() < (power.params.triggerChance ?? 0)) {
              bonusStacks += power.params.bonusStacks ?? 0
              floatingTexts.unshift({ id: createId('float'), label: '✦传说', kind: 'execute' as const, xOffset: Math.floor(rng.next() * 48) - 24 })
            }
          }
          bonusStacksTotal += bonusStacks
          const baseStacks = skillDef.bleedStacks + (skill.runeId === 'deep_cut' ? 1 : 0)
          target.bleed = nextBleed(target, baseStacks + bonusStacks, zoneStats.bleedDurationMs, bleedParams)

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
      }
      hero.skills = hero.skills.map((entry) =>
        entry.skillId === skill.skillId
          ? { ...entry, cooldownRemainingMs: zoneStats._silenceCurse
              ? skillDef.baseCooldownMs / effectiveStats.attackSpeed * 1.2
              : skillDef.baseCooldownMs / effectiveStats.attackSpeed }
          : entry,
      )
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
    if (rng.next() * 100 < zoneStats.evasion) {
      floatingTexts.unshift({ id: createId('float'), label: 'MISS', kind: 'miss' as const, xOffset: Math.floor(rng.next() * 48) - 24 })
    } else {
      totalEnemyDamage += Math.round(mitigated * zoneEnemyDmgMul * earlyGameMul)
    }
  }
  if (totalEnemyDamage > 0) {
    hero = { ...hero, currentLife: Math.max(0, hero.currentLife - totalEnemyDamage) }
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
    return {
      ...current,
      hero: { ...hero, currentLife: effectiveStats.life }, // 满血复活
      enemyGroup: createEnemyGroupForStage(respawnZoneId, respawnStage, rng2, hero.x),
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
  return resolveGroupClear(
    { ...current, hero, enemyGroup: { ...current.enemyGroup, members }, gameTimeMs, floatingTexts: floatingTexts.slice(0, 5) },
    zoneStats.magicFind,
    zoneStats.goldFind,
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
  if (aliveMembers.some((enemy) => enemy.rank === 'boss')) return baseGroup
  if (aliveMembers.length >= ENEMY_REINFORCE_MAX_ACTIVE) return baseGroup

  const lastSpawnAtMs = current.enemyGroup.lastSpawnAtMs ?? current.gameTimeMs
  if (gameTimeMs - lastSpawnAtMs < ENEMY_REINFORCE_INTERVAL_MS) return baseGroup

  const enemy = createEnemyForStage(current.progression.zoneId, current.progression.stage, rng)
  enemy.spawnedAtMs = gameTimeMs
  if (ENEMY_REINFORCE_MAX_ACTIVE > 1) {
    enemy.maxLife = Math.round(enemy.maxLife * 0.55)
    enemy.currentLife = enemy.maxLife
  }

  return {
    ...baseGroup,
    members: [...aliveMembers, enemy],
    lastSpawnAtMs: gameTimeMs,
  }
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

  return {
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
    enemyGroup: createEnemyGroupForStage(nextZoneId, nextStage, rng, current.hero.x),
    stageMode: 'travel',
    stageModeUntil: 0,
    progression: {
      ...current.progression,
      zoneId: nextZoneId,
      stage: nextStage,
      highestStage: Math.max(current.progression.highestStage, nextStage),
      kills: current.progression.kills + members.length,
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
}

function rankWeight(rank: EnemyInstance['rank']): number {
  return rank === 'boss' ? 3 : rank === 'elite' ? 2 : 1
}

function describeGroupName(members: EnemyInstance[]): string {
  if (members.length === 1) return members[0].name
  return `${members[0].name} 等 ${members.length} 名敌人`
}
