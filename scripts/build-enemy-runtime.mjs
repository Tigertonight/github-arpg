#!/usr/bin/env node
/**
 * 阶段 2 核心切图：generated-source/enemies/<slug>/{action}.png (2048x512)
 *  → enemies/runtime/<slug>/{action}-sheet.png (2048x512)
 *
 * 设计原则（v2，对照 sprite-source-spec-v2）：
 *   1. 单次 Lanczos：源帧已是 512×512，bbox 缩放后唯一一次 magick resize → 输出
 *   2. 不强制 ! 拉伸：保比例，bbox 提主体
 *   3. 4 帧统一 scale + baseline：消除跨帧抖动
 *   4. alpha 形态学闭运算 + 主连通分量 + 头部召回：避免丢头/丢肢
 *
 * 用法：
 *   node scripts/build-enemy-runtime.mjs                    # 全量
 *   node scripts/build-enemy-runtime.mjs --only=slag-warden,bone-miner
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceRoot = join(repoRoot, 'public/assets/game/generated-source/enemies')
const outRoot = join(repoRoot, 'public/assets/game/enemies/runtime')

const ACTIONS = ['idle', 'walk', 'attack', 'death']
const SOURCE_FRAME = 512    // 源单帧
const RUNTIME_FRAME = 512   // runtime 单帧（与源同分辨率，避免上采样）
const FRAMES = 4
const CONTENT_BUDGET = Math.round(RUNTIME_FRAME * 0.83) // ~425
const BASELINE_PADDING = 24
const BASELINE_Y = RUNTIME_FRAME - BASELINE_PADDING

const onlyArg = process.argv.find((a) => a.startsWith('--only='))
const onlySet = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null

const magickTmpDir = mkdtempSync(join(tmpdir(), 'enemy-runtime-v2-'))
let magickCounter = 0

let slugs = []
try {
  slugs = readdirSync(sourceRoot).filter((s) => !s.startsWith('.') && isDir(join(sourceRoot, s)))
} catch {
  console.error(`Source root not found: ${sourceRoot}`)
  console.error('Drop sources at generated-source/enemies/<slug>/{idle,walk,attack,death}.png first.')
  process.exit(1)
}
if (onlySet) slugs = slugs.filter((s) => onlySet.has(s))

if (!slugs.length) {
  console.error('No slug directories matched.')
  process.exit(1)
}

let buildErrors = 0
for (const slug of slugs) {
  const slugDir = join(sourceRoot, slug)
  const outDir = join(outRoot, slug)
  mkdirSync(outDir, { recursive: true })
  console.log(`\n[${slug}]`)
  for (const action of ACTIONS) {
    const sourcePath = join(slugDir, `${action}.png`)
    if (!exists(sourcePath)) {
      console.error(`  ERROR ${action}: source missing ${sourcePath}`)
      buildErrors += 1
      continue
    }
    try {
      buildAction(slug, action, sourcePath, outDir)
      console.log(`  ok    ${action}`)
    } catch (err) {
      console.error(`  ERROR ${action}: ${err.message}`)
      buildErrors += 1
    }
  }
}

rmSync(magickTmpDir, { recursive: true, force: true })

if (buildErrors > 0) {
  console.error(`\n${buildErrors} action(s) failed.`)
  process.exit(1)
}
console.log(`\nBuilt runtime sheets for ${slugs.length} slug(s) at ${outRoot}`)

// ==================================================================
// 切图核心：一次 Lanczos
// ==================================================================

function buildAction(slug, action, sourcePath, outDir) {
  const source = readPng(sourcePath)
  if (source.width !== SOURCE_FRAME * FRAMES || source.height !== SOURCE_FRAME) {
    throw new Error(`source size ${source.width}x${source.height} ≠ ${SOURCE_FRAME * FRAMES}x${SOURCE_FRAME}`)
  }

  // 1) 每帧抠绿 + 形态学 + bbox
  const cells = []
  for (let f = 0; f < FRAMES; f += 1) {
    cells.push(extractFrame(source, f * SOURCE_FRAME, 0, SOURCE_FRAME))
  }

  const validCells = cells.filter((c) => c.bbox)
  if (!validCells.length) throw new Error('no valid frames after extraction')

  // 2) 4 帧统一 scale：以最大 bbox 撑满 contentBudget
  let maxW = 1, maxH = 1
  for (const c of validCells) {
    const w = c.bbox.maxX - c.bbox.minX + 1
    const h = c.bbox.maxY - c.bbox.minY + 1
    if (w > maxW) maxW = w
    if (h > maxH) maxH = h
  }
  // 不允许放大（源已是目标分辨率）：scale ≤ 1
  // 但若主体本身偏小，允许放大到 contentBudget
  const scale = Math.min(CONTENT_BUDGET / maxW, CONTENT_BUDGET / maxH)

  // 3) 单一 baseline：使用各帧 bbox.maxY 的最大值（最低脚底）
  //    其他帧上抬，但其相对躯干位置不变
  // 4) 横向锚点：每帧用躯干 bodyBbox 中心，避免武器横向甩动拉飞中心

  const sheet = createImage(RUNTIME_FRAME * FRAMES, RUNTIME_FRAME)

  for (let f = 0; f < FRAMES; f += 1) {
    const cell = cells[f]
    if (!cell.bbox) continue

    const cropW = cell.bbox.maxX - cell.bbox.minX + 1
    const cropH = cell.bbox.maxY - cell.bbox.minY + 1
    const cropped = cropImage(cell.image, cell.bbox.minX, cell.bbox.minY, cropW, cropH)

    const scaledW = Math.max(1, Math.round(cropW * scale))
    const scaledH = Math.max(1, Math.round(cropH * scale))
    const scaled = scaledW === cropW && scaledH === cropH
      ? cropped
      : scaleViaMagick(cropped, scaledW, scaledH)

    // 躯干中心相对 cropped 起点
    const bodyCenterInCrop = ((cell.bodyBbox.minX + cell.bodyBbox.maxX) / 2) - cell.bbox.minX
    const bodyCenterScaled = bodyCenterInCrop * scale
    let dstX = Math.round(RUNTIME_FRAME / 2 - bodyCenterScaled)
    if (dstX < 0) dstX = 0
    if (dstX + scaledW > RUNTIME_FRAME) dstX = RUNTIME_FRAME - scaledW

    const dstY = BASELINE_Y - scaledH

    blit(sheet, scaled, f * RUNTIME_FRAME + dstX, dstY)
  }

  writePng(join(outDir, `${action}-sheet.png`), sheet)
}

/**
 * 单帧抠绿 + 形态学闭运算 + 主体 bbox 提取。
 * 返回 { image: 抠绿后的 cell，bbox: 全主体含武器，bodyBbox: 仅躯干 }。
 */
