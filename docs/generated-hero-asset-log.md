# 生成角色资产记录

日期：2026-05-30

本批资源用于“角色丰富度”阶段的首批可玩角色动作源。所有资源先作为 source atlas 入库，不直接替换运行时 hero sheet；原因是 atlas 仍需经过精确切片、底部锚点校准和动作回归后，才能进入 `public/assets/game/heroes/<class-id>/` 运行时目录。

## 资源路径

| classId | chroma 源图 | alpha 源图 | 状态 |
| --- | --- | --- | --- |
| ash_hunter | `public/assets/game/generated-source/heroes/ash_hunter/action-atlas-chroma.png` | `public/assets/game/generated-source/heroes/ash_hunter/action-atlas-alpha.png` | 可进入切片校准 |
| grave_votary | `public/assets/game/generated-source/heroes/grave_votary/action-atlas-chroma.png` | `public/assets/game/generated-source/heroes/grave_votary/action-atlas-alpha.png` | 可进入切片校准 |
| iron_gaoler | `public/assets/game/generated-source/heroes/iron_gaoler/action-atlas-chroma.png` | `public/assets/game/generated-source/heroes/iron_gaoler/action-atlas-alpha.png` | 可进入切片校准 |

角色选择页单独使用裁切后的预览图，避免直接渲染 4x4 atlas 时露出 chroma key 绿底或网格线：

- `public/assets/game/generated-source/heroes/ash_hunter/preview.png`
- `public/assets/game/generated-source/heroes/grave_votary/preview.png`
- `public/assets/game/generated-source/heroes/iron_gaoler/preview.png`

## 生成提示词摘要

### ash_hunter

2D side-scrolling ARPG sprite source atlas，4x4 grid，flat `#00ff00` chroma key。角色为瘦高兜帽灰烬猎手，烬红围巾、黑皮甲、焦铜护具、短刃和腕弩。四行分别是 idle、walk、attack、death，要求同一角色尺度、同一装备、同一底部锚点。

验收：

- 角色系列一致。
- walk 行有明确腿部运动。
- attack 行包含蓄力、斩击、射击、回收。
- death 行完整。
- 需要后续切片时移除网格线并统一每帧内容框。

### grave_votary

2D side-scrolling ARPG sprite source atlas，4x4 grid，flat `#00ff00` chroma key。角色为破损修女袍、骨质圣冠、墓灯、祷告链/短杖，幽紫魂火。四行分别是 idle、walk、attack、death，要求同一角色尺度、同一装备、同一底部锚点。

验收：

- 角色系列一致，轮廓和色彩区别明显。
- attack 行有举灯、法阵、魂火、回收。
- death 行完整。
- walk 行偏仪式步伐，后续接入时动画速度应低于灰烬猎手。

### iron_gaoler

2D side-scrolling ARPG sprite source atlas，4x4 grid，flat `#00ff00` chroma key。角色为重甲铁狱执行官，铁面罩、厚肩甲、链甲、链锤/巨锤和炉光裂缝。四行分别是 idle、walk、attack、death，要求同一角色尺度、同一装备、同一底部锚点。

验收：

- 角色系列一致，重型轮廓足够清楚。
- walk 行有沉重步态。
- attack 行包含蓄力、砸击、冲击、回收。
- death 行完整。
- 后续切片需要保留锤头和链条的水平空间，不能按身体框裁切。

## 已执行处理

- 原图复制自宿主生成目录，原始生成文件未删除。
- 使用 ImageMagick 将 `#00ff00` 背景转为 alpha。
- alpha 图检查：输出为 `srgba`，透明区域像素为 `srgba(0,0,0,0)`。

## 下一步

- [ ] 增加脚本：将 4x4 source atlas 切成 `idle/walk/attack/death` 4 个独立横向 sheet。
- [ ] 切片脚本需要先裁掉网格线，再按内容框居中到固定 256x256 单帧。
- [ ] 对每个角色输出 `portrait.png`，可先从 idle 第 1 帧裁出，再人工或 img gen 重制。
- [ ] 增加 `heroVisuals` 注册，但默认仍保留 `oathbreaker`，等角色选择 UI 完成后再开放。
- [ ] Playwright 对 3 个角色逐个跑 idle/walk/attack/death 尺寸回归。
