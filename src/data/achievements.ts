import type { GameState } from '../domain/types'

/**
 * 成就触发模式：
 * - polled：每次 boss 击杀后跑一次 condition(state)，适合累计型（杀数/层数/收藏/装备件数）。
 * - event：未来由具体事件钩子触发（单次暴击 10w、无伤通关等），目前留位。
 */
export type AchievementTrigger = 'polled' | 'event'

export interface AchievementReward {
  gold?: number
  shards?: number
  chaosStones?: number
}

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  trigger: AchievementTrigger
  /** 仅 polled 类型必填；返回 true 即解锁。 */
  condition?: (state: GameState) => boolean
  /** UI 进度展示用（可选）：返回 0..1。 */
  progress?: (state: GameState) => number
  reward: AchievementReward
}

function totalKills(state: GameState): number {
  return state.progression.kills
}

function totalBossKills(state: GameState): number {
  if (!state.bestiary) return 0
  let n = 0
  for (const id of Object.keys(state.bestiary)) n += state.bestiary[id].bossKills
  return n
}

function legendaryEquippedCount(state: GameState): number {
  let n = 0
  for (const slot of Object.keys(state.hero.equipment)) {
    const id = state.hero.equipment[slot as keyof typeof state.hero.equipment]
    if (!id) continue
    const item = state.itemsById[id]
    if (item?.rarity === 'legendary') n += 1
  }
  return n
}

function bestiaryEncounteredCount(state: GameState): number {
  if (!state.bestiary) return 0
  let n = 0
  for (const id of Object.keys(state.bestiary)) {
    if (state.bestiary[id].encountered) n += 1
  }
  return n
}

function ratioOf(value: number, target: number): number {
  if (target <= 0) return 1
  return Math.max(0, Math.min(1, value / target))
}

export const achievementsCatalog: AchievementDefinition[] = [
  {
    id: 'kills_100',
    title: '初出茅庐',
    description: '累计击杀 100 个敌人。',
    trigger: 'polled',
    condition: (s) => totalKills(s) >= 100,
    progress: (s) => ratioOf(totalKills(s), 100),
    reward: { gold: 500, shards: 20 },
  },
  {
    id: 'kills_1000',
    title: '收割者',
    description: '累计击杀 1000 个敌人。',
    trigger: 'polled',
    condition: (s) => totalKills(s) >= 1000,
    progress: (s) => ratioOf(totalKills(s), 1000),
    reward: { gold: 3000, shards: 80, chaosStones: 2 },
  },
  {
    id: 'kills_10000',
    title: '战场幽魂',
    description: '累计击杀 10000 个敌人。',
    trigger: 'polled',
    condition: (s) => totalKills(s) >= 10000,
    progress: (s) => ratioOf(totalKills(s), 10000),
    reward: { gold: 20000, shards: 300, chaosStones: 10 },
  },
  {
    id: 'stage_30',
    title: '黑炉余烬',
    description: '推进至第 30 层。',
    trigger: 'polled',
    condition: (s) => s.progression.highestStage >= 30,
    progress: (s) => ratioOf(s.progression.highestStage, 30),
    reward: { gold: 1000, shards: 30 },
  },
  {
    id: 'stage_100',
    title: '百层试炼',
    description: '推进至第 100 层并解锁 Torment。',
    trigger: 'polled',
    condition: (s) => s.progression.highestStage >= 100,
    progress: (s) => ratioOf(s.progression.highestStage, 100),
    reward: { gold: 8000, shards: 200, chaosStones: 5 },
  },
  {
    id: 'stage_300',
    title: '深渊登顶',
    description: '推进至第 300 层。',
    trigger: 'polled',
    condition: (s) => s.progression.highestStage >= 300,
    progress: (s) => ratioOf(s.progression.highestStage, 300),
    reward: { gold: 30000, shards: 600, chaosStones: 20 },
  },
  {
    id: 'boss_10',
    title: '弑首者',
    description: '累计击杀 10 名 BOSS。',
    trigger: 'polled',
    condition: (s) => totalBossKills(s) >= 10,
    progress: (s) => ratioOf(totalBossKills(s), 10),
    reward: { gold: 2000, shards: 60, chaosStones: 2 },
  },
  {
    id: 'boss_50',
    title: '断头台',
    description: '累计击杀 50 名 BOSS。',
    trigger: 'polled',
    condition: (s) => totalBossKills(s) >= 50,
    progress: (s) => ratioOf(totalBossKills(s), 50),
    reward: { gold: 12000, shards: 250, chaosStones: 8 },
  },
  {
    id: 'legendary_1',
    title: '初见传说',
    description: '同时装备 1 件传说物品。',
    trigger: 'polled',
    condition: (s) => legendaryEquippedCount(s) >= 1,
    progress: (s) => ratioOf(legendaryEquippedCount(s), 1),
    reward: { gold: 800, shards: 30 },
  },
  {
    id: 'legendary_3',
    title: '传说三件套',
    description: '同时装备 3 件传说物品。',
    trigger: 'polled',
    condition: (s) => legendaryEquippedCount(s) >= 3,
    progress: (s) => ratioOf(legendaryEquippedCount(s), 3),
    reward: { gold: 5000, shards: 120, chaosStones: 3 },
  },
  {
    id: 'bestiary_10',
    title: '田野调查',
    description: '图鉴中遇见 10 种敌人。',
    trigger: 'polled',
    condition: (s) => bestiaryEncounteredCount(s) >= 10,
    progress: (s) => ratioOf(bestiaryEncounteredCount(s), 10),
    reward: { gold: 600, shards: 20 },
  },
  {
    id: 'bestiary_25',
    title: '档案管理员',
    description: '图鉴中遇见 25 种敌人。',
    trigger: 'polled',
    condition: (s) => bestiaryEncounteredCount(s) >= 25,
    progress: (s) => ratioOf(bestiaryEncounteredCount(s), 25),
    reward: { gold: 2500, shards: 80, chaosStones: 2 },
  },
  {
    id: 'torment_1',
    title: '直面苦痛',
    description: '解锁 Torment 1 难度。',
    trigger: 'polled',
    condition: (s) => s.progression.maxTormentUnlocked >= 1,
    progress: (s) => ratioOf(s.progression.maxTormentUnlocked, 1),
    reward: { gold: 4000, shards: 100, chaosStones: 3 },
  },
  {
    id: 'torment_5',
    title: '苦痛常客',
    description: '解锁 Torment 5 难度。',
    trigger: 'polled',
    condition: (s) => s.progression.maxTormentUnlocked >= 5,
    progress: (s) => ratioOf(s.progression.maxTormentUnlocked, 5),
    reward: { gold: 20000, shards: 400, chaosStones: 12 },
  },

  // === 事件钩子位（暂未触发，UI 显示为"未解锁/事件型"） ===
  {
    id: 'first_crit_100k',
    title: '雷霆一击',
    description: '单次暴击造成 100,000+ 伤害。',
    trigger: 'event',
    reward: { gold: 5000, shards: 100, chaosStones: 5 },
  },
  {
    id: 'flawless_boss',
    title: '无瑕处决',
    description: '在 Boss 战中保持满血并击杀 Boss。',
    trigger: 'event',
    reward: { gold: 8000, shards: 200, chaosStones: 8 },
  },
]

export const achievementsById: Record<string, AchievementDefinition> = (() => {
  const map: Record<string, AchievementDefinition> = {}
  for (const a of achievementsCatalog) map[a.id] = a
  return map
})()