function extractFrame(source, x0, y0, frameSize) {
  // 1) 抠绿：复制 cell，把 #00ff00 附近像素 alpha 设 0
  const cell = createImage(frameSize, frameSize)
  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const srcIdx = ((y0 + y) * source.width + x0 + x) * 4
      const dstIdx = (y * frameSize + x) * 4
      const r = source.data[srcIdx], g = source.data[srcIdx + 1], b = source.data[srcIdx + 2]
      const aIn = source.data[srcIdx + 3]
      const isGreen = isGreenChroma(r, g, b)
      const alpha = isGreen ? 0 : aIn
      const [rr, gg, bb] = alpha > 0 ? despillGreen(r, g, b) : [r, g, b]
      cell.data[dstIdx] = rr
      cell.data[dstIdx + 1] = gg
      cell.data[dstIdx + 2] = bb
      cell.data[dstIdx + 3] = alpha
    }
  }

  // 2) alpha 形态学闭运算（dilate→erode，半径 2）：把头/肩/武器之间的 1–3px 缝隙连起来
  const mask = buildAlphaMask(cell, 16)
  const closed = morphClose(mask, frameSize, frameSize, 2)

  // 3) 在 closed mask 上找连通分量
  const components = connectedComponentsFromMask(closed, frameSize, frameSize, cell)
  if (!components.length) return { image: cell, bbox: null, bodyBbox: null }

  const maxArea = components.reduce((m, c) => Math.max(m, c.area), 0)
  const primary = components
    .filter((c) => c.area >= maxArea * 0.18)
    .toSorted((a, b) => a.bbox.minY - b.bbox.minY || b.area - a.area)[0]
    ?? components.toSorted((a, b) => b.area - a.area)[0]

  // 4) 召回头/肩/武器：在主体上方或与之重叠的小分量
  const sideThresh = Math.max(2, Math.floor(frameSize / 64))
  const kept = components.filter((c) => {
    if (c === primary) return true
    const touchesSide = c.bbox.minX <= sideThresh || c.bbox.maxX >= frameSize - sideThresh - 1
    if (touchesSide) return false
    if (c.bbox.minY > primary.bbox.maxY + 4) return false // 主体下方碎片丢弃
    const isAbovePrimary = c.bbox.maxY < primary.bbox.minY
    const horizontalOverlap = c.bbox.minX <= primary.bbox.maxX && c.bbox.maxX >= primary.bbox.minX
    if (isAbovePrimary && horizontalOverlap) {
      const gap = primary.bbox.minY - c.bbox.maxY
      if (gap <= frameSize * 0.3 && c.area >= primary.area * 0.01) return true
    }
    if (c.area < primary.area * 0.04) return false
    return bboxDistance(c.bbox, primary.bbox) <= 8
  })

  // 5) 用 closed mask 决定保留像素，但写入原 cell 的色值（无透明伪影）
  const cleaned = createImage(frameSize, frameSize)
  let bbox = null
  for (const c of kept) {
    bbox = mergeBounds(bbox, c.bbox)
    for (const idx of c.pixels) {
      const off = idx * 4
      cell.data.copy(cleaned.data, off, off, off + 4)
    }
  }

  return { image: cleaned, bbox, bodyBbox: { ...primary.bbox } }
}

