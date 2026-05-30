import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const atlasDir = join(repoRoot, 'public/assets/game/generated-source/enemy-specific-atlases')
const outRoot = join(repoRoot, 'public/assets/game/enemies/specific')
const tmpRoot = join(repoRoot, 'public/assets/game/generated-source/enemy-specific-atlases/tmp-cells')

const cellSize = 128
const actionColumns = {
  idle: [0, 1, 2, 3],
  walk: [4, 5, 6, 7],
  attack: [8, 9, 10, 11],
  death: [12, 13, 14, 15],
}

const groups = [
  { atlas: 'group-01-chroma.png', rows: ['bone_miner', 'rust_hound', 'coal_cultist', 'black_forge_guard', 'vein_butcher', 'furnace_brute', 'ember_imp', 'slag_warden'] },
  { atlas: 'group-02-chroma.png', rows: ['pale_chorister', 'crow_acolyte', 'glasswraith', 'silenced_cantor', 'bone_legion', 'marrow_drake', 'gravewright', 'cardinal_husk'] },
  { atlas: 'group-03-chroma.png', rows: ['frost_stalker', 'pale_pilgrim', 'winter_throat', 'iron_caravaneer', 'frostforge_warden', 'crimson_hound', 'vow_handmaiden', 'gargoyle_warden'] },
  { atlas: 'group-04-chroma.png', rows: ['lady_of_red_vow', 'tomb_revenant', 'mirror_widow', 'lord_of_kept_oaths', 'oath_brander', 'chained_titan', 'wyrm_of_broken_word', 'forge_serpent'] },
  { atlas: 'group-05-chroma.png', rows: ['the_first_oathbreaker', null, 'forgeheart_ember', null, null, null, null, null] },
]

rmSync(tmpRoot, { recursive: true, force: true })
mkdirSync(tmpRoot, { recursive: true })
mkdirSync(outRoot, { recursive: true })

for (const group of groups) {
  const normalized = join(tmpRoot, group.atlas.replace('-chroma.png', '-normalized.png'))
  execFileSync('magick', [join(atlasDir, group.atlas), '-resize', '2048x1024!', `png32:${normalized}`])
  const atlas = readPng(normalized)

  group.rows.forEach((enemyId, rowIndex) => {
    if (!enemyId) return

    const slug = enemyId.replaceAll('_', '-')
    const enemyDir = join(outRoot, slug)
    mkdirSync(enemyDir, { recursive: true })

    Object.entries(actionColumns).forEach(([action, columns]) => {
      const sheet = createImage(cellSize * 4, cellSize)
      columns.forEach((columnIndex, frameIndex) => {
        const frame = extractCleanFrame(atlas, columnIndex * cellSize, rowIndex * cellSize)
        blit(sheet, frame, frameIndex * cellSize, 0)
      })
      writePng(join(enemyDir, `${action}-sheet.png`), sheet)
    })
  })
}

buildSingleEnemySheet('the_first_oathbreaker', 'the-first-oathbreaker-single-chroma.png')
buildCleanWalkSheets()
buildNativeCleanWalkSheets()

rmSync(tmpRoot, { recursive: true, force: true })
console.log('Built enemy-specific sheets for 34 enemies.')

function buildCleanWalkSheets() {
  const enemyIds = [...new Set(groups.flatMap((group) => group.rows).filter(Boolean))]
  const cleanRoot = join(repoRoot, 'public/assets/game/enemies/clean')

  for (const enemyId of enemyIds) {
    const slug = enemyId.replaceAll('_', '-')
    const source = join(repoRoot, `public/assets/game/enemy-${slug}-walk-sheet.png`)
    const normalized = join(tmpRoot, `${slug}-walk-normalized.png`)
    execFileSync('magick', [source, '-resize', '512x128!', `png32:${normalized}`])
    const sheetSource = readPng(normalized)
    const sheet = createImage(cellSize * 4, cellSize)
    for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
      const frame = extractCleanFrame(sheetSource, columnIndex * cellSize, 0)
      blit(sheet, frame, columnIndex * cellSize, 0)
    }
    const enemyDir = join(cleanRoot, slug)
    mkdirSync(enemyDir, { recursive: true })
    writePng(join(enemyDir, 'walk-sheet.png'), sheet)
  }
}

