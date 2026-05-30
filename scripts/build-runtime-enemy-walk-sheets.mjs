import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceRoot = join(repoRoot, 'public/assets/game/enemies/specific')
const outRoot = join(repoRoot, 'public/assets/game/enemies/runtime')

const actions = ['idle', 'walk', 'attack', 'death']
const sourceFrameSize = 128
const runtimeFrameSize = 192
const contentSize = 160

for (const slug of readdirSync(sourceRoot)) {
  const enemyOut = join(outRoot, slug)
  mkdirSync(enemyOut, { recursive: true })

  for (const action of actions) {
    const sourcePath = join(sourceRoot, slug, `${action}-sheet.png`)
    const source = readPng(sourcePath)
    const sheet = createImage(runtimeFrameSize * 4, runtimeFrameSize)

    for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
      const frame = extractCleanFrame(source, frameIndex * sourceFrameSize, 0)
      const scaled = scaleNearest(frame, contentSize, contentSize)
      const placed = createImage(runtimeFrameSize, runtimeFrameSize)
      blit(placed, scaled, Math.floor((runtimeFrameSize - contentSize) / 2), runtimeFrameSize - contentSize - 6)
      blit(sheet, placed, frameIndex * runtimeFrameSize, 0)
    }

    writePng(join(enemyOut, `${action}-sheet.png`), sheet)
  }
}

console.log(`Built runtime enemy action sheets in ${outRoot}`)

function extractCleanFrame(source, x0, y0) {
  const cell = createImage(sourceFrameSize, sourceFrameSize)
  for (let y = 0; y < sourceFrameSize; y += 1) {
    for (let x = 0; x < sourceFrameSize; x += 1) {
      const srcIndex = ((y0 + y) * source.width + x0 + x) * 4
      const dstIndex = (y * sourceFrameSize + x) * 4
      const r = source.data[srcIndex]
      const g = source.data[srcIndex + 1]
      const b = source.data[srcIndex + 2]
      const alpha = isGreenSpill(r, g, b) ? 0 : source.data[srcIndex + 3]
      cell.data[dstIndex] = r
      cell.data[dstIndex + 1] = g
      cell.data[dstIndex + 2] = b
      cell.data[dstIndex + 3] = alpha
    }
  }

  const components = connectedComponents(cell, 20).filter((component) => component.area >= 10)
  if (!components.length) return cell
  const primary = components.toSorted((a, b) => b.area - a.area)[0]
  const kept = components.filter((component) => {
    if (component === primary) return true
    const touchesSide = component.bbox.minX <= 2 || component.bbox.maxX >= sourceFrameSize - 3
    if (touchesSide) return false
    return component.area >= primary.area * 0.12
  })

  const cleaned = createImage(sourceFrameSize, sourceFrameSize)
  let bbox = null
  for (const component of kept) {
    bbox = mergeBounds(bbox, component.bbox)
    for (const pixelIndex of component.pixels) {
      const index = pixelIndex * 4
      cell.data.copy(cleaned.data, index, index, index + 4)
    }
  }
  if (!bbox) return cleaned

  const out = createImage(sourceFrameSize, sourceFrameSize)
  const width = bbox.maxX - bbox.minX + 1
  const height = bbox.maxY - bbox.minY + 1
  const dx = Math.floor((sourceFrameSize - width) / 2)
  const dy = Math.max(0, sourceFrameSize - height - 6)

  for (let y = bbox.minY; y <= bbox.maxY; y += 1) {
    for (let x = bbox.minX; x <= bbox.maxX; x += 1) {
      const srcIndex = (y * sourceFrameSize + x) * 4
      if (cleaned.data[srcIndex + 3] < 20) continue
      const tx = dx + x - bbox.minX
      const ty = dy + y - bbox.minY
      const dstIndex = (ty * sourceFrameSize + tx) * 4
      cleaned.data.copy(out.data, dstIndex, srcIndex, srcIndex + 4)
    }
  }
  return out
}

function isGreenSpill(r, g, b) {
  return g > r + b + 1 || (g > 90 && g - r > 28 && g - b > 28)
}

function mergeBounds(current, next) {
  if (!current) return { ...next }
  return {
    minX: Math.min(current.minX, next.minX),
    minY: Math.min(current.minY, next.minY),
    maxX: Math.max(current.maxX, next.maxX),
    maxY: Math.max(current.maxY, next.maxY),
  }
}

function connectedComponents(image, alphaThreshold) {
  const visited = new Uint8Array(image.width * image.height)
  const components = []
  const queue = []
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const start = y * image.width + x
      if (visited[start] || image.data[start * 4 + 3] < alphaThreshold) continue
      visited[start] = 1
      queue.length = 0
      queue.push(start)
      const pixels = []
      const bbox = { minX: x, minY: y, maxX: x, maxY: y }
      let head = 0
      while (head < queue.length) {
        const current = queue[head++]
        pixels.push(current)
        const cx = current % image.width
        const cy = Math.floor(current / image.width)
        if (cx < bbox.minX) bbox.minX = cx
        if (cy < bbox.minY) bbox.minY = cy
        if (cx > bbox.maxX) bbox.maxX = cx
        if (cy > bbox.maxY) bbox.maxY = cy
        for (let ny = cy - 1; ny <= cy + 1; ny += 1) {
          for (let nx = cx - 1; nx <= cx + 1; nx += 1) {
            if (nx < 0 || nx >= image.width || ny < 0 || ny >= image.height) continue
            const next = ny * image.width + nx
            if (visited[next] || image.data[next * 4 + 3] < alphaThreshold) continue
            visited[next] = 1
            queue.push(next)
          }
        }
      }
      components.push({ pixels, bbox, area: pixels.length })
    }
  }
  return components
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
  if (colorType !== 6) throw new Error(`Expected RGBA PNG: ${path}`)
  const inflated = inflateSync(Buffer.concat(idat))
  const stride = width * 4
  const out = createImage(width, height)
  let inputOffset = 0
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++]
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride))
    inputOffset += stride
    unfilter(row, previous, 4, filter)
    row.copy(out.data, y * stride)
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
