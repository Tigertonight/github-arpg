#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const [slug, action, sourceArg] = process.argv.slice(2)

if (!slug || !action || !sourceArg) {
  console.error('Usage: node scripts/import-v2-enemy-action-sheet.mjs <slug> <idle|walk|attack|death> <source.png>')
  process.exit(1)
}

if (!['idle', 'walk', 'attack', 'death'].includes(action)) {
  console.error(`Unsupported action: ${action}`)
  process.exit(1)
}

const source = resolve(sourceArg)
const outDir = join(repoRoot, 'public/assets/game/generated-source/enemies', slug)
const tmpRoot = join(repoRoot, 'tmp/import-v2-enemy-action-sheet', slug, action)
mkdirSync(outDir, { recursive: true })
rmSync(tmpRoot, { recursive: true, force: true })
mkdirSync(tmpRoot, { recursive: true })

const { width, height } = identify(source)
const frameW = Math.floor(width / 4)
const frames = []
const dims = []

for (let i = 0; i < 4; i += 1) {
  const x = i * frameW
  const cropW = i === 3 ? width - x : frameW
  const raw = join(tmpRoot, `raw-${i}.png`)
  const trimmed = join(tmpRoot, `trimmed-${i}.png`)

  execFileSync('magick', [
    source,
    '-crop',
    `${cropW}x${height}+${x}+0`,
    '+repage',
    '-alpha',
    'set',
    '-fuzz',
    '18%',
    '-transparent',
    '#00ff00',
    '-fuzz',
    '18%',
    '-transparent',
    '#33d100',
    `png32:${raw}`,
  ])

  execFileSync('magick', [
    raw,
    '-trim',
    '+repage',
    `png32:${trimmed}`,
  ])

  const dim = identify(trimmed)
  frames.push(trimmed)
  dims.push(dim)
}

const maxW = Math.max(...dims.map((d) => d.width))
const maxH = Math.max(...dims.map((d) => d.height))
const maxContentW = action === 'attack' ? 470 : 430
const maxContentH = action === 'death' ? 390 : 410
const scale = Math.min(maxContentW / maxW, maxContentH / maxH)
const cells = []

for (let i = 0; i < 4; i += 1) {
  const dim = dims[i]
  const scaledW = Math.max(1, Math.round(dim.width * scale))
  const scaledH = Math.max(1, Math.round(dim.height * scale))
  const cell = join(tmpRoot, `cell-${i}.png`)
  // 每个 cell 单独 -flop 把"朝右"翻成"朝左"，避免拼接后整张翻转导致 4 帧时间顺序倒置。
  execFileSync('magick', [
    frames[i],
    '-filter',
    'point',
    '-resize',
    `${scaledW}x${scaledH}!`,
    '-gravity',
    'south',
    '-background',
    '#00ff00',
    '-extent',
    '512x512',
    '-flop',
    `png32:${cell}`,
  ])
  cells.push(cell)
}

// imagegen 按 v2 spec 画"facing RIGHT"；落地到 generated-source 时翻成"朝左"，
// 因为游戏里敌人在右侧朝左走向英雄。每个 cell 已在 -flop 阶段镜像，
// 拼接顺序保持 0..3 不变，时间顺序与原图一致。
const out = join(outDir, `${action}.png`)
execFileSync('magick', [...cells, '+append', `png32:${out}`])
rmSync(tmpRoot, { recursive: true, force: true })
console.log(`Imported ${slug}/${action} v2 source (flipped to face left) to ${out}`)

function identify(path) {
  const out = execFileSync('magick', ['identify', '-format', '%w %h', path], { encoding: 'utf8' }).trim()
  const [w, h] = out.split(/\s+/).map(Number)
  if (!Number.isFinite(w) || !Number.isFinite(h)) throw new Error(`Cannot identify image: ${path}`)
  return { width: w, height: h }
}