function buildNativeCleanWalkSheets() {
  const enemyIds = [...new Set(groups.flatMap((group) => group.rows).filter(Boolean))]
  const cleanRoot = join(repoRoot, 'public/assets/game/enemies/clean-native')

  for (const enemyId of enemyIds) {
    const slug = enemyId.replaceAll('_', '-')
    const source = join(repoRoot, `public/assets/game/enemy-${slug}-walk-sheet.png`)
    const normalized = join(tmpRoot, `${slug}-walk-native-normalized.png`)
    execFileSync('magick', [source, `png32:${normalized}`])
    const sourceSheet = readPng(normalized)
    const frameW = Math.floor(sourceSheet.width / 4)
    const frameH = sourceSheet.height
    const out = createImage(frameW * 4, frameH)

    for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
      const frame = extractNativeCleanFrame(sourceSheet, columnIndex * frameW, 0, frameW, frameH)
      blit(out, frame, columnIndex * frameW, 0)
    }

    const enemyDir = join(cleanRoot, slug)
    mkdirSync(enemyDir, { recursive: true })
    writePng(join(enemyDir, 'walk-sheet.png'), out)
  }
}

function extractNativeCleanFrame(src, x0, y0, frameW, frameH) {
  const frame = createImage(frameW, frameH)
  for (let y = 0; y < frameH; y += 1) {
    for (let x = 0; x < frameW; x += 1) {
      const srcIndex = ((y0 + y) * src.width + (x0 + x)) * 4
      const dstIndex = (y * frameW + x) * 4
      src.data.copy(frame.data, dstIndex, srcIndex, srcIndex + 4)
    }
  }

  const components = connectedComponents(frame, 20).filter((component) => component.area >= 12)
  if (!components.length) return frame

  const primary = components.toSorted((a, b) => b.area - a.area)[0]
  const cleaned = createImage(frameW, frameH)
  for (const component of components) {
    const touchesSide = component.bbox.minX <= 2 || component.bbox.maxX >= frameW - 3
    const smallRelativeToBody = component.area < primary.area * 0.55
    if (component !== primary && touchesSide && smallRelativeToBody) continue

    for (const pixelIndex of component.pixels) {
      const srcIndex = pixelIndex * 4
      frame.data.copy(cleaned.data, srcIndex, srcIndex, srcIndex + 4)
    }
  }
  return cleaned
}

function buildSingleEnemySheet(enemyId, atlasName) {
  const normalized = join(tmpRoot, `${enemyId}-single-normalized.png`)
  execFileSync('magick', [join(atlasDir, atlasName), '-resize', '1024x1024!', `png32:${normalized}`])
  const atlas = readPng(normalized)
  const slug = enemyId.replaceAll('_', '-')
  const enemyDir = join(outRoot, slug)
  mkdirSync(enemyDir, { recursive: true })

  Object.entries({ idle: 0, walk: 1, attack: 2, death: 3 }).forEach(([action, rowIndex]) => {
    const sheet = createImage(cellSize * 4, cellSize)
    for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
      const largeFrame = extractSingleFrame(atlas, columnIndex * 256, rowIndex * 256)
      blit(sheet, largeFrame, columnIndex * cellSize, 0)
    }
    writePng(join(enemyDir, `${action}-sheet.png`), sheet)
  })
}

