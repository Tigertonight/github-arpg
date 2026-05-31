# 单怪 Prompt 库

每个 `.md` 对应一只怪，给生图工具补图用。文件结构：

```
enemy-prompts/
├── README.md              # 本文件
├── _shared-rules.md       # 公共风格 / 单帧约束 / negative prompt
└── <slug>.md              # 单怪 prompt（4 个动作）
```

## 怎么用（v2 流程）

1. 把 `_shared-rules.md` 的「公共 prefix」+「Negative prompt」贴进 imagegen 作为前缀。
2. 然后贴目标怪的 `<slug>.md`：Subject + 当前要生成的那一动作的 4 帧描述。**一次只生 1 张 sheet**（idle/walk/attack/death 各跑一次），不要让模型一次生 4 张以避免风格漂移、4 张挤 1 张。
3. 4 张原图（任意尺寸）落地到任一临时目录，逐张走归一化导入：
   ```bash
   node scripts/import-v2-enemy-action-sheet.mjs <slug> idle   <path>
   node scripts/import-v2-enemy-action-sheet.mjs <slug> walk   <path>
   node scripts/import-v2-enemy-action-sheet.mjs <slug> attack <path>
   node scripts/import-v2-enemy-action-sheet.mjs <slug> death  <path>
   ```
4. 跑完整 v2 校验链：
   ```bash
   node scripts/audit-source-frames.mjs --slug=<slug>
   node scripts/build-enemy-runtime.mjs --only=<slug>
   node scripts/validate-enemy-sheets.mjs --report
   open public/assets/game/enemies/runtime/<slug>/{idle,walk,attack,death}-sheet.png  # montage 抽检
   ```
5. 全部通过 + 视觉抽检 OK，再进游戏 A/B。

旧的 v1 流程（"贴回 group-XX-chroma.png 行"）已废弃，相关 atlas 行号对照保留下方仅作历史索引。

## slug → atlas 行号对照（v1 历史，v2 不再消费）

| slug | atlas | row | family | rank |
|------|-------|-----|--------|------|
| bone-miner | group-01 | 0 | undead | normal |
| rust-hound | group-01 | 1 | beast | normal |
| coal-cultist | group-01 | 2 | cultist | normal |
| black-forge-guard | group-01 | 3 | construct | elite |
| vein-butcher | group-01 | 4 | demon | boss |
| furnace-brute | group-01 | 5 | construct | normal |
| ember-imp | group-01 | 6 | demon | normal |
| slag-warden | group-01 | 7 | construct | elite |
| pale-chorister | group-02 | 0 | cultist | normal |
| crow-acolyte | group-02 | 1 | cultist | normal |
| glasswraith | group-02 | 2 | undead | elite |
| silenced-cantor | group-02 | 3 | cultist | boss |
| bone-legion | group-02 | 4 | undead | normal |
| marrow-drake | group-02 | 5 | undead | elite |
| gravewright | group-02 | 6 | construct | normal |
| cardinal-husk | group-02 | 7 | undead | boss |
| frost-stalker | group-03 | 0 | beast | normal |
| pale-pilgrim | group-03 | 1 | undead | normal |
| winter-throat | group-03 | 2 | beast | boss |
| iron-caravaneer | group-03 | 3 | construct | elite |
| frostforge-warden | group-03 | 4 | construct | boss |
| crimson-hound | group-03 | 5 | demon | normal |
| vow-handmaiden | group-03 | 6 | demon | normal |
| gargoyle-warden | group-03 | 7 | construct | elite |
| lady-of-red-vow | group-04 | 0 | demon | boss |
| tomb-revenant | group-04 | 1 | undead | normal |
| mirror-widow | group-04 | 2 | demon | elite |
| lord-of-kept-oaths | group-04 | 3 | demon | boss |
| oath-brander | group-04 | 4 | demon | normal |
| chained-titan | group-04 | 5 | construct | elite |
| wyrm-of-broken-word | group-04 | 6 | demon | boss |
| forge-serpent | group-04 | 7 | primordial | elite |
| the-first-oathbreaker | single | — | primordial | boss |
| forgeheart-ember | group-05 | 2 | construct | boss |

## 当前坏点优先级

v2 全量重生计划下，所有 slug 都需重做，不再单独维护 v1 时代的"修哪几个先"列表。投产顺序由批量执行方决定。
