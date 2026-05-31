/**
 * Playwright 视觉回归脚本：
 *   1. 启动 dev server（需要外部已经 npm run dev）
 *   2. 进入游戏，截 travel + combat 两种状态
 *   3. 同时验证关键 DOM 尺寸（hero/enemy viewport），失败则非零退出
 *
 * 使用：
 *   终端 1：npm run dev
 *   终端 2：node scripts/visual-regression.mjs
 *
 * 输出：tmp/regression/*.png
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(repoRoot, 'tmp/regression')
mkdirSync(outDir, { recursive: true })

const URL = process.env.GAME_URL ?? 'http://localhost:5173/'
const HERO_IDS = ['oathbreaker', 'ash_hunter', 'grave_votary', 'iron_gaoler']

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
})

let failed = 0

for (const heroId of HERO_IDS) {
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 选英雄
  const heroBtn = page.locator(`button.hero-choice-card`).filter({ has: page.locator('text=' + nameOf(heroId)) })
  if (await heroBtn.count()) await heroBtn.first().click()
  await page.locator('button.hero-start-button').click()
  await page.waitForTimeout(1500)

  await page.screenshot({ path: join(outDir, `${heroId}-travel.png`) })

  // 等到出现敌人
  let combatReady = false
  for (let i = 0; i < 30; i += 1) {
    if (await page.locator('.enemy-frame-viewport').count()) { combatReady = true; break }
    await page.waitForTimeout(500)
  }

  if (!combatReady) {
    console.error(`[fail] ${heroId}: never entered combat within 15s`)
    failed += 1
    continue
  }

  await page.screenshot({ path: join(outDir, `${heroId}-combat-1.png`) })
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(outDir, `${heroId}-combat-2.png`) })
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(outDir, `${heroId}-combat-3.png`) })

  const sizes = await page.evaluate(() => {
    const hero = document.querySelector('.hero-frame-viewport')
    const enemies = Array.from(document.querySelectorAll('.enemy-frame-viewport'))
    const heroR = hero?.getBoundingClientRect()
    return {
      hero: heroR ? { w: heroR.width, h: heroR.height } : null,
      enemies: enemies.map((el) => {
        const r = el.getBoundingClientRect()
        return { w: r.width, h: r.height }
      }),
    }
  })

  // 期望英雄高度 180-280；敌人方形 ~200-280
  const heroOk = sizes.hero && sizes.hero.h >= 160 && sizes.hero.h <= 320
  const enemyOk = sizes.enemies.every((e) => e.h >= 160 && e.h <= 320 && Math.abs(e.w - e.h) < 30)

  if (!heroOk) {
    console.error(`[fail] ${heroId}: hero size out of range:`, sizes.hero)
    failed += 1
  }
  if (!enemyOk) {
    console.error(`[fail] ${heroId}: enemy size out of range:`, sizes.enemies)
    failed += 1
  }
  if (heroOk && enemyOk) {
    console.log(`[ok] ${heroId}: hero ${sizes.hero.w.toFixed(0)}x${sizes.hero.h.toFixed(0)}, ${sizes.enemies.length} enemies`)
  }
}

await browser.close()

if (errors.length) {
  console.error('Browser errors:')
  errors.forEach((e) => console.error('  -', e))
  failed += errors.length
}

console.log(`\nVisual regression: ${failed === 0 ? 'PASS' : `FAIL (${failed} issue(s))`}`)
console.log(`Screenshots in ${outDir}`)
process.exit(failed === 0 ? 0 : 1)

function nameOf(heroId) {
  return ({
    oathbreaker: '破誓骑士',
    ash_hunter: '灰烬猎手',
    grave_votary: '墓誓修女',
    iron_gaoler: '铁狱执行官',
  })[heroId]
}
