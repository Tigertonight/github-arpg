import { useEffect, useState } from 'react'
import { enemyViewX, ENCOUNTER_DISTANCE, HERO_VIEW_X } from '../engine/progression'
import type { StageMode } from '../domain/types'

export const HERO_ATTACK_FRAME_COUNT = 4
export const HERO_ATTACK_DURATION_MS = 900
/**
 * 视口坐标系（百分比）中，同波怪物之间的横向间距。
 * 坐标体系以 % 为单位（HERO_VIEW_X=30, ENCOUNTER_DISTANCE=32），
 * 8 表示 8%，4 只怪纵深跨度 ~24%。超过 4 只时通过 getEnemyMemberViewX 自动收敛。
 */
export const ENEMY_FORMATION_GAP = 8

export interface StageMotionInput {
  stageMode: StageMode
  heroX: number
  enemyGroupX: number
}

export interface StageMotionState {
  heroViewX: number
  enemyGroupViewX: number
  encounterViewX: number
  rawEnemyGroupViewX: number
}

export function getStageMotionState(input: StageMotionInput): StageMotionState {
  const encounterViewX = HERO_VIEW_X + ENCOUNTER_DISTANCE
  const rawEnemyGroupViewX = enemyViewX(input.heroX, input.enemyGroupX)

  return {
    heroViewX: HERO_VIEW_X,
    enemyGroupViewX: input.stageMode === 'travel'
      ? Math.max(encounterViewX, rawEnemyGroupViewX)
      : rawEnemyGroupViewX,
    encounterViewX,
    rawEnemyGroupViewX,
  }
}

export function getEnemyMemberViewX(groupViewX: number, memberIndex: number): number {
  return groupViewX + memberIndex * ENEMY_FORMATION_GAP
}

/**
 * 基于 gameTimeMs（游戏内时间）计算当前动作帧索引。
 * 与游戏 tick 共享同一时间源，帧画面和战斗逻辑严格对齐；
 * 暂停时 gameTimeMs 停止推进，动画自然冻结，无需额外 clearInterval。
 *
 * @param gameTimeMs - 游戏累计内部时间（ms），来自 GameState.gameTimeMs
 * @param frameCount - 动画总帧数
 * @param durationMs - 完整循环时长（ms），例如 HERO_ATTACK_DURATION_MS
 */
export function getAnimationFrame(gameTimeMs: number, frameCount: number, durationMs: number): number {
  return Math.floor((gameTimeMs % durationMs) / (durationMs / frameCount))
}

export function useAnimationFrameIndex(enabled: boolean, frameCount: number, durationMs: number): number {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined

    const startedAt = performance.now()
    let raf = 0

    const update = (now: number) => {
      const elapsed = Math.max(0, now - startedAt) % durationMs
      setFrame(Math.floor(elapsed / (durationMs / frameCount)))
      raf = requestAnimationFrame(update)
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, enabled, frameCount])

  return frame
}
