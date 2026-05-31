#!/usr/bin/env node
/**
 * 阶段 1 软警告：检查 generated-source/enemies/<slug>/ 下的 4 张 source.png
 * 是否符合 sprite-source-spec-v2 规范。不符合只输出黄色警告，不阻断流程。
 *
 * 用法：
 *   node scripts/audit-source-frames.mjs                  # 扫所有 slug
 *   node scripts/audit-source-frames.mjs --slug=slag-warden
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceRoot = join(repoRoot, 'public/assets/game/generated-source/enemies')

const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1]

const EXPECTED_W = 2048
const EXPECTED_H = 512
const FRAME = 512
const FRAMES = 4
const ACTIONS = ['idle', 'walk', 'attack', 'death']

const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

let slugs
try {
  slugs = readdirSync(sourceRoot).filter((s) => !s.startsWith('.') && isDir(join(sourceRoot, s)))
} catch {
  console.error(`Source root not found: ${sourceRoot}`)
  console.error('Create generated-source/enemies/<slug>/ and try again.')
  process.exit(0)
}

if (slugArg) slugs = slugs.filter((s) => s === slugArg)

if (!slugs.length) {
  console.log(`No slug directories found under ${sourceRoot}`)
  process.exit(0)
}

let totalWarn = 0
for (const slug of slugs) {
  console.log(`\n[${slug}]`)
  const slugDir = join(sourceRoot, slug)
  for (const action of ACTIONS) {
    const path = join(slugDir, `${action}.png`)
    const warns = auditFile(path, action)
    for (const w of warns) {
      console.log(`  ${YELLOW}WARN${RESET} ${action}: ${w}`)
      totalWarn += 1
    }
    if (!warns.length) console.log(`  ${GREEN}ok${RESET}   ${action}`)
  }
}

console.log(`\n${totalWarn === 0 ? GREEN : YELLOW}${totalWarn} warnings${RESET} across ${slugs.length} slug(s)`)

function auditFile(path, action) {
  const warns = []
  if (!exists(path)) {
    warns.push(`missing file ${path}`)
    return warns
  }
  let img
  try {
    img = readPng(path)
  } catch (err) {
    warns.push(`cannot read PNG: ${err.message}`)
    return warns
  }

  if (img.width !== EXPECTED_W || img.height !== EXPECTED_H) {
    warns.push(`size ${img.width}x${img.height} ≠ ${EXPECTED_W}x${EXPECTED_H}`)
    return warns // size 不对后续检查也无意义
  }

  // 绿幕占比：r<60, g>180, b<60 视作纯绿
  let greenCount = 0
  const total = img.width * img.height
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2]
    if (r < 60 && g > 180 && b < 60) greenCount += 1
  }
  const greenRatio = greenCount / total
  if (greenRatio < 0.30) warns.push(`green-screen ratio ${(greenRatio * 100).toFixed(1)}% < 30% (background may not be #00ff00)`)

  // 4 帧 baseline 漂移：每帧最低非绿像素的 y
  const baselines = []
  const topYs = []
  const bboxes = []
  for (let f = 0; f < FRAMES; f += 1) {
    const x0 = f * FRAME
    const bbox = bboxOfFrame(img, x0, 0, FRAME, FRAME)
    if (!bbox) {
      warns.push(`frame ${f}: no subject pixels detected (all green?)`)
      continue
    }
    bboxes.push(bbox)
    baselines.push(bbox.maxY)
    topYs.push(bbox.minY)
  }

  if (baselines.length === FRAMES) {
    const drift = Math.max(...baselines) - Math.min(...baselines)
    if (drift > 20) warns.push(`baseline drift ${drift}px > 20px (frames not aligned at foot)`)

    const minTop = Math.min(...topYs)
    const topClearance = minTop // 距 cell 顶
    if (topClearance < FRAME * 0.12) warns.push(`top clearance ${topClearance}px < 12% (${Math.floor(FRAME * 0.12)}px) — head may overflow on resize`)

    // 边界裁切：bbox 是否触及 cell 左右边
    for (let f = 0; f < bboxes.length; f += 1) {
      const b = bboxes[f]
      const localMinX = b.minX // already cell-local? bboxOfFrame 返回的是相对 frame 起点
      const leftPad = localMinX
      const rightPad = FRAME - 1 - b.maxX
      if (leftPad < 24) warns.push(`frame ${f}: subject touches left edge (pad=${leftPad}px < 24px)`)
      if (rightPad < 24) warns.push(`frame ${f}: subject touches right edge (pad=${rightPad}px < 24px)`)
    }
  }

  return warns
}

function bboxOfFrame(img, x0, y0, w, h) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = ((y0 + y) * img.width + x0 + x) * 4
      const r = img.data[idx], g = img.data[idx + 1], b = img.data[idx + 2]
      const a = img.data[idx + 3]
      // 非绿幕 + 非透明 → 计入主体
      const isGreen = r < 60 && g > 180 && b < 60
      if (a < 32 || isGreen) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

function exists(p) { try { statSync(p); return true } catch { return false } }
function isDir(p) { try { return statSync(p).isDirectory() } catch { return false } }

function readPng(path) {
  const bytes = readFileSync(path)
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Invalid PNG: ${path}`)
  let offset = 8, width = 0, height = 0, colorType = 0
  const idat = []
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii')
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    offset += length + 12
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
  }
  const inflated = inflateSync(Buffer.concat(idat))
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0
  if (!channels) throw new Error(`Unsupported color type ${colorType} (need RGB or RGBA)`)
  const stride = width * channels
  const out = { width, height, data: Buffer.alloc(width * height * 4) }
  let inputOffset = 0
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++]
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride))
    inputOffset += stride
    unfilter(row, previous, channels, filter)
    // 转 RGBA：RGB 源补 alpha=255
    for (let x = 0; x < width; x += 1) {
      const dst = (y * width + x) * 4
      out.data[dst] = row[x * channels]
      out.data[dst + 1] = row[x * channels + 1]
      out.data[dst + 2] = row[x * channels + 2]
      out.data[dst + 3] = channels === 4 ? row[x * channels + 3] : 255
    }
    previous = row
  }
  return out
}

function unfilter(row, previous, bpp, filter) {
  for (let i = 0; i < row.length; i += 1) {
    const left = i >= bpp ? row[i - bpp] : 0
    const up = previous[i] ?? 0
    const upLeft = i >= bpp ? previous[i - bpp] : 0
    if (filter === 1) row[i] = (row[i] + left) & 255
    else if (filter === 2) row[i] = (row[i] + up) & 255
    else if (filter === 3) row[i] = (row[i] + Math.floor((left + up) / 2)) & 255
    else if (filter === 4) row[i] = (row[i] + paeth(left, up, upLeft)) & 255
    else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`)
  }
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}
