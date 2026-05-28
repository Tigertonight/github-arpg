# 黑炉编年史 · 世界设计与美术清单

> 用途：为后续生图（GPT-image / Midjourney / SD）和数据落地提供单一真源。
> 所有 prompt 样例继承 `docs/art-direction.md` 的视觉锚点：低饱和、铁锈血红、烬橙暗金、Diablo 风 2.5D 横版。
> 每个生图条目都给：ID、名称、用途、构图与关键词、推荐尺寸、prompt 样例。

---

## 0. 全局视觉锚点（生图共用）

| 维度 | 设定 |
| --- | --- |
| 风格 | Realistic illustrated dark fantasy 2.5D side-scrolling ARPG |
| 调色板 | 低饱和；铁锈红 #6e2a22、煤黑 #1a1410、烬橙 #d96b2c、暗金 #b88a3a、骨白 #d8cfb8、毒绿 #5a7333、灵魂蓝 #3b6f8a |
| 光影 | 低位光源，环境镜头压暗，主体边缘高光 + 暗金体积光 |
| 视角 | 侧 3/4 视角，略带俯视；脚部清晰，地面线明确 |
| 透明 sprite | 纯 #00ff00 chroma key 底，每边 10% padding，禁止接触阴影/UI/文字 |
| 背景图 | 16:9 横版，下半部留出战斗 lane（不要堆杂物），中景留空给角色 |

后续所有 sprite prompt 复用 `docs/art-direction.md § Shared Transparent Sprite Prompt Pattern`，每帧 walk-sheet 复用 `§ Shared Walk Sheet Prompt Pattern`。本文档只列每个资产的 [subject] 替换文本和构图要点。

---

## 1. 章节与区域结构（Acts × Zones × Stages）

### 1.1 章节总表

| ChapterID | 名称 | 主题 | 包含区域 | Boss | 解锁条件 |
| --- | --- | --- | --- | --- | --- |
| `chapter_act_1` | 黑炉裂痕 | 工业地狱 / 锈血 | `black_forge_mines`, `bleeding_furnace` | `vein_butcher` | 默认开放 |
| `chapter_act_2` | 沉骨教廷 | 邪教废墟 / 骸骨 | `silent_choir`, `ossuary_keep` | `cardinal_husk` | 通关 Act1 Boss |
| `chapter_act_3` | 苍铸荒原 | 雪原 / 冰铁 | `pale_wastes`, `iron_caravan` | `frostforge_warden` | 通关 Act2 Boss |
| `chapter_act_4` | 残月王座 | 邪堡 / 月血 | `crimson_keep`, `moonblood_crypt` | `lord_of_kept_oaths` | 通关 Act3 Boss |
| `chapter_act_5` | 燔誓之渊 | 末世深渊 / 火血混沌 | `oath_abyss`, `forgemaw_core` | `the_first_oathbreaker` | 通关 Act4 Boss |

> 每章有两个 zone，每个 zone 5 个 stage（即 1 章 = 10 stage）。每个 zone 第 5 stage 必出 zone Boss，第 10 stage（即 act 第二个 zone 末尾）出 Act Boss。

### 1.2 区域明细（共 10 区域）

每条带：背景图 ID、生图 prompt 关键词、Boss、可遇敌人。

| ZoneID | 名称 | 背景图资源 | 关键词构图 | 可遇敌人 family | Zone Boss |
| --- | --- | --- | --- | --- | --- |
| `black_forge_mines` | 黑炉矿道 | `bg-black-forge-mines.webp` | abandoned mine tunnel, rusted rail tracks, basalt walls, distant forge glow, coal dust | undead, demon, cultist, construct | `vein_butcher` |
| `bleeding_furnace` | 血泣熔炉 | `bg-bleeding-furnace.webp` | colossal cracked furnace, molten bloodlike iron streams, broken chains, ember rain, gothic catwalks | demon, construct | `forgeheart_ember` |
| `silent_choir` | 缄默圣咏 | `bg-silent-choir.webp` | derelict cathedral nave, shattered stained glass, crow feathers, candle wax, fallen pews | cultist, undead | `silenced_cantor` |
| `ossuary_keep` | 骸塔王城 | `bg-ossuary-keep.webp` | bone-built citadel, skull battlements, banner shreds, fog, raven flocks, dim moon | undead, cultist | `cardinal_husk` |
| `pale_wastes` | 苍白荒原 | `bg-pale-wastes.webp` | endless snow plain, half-buried iron caravan, broken obelisks, gray sky, distant blizzard | beast, undead, construct | `winter_throat` |
| `iron_caravan` | 铁辙商队遗骸 | `bg-iron-caravan.webp` | overturned armored carriages on icebound road, frozen banners, dead horses in mail, watchtower | construct, demon | `frostforge_warden` |
| `crimson_keep` | 赤月城堡 | `bg-crimson-keep.webp` | gothic vampire keep at red moonrise, blood-soaked stone bridge, gargoyles, banners, crimson clouds | demon, undead | `lady_of_red_vow` |
| `moonblood_crypt` | 月血墓园 | `bg-moonblood-crypt.webp` | flooded crypt with mirrored blood pools reflecting red moon, sarcophagi, willow trees, mist | undead, demon | `lord_of_kept_oaths` |
| `oath_abyss` | 燔誓深渊 | `bg-oath-abyss.webp` | bottomless rift of broken oath stones, floating molten chains, hellish updraft, ash columns | demon, construct | `wyrm_of_broken_word` |
| `forgemaw_core` | 炉颚之核 | `bg-forgemaw-core.webp` | infernal forge heart inside the abyss, throne of molten iron, suspended hammers of giants, fire rain | demon, construct, primordial | `the_first_oathbreaker` |