function isGreenChroma(r, g, b) {
  // 命中 #00ff00 附近：g 主导，r/b 都低
  if (g > 140 && g - r > 50 && g - b > 50) return true
  // 也命中暗一点的纯绿（防 jpeg/ai 输出毛刺）
  if (r < 80 && g > 150 && b < 80 && g - r > 70 && g - b > 70) return true
  return false
}

function despillGreen(r, g, b) {
  if (g <= 70 || g - r <= 8 || g - b <= 8) return [r, g, b]
  const cap = Math.max(r, b)
  return [r, Math.min(g, cap), b]
}

function buildAlphaMask(cell, alphaThresh) {
  const { width, height } = cell
  const mask = new Uint8Array(width * height)
  for (let i = 0; i < mask.length; i += 1) {
    mask[i] = cell.data[i * 4 + 3] > alphaThresh ? 1 : 0
  }
  return mask
}

function morphClose(mask, w, h, radius) {
  const dilated = dilate(mask, w, h, radius)
  return erode(dilated, w, h, radius)
}

function dilate(mask, w, h, r) {
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let hit = 0
      for (let dy = -r; dy <= r && !hit; dy += 1) {
        for (let dx = -r; dx <= r && !hit; dx += 1) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          if (mask[ny * w + nx]) hit = 1
        }
      }
      out[y * w + x] = hit
    }
  }
  return out
}

function erode(mask, w, h, r) {
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let all = 1
      for (let dy = -r; dy <= r && all; dy += 1) {
        for (let dx = -r; dx <= r && all; dx += 1) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) { all = 0; break }
          if (!mask[ny * w + nx]) all = 0
        }
      }
      out[y * w + x] = all
    }
  }
  return out
}

