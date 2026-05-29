import { enemiesById } from '../data/enemies'
import { skillsById } from '../data/skills'
import type { EnemyInstance, GameState, SkillState } from '../domain/types'
import { getEnemyMemberViewX, getStageMotionState, HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT } from './motion'

export { HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT }

export const gameAssetBase = '/assets/game'
export const ENEMY_ENTER_DURATION_MS = 2400
export const ENEMY_POSITION_TRANSITION = 'left 0.9s linear'
export const enemyAttackSheetIds = new Set([
  'forge_serpent',
  'bone_miner',
  'black_forge_guard',
  'coal_cultist',
  'rust_hound',
  'furnace_brute',
  'slag_warden',
])

const skillVfx: Record<string, string> = {
  cleave: `${gameAssetBase}/vfx-cleave-impact.png`,
  lacerating_sweep: `${gameAssetBase}/vfx-sweep-trail.png`,
  execute: `${gameAssetBase}/vfx-execute-burst.png`,
  iron_oath: `${gameAssetBase}/vfx-oath-shield.png`,
  crit: `${gameAssetBase}/vfx-crit-flash.png`,
}

export type ActorVisualState = 'walk' | 'attack' | 'idle'
type EnemyVisualState = 'walk' | 'idle' | 'attack'

export interface HeroActorView {
  xPct: number
  state: ActorVisualState
  rootClassName: string
  transition: string
  frame:
    | { kind: 'sheet'; className: string }
    | { kind: 'image'; key: number; className: string; src: string }
}

export interface EnemyActorView {
  enemy: EnemyInstance
  xPct: number
  rootClassName: string
  transition: string
  hpPct: number
  showHealthbar: boolean
  showCrown: boolean
  state: EnemyVisualState
  frame:
    | { kind: 'walk'; className: string; src: string }
    | { kind: 'static'; className: string; src: string }
}

export interface StageActorScene {
  isTraveling: boolean
  hero: HeroActorView
  enemies: EnemyActorView[]
  activeSkillId: string | null
  hitFrameActive: boolean
  isHitTick: boolean
  shakeClass: string
  vfx: { className: string; src: string; xPct: number; key: string } | null
}

