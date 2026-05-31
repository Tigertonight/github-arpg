#!/usr/bin/env node
/**
 * 阶段 2 硬阻断：检查 enemies/runtime/<slug>/*-sheet.png
 * 不达标退出码 1，CI/build 钩子据此阻断进入游戏。
 *
 * 检查项（与 sprite-source-spec-v2 对应）：
 *   - 尺寸 = 2048×512
 *   - 4 帧 baseline drift ≤ 16 px
 *   - 4 帧 center drift ≤ 80 px
 *   - 头顶留白 ≥ 8%（防截头）
 *   - 主体不触帧边界（防裁切）
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const runtimeRoot = join(repoRoot, 'public/assets/game/enemies/runtime')

const FRAME = 512
const FRAMES = 4
const EXPECTED_W = FRAME * FRAMES
const EXPECTED_H = FRAME
const ACTIONS = ['idle', 'walk', 'attack', 'death']
const BASELINE_TOLERANCE = 16
const CENTER_TOLERANCE = 80
const TOP_CLEARANCE_MIN = Math.floor(FRAME * 0.08) // 8% = 41 px
const EDGE_PAD_MIN = 8

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const RESET = '\x1b[0m'

const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1]

let slugs
try {
  slugs = readdirSync(runtimeRoot).filter((s) => !s.startsWith('.') && isDir(join(runtimeRoot, s)))
} catch {
  console.error(`Runtime root not found: ${runtimeRoot}`)
  process.exit(1)
}
if (slugArg) slugs = slugs.filter((s) => s === slugArg)

let totalFail = 0
let totalPass = 0

for (const slug of slugs) {
  for (const action of ACTIONS) {
    const path = join(runtimeRoot, slug, `${action}-sheet.png`)
    if (!exists(path)) {
      console.error(`${RED}FAIL${RESET} ${slug}/${action}: sheet missing`)
      totalFail += 1
      continue
    }
    const errs = auditSheet(path)
    if (errs.length) {
      totalFail += 1
      console.error(`${RED}FAIL${RESET} ${slug}/${action}:`)
      for (const e of errs) console.error(`       ${e}`)
    } else {
      totalPass += 1
    }
  }
}

console.log(`\n${totalPass} pass, ${totalFail} fail`)
if (totalFail > 0) {
  console.error(`${RED}${totalFail} sheets exceed tolerance.${RESET}`)
  process.exit(1)
}
console.log(`${GREEN}All runtime sheets pass.${RESET}`)

function auditSheet(path) {
  const errs = []
  let img
  try { img = readPng(path) } catch (err) {
    errs.push(`cannot read PNG: ${err.message}`)
    return errs
  }
  if (img.width !== EXPECTED_W || img.height !== EXPECTED_H) {
    errs.push(`size ${img.width}x${img.height} ≠ ${EXPECTED_W}x${EXPECTED_H}`)
    return errs
  }
  const bottoms = [], centers = [], tops = []
  const bboxes = []
  for (let f = 0; f < FRAMES; f += 1) {
    const bbox = bboxOfFrame(img, f * FRAME, 0, FRAME, FRAME)
    if (!bbox) {
      errs.push(`frame ${f}: empty (no opaque pixels)`)
      continue
    }
    bboxes.push({ frame: f, bbox })
    bottoms.push(bbox.maxY)
    centers.push((bbox.minX + bbox.maxX) / 2)
    tops.push(bbox.minY)
  }
  if (!bottoms.length) return errs

  const baselineDrift = Math.max(...bottoms) - Math.min(...bottoms)
  if (baselineDrift > BASELINE_TOLERANCE) {
    errs.push(`baseline drift ${baselineDrift}px > ${BASELINE_TOLERANCE}px`)
  }
  const centerDrift = Math.max(...centers) - Math.min(...centers)
  if (centerDrift > CENTER_TOLERANCE) {
    errs.push(`center drift ${centerDrift.toFixed(1)}px > ${CENTER_TOLERANCE}px`)
  }
  const minTop = Math.min(...tops)
  if (minTop < TOP_CLEARANCE_MIN) {
    errs.push(`top clearance ${minTop}px < ${TOP_CLEARANCE_MIN}px (likely beheaded)`)
  }
  for (const { frame, bbox } of bboxes) {
    const leftPad = bbox.minX
    const rightPad = FRAME - 1 - bbox.maxX
    if (leftPad < EDGE_PAD_MIN) errs.push(`frame ${frame}: left edge touch (pad=${leftPad}px)`)
    if (rightPad < EDGE_PAD_MIN) errs.push(`frame ${frame}: right edge touch (pad=${rightPad}px)`)
  }
  return errs
}

function bboxOfFrame(img, x0, y0, w, h) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = ((y0 + y) * img.width + x0 + x) * 4 + 3
      if (img.data[idx] < 32) continue
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
  if (colorType !== 6) throw new Error(`Expected RGBA: ${path}`)
  const inflated = inflateSync(Buffer.concat(idat))
  const stride = width * 4
  const out = { width, height, data: Buffer.alloc(width * height * 4) }
  let inputOffset = 0
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++]
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride))
    inputOffset += stride
    for (let i = 0; i < row.length; i += 1) {
      const left = i >= 4 ? row[i - 4] : 0
      const up = previous[i] ?? 0
      const upLeft = i >= 4 ? previous[i - 4] : 0
      if (filter === 1) row[i] = (row[i] + left) & 255
      else if (filter === 2) row[i] = (row[i] + up) & 255
      else if (filter === 3) row[i] = (row[i] + Math.floor((left + up) / 2)) & 255
      else if (filter === 4) row[i] = (row[i] + paeth(left, up, upLeft)) & 255
      else if (filter !== 0) throw new Error(`Unsupported filter ${filter}`)
    }
    row.copy(out.data, y * stride)
    previous = row
  }
  return out
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}
