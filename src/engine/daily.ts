import type { DailyGoal, DailyGoalsState, GameState } from '../domain/types'

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 三个每日目标的固定模板。target 数值随玩家进度可后续动态化。 */
export function createDailyGoals(date: string = todayStr()): DailyGoalsState {
  return {
    date,
    goals: [
      { id: 'kill', label: '今日击杀 50 个敌人', target: 50, progress: 0, rewardGold: 300, rewardShards: 5, claimed: false },
      { id: 'stage', label: '今日推进 5 层', target: 5, progress: 0, rewardGold: 250, rewardShards: 6, claimed: false },
      { id: 'rareLoot', label: '今日捡到 1 件稀有+ 物品', target: 1, progress: 0, rewardGold: 200, rewardShards: 8, claimed: false },
    ],
  }
}

/** 若 dailyGoals 缺失或日期已过，刷新并返回新状态。 */
export function ensureDailyGoals(state: GameState): GameState {
  const today = todayStr()
  if (state.dailyGoals && state.dailyGoals.date === today) return state
  return { ...state, dailyGoals: createDailyGoals(today) }
}

/** 累加某种目标的进度（不超过 target，已 claimed 不变）。 */
export function bumpDailyGoal(state: GameState, kind: DailyGoal['id'], delta: number): GameState {
  const ensured = ensureDailyGoals(state)
  if (!ensured.dailyGoals || delta <= 0) return ensured
  const goals = ensured.dailyGoals.goals.map((goal) => {
    if (goal.id !== kind) return goal
    return { ...goal, progress: Math.min(goal.target, goal.progress + delta) }
  })
  return { ...ensured, dailyGoals: { ...ensured.dailyGoals, goals } }
}
