import { describe, expect, it } from 'vitest'
import { ENCOUNTER_DISTANCE, ENEMY_SPAWN_AHEAD, HERO_VIEW_X } from '../../engine/progression'
import { ENEMY_FORMATION_GAP, getAnimationFrame, getEnemyMemberViewX, getStageMotionState, HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT } from '../motion'

describe('stage motion projection', () => {
  it('keeps the hero anchored in viewport space', () => {
    const motion = getStageMotionState({ stageMode: 'travel', heroX: 120, enemyGroupX: 190 })

    expect(motion.heroViewX).toBe(HERO_VIEW_X)
  })

  it('clamps traveling enemies at the encounter line to avoid overshooting into combat', () => {
    const motion = getStageMotionState({
      stageMode: 'travel',
      heroX: 49,
      enemyGroupX: 70,
    })

    expect(motion.rawEnemyGroupViewX).toBeLessThan(HERO_VIEW_X + ENCOUNTER_DISTANCE)
    expect(motion.enemyGroupViewX).toBe(HERO_VIEW_X + ENCOUNTER_DISTANCE)
  })

  it('uses the exact world projection in combat after the encounter has locked', () => {
    const motion = getStageMotionState({
      stageMode: 'combat',
      heroX: 38,
      enemyGroupX: 62,
    })

    expect(motion.enemyGroupViewX).toBe(HERO_VIEW_X + ENCOUNTER_DISTANCE)
  })

  it('keeps enemy formation spacing identical across stage modes', () => {
    const groupX = HERO_VIEW_X + ENCOUNTER_DISTANCE

    expect(getEnemyMemberViewX(groupX, 0)).toBe(groupX)
    expect(getEnemyMemberViewX(groupX, 1)).toBe(groupX + ENEMY_FORMATION_GAP)
    expect(getEnemyMemberViewX(groupX, 2)).toBe(groupX + ENEMY_FORMATION_GAP * 2)
  })

  it('starts new enemy groups beyond the right edge before they walk into view', () => {
    expect(HERO_VIEW_X + ENEMY_SPAWN_AHEAD).toBeGreaterThan(100)
  })
})

describe('getAnimationFrame', () => {
  it('returns frame 0 at gameTimeMs=0', () => {
    expect(getAnimationFrame(0, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(0)
  })

  it('advances frames in step with durationMs/frameCount', () => {
    const frameMs = HERO_ATTACK_DURATION_MS / HERO_ATTACK_FRAME_COUNT // 225
    expect(getAnimationFrame(0, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(0)
    expect(getAnimationFrame(frameMs, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(1)
    expect(getAnimationFrame(frameMs * 2, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(2)
    expect(getAnimationFrame(frameMs * 3, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(3)
  })

  it('wraps back to frame 0 after a full cycle', () => {
    expect(getAnimationFrame(HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(0)
    expect(getAnimationFrame(HERO_ATTACK_DURATION_MS * 2 + 1, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(0)
  })

  it('stays on frame 2 when gameTimeMs is in the third quarter', () => {
    const frameMs = HERO_ATTACK_DURATION_MS / HERO_ATTACK_FRAME_COUNT
    expect(getAnimationFrame(frameMs * 2 + 10, HERO_ATTACK_FRAME_COUNT, HERO_ATTACK_DURATION_MS)).toBe(2)
  })
})
