import { enemiesById } from '../data/enemies'
import { skillsById } from '../data/skills'
import { createId } from '../domain/ids'
import { addLog, deriveCombatStats } from '../domain/formulas'
import type { GameState, SkillState } from '../domain/types'
import { bleedTickDamage, nextBleed, physicalHit } from './damage'
import { applyLootFilter, createItem, salvageValue } from './loot'
import { createEnemyForStage } from './progression'
import { randomRng } from './rng'

const TICK_MS = 900
const TRAVEL_MS = 1800

export function advanceCombat(current: GameState, deltaMs = TICK_MS): GameState {
  const stats = deriveCombatStats(current.hero.equipment, current.itemsById, current.hero.level)
  const enemy = { ...current.enemy, bleed: { ...current.enemy.bleed } }
  let hero = coolDownSkills(current, deltaMs)
  const floatingTexts = current.floatingTexts.slice(0, 3)
  const now = Date.now()

  if (current.stageMode === 'travel') {
    if (current.stageModeUntil > now) {
      return {
        ...current,
        hero,
        floatingTexts,
        lastDrop: undefined,
        lastSavedAt: now,
      }
    }

    return {
      ...current,
      hero,
      stageMode: 'combat',
      stageModeUntil: 0,
      combatLog: addLog(current.combatLog, `遭遇 ${current.enemy.name}，矿道行军停止。`),
      floatingTexts,
      lastDrop: undefined,
      lastSavedAt: now,
    }
  }

  const bleedDamage = bleedTickDamage(stats, enemy, deltaMs)
  if (bleedDamage > 0) {
    enemy.currentLife -= bleedDamage
    enemy.bleed.remainingMs = Math.max(0, enemy.bleed.remainingMs - deltaMs)
    if (enemy.bleed.remainingMs <= 0) enemy.bleed.stacks = 0
    floatingTexts.unshift({ id: createId('float'), label: `${bleedDamage}`, kind: 'bleed' })
  }

  const skill = chooseSkill(hero.skills, enemy)
  if (skill) {
    const skillDef = skillsById[skill.skillId]
    if (skill.skillId === 'iron_oath') {
      hero = { ...hero, currentLife: Math.min(stats.life, hero.currentLife + Math.round(stats.life * 0.12)) }
      floatingTexts.unshift({ id: createId('float'), label: '守护', kind: 'hit' })
    } else {
      const hit = physicalHit(stats, enemy, skill)
      const echoHit = skill.runeId === 'echo_sweep' ? Math.round(hit * 0.45) : 0
      const damageDone = hit + echoHit
      enemy.currentLife -= damageDone
      enemy.bleed = nextBleed(enemy, skillDef.bleedStacks + (skill.runeId === 'deep_cut' ? 1 : 0), stats.bleedDurationMs)
      floatingTexts.unshift({
        id: createId('float'),
        label: `${damageDone}`,
        kind: skill.skillId === 'execute' ? 'execute' : 'hit',
      })
    }
    hero.skills = hero.skills.map((entry) =>
      entry.skillId === skill.skillId ? { ...entry, cooldownRemainingMs: skillDef.baseCooldownMs / stats.attackSpeed } : entry,
    )
  }

  if (enemy.currentLife > 0) {
    return {
      ...current,
      hero,
      enemy,
      stageMode: 'combat',
      stageModeUntil: 0,
      floatingTexts: floatingTexts.slice(0, 5),
      lastDrop: undefined,
      lastSavedAt: now,
    }
  }

  return resolveKill({ ...current, hero, enemy, floatingTexts: floatingTexts.slice(0, 5) }, stats.magicFind, stats.goldFind)
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

function chooseSkill(skills: SkillState[], enemy: GameState['enemy']) {
  const ready = (id: string) => skills.find((skill) => skill.skillId === id && skill.cooldownRemainingMs <= 0)
  const execute = ready('execute')
  if (execute && (enemy.currentLife / enemy.maxLife <= 0.35 || enemy.bleed.stacks >= 5)) return execute
  const sweep = ready('lacerating_sweep')
  if (sweep) return sweep
  const shield = ready('iron_oath')
  if (shield && enemy.rank !== 'normal') return shield
  return ready('cleave')
}

function resolveKill(current: GameState, magicFind: number, goldFind: number): GameState {
  const enemyDefinition = enemiesById[current.enemy.enemyDefId]
  const stage = current.progression.stage
  const nextStage = current.enemy.rank === 'boss' || current.progression.kills % 3 === 2 ? stage + 1 : stage
  const dropped = createItem(enemyDefinition.lootTableId, stage, magicFind, randomRng)
  const filterResult = applyLootFilter(dropped, current)
  const gold = Math.round((12 + stage * 7) * (1 + goldFind / 100) * (current.enemy.rank === 'boss' ? 3 : current.enemy.rank === 'elite' ? 1.7 : 1))
  const xp = Math.round(24 + stage * 6 + (current.enemy.rank === 'boss' ? 80 : 0))
  const shards = filterResult === 'salvage' ? salvageValue(dropped) : current.enemy.rank === 'boss' ? 3 : 0
  const itemsById = filterResult === 'keep' ? { ...current.itemsById, [dropped.id]: dropped } : current.itemsById
  const itemIds = filterResult === 'keep' ? [dropped.id, ...current.inventory.itemIds].slice(0, current.inventory.capacity) : current.inventory.itemIds
  const heroXp = current.hero.xp + xp
  const nextLevel = Math.floor(heroXp / 140) + 1
  const logText =
    filterResult === 'keep'
      ? `${current.enemy.name} 掉落 ${dropped.name}，伤口仍在发烫。`
      : `${current.enemy.name} 被处置，掉落被筛选规则分解。`

  return {
    ...current,
    hero: {
      ...current.hero,
      xp: heroXp,
      level: nextLevel,
    },
    resources: {
      ...current.resources,
      gold: current.resources.gold + gold,
      shards: current.resources.shards + shards,
    },
    inventory: {
      ...current.inventory,
      itemIds,
    },
    itemsById,
    enemy: createEnemyForStage(current.progression.zoneId, nextStage, randomRng),
    stageMode: 'travel',
    stageModeUntil: Date.now() + TRAVEL_MS,
    progression: {
      ...current.progression,
      stage: nextStage,
      highestStage: Math.max(current.progression.highestStage, nextStage),
      kills: current.progression.kills + 1,
    },
    combatLog: addLog(current.combatLog, logText),
    floatingTexts: [{ id: createId('float'), label: filterResult === 'keep' ? '掉落' : `+${shards} 裂片`, kind: 'loot' as const }, ...current.floatingTexts].slice(0, 5),
    lastDrop: filterResult === 'keep' ? dropped : undefined,
    lastSavedAt: Date.now(),
  }
}
