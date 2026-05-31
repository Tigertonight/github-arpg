import type { RuneDefinition, SkillDefinition } from '../domain/types'

export const skills: SkillDefinition[] = [
  {
    id: 'cleave',
    name: '基础斩击',
    description: '自动挥砍，稳定叠加流血。',
    baseCooldownMs: 1050,
    damageScale: 1,
    bleedStacks: 1,
    aoeTargets: 2,
    tags: ['physical', 'bleed'],
    automation: '冷却结束自动释放',
    color: '#e05a3a',
  },
  {
    id: 'lacerating_sweep',
    name: '裂伤横扫',
    description: '横扫矿道，对所有近身敌人造成重击并额外撕裂伤口。',
    baseCooldownMs: 3800,
    damageScale: 1.65,
    bleedStacks: 2,
    aoeTargets: Infinity,
    tags: ['physical', 'bleed', 'area'],
    automation: '敌人存活且冷却结束自动释放',
    color: '#d4a017',
  },
  {
    id: 'execute',
    name: '处决',
    description: '敌人低生命或高流血层数时造成高额斩杀伤害。',
    baseCooldownMs: 6400,
    damageScale: 2.1,
    bleedStacks: 0,
    aoeTargets: 1,
    tags: ['physical', 'execute'],
    automation: '低血或高流血敌人释放',
    color: '#c0392b',
  },
  {
    id: 'iron_oath',
    name: '铁誓护盾',
    description: '周期性稳住生命线，代表破誓骑士的防御窗口。',
    baseCooldownMs: 9000,
    damageScale: 0,
    bleedStacks: 0,
    aoeTargets: 0,
    tags: ['defense'],
    automation: '生命低于 75% 或冷却结束自动释放',
    color: '#2980b9',
  },
]

