import type { RuneDefinition, SkillDefinition } from '../domain/types'

export const skills: SkillDefinition[] = [
  {
    id: 'cleave',
    name: '基础斩击',
    description: '自动挥砍，稳定叠加流血。',
    baseCooldownMs: 1050,
    damageScale: 1,
    bleedStacks: 1,
    tags: ['physical', 'bleed'],
    automation: '冷却结束自动释放',
  },
  {
    id: 'lacerating_sweep',
    name: '裂伤横扫',
    description: '横扫矿道，对敌人造成重击并额外撕裂伤口。',
    baseCooldownMs: 3800,
    damageScale: 1.65,
    bleedStacks: 2,
    tags: ['physical', 'bleed', 'area'],
    automation: '敌人存活且冷却结束自动释放',
  },
  {
    id: 'execute',
    name: '处决',
    description: '敌人低生命或高流血层数时造成高额斩杀伤害。',
    baseCooldownMs: 6400,
    damageScale: 2.1,
    bleedStacks: 0,
    tags: ['physical', 'execute'],
    automation: '敌人低于 35% 生命或流血 5 层以上释放',
  },
  {
    id: 'iron_oath',
    name: '铁誓护盾',
    description: '周期性稳住生命线，代表破誓骑士的防御窗口。',
    baseCooldownMs: 9000,
    damageScale: 0,
    bleedStacks: 0,
    tags: ['defense'],
    automation: '生命低于 75% 或冷却结束自动释放',
  },
]

export const runes: RuneDefinition[] = [
  { id: 'deep_cut', name: '深创', skillId: 'cleave', description: '基础斩击额外 +1 流血层。', tags: ['bleed'] },
  { id: 'echo_sweep', name: '回响', skillId: 'lacerating_sweep', description: '裂伤横扫造成一次 45% 的回响伤害。', tags: ['area'] },
  { id: 'blood_debt', name: '血债', skillId: 'execute', description: '每层流血提高处决伤害。', tags: ['execute', 'bleed'] },
  { id: 'guardian_oath', name: '守护', skillId: 'iron_oath', description: '护盾同时恢复少量生命。', tags: ['defense'] },
]

export const skillsById = Object.fromEntries(skills.map((skill) => [skill.id, skill]))
export const runesById = Object.fromEntries(runes.map((rune) => [rune.id, rune]))
