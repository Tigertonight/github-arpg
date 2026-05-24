# 横版挂机镜头与遭遇参考

本轮参考了几个 GitHub 上更成熟的横版/ARPG/2D 游戏实现，提炼出适合当前 React 原型的小方案。

## 参考项目

- `phaserjs/examples`：Phaser 官方示例仓库，高星，常见做法是把地图/背景滚动作为世界或 tile sprite 的位移，而不是让角色和背景各自猜速度。
- `flareteam/flare-engine`：开源 ARPG 引擎。`Camera.cpp` 使用目标点 + 平滑追踪；`MapParallax.cpp` 用 camera delta 和 layer speed 计算背景层偏移。
- `allenu/YokosukaJS`：JavaScript 横版 beat'em up。实体保留世界坐标，摄像机跟随玩家并夹在地图边界内；渲染阶段用 `sprite.position - camera.position` 转成屏幕坐标。

## 当前原型采用的简化方案

- 玩家不再在屏幕里大范围来回跑，而是锚定在左侧战斗区域。
- `travel` 状态滚动背景/地面，玩家播放原地跑动；下一只真实敌人从右侧进入。
- `combat` 状态暂停世界滚动，玩家和敌人锁定站位，只播放攻击/受击/技能反馈。
- 彻底移除伪背景敌人层，避免敌人像“贴在背景上”一样浅浅漂过。

后续如果继续升级，应把 stage presentation 拆成虚拟世界坐标：`heroWorldX`、`cameraX`、`encounterX`、`entities[]`，由渲染层统一做 `screenX = worldX - cameraX`。