function extractSingleFrame(src, x0, y0) {
  const sourceSize = 256
  const cell = createImage(sourceSize, sourceSize)
  for (let y = 0; y < sourceSize; y += 1) {
    for (let x = 0; x < sourceSize; x += 1) {
      const srcIndex = ((y0 + y) * src.width + (x0 + x)) * 4
      const dstIndex = (y * sourceSize + x) * 4
      const r = src.data[srcIndex]
      const g = src.data[srcIndex + 1]
      const b = src.data[srcIndex + 2]
      cell.data[dstIndex] = r
      cell.data[dstIndex + 1] = g
      cell.data[dstIndex + 2] = b
      cell.data[dstIndex + 3] = isChromaGreen(r, g, b) ? 0 : src.data[srcIndex + 3]
    }
  }

  const bbox = alphaBounds(cell)
  if (!bbox) return createImage(cellSize, cellSize)
  const scale = Math.min(124 / (bbox.maxX - bbox.minX + 1), 124 / (bbox.maxY - bbox.minY + 1), 1)
  const out = createImage(cellSize, cellSize)
  const scaledW = Math.max(1, Math.round((bbox.maxX - bbox.minX + 1) * scale))
  const scaledH = Math.max(1, Math.round((bbox.maxY - bbox.minY + 1) * scale))
  const dx = Math.floor((cellSize - scaledW) / 2)
  const dy = Math.max(0, cellSize - scaledH - 4)

  for (let ty = 0; ty < scaledH; ty += 1) {
    for (let tx = 0; tx < scaledW; tx += 1) {
      const sx = bbox.minX + Math.min(bbox.maxX - bbox.minX, Math.floor(tx / scale))
      const sy = bbox.minY + Math.min(bbox.maxY - bbox.minY, Math.floor(ty / scale))
      const srcIndex = (sy * sourceSize + sx) * 4
      if (cell.data[srcIndex + 3] === 0) continue
      const dstIndex = ((dy + ty) * cellSize + dx + tx) * 4
      out.data[dstIndex] = cell.data[srcIndex]
      out.data[dstIndex + 1] = cell.data[srcIndex + 1]
      out.data[dstIndex + 2] = cell.data[srcIndex + 2]
      out.data[dstIndex + 3] = cell.data[srcIndex + 3]
    }
  }

  return out
}

function alphaBounds(image) {
  const bbox = { minX: image.width - 1, minY: image.height - 1, maxX: 0, maxY: 0 }
  let found = false
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] < 20) continue
      found = true
      if (x < bbox.minX) bbox.minX = x
      if (y < bbox.minY) bbox.minY = y
      if (x > bbox.maxX) bbox.maxX = x
      if (y > bbox.maxY) bbox.maxY = y
    }
  }
  return found ? bbox : null
}

