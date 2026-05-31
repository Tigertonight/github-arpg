/**
 * Audit per-frame bbox stability for runtime hero/enemy action sheets.
 *
 * For each sheet (FRAMES * FRAME_SIZE x FRAME_SIZE):
 *   - Computes alpha bbox per frame.
 *   - Reports baseline drift (max delta of bbox.bottom across frames).
 *   - Reports horizontal jitter (max delta of bbox.centerX across frames).
 *
 * Fails (exit 1) if any sheet exceeds the configured tolerance, so this can
 * gate the build script in CI.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const enemyRoot = join(repoRoot, 'public/assets/game/enemies/runtime')
const heroRoot = join(repoRoot, 'public/assets/game/heroes')

const FRAME_SIZE = 512
const FRAMES = 4
const ACTIONS = ['idle', 'walk', 'attack', 'death']
// 容忍：脚底（bottom）跨帧最多 16px 漂移；水平中心最多 80px（与 frameSize 等比放大）
const BASELINE_TOLERANCE = 16
const CENTER_TOLERANCE = 80

let failed = 0
let total = 0

const targets = []

for (const slug of readdirSync(enemyRoot)) {
  for (const action of ACTIONS) {
    const sheet = join(enemyRoot, slug, `${action}-sheet.png`)
    if (existsSync(sheet)) targets.push({ kind: 'enemy', slug, action, sheet })
  }
}

for (const slug of readdirSync(heroRoot)) {
  const runtimeDir = join(heroRoot, slug, 'runtime')
  if (!existsSync(runtimeDir) || !isDirectory(runtimeDir)) continue
  for (const action of ACTIONS) {
    const sheet = join(runtimeDir, `${action}-sheet.png`)
    if (existsSync(sheet)) targets.push({ kind: 'hero', slug, action, sheet })
  }
}

for (const t of targets) {
  const img = readPng(t.sheet)
  if (img.width !== FRAME_SIZE * FRAMES || img.height !== FRAME_SIZE) {
    console.warn(`[skip] ${t.kind}/${t.slug}/${t.action}: unexpected size ${img.width}x${img.height}`)
    continue
  }
  const bottoms = []
  const centers = []
  for (let f = 0; f < FRAMES; f += 1) {
    const bbox = bboxOfFrame(img, f * FRAME_SIZE, 0, FRAME_SIZE, FRAME_SIZE)
    if (!bbox) continue
    bottoms.push(bbox.maxY)
    centers.push((bbox.minX + bbox.maxX) / 2)
  }
  if (!bottoms.length) continue

  const baselineDrift = Math.max(...bottoms) - Math.min(...bottoms)
  const centerDrift = Math.max(...centers) - Math.min(...centers)
  total += 1

  const baselineFail = baselineDrift > BASELINE_TOLERANCE
  const centerFail = centerDrift > CENTER_TOLERANCE
  if (baselineFail || centerFail) {
    failed += 1
    console.error(
      `[fail] ${t.kind}/${t.slug}/${t.action}: baseline drift ${baselineDrift}px (limit ${BASELINE_TOLERANCE}), center drift ${centerDrift.toFixed(1)}px (limit ${CENTER_TOLERANCE})`,
    )
  }
}

console.log(`Frame stability audit: ${total - failed}/${total} sheets pass (baseline≤${BASELINE_TOLERANCE}px, center≤${CENTER_TOLERANCE}px)`)
if (failed > 0) {
  console.error(`${failed} sheets exceed tolerance.`)
  process.exit(1)
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

function existsSync(p) {
  try { statSync(p); return true } catch { return false }
}
function isDirectory(p) {
  try { return statSync(p).isDirectory() } catch { return false }
}

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