export function deriveStageActors(game: GameState, heroAttackFrame: number): StageActorScene {
  const isTraveling = game.stageMode === 'travel'
  const latestText = game.floatingTexts[0]
  const isHitTick = !isTraveling && (
    latestText?.kind === 'hit' ||
    latestText?.kind === 'crit' ||
    latestText?.kind === 'execute'
  )
  const activeSkillId = isTraveling ? null : inferActiveSkillId(game.hero.skills)
  const hitFrameActive = !isTraveling && heroAttackFrame === 2
  const motion = getStageMotionState({
    stageMode: game.stageMode,
    heroX: game.hero.x,
    enemyGroupX: game.enemyGroup.x,
  })

  return {
    isTraveling,
    activeSkillId,
    hitFrameActive,
    isHitTick,
    shakeClass: latestText?.kind === 'crit' || latestText?.kind === 'execute'
      ? 'shake-crit'
      : latestText?.kind === 'hit'
        ? 'shake-hit'
        : '',
    hero: {
      xPct: motion.heroViewX,
      state: isTraveling ? 'walk' : 'attack',
      rootClassName: `hero-sprite${activeSkillId ? ` skill-${activeSkillId}` : ''}`,
      transition: 'none',
      frame: isTraveling
        ? { kind: 'sheet', className: 'hero-action-sheet hero-sheet-walk' }
        : {
            kind: 'image',
            key: heroAttackFrame,
            className: `hero-attack-frame hero-attack-frame-${heroAttackFrame}`,
            src: `${gameAssetBase}/oathbreaker-attack-aligned-frame-${heroAttackFrame}.png`,
          },
    },
    enemies: game.enemyGroup.members.map((enemy, idx) => {
      const familyClass = enemyFamilyClass(enemy.enemyDefId)
      const formationSlot = enemy.formationSlot ?? idx
      const hpPct = Math.max(0, Math.round((enemy.currentLife / enemy.maxLife) * 100))
      const isEntering = !isTraveling && typeof enemy.spawnedAtMs === 'number' && game.gameTimeMs - enemy.spawnedAtMs < ENEMY_ENTER_DURATION_MS
      const isAttacking = !isTraveling && !isEntering && heroAttackFrame >= 2
      return {
        enemy,
        xPct: getEnemyMemberViewX(motion.enemyGroupViewX, formationSlot),
        rootClassName: `enemy-sprite enemy-slot-${Math.min(formationSlot, 3)} enemy-rank-${enemy.rank} ${familyClass} ${isEntering ? 'is-entering' : ''} ${isAttacking ? 'is-attacking' : ''} ${isHitTick && enemy.currentLife > 0 && !isEntering ? 'is-hit' : ''}`,
        transition: ENEMY_POSITION_TRANSITION,
        hpPct,
        showHealthbar: !isTraveling && !isEntering,
        showCrown: enemy.rank !== 'normal' && !isTraveling && !isEntering,
        state: isTraveling || isEntering ? 'walk' : isAttacking ? 'attack' : 'idle',
        frame: isTraveling || isEntering
          ? {
              kind: 'walk',
              className: 'enemy-walk-sheet',
              src: enemyWalkSheetSrc(enemy.enemyDefId),
            }
          : isAttacking && enemyHasAttackSheet(enemy.enemyDefId)
            ? {
                kind: 'walk',
                className: 'enemy-attack-sheet',
                src: enemyAttackSheetSrc(enemy.enemyDefId),
              }
          : {
              kind: 'walk',
              className: 'enemy-walk-sheet enemy-walk-sheet-idle',
              src: enemyWalkSheetSrc(enemy.enemyDefId),
            },
      }
    }),
    vfx: !hitFrameActive
      ? null
      : makeSkillVfx(latestText?.kind === 'crit' ? 'crit' : activeSkillId ?? 'cleave', motion.heroViewX, game.gameTimeMs),
  }
}

function inferActiveSkillId(skills: SkillState[]): string {
  const firstSkill = skills[0]
  if (!firstSkill) return 'cleave'

  let best = firstSkill
  let bestProgress = skillProgress(firstSkill)
  for (const skill of skills.slice(1)) {
    const progress = skillProgress(skill)
    if (progress < bestProgress) {
      best = skill
      bestProgress = progress
    }
  }

  return best.skillId
}

function skillProgress(skill: SkillState): number {
  const def = skillsById[skill.skillId]
  return def ? (def.baseCooldownMs - skill.cooldownRemainingMs) / def.baseCooldownMs : 0
}

function enemyFamilyClass(enemyDefId: string): string {
  const family = enemiesById[enemyDefId]?.family ?? 'undead'
  if (family === 'beast') return 'enemy-sheet-beast'
  if (family === 'construct' || family === 'demon') return 'enemy-sheet-brute'
  return 'enemy-sheet-humanoid'
}

function enemyWalkSheetSrc(enemyDefId: string): string {
  return `${gameAssetBase}/enemy-${enemyDefId.replaceAll('_', '-')}-walk-sheet.png`
}

function enemyAttackSheetSrc(enemyDefId: string): string {
  return `${gameAssetBase}/enemy-${enemyDefId.replaceAll('_', '-')}-attack-sheet.png`
}

function enemyHasAttackSheet(enemyDefId: string): boolean {
  return enemyAttackSheetIds.has(enemyDefId)
}

function makeSkillVfx(skillId: string, heroX: number, gameTimeMs: number): StageActorScene['vfx'] {
  const src = skillVfx[skillId]
  if (!src) return null
  return {
    className: `skill-vfx skill-vfx-${skillId}`,
    src,
    xPct: heroX + 20,
    key: `vfx-${gameTimeMs}-${skillId}`,
  }
}