function extractCleanFrame(src, x0, y0) {
  const cell = createImage(cellSize, cellSize)
  for (let y = 0; y < cellSize; y += 1) {
    for (let x = 0; x < cellSize; x += 1) {
      const srcIndex = ((y0 + y) * src.width + (x0 + x)) * 4
      const dstIndex = (y * cellSize + x) * 4
      const r = src.data[srcIndex]
      const g = src.data[srcIndex + 1]
      const b = src.data[srcIndex + 2]
      const alpha = isChromaGreen(r, g, b) ? 0 : src.data[srcIndex + 3]
      cell.data[dstIndex] = r
      cell.data[dstIndex + 1] = g
      cell.data[dstIndex + 2] = b
      cell.data[dstIndex + 3] = alpha
    }
  }

  const components = findKeptComponents(cell)
  if (!components.length) return cell

  const cleaned = createImage(cellSize, cellSize)
  const bbox = { minX: cellSize - 1, minY: cellSize - 1, maxX: 0, maxY: 0 }
  for (const component of components) {
    if (component.bbox.minX < bbox.minX) bbox.minX = component.bbox.minX
    if (component.bbox.minY < bbox.minY) bbox.minY = component.bbox.minY
    if (component.bbox.maxX > bbox.maxX) bbox.maxX = component.bbox.maxX
    if (component.bbox.maxY > bbox.maxY) bbox.maxY = component.bbox.maxY
    for (const pixelIndex of component.pixels) {
      const srcIndex = pixelIndex * 4
      cleaned.data[srcIndex] = cell.data[srcIndex]
      cleaned.data[srcIndex + 1] = cell.data[srcIndex + 1]
      cleaned.data[srcIndex + 2] = cell.data[srcIndex + 2]
      cleaned.data[srcIndex + 3] = cell.data[srcIndex + 3]
    }
  }

  const trimmedW = bbox.maxX - bbox.minX + 1
  const trimmedH = bbox.maxY - bbox.minY + 1
  const out = createImage(cellSize, cellSize)
  const dx = Math.floor((cellSize - trimmedW) / 2)
  const dy = Math.max(0, cellSize - trimmedH - 6)

  for (let y = bbox.minY; y <= bbox.maxY; y += 1) {
    for (let x = bbox.minX; x <= bbox.maxX; x += 1) {
      const srcIndex = (y * cellSize + x) * 4
      if (cleaned.data[srcIndex + 3] === 0) continue
      const tx = dx + x - bbox.minX
      const ty = dy + y - bbox.minY
      if (tx < 0 || tx >= cellSize || ty < 0 || ty >= cellSize) continue
      const dstIndex = (ty * cellSize + tx) * 4
      out.data[dstIndex] = cleaned.data[srcIndex]
      out.data[dstIndex + 1] = cleaned.data[srcIndex + 1]
      out.data[dstIndex + 2] = cleaned.data[srcIndex + 2]
      out.data[dstIndex + 3] = cleaned.data[srcIndex + 3]
    }
  }

  return out
}

function isChromaGreen(r, g, b) {
  return g > 105 && g - r > 34 && g - b > 34
}

function findKeptComponents(image) {
  const components = connectedComponents(image, 20).filter((component) => component.area >= 8)
  if (!components.length) return []

  const primary = components.toSorted((a, b) => b.area - a.area)[0]
  const primaryCx = (primary.bbox.minX + primary.bbox.maxX) / 2
  const primaryCy = (primary.bbox.minY + primary.bbox.maxY) / 2

  return components.filter((component) => {
    if (component === primary) return true
    const cx = (component.bbox.minX + component.bbox.maxX) / 2
    const cy = (component.bbox.minY + component.bbox.maxY) / 2
    const nearPrimary = Math.hypot(cx - primaryCx, cy - primaryCy) < 58
    const meaningfulEffect = component.area > primary.area * 0.18 && component.area > 24
    const edgeShard = component.area < 64 && (component.bbox.maxX < 12 || component.bbox.minX > 116 || component.bbox.maxY < 10)
    return !edgeShard && (nearPrimary || meaningfulEffect)
  })
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

function createImage(width, height) {
  return { width, height, data: Buffer.alloc(width * height * 4) }
}

function blit(target, source, x0, y0) {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const srcIndex = (y * source.width + x) * 4
      const dstIndex = ((y0 + y) * target.width + (x0 + x)) * 4
      source.data.copy(target.data, dstIndex, srcIndex, srcIndex + 4)
    }
  }
}

function readPng(path) {
  const bytes = readFileSync(path)
  const signature = bytes.subarray(0, 8)
  if (signature.toString('hex') !== '89504e470d0a1a0a') throw new Error(`Invalid PNG: ${path}`)

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
      if (data[8] !== 8 || data[12] !== 0) throw new Error(`Unsupported PNG format: ${path}`)
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
  }

  if (colorType !== 6) throw new Error(`Expected RGBA PNG from ImageMagick png32 output: ${path}`)
  const inflated = inflateSync(Buffer.concat(idat))
  const bpp = 4
  const stride = width * bpp
  const out = createImage(width, height)
  let inputOffset = 0
  let previous = Buffer.alloc(stride)

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++]
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride))
    inputOffset += stride
    unfilter(row, previous, bpp, filter)
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
  data[10] = 0
  data[11] = 0
  data[12] = 0
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
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}