function connectedComponentsFromMask(mask, w, h, cell) {
  const visited = new Uint8Array(w * h)
  const components = []
  const queue = []
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const start = y * w + x
      if (visited[start] || !mask[start]) continue
      visited[start] = 1
      queue.length = 0
      queue.push(start)
      const pixels = []
      const bbox = { minX: x, minY: y, maxX: x, maxY: y }
      let head = 0
      while (head < queue.length) {
        const cur = queue[head++]
        // 只把"在原 cell 中实际有 alpha"的像素纳入 pixels（mask 是膨胀后的，多了一圈）
        if (cell.data[cur * 4 + 3] > 16) pixels.push(cur)
        const cx = cur % w, cy = Math.floor(cur / w)
        if (cx < bbox.minX) bbox.minX = cx
        if (cy < bbox.minY) bbox.minY = cy
        if (cx > bbox.maxX) bbox.maxX = cx
        if (cy > bbox.maxY) bbox.maxY = cy
        for (let ny = cy - 1; ny <= cy + 1; ny += 1) {
          for (let nx = cx - 1; nx <= cx + 1; nx += 1) {
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
            const nIdx = ny * w + nx
            if (visited[nIdx] || !mask[nIdx]) continue
            visited[nIdx] = 1
            queue.push(nIdx)
          }
        }
      }
      if (pixels.length >= 10) components.push({ pixels, bbox, area: pixels.length })
    }
  }
  return components
}

function mergeBounds(cur, next) {
  if (!cur) return { ...next }
  return {
    minX: Math.min(cur.minX, next.minX),
    minY: Math.min(cur.minY, next.minY),
    maxX: Math.max(cur.maxX, next.maxX),
    maxY: Math.max(cur.maxY, next.maxY),
  }
}

function bboxDistance(a, b) {
  const dx = a.maxX < b.minX ? b.minX - a.maxX : b.maxX < a.minX ? a.minX - b.maxX : 0
  const dy = a.maxY < b.minY ? b.minY - a.maxY : b.maxY < a.minY ? a.minY - b.maxY : 0
  return Math.hypot(dx, dy)
}

function cropImage(source, x0, y0, w, h) {
  const out = createImage(w, h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const sx = x0 + x, sy = y0 + y
      if (sx < 0 || sx >= source.width || sy < 0 || sy >= source.height) continue
      const sIdx = (sy * source.width + sx) * 4
      const dIdx = (y * w + x) * 4
      source.data.copy(out.data, dIdx, sIdx, sIdx + 4)
    }
  }
  return out
}

function scaleViaMagick(src, w, h) {
  const id = magickCounter++
  const inP = join(magickTmpDir, `in-${id}.png`)
  const outP = join(magickTmpDir, `out-${id}.png`)
  writePng(inP, src)
  execFileSync('magick', [inP, '-filter', 'Lanczos', '-resize', `${w}x${h}!`, `png32:${outP}`])
  return readPng(outP)
}

function blit(target, src, x0, y0) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const tx = x0 + x, ty = y0 + y
      if (tx < 0 || tx >= target.width || ty < 0 || ty >= target.height) continue
      const sIdx = (y * src.width + x) * 4
      const tIdx = (ty * target.width + tx) * 4
      // alpha blend：背景透明 + 源 alpha → 直接覆盖
      if (src.data[sIdx + 3] === 0) continue
      src.data.copy(target.data, tIdx, sIdx, sIdx + 4)
    }
  }
}

function createImage(w, h) {
  return { width: w, height: h, data: Buffer.alloc(w * h * 4) }
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
  if (!channels) throw new Error(`Unsupported color type ${colorType}`)
  const stride = width * channels
  const out = createImage(width, height)
  let inputOffset = 0
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++]
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride))
    inputOffset += stride
    unfilter(row, previous, channels, filter)
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

function writePng(path, image) {
  const stride = image.width * 4
  const raw = Buffer.alloc((stride + 1) * image.height)
  for (let y = 0; y < image.height; y += 1) {
    raw[y * (stride + 1)] = 0
    image.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const chunks = [
    chunk('IHDR', ihdr(image.width, image.height)),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]
  writeFileSync(path, Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), ...chunks]))
}

function ihdr(width, height) {
  const data = Buffer.alloc(13)
  data.writeUInt32BE(width, 0)
  data.writeUInt32BE(height, 4)
  data[8] = 8
  data[9] = 6
  return data
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([length, typeBytes, data, crc])
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
