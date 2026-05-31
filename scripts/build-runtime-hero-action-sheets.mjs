/**
 * 把 generated-source/heroes/<class>/action-atlas-alpha.png（1254x1254 4x4 grid）
 * 切成 idle/walk/attack/death 4 张运行时 sheet（1536x384，每帧 384x384）。
 *
 * Atlas 行约定（docs/generated-hero-asset-log.md）：
 *   row 0 → idle
 *   row 1 → walk
 *   row 2 → attack
 *   row 3 → death
 *
 * 与 build-enemy-runtime 同套规则：每行 4 帧先求 union bbox，
 * 然后用单一缩放系数把内容塞进 contentBudget，所有帧脚底锚到统一 baseline，
 * 保证同一动作 4 帧间脚底不漂移、武器不跨帧。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceRoot = join(repoRoot, 'public/assets/game/generated-source/heroes')
const outRoot = join(repoRoot, 'public/assets/game/heroes')

const actions = ['idle', 'walk', 'attack', 'death']
const runtimeFrameSize = 384 // 2× 原 192：display ~245px → downscale，更锐利
const contentBudget = 336
const baselinePadding = 12

for (const slug of readdirSync(sourceRoot)) {
  // 优先用 alpha 版本（如果它真的有干净 alpha 通道），否则用 chroma 版本现场扣绿
  const alphaPath = join(sourceRoot, slug, 'action-atlas-alpha.png')
  const chromaPath = join(sourceRoot, slug, 'action-atlas-chroma.png')
  let atlas
  try {
    atlas = readPng(chromaPath)
  } catch (err) {
    try {
      atlas = readPng(alphaPath)
    } catch {
      console.warn(`[hero-sheets] skip ${slug}: ${err.message}`)
      continue
    }
  }

  const cellW = Math.floor(atlas.width / 4)
  const cellH = Math.floor(atlas.height / 4)
  const heroOut = join(outRoot, slug, 'runtime')
  mkdirSync(heroOut, { recursive: true })

  for (let row = 0; row < actions.length; row += 1) {
    const action = actions[row]
    const sheet = createImage(runtimeFrameSize * 4, runtimeFrameSize)

    const cleaned = []
    for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
      const x0 = frameIndex * cellW
      const y0 = row * cellH
      cleaned.push(extractCleanFrameWithBbox(atlas, x0, y0, cellW, cellH))
    }

    let unionMaxWidth = 1
    let unionMaxHeight = 1
    for (const cell of cleaned) {
      if (!cell.bbox) continue
      const w = cell.bbox.maxX - cell.bbox.minX + 1
      const h = cell.bbox.maxY - cell.bbox.minY + 1
      if (w > unionMaxWidth) unionMaxWidth = w
      if (h > unionMaxHeight) unionMaxHeight = h
    }
    const scale = Math.min(contentBudget / unionMaxWidth, contentBudget / unionMaxHeight, 1.2)
    const baselineY = runtimeFrameSize - baselinePadding

    for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
      const cell = cleaned[frameIndex]
      const placed = createImage(runtimeFrameSize, runtimeFrameSize)
      if (cell.bbox) {
        const cropW = cell.bbox.maxX - cell.bbox.minX + 1
        const cropH = cell.bbox.maxY - cell.bbox.minY + 1
        const cropped = cropImage(cell.image, cell.bbox.minX, cell.bbox.minY, cropW, cropH)
        const scaledW = Math.max(1, Math.round(cropW * scale))
        const scaledH = Math.max(1, Math.round(cropH * scale))
        const scaled = scaleBilinear(cropped, scaledW, scaledH)
        const dstX = Math.floor((runtimeFrameSize - scaledW) / 2)
        const dstY = baselineY - scaledH
        blit(placed, scaled, dstX, dstY)
      }
      blit(sheet, placed, frameIndex * runtimeFrameSize, 0)
    }

    writePng(join(heroOut, `${action}-sheet.png`), sheet)
  }

  console.log(`[hero-sheets] ${slug}: idle/walk/attack/death rebuilt → ${heroOut}`)
}

function extractCleanFrameWithBbox(source, x0, y0, cellW, cellH) {
  // 网格线安全边距：源图 cell 边缘 4px 内可能有绿色分隔线，强制透明
  const gridEdgeMargin = 4
  const cell = createImage(cellW, cellH)
  for (let y = 0; y < cellH; y += 1) {
    for (let x = 0; x < cellW; x += 1) {
      const srcIndex = ((y0 + y) * source.width + x0 + x) * 4
      const dstIndex = (y * cellW + x) * 4
      const r = source.data[srcIndex]
      const g = source.data[srcIndex + 1]
      const b = source.data[srcIndex + 2]
      const baseAlpha = source.data[srcIndex + 3]
      const inEdge = x < gridEdgeMargin || x >= cellW - gridEdgeMargin
        || y < gridEdgeMargin || y >= cellH - gridEdgeMargin
      const alpha = (inEdge || isGreenSpill(r, g, b)) ? 0 : baseAlpha
      const [cr, cg, cb] = alpha > 0 ? despillGreen(r, g, b) : [r, g, b]
      cell.data[dstIndex] = cr
      cell.data[dstIndex + 1] = cg
      cell.data[dstIndex + 2] = cb
      cell.data[dstIndex + 3] = alpha
    }
  }
  let bbox = null
  for (let y = 0; y < cellH; y += 1) {
    for (let x = 0; x < cellW; x += 1) {
      const alpha = cell.data[(y * cellW + x) * 4 + 3]
      if (alpha < 32) continue
      if (!bbox) bbox = { minX: x, minY: y, maxX: x, maxY: y }
      else {
        if (x < bbox.minX) bbox.minX = x
        if (x > bbox.maxX) bbox.maxX = x
        if (y < bbox.minY) bbox.minY = y
        if (y > bbox.maxY) bbox.maxY = y
      }
    }
  }
  return { image: cell, bbox }
}

function isGreenSpill(r, g, b) {
  return g > r + b + 1 || (g > 90 && g - r > 28 && g - b > 28)
}

function despillGreen(r, g, b) {
  if (g <= 70 || g - r <= 8 || g - b <= 8) return [r, g, b]
  const cap = Math.max(r, b)
  return [r, Math.min(g, cap), b]
}

function cropImage(source, x0, y0, width, height) {
  const out = createImage(width, height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = x0 + x
      const sy = y0 + y
      if (sx < 0 || sx >= source.width || sy < 0 || sy >= source.height) continue
      const srcIndex = (sy * source.width + sx) * 4
      const dstIndex = (y * width + x) * 4
      source.data.copy(out.data, dstIndex, srcIndex, srcIndex + 4)
    }
  }
  return out
}

function scaleNearest(source, width, height) {
  const out = createImage(width, height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(source.width - 1, Math.floor((x / width) * source.width))
      const sy = Math.min(source.height - 1, Math.floor((y / height) * source.height))
      const srcIndex = (sy * source.width + sx) * 4
      const dstIndex = (y * width + x) * 4
      source.data.copy(out.data, dstIndex, srcIndex, srcIndex + 4)
    }
  }
  return out
}

function scaleBilinear(source, width, height) {
  const out = createImage(width, height)
  const sw = source.width
  const sh = source.height
  for (let y = 0; y < height; y += 1) {
    const fy = ((y + 0.5) / height) * sh - 0.5
    const y0 = Math.max(0, Math.floor(fy))
    const y1 = Math.min(sh - 1, y0 + 1)
    const wy = Math.max(0, Math.min(1, fy - y0))
    for (let x = 0; x < width; x += 1) {
      const fx = ((x + 0.5) / width) * sw - 0.5
      const x0 = Math.max(0, Math.floor(fx))
      const x1 = Math.min(sw - 1, x0 + 1)
      const wx = Math.max(0, Math.min(1, fx - x0))
      const i00 = (y0 * sw + x0) * 4
      const i01 = (y0 * sw + x1) * 4
      const i10 = (y1 * sw + x0) * 4
      const i11 = (y1 * sw + x1) * 4
      const dst = (y * width + x) * 4
      for (let c = 0; c < 4; c += 1) {
        const top = source.data[i00 + c] * (1 - wx) + source.data[i01 + c] * wx
        const bot = source.data[i10 + c] * (1 - wx) + source.data[i11 + c] * wx
        out.data[dst + c] = Math.round(top * (1 - wy) + bot * wy)
      }
    }
  }
  return out
}

function createImage(width, height) {
  return { width, height, data: Buffer.alloc(width * height * 4) }
}

function blit(target, source, x0, y0) {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const tx = x0 + x
      const ty = y0 + y
      if (tx < 0 || tx >= target.width || ty < 0 || ty >= target.height) continue
      const srcIndex = (y * source.width + x) * 4
      const dstIndex = (ty * target.width + tx) * 4
      source.data.copy(target.data, dstIndex, srcIndex, srcIndex + 4)
    }
  }
}

function readPng(path) {
  const bytes = readFileSync(path)
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Invalid PNG: ${path}`)
  let offset = 8
  let width = 0
  let height = 0
  let colorType = 0
  const idat = []
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii')
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    offset += length + 12
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
  }
  if (colorType !== 2 && colorType !== 6) throw new Error(`Unsupported PNG color type ${colorType}: ${path}`)
  const channels = colorType === 6 ? 4 : 3
  const inflated = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const rawPrev = Buffer.alloc(stride)
  let inputOffset = 0
  const out = createImage(width, height)
  let previous = rawPrev
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++]
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride))
    inputOffset += stride
    unfilter(row, previous, channels, filter)
    if (channels === 4) {
      row.copy(out.data, y * width * 4)
    } else {
      // RGB → RGBA, 绿底像素稍后由 chroma key 处理
      for (let x = 0; x < width; x += 1) {
        const dst = (y * width + x) * 4
        out.data[dst] = row[x * 3]
        out.data[dst + 1] = row[x * 3 + 1]
        out.data[dst + 2] = row[x * 3 + 2]
        out.data[dst + 3] = 255
      }
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
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
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