export const runes: RuneDefinition[] = [
  // === Cleave slot 5 — 节奏型 ===
  { id: 'tempest_blade', name: '旋风斩', skillId: 'cleave', slot: 5, description: '改为 0.5s 旋转，每 100ms 命中所有目标 25%，总伤害约 1.5×，冷却 ×2。', tags: ['rhythm', 'area'] },
  { id: 'lunge_strike', name: '跃斩', skillId: 'cleave', slot: 5, description: '前冲 30 单位，AOE 半径 +50%，但单次伤害 -50%。', tags: ['rhythm', 'area'] },
  { id: 'momentum_charge', name: '蓄势斩', skillId: 'cleave', slot: 5, description: '冷却 ×0.5；命中累计势能（最多 5 层），下次命中按 +30%/层结算后清空。', tags: ['rhythm'] },
  // === Cleave slot 10 — 资源型 ===
  { id: 'crimson_harvest', name: '血色收割', skillId: 'cleave', slot: 10, description: '每点目标缺失生命百分比 +0.5% 伤害；目标 >50% 时反 -30%。', tags: ['resource'] },
  { id: 'chain_reaver', name: '连锁裂创', skillId: 'cleave', slot: 10, description: '0.3s 后弹射至额外目标；首次命中 -30% 伤害。', tags: ['resource', 'area'] },
  { id: 'oath_brand', name: '誓痕烙印', skillId: 'cleave', slot: 10, description: '每次命中叠烙印（最多 3 层）；处决击杀按 +50%/层奖励技能 XP 与伤害。', tags: ['resource', 'execute'] },
  // === Cleave slot 15 — 颠覆型 ===
  { id: 'bleed_detonator', name: '流血引爆', skillId: 'cleave', slot: 15, description: '命中时消耗目标全部流血层，每层引爆 80% 武器伤害。', tags: ['paradigm', 'bleed'] },
  { id: 'executioner_rhythm', name: '处决韵律', skillId: 'cleave', slot: 15, description: '每第 4 次 cleave 命中强制暴击并触发处决判定。', tags: ['paradigm', 'execute'] },
  { id: 'ironbound_vow', name: '铁誓共鸣', skillId: 'cleave', slot: 15, description: '每次 cleave 命中减少铁誓护盾 200ms 冷却，但 cleave 基础伤害 -25%。', tags: ['paradigm', 'defense'] },
  // === Lacerating sweep slot 5 — 节奏型 ===
  { id: 'whirling_grasp', name: '旋舞缠绕', skillId: 'lacerating_sweep', slot: 5, description: 'cd ×0.7，但每次仅扫前 3 个目标。', tags: ['rhythm', 'area'] },
  { id: 'overhead_cleaver', name: '顶劈刀', skillId: 'lacerating_sweep', slot: 5, description: 'cd ×1.3，伤害 +50%；首要目标额外 +30%。', tags: ['rhythm'] },
  { id: 'bleeding_arc', name: '血弧', skillId: 'lacerating_sweep', slot: 5, description: '命中目标若有流血则伤害 +25%/层（最多 +75%）。', tags: ['rhythm', 'bleed'] },
  // === Lacerating sweep slot 10 — 资源型 ===
  { id: 'gore_harvest', name: '血肉收割', skillId: 'lacerating_sweep', slot: 10, description: '命中时按全场总流血层数 ×8 回血给英雄。', tags: ['resource', 'bleed'] },
  { id: 'tearing_momentum', name: '撕裂势能', skillId: 'lacerating_sweep', slot: 10, description: '每命中流血目标 +1 层势能（最多 5），下次 sweep 伤害 +20%/层后清空。', tags: ['resource'] },
  { id: 'fractured_vow', name: '碎誓共振', skillId: 'lacerating_sweep', slot: 10, description: '命中带烙印的敌人时，每层烙印引爆 60% 武器伤害。', tags: ['resource', 'execute'] },
  // === Lacerating sweep slot 15 — 颠覆型 ===
  { id: 'bleed_storm', name: '血风暴', skillId: 'lacerating_sweep', slot: 15, description: 'sweep 改为分 4 次结算（每次 45% 伤害），总 1.8×；cd ×1.5。', tags: ['paradigm', 'area'] },
  { id: 'cull_the_wounded', name: '屠戮残躯', skillId: 'lacerating_sweep', slot: 15, description: '对生命 < 50% 的目标 sweep 享受处决倍率。', tags: ['paradigm', 'execute'] },
  { id: 'marrow_split', name: '髓骨裂', skillId: 'lacerating_sweep', slot: 15, description: '击杀触发一次小型 sweep（+60% 伤害），每 tick 仅触发一次。', tags: ['paradigm', 'area'] },

  // === Execute slot 5 — 节奏型 ===
  { id: 'quick_judgment', name: '速断', skillId: 'execute', slot: 5, description: 'cd ×0.6，伤害 ×0.7。', tags: ['rhythm'] },
  { id: 'weighty_verdict', name: '重审判', skillId: 'execute', slot: 5, description: 'cd ×1.5，伤害 ×1.5，强制暴击。', tags: ['rhythm'] },
  { id: 'chained_execution', name: '连环处决', skillId: 'execute', slot: 5, description: '处决击杀后立即重置 cd（每场战斗仅一次）。', tags: ['rhythm', 'execute'] },
  // === Execute slot 10 — 资源型 ===
  { id: 'bleed_reckoning', name: '血债清算', skillId: 'execute', slot: 10, description: '处决时按目标流血层数 +30%/层（最多 +150%）。', tags: ['resource', 'bleed'] },
  { id: 'oath_collector', name: '誓约收割', skillId: 'execute', slot: 10, description: '处决击杀给所有技能减 800ms cd。', tags: ['resource'] },
  { id: 'executioner_brand', name: '处决烙印', skillId: 'execute', slot: 10, description: '处决命中未杀的目标，下次任意技能命中必暴击。', tags: ['resource', 'execute'] },
  // === Execute slot 15 — 颠覆型 ===
  { id: 'lower_the_threshold', name: '降阈', skillId: 'execute', slot: 15, description: '处决阈值 35% → 55%；阈值外伤害 -40%。', tags: ['paradigm', 'execute'] },
  { id: 'mass_judgment', name: '群体审判', skillId: 'execute', slot: 15, description: '处决同时打主目标 + 流血最高的另外 2 个目标。', tags: ['paradigm', 'execute', 'area'] },
  { id: 'final_oath', name: '终末之誓', skillId: 'execute', slot: 15, description: '处决击杀 elite/boss 时回满英雄生命；cd ×2。', tags: ['paradigm', 'execute'] },

  // === Iron oath slot 5 — 节奏型 ===
  { id: 'vigilant_oath', name: '警觉誓言', skillId: 'iron_oath', slot: 5, description: 'cd ×0.7，回血量 ×0.7。', tags: ['rhythm', 'defense'] },
  { id: 'enduring_oath', name: '坚守誓言', skillId: 'iron_oath', slot: 5, description: 'cd ×1.3，回血量 ×1.5。', tags: ['rhythm', 'defense'] },
  { id: 'reactive_oath', name: '应激誓言', skillId: 'iron_oath', slot: 5, description: '英雄受到 ≥25% 上限血量伤害时立即触发（覆盖 cd）。', tags: ['rhythm', 'defense'] },
  // === Iron oath slot 10 — 资源型 ===
  { id: 'oathbound_shield', name: '誓约护甲', skillId: 'iron_oath', slot: 10, description: '触发后 4 秒内 armor +50%。', tags: ['resource', 'defense'] },
  { id: 'purging_vow', name: '涤罪誓言', skillId: 'iron_oath', slot: 10, description: '触发时清除全场敌人烙印；每清一层补 5% 上限血。', tags: ['resource', 'defense'] },
  { id: 'vow_of_retribution', name: '报复誓言', skillId: 'iron_oath', slot: 10, description: '触发后 4 秒内反弹 30% 受到的伤害给所有反击的怪。', tags: ['resource', 'defense'] },
  // === Iron oath slot 15 — 颠覆型 ===
  { id: 'eternal_vow', name: '永恒誓言', skillId: 'iron_oath', slot: 15, description: '触发时回血 ×2（24% 上限），cd ×2。', tags: ['paradigm', 'defense'] },
  { id: 'chain_oath', name: '链誓', skillId: 'iron_oath', slot: 15, description: '每次 cleave/sweep/execute 命中减 iron_oath 100ms cd。', tags: ['paradigm', 'defense'] },
  { id: 'martyr_oath', name: '殉道誓言', skillId: 'iron_oath', slot: 15, description: '触发后 6 秒内每受到 1 点伤害也对最近怪反弹 1 点真实伤害。', tags: ['paradigm', 'defense'] },

  // === 其它技能旧 rune（保留兼容） ===
  { id: 'deep_cut', name: '深创', skillId: 'cleave', description: '基础斩击额外 +1 流血层。（旧版兼容，已被 slot 系统替代）', tags: ['bleed'] },
  { id: 'echo_sweep', name: '回响', skillId: 'lacerating_sweep', description: '裂伤横扫造成一次 45% 的回响伤害。（旧版兼容）', tags: ['area'] },
  { id: 'blood_debt', name: '血债', skillId: 'execute', description: '每层流血提高处决伤害。（旧版兼容，已被 bleed_reckoning 替代）', tags: ['execute', 'bleed'] },
  { id: 'guardian_oath', name: '守护', skillId: 'iron_oath', description: '护盾同时恢复少量生命。（旧版兼容）', tags: ['defense'] },
]

export const skillsById = Object.fromEntries(skills.map((skill) => [skill.id, skill]))
export const runesById = Object.fromEntries(runes.map((rune) => [rune.id, rune]))
