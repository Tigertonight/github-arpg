# 角色与敌人动画治理经验

本文记录本项目在英雄、敌人运动表现治理中的关键经验，后续新增角色、敌人、技能动作 sheet 时优先按这里回归。

## 核心结论

当前最容易出问题的点不是单一的美术质量，而是“美术 sheet 规格”和“前端播放机制”不一致。

如果 4 帧横向 sheet 被放进 `width: 400%` 的 `<img>` 中，CSS 动画终点必须移动到整张 sheet 的末端：

```css
@keyframes enemySheetStep {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
```

不要把 4 帧动画写成 `translateX(-75%)`。CSS transform 百分比是按元素自身宽度计算的，不是按视口宽度计算的。`width: 400%` 时，`translateX(-75%)` 会移动 3 个视口宽度，但配合 `steps(4,end)` 容易落在帧间采样状态，肉眼表现就是敌人像被切成竖条拉片。

2 帧 sheet 同理。如果元素宽度是 `200%`，也应使用 `translateX(-100%)`，由 `steps(2,end)` 控制帧边界。

## 已验证的稳定做法

敌人 walk 运行时先使用根目录中经过验证的稳定资源：

```ts
const stableWalk = `${gameAssetBase}/enemy-${slug}-walk-sheet.png`
```

不要在未完整验收前把运行时直接切到新生成目录，例如：

```text
/assets/game/enemies/clean-native/...
/assets/game/enemies/specific/...
```

这些目录可以作为候选资产池，但进入运行时前必须先做切图和帧边界验收。

敌人 CSS 播放方向保持 `normal`。不要通过 `animation-direction: reverse` 临时修正朝向问题。朝向应由美术资源、渲染朝向或独立 transform 统一解决，否则后续会叠加出“倒着走”“帧序反了”“攻击不连贯”等问题。

## 常见问题与根因

### 1. 敌人移动像竖向拉片

现象：

- 敌人走路时身体被分割成多条竖向片段。
- 某一帧里能同时看到上一帧和下一帧的身体部分。
- DOM 位置没有重叠，但画面仍然像切片。

优先检查：

- sheet 是否真的是横向等宽帧。
- `.enemy-walk-sheet` 是否 `width: 400%`。
- `@keyframes enemySheetStep` 是否从 `0` 到 `-100%`。
- `animation-timing-function` 是否是 `steps(4,end)`。
- 是否误用了 `animation-direction: reverse`。

### 2. 角色攻击或走路忽大忽小

现象：

- 英雄攻击时体积缩小或变大。
- 某些帧脚底上移，像浮起来。
- 武器被裁掉或角色出现半截残影。

优先检查：

- 同一动作 sheet 内每帧画布尺寸是否一致。
- 每帧角色脚底是否在同一 baseline。
- 武器最大挥舞范围是否完整包含在每帧画布内。
- 前端 viewport 是否在动作间切换了不同宽高。
- `transform-origin` 是否保持 `50% 100%`。

美术资产要求：

- 同一角色同一动作必须使用统一画布尺寸。
- 所有帧保留足够透明边距，尤其是武器挥舞方向。
- 以脚底为统一底部锚点，不要按身体外接框自动裁剪。

### 3. 敌人到达遭遇点时位置跳变

现象：

- 敌人从屏幕外走入正常，但到遭遇点瞬间前跳或后跳。
- 第一波正常，后续波次突然瞬移。

优先检查：

- 行进态和战斗态是否使用同一套 `xPct` 计算。
- `formationSlot` 是否稳定，不要每次 render 重新按数组临时推导。
- `spawnedAtMs` 是否只在创建时写入，不要被后续更新刷新。
- CSS transition 是否只作用于 `left`，不要叠加额外位移修正。

## 回归验收清单

每次修改英雄、敌人或场景运动相关代码后，至少做以下检查。

1. 桌面横屏截图

   - 视口建议：`2048 x 800`
   - 确认敌人没有竖向切片。
   - 确认敌人之间没有明显遮挡成一团。
   - 确认英雄攻击和行走体积感一致。

2. 手机横屏截图

   - 视口建议：`932 x 430`
   - 确认一屏内可玩，无页面滚动依赖。
   - 确认底部 HUD 不遮挡主要战斗判断。
   - 确认敌人进入屏幕时不是瞬移。

3. DOM 抽样

   检查敌人当前资源、动画名、动画方向和重叠矩形：

```js
const enemies = [...document.querySelectorAll('.enemy-frame-viewport')].map((el) => {
  const rect = el.getBoundingClientRect()
  const img = el.querySelector('img')
  const style = img ? getComputedStyle(img) : null
  return {
    left: rect.left,
    right: rect.right,
    width: rect.width,
    src: img?.getAttribute('src'),
    animationName: style?.animationName,
    animationDirection: style?.animationDirection,
    transform: style?.transform,
  }
})
```

验收标准：

- `animationDirection` 应为 `normal`。
- walk sheet 应使用稳定路径 `/assets/game/enemy-*-walk-sheet.png`，除非新资产已完成验收。
- 同屏敌人矩形不应大面积重叠。
- `transform` 应落在完整帧边界附近，不能长期停在明显的中间切片状态。

## 新资产进入运行时前的规则

新增或替换 sheet 前，必须确认以下内容：

- 横向 sheet 帧数和代码中的 `frames` 一致。
- 每帧宽度完全一致。
- 每帧透明画布尺寸一致。
- 每帧脚底 baseline 一致。
- 每帧角色完整，没有武器、尾巴、披风、特效被裁掉。
- sheet 内相邻帧之间有足够透明隔离，不要让角色跨帧侵入下一格。
- 不要把带白底、灰底、测试遮罩的源图直接进入运行时。

如果使用图像生成工具产出动作帧，prompt 中必须明确：

```text
transparent background, fixed canvas size per frame, equal-width horizontal sprite sheet,
large transparent padding around each frame, feet aligned to the same bottom baseline,
no frame overlap, no cropped weapon, no extra characters, no shadows crossing frame boundaries
```

## 推荐治理方向

后续如果继续扩展角色和敌人，建议把动画资产抽象成统一 schema：

```ts
type SpriteAction = {
  src: string
  frames: number
  durationMs: number
  mode: 'img-transform' | 'background-position'
  anchor: { x: number; y: number }
  frameWidth?: number
  frameHeight?: number
}
```

然后由一个 `SpriteSheet` 组件统一处理：

- 根据 `frames` 自动设置元素宽度。
- 根据 `frames` 自动选择 keyframes 或 CSS 变量。
- 禁止业务组件手写不同的 sheet 播放规则。
- 在开发模式下输出当前帧、资源路径、尺寸和 transform，方便验收。

这可以避免英雄、敌人、技能特效各自维护一套播放细节，降低后续“修 A 坏 B”的概率。
