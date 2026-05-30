import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const visualsSource = readFileSync(join(root, 'src/data/visuals.ts'), 'utf8')
const enemySource = readFileSync(join(root, 'src/data/enemies.ts'), 'utf8')
const assetRoot = join(root, 'public/assets/game')

const errors = []
const warnings = []

function assetPath(assetRef) {
  return join(root, 'public', assetRef.replace(/^\//, ''))
}

function exists(assetRef) {
  try {
    readFileSync(assetPath(assetRef))
    return true
  } catch {
    return false
  }
}

function pngInfo(file) {
  const bytes = readFileSync(file)
  if (bytes.readUInt32BE(0) !== 0x89504e47) return null
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
    hasAlpha: bytes[25] === 4 || bytes[25] === 6,
  }
}

function collectVisualAssetRefs() {
  const refs = new Set()
  const assetBaseRefs = visualsSource.matchAll(/\$\{gameAssetBase\}\/([^`']+)/g)
  for (const match of assetBaseRefs) {
    if (!match[1].includes('${') && /\.[a-z0-9]+$/i.test(match[1])) refs.add(`/assets/game/${match[1]}`)
  }
  const foregroundRefs = visualsSource.matchAll(/\$\{foregroundBase\}\/([^`']+)/g)
  for (const match of foregroundRefs) refs.add(`/assets/game/zones/foregrounds/${match[1]}`)
  const directRefs = visualsSource.matchAll(/['"]\/assets\/game\/([^'"]+)['"]/g)
  for (const match of directRefs) refs.add(`/assets/game/${match[1]}`)
  return [...refs].sort()
}

for (const ref of collectVisualAssetRefs()) {
  if (!exists(ref)) errors.push(`Missing visual registry asset: ${ref}`)
}

const enemyDefinitionsSource = enemySource.split('export const zones:')[0]
const enemyIds = [...enemyDefinitionsSource.matchAll(/id: '([^']+)'/g)].map((match) => match[1])
for (const enemyId of enemyIds) {
  const slug = enemyId.replaceAll('_', '-')
  for (const action of ['idle', 'walk', 'attack', 'death']) {
    const actionSheet = `/assets/game/enemies/specific/${slug}/${action}-sheet.png`
    if (!exists(actionSheet)) errors.push(`Missing enemy ${action} sheet for ${enemyId}: ${actionSheet}`)
  }
  const cleanWalk = `/assets/game/enemies/clean-native/${slug}/walk-sheet.png`
  if (!exists(cleanWalk)) errors.push(`Missing cleaned enemy walk sheet for ${enemyId}: ${cleanWalk}`)
  for (const action of ['idle', 'walk', 'attack', 'death']) {
    const runtimeSheet = `/assets/game/enemies/runtime/${slug}/${action}-sheet.png`
    if (!exists(runtimeSheet)) errors.push(`Missing runtime enemy ${action} sheet for ${enemyId}: ${runtimeSheet}`)
  }
}

for (const fileName of readdirSync(join(assetRoot, 'ui-icons'))) {
  if (!fileName.endsWith('.png')) continue
  const file = join(assetRoot, 'ui-icons', fileName)
  const info = pngInfo(file)
  if (!info) {
    errors.push(`UI icon is not a PNG: ${fileName}`)
    continue
  }
  if (info.width !== 256 || info.height !== 256) {
    errors.push(`UI icon must be 256x256: ${fileName} is ${info.width}x${info.height}`)
  }
  if (!info.hasAlpha) errors.push(`UI icon must have alpha channel: ${fileName}`)
}

function auditSheetFile(fileName, file, info) {
  if (fileName.includes('walk-sheet') && info.width % 4 !== 0) {
    errors.push(`Walk sheet width must divide into 4 frames: ${fileName} is ${info.width}x${info.height}`)
  }
  if (fileName.includes('attack-sheet') && info.width % 4 !== 0) {
    errors.push(`Attack sheet width must divide into 4 frames: ${fileName} is ${info.width}x${info.height}`)
  }
  if ((fileName.includes('idle-sheet') || fileName.includes('death-sheet')) && info.width % 4 !== 0) {
    errors.push(`Action sheet width must divide into 4 frames: ${fileName} is ${info.width}x${info.height}`)
  }
}

for (const fileName of readdirSync(assetRoot)) {
  if (!fileName.endsWith('.png')) continue
  const file = join(assetRoot, fileName)
  const info = pngInfo(file)
  if (!info) continue
  if (fileName.startsWith('enemy-')) auditSheetFile(fileName, file, info)
  if (fileName.includes('motion-sheet')) {
    warnings.push(`Motion sheet is source-only style; prefer explicit action sheets: ${fileName}`)
  }
}

for (const dir of ['heroes/oathbreaker', 'enemies/fallback']) {
  const absDir = join(assetRoot, dir)
  for (const fileName of readdirSync(absDir)) {
    if (!fileName.endsWith('.png')) continue
    const relName = `${dir}/${fileName}`
    const info = pngInfo(join(absDir, fileName))
    if (!info) continue
    auditSheetFile(relName, join(absDir, fileName), info)
    if (!info.hasAlpha) errors.push(`Generated action sheet must have alpha channel: ${relName}`)
  }
}

for (const enemyId of enemyIds) {
  const slug = enemyId.replaceAll('_', '-')
  for (const dir of [`enemies/specific/${slug}`, `enemies/clean/${slug}`, `enemies/clean-native/${slug}`, `enemies/runtime/${slug}`]) {
    const absDir = join(assetRoot, dir)
    for (const fileName of readdirSync(absDir)) {
      if (!fileName.endsWith('.png')) continue
      const relName = `${dir}/${fileName}`
      const info = pngInfo(join(absDir, fileName))
      if (!info) continue
      auditSheetFile(relName, join(absDir, fileName), info)
      const isNativeWalk = dir.includes('/clean-native/')
      if (!isNativeWalk && !dir.includes('/runtime/') && (info.width !== 512 || info.height !== 128)) {
        errors.push(`Enemy action sheet must be 512x128: ${relName} is ${info.width}x${info.height}`)
      }
      if (dir.includes('/runtime/') && (info.width !== 768 || info.height !== 192)) {
        errors.push(`Enemy runtime walk sheet must be 768x192: ${relName} is ${info.width}x${info.height}`)
      }
      if (isNativeWalk && info.width % 4 !== 0) {
        errors.push(`Enemy native clean walk sheet width must divide into 4 frames: ${relName} is ${info.width}x${info.height}`)
      }
      if (!info.hasAlpha) errors.push(`Enemy action sheet must have alpha channel: ${relName}`)
    }
  }
}

if (warnings.length) {
  console.log('Visual asset warnings:')
  for (const warning of warnings) console.log(`- ${warning}`)
}

if (errors.length) {
  console.error('Visual asset audit failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Visual asset audit passed: ${collectVisualAssetRefs().length} registry refs, ${enemyIds.length} enemies with specific action packs.`)