### 1.3 背景图生图 prompt 模板

复用 `art-direction.md § Background Prompt`。每张替换主语句即可：

```text
Create a dark fantasy 2.5D side-scrolling dungeon stage background called <Zone Name>.
<构图关键词，从上表 "关键词构图" 列复制>.
Wide horizontal game background, readable combat lane across the bottom half,
darker empty mid-lane where characters can stand,
strong depth with foreground ground plane and distant <terrain>.
Mood: gothic Diablo-like, low saturation, iron rust, blood red and dark gold accents.
No UI, no characters, no monsters, no text, no watermark.
```

推荐尺寸：1920 × 1080（运行时按 `cover` 适配 vw）。

---

## 2. 敌人系统（共 24 种 + 10 区域 Boss + 5 Act Boss）

### 2.1 敌人家族（family）扩充

| family | 主题 | 攻击风格 | 视觉锚点 |
| --- | --- | --- | --- |
| `undead` | 亡者 / 骸骨 | 近战群攻 | 骨甲、矿镐、空洞眼眶、内嵌烛火 |
| `demon` | 恶魔 | 中距离突进 | 烬色皮肤、断角、武器与肉融合 |
| `cultist` | 教徒 | 远程吟唱、自爆 | 黑袍、面纱、刺绳书、烛蜡 |
| `construct` | 构装 | 高甲低速重击 | 黑铁机甲、蒸汽、镶血宝石 |
| `beast` | 兽类 | 多腿冲撞 | 毛皮带霜、尖钉项圈、双关节后腿 |
| `primordial` | 原初存在 | 终局 Boss 用 | 巨大、半融化、混沌肢体（仅 Act5） |

### 2.2 普通 / 精英敌人明细（24 项）

格式：ID / 名称 / family / rank / 出现 zone / 视觉关键词 / 推荐 sprite 资源 / walk-sheet 复用。

