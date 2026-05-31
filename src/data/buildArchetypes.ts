/**
 * Build planner 流派目录。每个 archetype 列出关键 affix / legendary / rune 三类需求。
 * 完成度 = (已持有 affix + 已持有 legendary + 已持有 rune) / 总需求数。
 */

export interface BuildArchetypeRequirements {
  /** 关键 affix 词缀 ID（来自 affixesById）。 */
  affixIds: string[]
  /** 关键 legendary power ID（来自 legendaryPowersById），玩家须持有 legendary 装备且 powerId 命中。 */
  legendaryIds: string[]
  /** 关键 rune ID（来自 runesById），玩家须为对应技能选中。 */
  runeIds: string[]
}

export interface BuildArchetypeDefinition {
  id: string
  name: string
  tagline: string
  /** 流派调性色（CSS color），UI 卡片使用。 */
  accent: string
  /** emoji icon，UI 卡片头部显示。 */
  icon: string
  description: string
  /** 推荐英雄 classId（仅作 UI 提示，不强约束）。 */
  recommendedHeroIds: string[]
  requirements: BuildArchetypeRequirements
}

export const buildArchetypes: BuildArchetypeDefinition[] = [
  {
    id: 'bleed_stack',
    name: '流血叠层流',
    tagline: 'Bleed DOT / 上限突破',
    accent: '#d04b4b',
    icon: '🩸',
    description:
      '靠流血层数和持续时间堆叠 DOT 输出。上限突破装备让流血上限 +10、每层 +8%，配合撕裂势能 rune 滚雪球。',
    recommendedHeroIds: ['oathbreaker', 'grave_votary'],
    requirements: {
      affixIds: ['gouging', 'deep_wound'],
      legendaryIds: ['heart_strangler', 'butcher_seal'],
      runeIds: ['tearing_momentum', 'marrow_split'],
    },
  },
  {
    id: 'execute_burst',
    name: '处决爆发流',
    tagline: 'Execute Window / 链式秒杀',
    accent: '#f0743e',
    icon: '⚔️',
    description:
      '抓 50% 处决阈值，每次秒杀触发链式连锁。断头台让阈值降至 50% HP，配合链式处决 rune 一波清场。',
    recommendedHeroIds: ['oathbreaker', 'iron_gaoler'],
    requirements: {
      affixIds: ['headsman', 'cruel'],
      legendaryIds: ['oath_guillotine'],
      runeIds: ['chained_execution', 'executioner_brand'],
    },
  },
  {
    id: 'crit_storm',
    name: '暴击连击流',
    tagline: 'Crit Chance / Multiplier 双堆',
    accent: '#f3d98a',
    icon: '💥',
    description:
      '暴击率 + 暴击伤害 + 攻速三堆，靠节奏 rune 每 4 次命中强制暴击+处决，触发屠夫凶印连环爆发。',
    recommendedHeroIds: ['ash_hunter', 'oathbreaker'],
    requirements: {
      affixIds: ['lethal', 'vicious', 'quick'],
      legendaryIds: ['butcher_seal'],
      runeIds: ['executioner_rhythm'],
    },
  },
  {
    id: 'iron_oath_tank',
    name: '反甲坦克流',
    tagline: 'Armor / Retribution Reflect',
    accent: '#8aa6c8',
    icon: '🛡️',
    description:
      '高护甲 + 高生命，配合 Iron Oath 三件套 rune：护盾增甲、誓约反伤、殉道反弹，让敌人自残。',
    recommendedHeroIds: ['oathbreaker', 'iron_gaoler'],
    requirements: {
      affixIds: ['plated', 'vital', 'nimble'],
      legendaryIds: [],
      runeIds: ['oathbound_shield', 'vow_of_retribution', 'martyr_oath'],
    },
  },
  {
    id: 'treasure_hunter',
    name: '拾荒探险流',
    tagline: 'Magic Find / Gold Find',
    accent: '#c8b87a',
    icon: '💰',
    description:
      '堆 magic find + gold find + Torment 难度加成，最大化掉率。以"刷子"为目标，不追求极限输出。',
    recommendedHeroIds: ['ash_hunter', 'grave_votary'],
    requirements: {
      affixIds: ['seeker', 'avarice'],
      legendaryIds: [],
      runeIds: [],
    },
  },
]

export const buildArchetypesById: Record<string, BuildArchetypeDefinition> = (() => {
  const map: Record<string, BuildArchetypeDefinition> = {}
  for (const a of buildArchetypes) map[a.id] = a
  return map
})()
