#!/usr/bin/env node
/**
 * 敌人 sprite sheet 守门员
 *
 * 扫 public/assets/game/enemies/runtime/<slug>/{walk,attack,idle,death}-sheet.png
 * 每张 sheet 4 帧，统计每帧的 alpha mean（非透明像素覆盖率）。
 *
 * 失败规则：
 *   - 任一帧 alpha mean = 0：完全空白（确定坏帧）
 *   - 同一 sheet 内 min/max ratio < MIN_RATIO：帧间差距过大（残缺帧）
 *
 * 用法：
 *   node scripts/validate-enemy-sheets.mjs                # 默认严格模式，发现问题非零退出
 *   node scripts/validate-enemy-sheets.mjs --report       # 仅报告，始终零退出（用于审计）
 *   node scripts/validate-enemy-sheets.mjs --threshold=0.5
 *
 * 接 CI：在 package.json scripts 里加
 *   "validate:enemy-sheets": "node scripts/validate-enemy-sheets.mjs"
 * 然后 lint / pre-push 调一次。
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const runtimeRoot = join(repoRoot, 'public/assets/game/enemies/runtime')

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const REPORT_ONLY = Boolean(args.get('report'))
const MIN_RATIO = Number(args.get('threshold') ?? 0.5)
const FRAMES_PER_SHEET = 4
const ACTIONS = ['walk', 'attack', 'idle', 'death']

const failures = []
const warnings = []
const inspected = []

for (const slug of readdirSync(runtimeRoot)) {
  const enemyDir = join(runtimeRoot, slug)
  if (!statSync(enemyDir).isDirectory()) continue

  for (const action of ACTIONS) {
    const sheetPath = join(enemyDir, `${action}-sheet.png`)
    let dims
    try {
      dims = execFileSync('magick', ['identify', '-format', '%w %h', sheetPath], { encoding: 'utf8' }).trim()
    } catch {
      continue // 文件不存在，跳过
    }
    const [W, H] = dims.split(' ').map(Number)
    const frameW = Math.floor(W / FRAMES_PER_SHEET)

    const means = []
    for (let i = 0; i < FRAMES_PER_SHEET; i += 1) {
      const x = i * frameW
      const out = execFileSync(
        'magick',
        [sheetPath, '-crop', `${frameW}x${H}+${x}+0`, '+repage', '-alpha', 'extract', '-format', '%[mean]', 'info:'],
        { encoding: 'utf8' },
      ).trim()
      means.push(Number(out))
    }

    const max = Math.max(...means)
    const min = Math.min(...means)
    const ratio = max === 0 ? 0 : min / max
    inspected.push({ slug, action, means, ratio })

    const emptyFrames = means
      .map((m, i) => (m === 0 ? i : -1))
      .filter((i) => i >= 0)

    // death 动作允许"单调递减（倒地溶解）"，只有非单调或最大帧不在第 0 帧时才告警
    const monotonicallyDecays =
      action === 'death' &&
      means[0] === max &&
      means.every((m, i, arr) => i === 0 || m <= arr[i - 1] * 1.15) // 容忍 15% 反弹（鬼火扩散等）

    if (emptyFrames.length > 0) {
      failures.push({
        slug,
        action,
        kind: 'empty-frame',
        message: `空白帧索引 ${emptyFrames.join(',')}（means=[${means.map((m) => m.toFixed(0)).join(',')}]）`,
      })
    } else if (!monotonicallyDecays && ratio < MIN_RATIO) {
      const target = ratio < 0.3 ? failures : warnings
      target.push({
        slug,
        action,
        kind: 'low-ratio',
        message: `帧间覆盖率失衡 ratio=${ratio.toFixed(2)}（means=[${means.map((m) => m.toFixed(0)).join(',')}]）`,
      })
    }
  }
}

console.log(`Inspected ${inspected.length} sheets across ${readdirSync(runtimeRoot).length} enemies.\n`)

if (warnings.length) {
  console.log(`Warnings (ratio < ${MIN_RATIO}, 视觉差异较大但可接受)：`)
  for (const w of warnings) console.log(`  [WARN] ${w.slug}/${w.action} — ${w.message}`)
  console.log()
}

if (failures.length) {
  console.log(`Failures (ratio < 0.30 或存在空白帧，必须重生)：`)
  for (const f of failures) console.log(`  [FAIL] ${f.slug}/${f.action} — ${f.message}`)
  console.log()
  console.log(`修复指引：见 docs/sprite-source-spec-v2.md。重生 source 后跑：`)
  console.log(`  node scripts/import-v2-enemy-action-sheet.mjs <slug> <action> <source.png>`)
  console.log(`  node scripts/build-enemy-runtime.mjs`)
  console.log(`  node scripts/validate-enemy-sheets.mjs`)
  if (!REPORT_ONLY) process.exit(1)
} else {
  console.log('All enemy sheets passed validation.')
}