| ID | 名称 | family | rank | 主要 zone | 视觉关键词 | sprite 资源 | walk-sheet |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bone_miner` | 碎骨矿奴 | undead | normal | black_forge_mines | 锈链、矿镐、骨头从矿工服破口戳出 | `enemy-bone-miner.png` ✓ | humanoid |
| `rust_hound` | 锈刃猎犬 | beast | normal | black_forge_mines, pale_wastes | 钢板嫁接的瘦犬，颈圈血锈 | `enemy-rust-hound.png` ✓ | beast |
| `coal_cultist` | 煤烬教徒 | cultist | normal | black_forge_mines | 黑袍 + 包煤面纱，手持烬蜡 | `enemy-coal-cultist.png` ✓ | humanoid |
| `black_forge_guard` | 黑炉守卫 | construct | elite | black_forge_mines | 黑铁全甲，肩部蒸汽阀，眼槽红光 | `enemy-black-forge-guard.png` ✓ | brute |
| `furnace_brute` | 熔炉重锤手 | construct | normal | bleeding_furnace | 单臂熔铁锤，肩甲嵌烬石 | `enemy-furnace-brute.png` | brute |
| `ember_imp` | 烬翼小鬼 | demon | normal | bleeding_furnace | 体型小，肩生烬翼，长舌 | `enemy-ember-imp.png` | beast |
| `slag_warden` | 矿渣狱卒 | construct | elite | bleeding_furnace | 骨架镀熔渣，提铁牢笼 | `enemy-slag-warden.png` | brute |
| `pale_chorister` | 缄默唱诗者 | cultist | normal | silent_choir | 白布蒙眼，绣银十字，嘴被缝合 | `enemy-pale-chorister.png` | humanoid |
| `crow_acolyte` | 鸦使祭僧 | cultist | normal | silent_choir | 鸦头法杖，黑羽斗篷 | `enemy-crow-acolyte.png` | humanoid |
| `glasswraith` | 残窗游魂 | undead | elite | silent_choir | 半透明，碎玻璃碴绕身 | `enemy-glasswraith.png` | humanoid |
| `bone_legion` | 骸塔士兵 | undead | normal | ossuary_keep | 全骨甲，断旗，长矛 | `enemy-bone-legion.png` | humanoid |
| `marrow_drake` | 髓骨小龙 | undead | elite | ossuary_keep | 骨翼飞蜥，腭骨外露 | `enemy-marrow-drake.png` | beast |
| `gravewright` | 掘墓巨工 | construct | normal | ossuary_keep | 抬棺巨人，铁铲为武器 | `enemy-gravewright.png` | brute |
| `frost_stalker` | 霜踪兽 | beast | normal | pale_wastes | 六足雪豹，冰刃尾 | `enemy-frost-stalker.png` | beast |
| `pale_pilgrim` | 苍白朝圣者 | undead | normal | pale_wastes | 冻僵灰袍，怀抱铁经 | `enemy-pale-pilgrim.png` | humanoid |
| `iron_caravaneer` | 沉铁车夫 | construct | elite | iron_caravan | 半埋雪中的护卫机甲 | `enemy-iron-caravaneer.png` | brute |
| `crimson_hound` | 赤血恶犬 | demon | normal | crimson_keep | 红毛双头猎犬，爪带血结晶 | `enemy-crimson-hound.png` | beast |
| `vow_handmaiden` | 誓约女仆 | demon | normal | crimson_keep | 哥特礼裙、银匙、嘴角血纹 | `enemy-vow-handmaiden.png` | humanoid |
| `gargoyle_warden` | 落瓦石翼 | construct | elite | crimson_keep | 巨型石像鬼，月光下苏醒 | `enemy-gargoyle-warden.png` | brute |
| `tomb_revenant` | 墓血亡灵 | undead | normal | moonblood_crypt | 半浸血池中的剑士亡灵 | `enemy-tomb-revenant.png` | humanoid |
| `mirror_widow` | 镜池寡妇 | demon | elite | moonblood_crypt | 长发覆面，倒影里另一个自己 | `enemy-mirror-widow.png` | humanoid |
| `oath_brander` | 誓痕烙印者 | demon | normal | oath_abyss | 全身布满流动符文 | `enemy-oath-brander.png` | humanoid |
| `chained_titan` | 锁誓提坦 | construct | elite | oath_abyss | 双手被熔铁锁链拖住的巨人 | `enemy-chained-titan.png` | brute |
| `forge_serpent` | 炉脉巨蛇 | primordial | elite | forgemaw_core | 由熔铁与骨节构成的巨蛇 | `enemy-forge-serpent.png` | beast |

### 2.3 区域 Boss（共 10 位）

| ID | 名称 | 所属 zone | 战斗机制亮点 | 视觉关键词 | sprite 资源 |
| --- | --- | --- | --- | --- | --- |
| `vein_butcher` | 血脉屠夫 | black_forge_mines | 流血叠层 / 召唤矿奴 | 双手血斧，胸口外露血脉 | `boss-vein-butcher.png` ✓ |
| `forgeheart_ember` | 炉心烬王 | bleeding_furnace | 周期性熔铁地形伤害 | 巨型熔铁傀儡，胸腔发光熔池 | `boss-forgeheart-ember.png` |
| `silenced_cantor` | 缄默主咏 | silent_choir | 沉默 + 玻璃碎片AOE | 长袍合唱者，喉部缝合发光 | `boss-silenced-cantor.png` |
| `cardinal_husk` | 骸塔红衣主教 | ossuary_keep | 召唤骸骨军团 | 红袍骷髅主教，金权杖 | `boss-cardinal-husk.png` |
| `winter_throat` | 寒喉巨兽 | pale_wastes | 范围冻结 / 大跳冲撞 | 冰甲六足野兽，胸腹空洞冒寒气 | `boss-winter-throat.png` |
| `frostforge_warden` | 苍铸狱长 | iron_caravan | 高甲狂暴 | 雪铁全甲将军，背负熔炉 | `boss-frostforge-warden.png` |
| `lady_of_red_vow` | 赤誓夫人 | crimson_keep | 召唤恶犬 / 血咒 | 哥特女吸血鬼，提血鞭 | `boss-lady-red-vow.png` |
| `lord_of_kept_oaths` | 守誓领主 | moonblood_crypt | 镜池分身 | 月相骑士，双剑 | `boss-lord-kept-oaths.png` |
| `wyrm_of_broken_word` | 断言之蠕 | oath_abyss | 阶段切换 / 地形撕裂 | 巨蛇形深渊存在，鳞为破誓铭文 | `boss-wyrm-broken-word.png` |
| `the_first_oathbreaker` | 初代破誓 | forgemaw_core | 玩家堕落版镜像 | 与英雄同型，但黑铁化、独眼血光 | `boss-first-oathbreaker.png` |

### 2.4 普通 / 精英敌人 sprite prompt 样例

复用 `art-direction.md § Shared Transparent Sprite Prompt Pattern`，替换 `[subject]`：

```text
[subject] = "Marrow Drake — bone-winged drake undead, exposed mandible, ribcage spine,
half-rotted leather wings, perched in attack pose facing left,
height roughly 1.4× human, low-saturation iron rust palette with bone white highlights"
```

```text
[subject] = "Mirror Widow — gothic ghost noblewoman in tattered black mourning gown,
long hair covering face, holds a silver-handled mirror in left hand,
faintly luminous reflection visible inside mirror, facing left, full body"
```

### 2.5 Boss sprite prompt 要点

Boss 比普通敌人大 1.5–2 倍画幅，强调**剪影辨识**与**关键武器**。

```text
[subject] = "The First Oathbreaker — fallen knight final boss, identical silhouette to the player Oathbreaker
but corrupted: black-iron plate armor blackened to obsidian, single glowing crimson eye in helm,
oath-mark brands seared across breastplate, two-handed bleeding axe with chain hilt,
heroic dark fantasy boss pose, full body, facing left, slight low-angle camera"
```

### 2.6 walk-sheet 复用矩阵

| 体型类别 | 复用 walk-sheet | 适用敌人 |
| --- | --- | --- |
| humanoid | `enemy-humanoid-walk-sheet.png`（重出版） | 所有 cultist / 大部分 undead / vow_handmaiden 等 |
| beast | `enemy-beast-walk-sheet.png` | rust_hound, frost_stalker, crimson_hound, ember_imp, forge_serpent |
| brute | `enemy-brute-walk-sheet.png` | guard / warden / gravewright / titan / Boss |
| boss-unique | 每位 Boss 单独出 4 帧 | 10 Zone Boss + 5 Act Boss（建议先跑 Boss 静态图，walk-sheet 第二批） |

> 重要：所有 walk-sheet 必须遵循 `art-direction.md` 模板的 "每帧独立、武器不超出帧边界" 约束（修复 task #22）。

---

## 3. 职业系统（3 职业 × 6 技能）

### 3.1 职业总表

| ClassID | 名称 | 核心 build | 资源 | 关键词 |
| --- | --- | --- | --- | --- |
| `oathbreaker` | 破誓骑士 | 流血 / 处决 / 重甲近战 | 怒气（rage） | 双手斧、铁誓护盾、血雾 |
| `ember_witch` | 烬纹巫女 | 火焰 DoT / 远程 AoE | 烬蕴（embers） | 烧焦法杖、布袍、骨骸面纱 |
| `gravewarden` | 守墓人 | 召唤骸骨 / 暗影持续伤害 | 灵魂（souls） | 长柄铲、灯笼、半骷髅头盔 |

### 3.2 破誓骑士（已实装基础，扩展 6 技能）

| SkillID | 名称 | 类型 | 自动条件 | AOE | tags |
| --- | --- | --- | --- | --- | --- |
| `cleave` ✓ | 基础斩击 | 主攻 | 冷却结束 | 2 | physical, bleed |
| `lacerating_sweep` ✓ | 裂伤横扫 | AOE | 有敌且冷却结束 | ∞ | physical, bleed, area |
| `execute` ✓ | 处决 | 单体爆发 | 敌低血/高叠层 | 1 | physical, execute |
| `iron_oath` ✓ | 铁誓护盾 | 防御 | 自身低血 | 0 | defense |
| `bloodvow` | 血誓爆发 | 自伤强化 | 主动 / 怒气满 | 0 | rage, bleed |
| `oath_charge` | 誓约冲锋 | 位移突进 | 敌远 / 战斗开局 | 3 | physical, charge |

### 3.3 烬纹巫女（新职业 6 技能）

| SkillID | 名称 | 类型 | 自动条件 | AOE | tags |
| --- | --- | --- | --- | --- | --- |
| `ember_bolt` | 烬芒投射 | 主攻 | 冷却结束 | 1 | fire, projectile |
| `cinder_rain` | 落烬骤雨 | AOE 持续 | 敌人 ≥ 3 | ∞ | fire, area, dot |
| `pyre_seal` | 焚誓封印 | 标记 + 引爆 | 主目标存活 | 1 → 链式 | fire, dot |
| `ash_ward` | 灰烬护身 | 防御反伤 | 自身低血 | 0 | fire, defense |
| `kiln_step` | 炉跃步 | 位移 + 短 AOE | 距离过近 | 4 | fire, mobility |
| `effigy_of_smoke` | 灰焰幻影 | 召唤分身吸引仇恨 | 敌人 ≥ 4 | 0 | summon, fire |

### 3.4 守墓人（新职业 6 技能）

| SkillID | 名称 | 类型 | 自动条件 | AOE | tags |
| --- | --- | --- | --- | --- | --- |
| `lantern_strike` | 长铲挥击 | 主攻 | 冷却结束 | 2 | physical, shadow |
| `marrow_call` | 唤骸 | 召唤 | 战场 ≤ 2 召唤物 | — | summon, undead |
| `soul_drain` | 魂蚀 | 持续吸血 | 敌存活 | 1 | shadow, dot |
| `grave_chill` | 墓寒领域 | AOE 减速 + DoT | 敌人 ≥ 2 | ∞ | shadow, area, slow |
| `vigil_lantern` | 守夜灯 | 范围治疗 + 召唤增益 | 召唤物存活 | — | summon, support |
| `final_rite` | 终末仪式 | 单体大伤 + 牺牲召唤物 | 召唤物 ≥ 1 | 1 | shadow, execute |

### 3.5 技能符文（每技能 2–3 条）

> 当前实装版本每技能仅 1 符文。本扩展把每个技能扩到 2–3 符文，命名规则：`{skill_root}_{flavor}`。仅列举关键改写效果，由后续平衡文档具化数值。

举例（破誓骑士 `cleave`）：

| RuneID | 名称 | 改写效果 |
| --- | --- | --- |
| `deep_cut` ✓ | 深创 | 额外 +1 流血层 |
| `cleave_red_arc` | 红弧 | 命中 ≥ 2 敌时附带 30% 溅射伤害 |
| `cleave_iron_burst` | 铁裂 | 流血层数 = 0 时伤害 +25% |

> （其余 17 技能 × 平均 2.5 符文 ≈ 45 条符文，建议落到一个独立 `runes-spec.md`，避免本文档过长。本文档先给命名约定与示例。）

### 3.6 职业立绘 / 战斗 sprite prompt

**破誓骑士**已有 `oathbreaker-hero.png`，新增两个职业：

```text
[subject] = "Ember Witch — slender female ash-mage, charred bone mask covering upper face,
ragged crimson and ash-black robes, gold-thread oath sigils on sleeves,
holds a half-burnt wooden staff topped with smoldering ember crystal,
ember motes drifting around her, full body, facing left"
```

```text
[subject] = "Gravewarden — gaunt male undertaker, half-skull steel helm with one human eye visible,
heavy long-shovel polearm with lantern hooked at the haft,
black travel coat over riveted leather, soul-blue lantern glow on left hand,
full body, facing left"
```

> 同时为每个新职业出一张 walk-sheet（4 帧），prompt 复用 `§ Shared Walk Sheet Prompt Pattern`，subject = 职业立绘 subject + "walking forward to the left, four frames: contact / down / passing / up"。

---

## 4. 装备系统

### 4.1 槽位与基础数（base item）

当前 10 个槽位（保持代码已有结构），每槽位扩到 5–8 个 base，呼应 5 个 act 的递进。

| Slot | 备注 | base 数量目标 |
| --- | --- | --- |
| `weapon` | 主手 | 8（按武器类型分：axe, sword, mace, claymore, scythe, hammer, polearm, dagger） |
| `offhand` | 副手（盾 / 法器 / 灯笼） | 5 |
| `helm` | 头部 | 6 |
| `chest` | 胸甲 | 6 |
| `gloves` | 手套 | 5 |
| `boots` | 鞋 | 5 |
| `amulet` | 项链 | 5 |
| `ring1` / `ring2` | 戒指（共用 base 池） | 6 |
| `relic` | 圣物 | 5 |

### 4.2 武器 base 全量清单（8 件）

| ID | 名称 | implicit | 风格关键词 | sprite 资源 |
| --- | --- | --- | --- | --- |
| `rusted_cleaver` ✓ | 锈蚀斩斧 | physicalDamage +12 | 单手斧、断刃锈红 | `item-rusted-cleaver.png` |
| `black_iron_sword` ✓ | 黑铁长剑 | atkSpeed +6, phys +8 | 单手剑、十字护手、刃身刻铭 | `item-black-iron-sword.png` |
| `ember_maul` | 烬铸大锤 | phys +20, atkSpeed -3 | 双手钉锤，锤头嵌烬石 | `item-ember-maul.png` |
| `oath_claymore` | 破誓巨剑 | phys +18, executeDmg +10 | 双手大剑、护手缠链 | `item-oath-claymore.png` |
| `widow_scythe` | 寡妇镰 | bleedDmg +14, atkSpeed +4 | 长柄镰，刃缠红绳 | `item-widow-scythe.png` |
| `relic_bonespear` | 圣骨长枪 | phys +14, magicFind +6 | 骨制长枪，缠金线 | `item-relic-bonespear.png` |
| `flayer_dagger` | 剥皮匕 | bleedDmg +18, atkSpeed +8 | 短刃倒勾，柄缠皮 | `item-flayer-dagger.png` |
| `pyre_staff` | 焚柩法杖 | fireDmg +18, embers +6 | 烧焦木杖，顶端骨笼锁住烬石 | `item-pyre-staff.png` |

### 4.3 副手 base（5 件）

| ID | 名称 | implicit | 关键词 |
| --- | --- | --- | --- |
| `oath_shield` ✓ | 破誓盾 | armor +18, life +22 | 圆盾，盾面有破誓符文 |
| `bone_buckler` | 骸骨小盾 | armor +10, atkSpeed +4 | 骨制小圆盾 |
| `vow_lantern` | 守誓灯笼 | magicFind +12, life +10 | 黄铜提灯，灵魂蓝光 |
| `ember_focus` | 烬纹焦核 | fireDmg +14, embers +6 | 浮空烬石焦核 |
| `tome_of_kept_oaths` | 守誓典籍 | shadowDmg +12, souls +5 | 锁链束缚的旧书 |

### 4.4 头盔 / 胸甲 / 手套 / 鞋 / 项链 / 戒指 / 圣物（按 act 5 件 + 新增）

> 为节省篇幅，下表列每槽位**扩展后的 5–6 件**。具体 stat 数值由平衡阶段确认。

| Slot | base ID | 名称 | 关键词 |
| --- | --- | --- | --- |
| helm | `miner_helm` ✓ | 矿灯盔 | 矿灯铆接钢盔 |
| helm | `coal_hood` | 煤布兜帽 | 黑布、银十字、煤灰 |
| helm | `bone_visage` | 髓骨面具 | 半骷髅头骨 |
| helm | `frost_circlet` | 寒铸冠环 | 冰铁冠 + 蓝纱 |
| helm | `vow_crown` | 誓约冠 | 哥特金属冠 + 红纱 |
| helm | `ash_diadem` | 烬纹绷带冠 | 焦布 + 烬石 |
| chest | `charred_plate` ✓ | 焦黑胸甲 | 烧黑全身板甲 |
| chest | `bonecage_harness` | 骸笼胸甲 | 外露肋骨 + 皮带 |
| chest | `nightcloak_robe` | 夜帷长袍 | 黑布 + 暗金锁子 |
| chest | `pale_aegis` | 苍铸胸甲 | 雪铁 + 白皮草披风 |
| chest | `crimson_doublet` | 赤誓礼装 | 哥特皮甲 + 银纽扣 |
| chest | `oath_breastplate` | 破誓胸铠 | 黑铁 + 烬纹符印 |
| gloves | `butcher_gloves` ✓ | 屠夫手套 | 染血皮手套 |
| gloves | `iron_gauntlets` | 铁戟铁手套 | 黑铁全指甲 |
| gloves | `ember_grip` | 烬抓 | 焦皮 + 烬石嵌 |
| gloves | `widow_lace` | 寡妇黑纱手套 | 蕾丝 + 银针 |
| gloves | `bonefinger` | 骸指 | 骨骼缝合手套 |
| boots | `ashwalkers` ✓ | 踏灰靴 | 焦底战靴 |
| boots | `ironheel_sabatons` | 铁踵铠靴 | 重型钢靴 |
| boots | `frostgrip_boots` | 寒咬靴 | 冰钉 + 雪皮 |
| boots | `pyre_treads` | 焚踪靴 | 烬石踝铆 |
| boots | `crypt_softsoles` | 墓行软靴 | 静音皮靴 |
| amulet | `red_cord` ✓ | 赤绳项链 | 红绳 + 骨珠 |
| amulet | `silenced_locket` | 缄默挂坠 | 银盒缝合 |
| amulet | `ember_pendant` | 烬纹吊坠 | 烬石锁链 |
| amulet | `vow_choker` | 誓约项圈 | 黑色蕾丝 + 银十字 |
| amulet | `marrow_charm` | 髓骨护符 | 骨牙 + 红绳 |
| ring1/ring2 | `bone_ring` ✓ | 骨印戒指 | 骨雕戒 |
| ring1/ring2 | `iron_oath_band` | 铁誓指环 | 黑铁 + 红宝石 |
| ring1/ring2 | `ember_seal` | 烬封戒 | 嵌烬石戒 |
| ring1/ring2 | `crimson_signet` | 赤誓印戒 | 红玉 + 雕花 |
| ring1/ring2 | `mirror_band` | 镜池戒 | 双面镜面戒 |
| ring1/ring2 | `kiln_promise` | 炉誓戒 | 焦铜镶烬石 |
| relic | `forgotten_relic` ✓ | 遗忘圣物 | 锈金小匣 |
| relic | `oath_ledger` | 誓约名册 | 锁链书 |
| relic | `bone_chalice` | 髓骨圣杯 | 骨杯 + 红绳 |
| relic | `frostforge_seal` | 苍铸封章 | 雪铁徽章 |
| relic | `mirror_shard` | 镜血碎片 | 棱形血色镜片 |

### 4.5 装备 sprite prompt 样例

装备图标也走 chroma key 透明，但比战斗 sprite 更紧凑（单图标尺寸 512×512，主体居中 80%）。

```text
[subject] = "Ember Maul — two-handed war maul prop icon, head forged from blackened iron
with embedded glowing ember crystals, leather-wrapped haft, dark fantasy game item,
single object centered, no character, no shadow"
```

```text
[subject] = "Vow Lantern — gothic brass lantern offhand, suspended from a chain ring,
soul-blue flame inside, oath rune engraved on glass panes,
single object centered prop icon"
```

### 4.6 稀有度视觉规则

| Rarity | 稀有度色 | 美术差异 |
| --- | --- | --- |
| `normal` | 灰白 | 素材本身，不加光效 |
| `magic` | 蓝 | 边缘加蓝色微光 + 蓝词缀题词 |
| `rare` | 黄 | 边缘金色 + 烟尘 |
| `epic` | 紫 | 边缘紫雾 + 流光 |
| `legendary` | 橙 | 烬橙体积光 + 浮起符印 |

> 装备图本身不画稀有度光效；运行时由 CSS `--rarity` 添加 outline / glow。

---

## 5. 词缀系统扩展（共 30 条）

### 5.1 现有 9 条 ✓

`cruel`, `quick`, `gouging`, `deep_wound`, `headsman`, `vital`, `plated`, `seeker`, `avarice`

### 5.2 新增 21 条（按 category 分组）

| ID | 名称 | category | stat | 说明 |
| --- | --- | --- | --- | --- |
| `pyre` | 焚火 | offense | fireDamage | 火焰伤害 |
| `umbral` | 暗影 | offense | shadowDamage | 暗影伤害 |
| `frostbound` | 寒缚 | offense | coldDamage | 冰冷伤害 |
| `merciless` | 无怜 | offense | critChance | 暴击率 |
| `savage` | 凶残 | offense | critDamage | 暴击伤害 |
| `concussive` | 震荡 | offense | stunChance | 命中眩晕几率 |
| `incendiary` | 引火 | dot | igniteChance | 命中点燃几率 |
| `searing` | 灼烧 | dot | burnDuration | 燃烧持续时间 |
| `phantasmal` | 缠魂 | dot | shadowDotDmg | 暗影 DoT |
| `shrouded` | 蔽影 | defense | dodgeChance | 闪避率 |
| `bulwark` | 壁障 | defense | blockChance | 格挡率 |
| `wellspring` | 泉源 | defense | lifeRegen | 每秒生命回复 |
| `embered_soul` | 烬魂 | defense | embersRegen | 资源（烬蕴）回复 |
| `oathbound` | 誓缚 | defense | damageReduction | 减伤 |
| `summoner` | 召主 | summon | summonDamage | 召唤物伤害 |
| `bonebound` | 骨缚 | summon | summonLife | 召唤物生命 |
| `swarmcaller` | 群召 | summon | summonCount | 召唤物上限 |
| `gilded` | 鎏金 | loot | rareDropBonus | 稀有掉率 |
| `legendary_lure` | 引奇 | loot | legendaryDropBonus | 传说掉率 |
| `eternal` | 不朽 | utility | xpBonus | 经验加成 |
| `wayfarer` | 行路 | utility | moveSpeed | 移动速度 |

> 每条沿用现有 5-tier × 4 数值阶梯，结构沿 `affixes.ts § Tier 设计规则`。Stat 数值范围在平衡阶段产出独立 `affix-tuning.md`。

---

## 6. 传说装备扩展（共 30 件）

> 已实装 3 件 ✓：`oath_guillotine`, `heart_strangler`, `butcher_seal`。
> 后续每职业 ≥ 8 件，通用 6 件，共 30 件。

### 6.1 命名与 hook 规则

| hookId | 触发时机 | 数据示例 |
| --- | --- | --- |
| `onExecuteThreshold` ✓ | 处决可在 X% 生命触发 | threshold, dmgMult |
| `onBleedStack` ✓ | 流血叠到 N 层 | maxStacks, perStackDmg |
| `onSkillCast` ✓ | 技能命中 | triggerChance, bonusEffect |
| `onCriticalHit`（新） | 暴击命中 | bonusBleed, bonusDmg |
| `onLowLife`（新） | 自身低血 | dmgReduction, lifeOnHit |
| `onKill`（新） | 击杀触发 | aoeDmg, embersGain |
| `onSummon`（新） | 召唤物生成 | extraSummon, summonDmgBuff |
| `onTakeDamage`（新） | 受击触发 | reflectDmg, shieldGain |

### 6.2 通用传说（6 件，任意职业）

| ID | 名称 | 槽位 | hook | 描述 |
| --- | --- | --- | --- | --- |
| `oath_guillotine` ✓ | 血誓断头台 | weapon | onExecuteThreshold | 处决可在 50% 触发，但 -25% |
| `heart_strangler` ✓ | 心绞诅咒 | amulet | onBleedStack | 流血上限 +5，每层 +8% |
| `butcher_seal` ✓ | 屠夫凶印 | ring | onSkillCast | 25% 概率 +2 流血层 |
| `gilded_choker` | 镀金枷锁 | amulet | onKill | 击杀+5% 暴金币 |
| `mirror_charm` | 镜池护符 | amulet | onTakeDamage | 受击 10% 概率反射 50% 伤害 |
| `iron_oathring` | 铁誓指环 | ring | onLowLife | 低血时减伤 +30% |

### 6.3 破誓骑士专属（8 件）

| ID | 名称 | 槽位 | hook | 描述 |
| --- | --- | --- | --- | --- |
| `crimson_pact` | 赤誓血盟 | weapon | onCriticalHit | 暴击附 +1 流血层 |
| `oathmaker_grip` | 立誓铁握 | gloves | onSkillCast | 怒气满时技能伤害 +25% |
| `severance_helm` | 断盟头盔 | helm | onExecuteThreshold | 处决阈值 +5%，处决伤害 +20% |
| `wrathwalk` | 怒踏战靴 | boots | onLowLife | 血量 < 30% 时移速 +25% |
| `bloodsmith_vow` | 血铸誓约 | chest | onTakeDamage | 受击堆叠流血加成（最多 5） |
| `iron_oath_chant` | 铁誓圣咏 | offhand | onSkillCast | 铁誓护盾期间命中可叠层 |
| `vow_to_remember` | 铭誓圣物 | relic | onKill | 击杀掉落金币 +30% |
| `final_word` | 终言巨刃 | weapon | onLowLife | 低血时全伤害 +40%，攻速 -20% |

### 6.4 烬纹巫女专属（8 件）

| ID | 名称 | 槽位 | hook | 描述 |
| --- | --- | --- | --- | --- |
| `kiln_eye` | 炉瞳法杖 | weapon | onCriticalHit | 暴击点燃目标 |
| `ash_pact` | 灰誓项链 | amulet | onBleedStack | 燃烧效果 = 流血同源叠加 |
| `pyre_robes` | 焚柩法衣 | chest | onSkillCast | 烬芒投射 30% 链 1 个目标 |
| `cinder_breath` | 烬息靴 | boots | onLowLife | 低血时落烬骤雨 CD -50% |
| `effigy_pact` | 焰偶契 | offhand | onSummon | 灰焰幻影伤害 +50% |
| `ember_marrow_ring` | 烬髓戒 | ring | onKill | 击杀返还 5 烬蕴 |
| `phoenix_remembrance` | 不死鸟遗物 | relic | onTakeDamage | 致死时 1 次复活到 30%（CD 5 分钟） |
| `sealing_breath_helm` | 封烬冠 | helm | onCriticalHit | 暴击触发焚誓封印 |

### 6.5 守墓人专属（8 件）

| ID | 名称 | 槽位 | hook | 描述 |
| --- | --- | --- | --- | --- |
| `boneherder` | 骨牧长铲 | weapon | onSummon | 召唤额外 +1 骷髅 |
| `lantern_pact` | 灯誓挂坠 | amulet | onSkillCast | 守夜灯持续 +50% |
| `marrow_warden` | 髓骨胸甲 | chest | onTakeDamage | 召唤物分担 30% 伤害 |
| `nightwalker_boots` | 夜行墓靴 | boots | onLowLife | 低血召唤 1 个守墓亡魂 |
| `tomb_warden_focus` | 守墓焦核 | offhand | onSummon | 召唤物伤害 +20% |
| `soul_seal_ring` | 魂封戒 | ring | onKill | 击杀返还 1 灵魂 |
| `final_rite_relic` | 终末圣物 | relic | onCriticalHit | 终末仪式暴击 +50% |
| `gravewarden_visor` | 守墓面甲 | helm | onBleedStack | 流血层 = 灵魂同步增长 |

---

## 7. UI / VFX 资产清单

| ID | 用途 | 关键词 | sprite 资源 |
| --- | --- | --- | --- |
| `loot-drop-beam` ✓ | 掉落光柱 | 暗金体积光 | `loot-drop-beam.png` |
| `blood-slash-effect` ✓ | 斩击血雾 | 红弧 + 飞溅 | `blood-slash-effect.png` |
| `ember-burst` | 火焰爆点 | 烬橙圆爆 | `vfx-ember-burst.png` |
| `frost-shard-burst` | 冰刺爆 | 蓝白棱片 | `vfx-frost-shard-burst.png` |
| `shadow-coil` | 暗影缠绕 | 黑紫烟流 | `vfx-shadow-coil.png` |
| `oath-mark` | 誓痕浮印 | 烬橙符号 | `vfx-oath-mark.png` |
| `summon-circle` | 召唤法阵 | 灵魂蓝法阵 | `vfx-summon-circle.png` |
| `level-up-aura` | 升级光圈 | 暗金 + 烬橙脉冲 | `vfx-level-up-aura.png` |

---

## 8. 优先级与生图批次建议

| 批次 | 内容 | 估算 PNG 数 | 解锁玩法 |
| --- | --- | --- | --- |
| Batch 1（已 ✓） | Act1 黑炉矿道 + 破誓骑士 + 5 敌人 + 1 Boss | ~14 | 当前可玩 |
| Batch 2 | Act1 第二区域（bleeding_furnace）背景 + 4 新敌人 + Zone Boss | 6 | Act1 完整通关 |
| Batch 3 | 重出 4 张 walk-sheet（task #22） | 4 | 行走动画恢复 |
| Batch 4 | 烬纹巫女 + 守墓人立绘 + walk-sheet × 2 | 4 | 多职业可选 |
| Batch 5 | 装备 base 图标全 50 件 | 50 | 完整装备视觉 |
| Batch 6 | Act2（silent_choir + ossuary_keep）2 背景 + 8 敌人 + 2 Boss | 12 | Act2 |
| Batch 7 | Act3 / Act4 / Act5 各自 2 背景 + 8 敌人 + 2 Boss | 36 | 主线全开 |
| Batch 8 | VFX 6 张 | 6 | 玩法手感 |

总目标 PNG 量：~130 张。建议每批跑完先入库 `public/assets/game/` 再切下一批。

---

## 9. 命名约定（数据 ↔ 资源 ↔ 文件）

- 数据 ID：`snake_case` 英文，全局唯一（如 `vein_butcher`）
- 文件名：`{type}-{id_with_dashes}.png`，type ∈ `{enemy, boss, hero, item, vfx, bg}`
  - 例：`enemy-marrow-drake.png`、`boss-cardinal-husk.png`、`item-ember-maul.png`、`bg-silent-choir.webp`
- walk-sheet：`{role}-walk-sheet.png`（hero / enemy-humanoid / enemy-beast / enemy-brute / boss-{id}）
- prompt 中文名仅作记忆辅助；数据层与文件名统一英文 ID。

---

## 10. 后续工作链路

1. 沿用 `art-direction.md` 的 chroma-key + remove_chroma_key.py 流水线
2. 按 §8 批次生图入库
3. 每批入库后增量更新 `src/data/{enemies,items,affixes,legendaryPowers,chapters,skills}.ts`
4. Boss 战首批仅静态图 + 复用 brute walk-sheet，第二批再补专属 walk-sheet
5. 平衡数值由独立 `docs/balance.md` 处理，不进本文件

