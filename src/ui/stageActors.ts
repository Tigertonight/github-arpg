import { skillsById } from '../data/skills'
import { gameAssetBase, getEnemyVisual, getHeroVisual } from '../data/visuals'
import type { EnemyInstance, GameState, SkillState } from '../domain/types'
import { getAnimationFrame, getEnemyMemberViewX, getStageMotionState, HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT } from './motion'

// 同一波怪物之间的帧偏移，让脚步不同步（避免方阵感）
const ENEMY_FRAME_STAGGER_MS = 120

export { HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT }
export { gameAssetBase }

export const ENEMY_ENTER_DURATION_MS = 2400
export const ENEMY_POSITION_TRANSITION = 'left 0.9s linear'

export type ActorVisualState = 'walk' | 'attack' | 'idle'
type EnemyVisualState = 'walk' | 'idle' | 'attack'
type ActorStyleVars = Record<`--${string}`, string | number>

export interface HeroActorView {
  xPct: number
  state: ActorVisualState
  rootClassName: string
  transition: string
  styleVars: ActorStyleVars
  frame:
    | { kind: 'sheet'; className: string; src: string; frames: number }
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
  styleVars: ActorStyleVars
  frame:
    | { kind: 'walk'; className: string; src: string; frames: number; frameIndex: number }
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
  const heroVisual = getHeroVisual(game.hero.classId)
  const heroAction = isTraveling ? heroVisual.actions.walk : heroActionForSkill(heroVisual.actions, activeSkillId)
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
    shakeClass: (() => {
      const hasKill = game.floatingTexts.some(t => t.kind === 'kill' && t.label === 'BOSS DOWN')
      if (hasKill) return 'shake-boss-kill'
      const hasEliteKill = game.floatingTexts.some(t => t.kind === 'kill' && t.label === 'KILL!')
      if (hasEliteKill) return 'shake-kill'
      if (latestText?.kind === 'crit' || latestText?.kind === 'execute') return 'shake-crit'
      if (latestText?.kind === 'hit') return 'shake-hit'
      return ''
    })(),
    hero: {
      xPct: motion.heroViewX,
      state: isTraveling ? 'walk' : 'attack',
      rootClassName: `hero-sprite${activeSkillId ? ` skill-${activeSkillId}` : ''}`,
      transition: 'none',
      styleVars: {
        '--hero-scale': heroVisual.scale,
        '--hero-anchor-x': heroVisual.anchor.x,
        '--hero-anchor-y': heroVisual.anchor.y,
      },
      frame: isTraveling
        ? { kind: 'sheet', className: 'hero-action-sheet hero-sheet-walk', src: heroAction?.src ?? heroVisual.attackFrames[0], frames: heroAction?.frames ?? 4 }
        : { kind: 'sheet', className: 'hero-action-sheet hero-sheet-attack', src: heroAction?.src ?? heroVisual.attackFrames[0], frames: heroAction?.frames ?? 4 },
    },
    enemies: game.enemyGroup.members.map((enemy, idx) => {
      const enemyVisual = getEnemyVisual(enemy.enemyDefId)
      const formationSlot = enemy.formationSlot ?? idx
      const hpPct = Math.max(0, Math.round((enemy.currentLife / enemy.maxLife) * 100))
      const isEntering = !isTraveling && typeof enemy.spawnedAtMs === 'number' && game.gameTimeMs - enemy.spawnedAtMs < ENEMY_ENTER_DURATION_MS
      const isAttacking = !isTraveling && !isEntering && heroAttackFrame >= 2
      const walk = enemyVisual.actions.walk
      const idle = enemyVisual.actions.idle ?? walk
      const attack = enemyVisual.actions.attack ?? idle ?? walk
      const usesRuntimeWalk = walk?.src.includes('/enemies/runtime/') ?? false

      // 帧索引基于 gameTimeMs：暂停时游戏时间停止，sheet 不再跳帧
      // 不同 slot 加偏移，避免一波敌人同步迈步
      const stagger = formationSlot * ENEMY_FRAME_STAGGER_MS
      const walkFrames = walk?.frames ?? 4
      const walkDuration = walk?.durationMs ?? 720
      const attackFrames = attack?.frames ?? 4
      const attackDuration = attack?.durationMs ?? 760
      const rawWalkFrameIndex = getAnimationFrame(game.gameTimeMs + stagger, walkFrames, walkDuration)
      const rawAttackFrameIndex = getAnimationFrame(game.gameTimeMs + stagger, attackFrames, attackDuration)
      // runtime 敌人 sheet 第 3、4 帧素材残缺（导出脚本切错），只用前 2 帧。
      // root motion 敌人（rust_hound 等）sheet 完整，按原帧数轮播。
      const walkFrameIndex = usesRuntimeWalk ? rawWalkFrameIndex % 2 : rawWalkFrameIndex
      const attackFrameIndex = usesRuntimeWalk ? rawAttackFrameIndex % 2 : rawAttackFrameIndex

      return {
        enemy,
        xPct: getEnemyMemberViewX(motion.enemyGroupViewX, formationSlot),
        rootClassName: `enemy-sprite enemy-slot-${Math.min(formationSlot, 3)} enemy-rank-${enemy.rank} ${enemyVisual.familyClass} ${usesRuntimeWalk ? 'enemy-runtime-motion' : ''} ${isEntering ? 'is-entering' : ''} ${isAttacking ? 'is-attacking' : ''} ${isHitTick && enemy.currentLife > 0 && !isEntering ? 'is-hit' : ''}`,
        transition: ENEMY_POSITION_TRANSITION,
        hpPct,
        showHealthbar: !isTraveling && !isEntering,
        showCrown: enemy.rank !== 'normal' && !isTraveling && !isEntering,
        state: isTraveling || isEntering ? 'walk' : isAttacking ? 'attack' : 'idle',
        styleVars: {
          '--enemy-scale': enemyVisual.scale,
          '--enemy-anchor-x': enemyVisual.anchor.x,
          '--enemy-anchor-y': enemyVisual.anchor.y,
          '--enemy-walk-frames': walkFrames,
          '--enemy-attack-frames': attackFrames,
        },
        frame: isTraveling || isEntering
          ? {
              kind: 'walk',
              className: 'enemy-walk-sheet',
              src: walk?.src ?? idle?.src ?? '',
              frames: walkFrames,
              frameIndex: walkFrameIndex,
            }
          : isAttacking && attack
            ? {
                kind: 'walk',
                className: `enemy-attack-sheet enemy-attack-sheet-${attack.frames}`,
                src: attack.src,
                frames: attackFrames,
                frameIndex: attackFrameIndex,
              }
          : {
              kind: 'walk',
              className: 'enemy-walk-sheet enemy-walk-sheet-idle',
              src: idle?.src ?? walk?.src ?? '',
              frames: walkFrames,
              // idle: 锁定第 0 帧
              frameIndex: 0,
            },
      }
    }),
    vfx: !hitFrameActive
      ? null
      : makeSkillVfx(heroVisual.vfx, latestText?.kind === 'crit' ? 'crit' : activeSkillId ?? 'cleave', motion.heroViewX, game.gameTimeMs),
  }
}

function heroActionForSkill(actions: ReturnType<typeof getHeroVisual>['actions'], skillId: string | null) {
  if (skillId === 'lacerating_sweep') return actions.sweep ?? actions.attack
  if (skillId === 'execute') return actions.execute ?? actions.attack
  if (skillId === 'iron_oath') return actions.shield ?? actions.attack
  return actions.cleave ?? actions.attack ?? actions.idle
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

function makeSkillVfx(vfx: Record<string, string>, skillId: string, heroX: number, gameTimeMs: number): StageActorScene['vfx'] {
  const src = vfx[skillId]
  if (!src) return null
  return {
    className: `skill-vfx skill-vfx-${skillId}`,
    src,
    xPct: heroX + 20,
    key: `vfx-${gameTimeMs}-${skillId}`,
  }
}
