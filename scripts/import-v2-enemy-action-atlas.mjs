#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const [slug, sourceArg] = process.argv.slice(2)

if (!slug || !sourceArg) {
  console.error('Usage: node scripts/import-v2-enemy-action-atlas.mjs <slug> <source-4x4.png>')
  process.exit(1)
}

const source = resolve(sourceArg)
const tmpRoot = join(repoRoot, 'tmp/import-v2-enemy-action-atlas', slug)
const actions = ['idle', 'walk', 'attack', 'death']

rmSync(tmpRoot, { recursive: true, force: true })
mkdirSync(tmpRoot, { recursive: true })

const { width, height } = identify(source)
const rowH = Math.floor(height / 4)

for (let i = 0; i < actions.length; i += 1) {
  const y = i * rowH
  const cropH = i === actions.length - 1 ? height - y : rowH
  const row = join(tmpRoot, `${actions[i]}.png`)
  execFileSync('magick', [
    source,
    '-crop',
    `${width}x${cropH}+0+${y}`,
    '+repage',
    `png32:${row}`,
  ])
  execFileSync('node', [
    join(repoRoot, 'scripts/import-v2-enemy-action-sheet.mjs'),
    slug,
    actions[i],
    row,
  ], { stdio: 'inherit' })
}

rmSync(tmpRoot, { recursive: true, force: true })
console.log(`Imported ${slug} 4x4 v2 action atlas`)

function identify(path) {
  const out = execFileSync('magick', ['identify', '-format', '%w %h', path], { encoding: 'utf8' }).trim()
  const [w, h] = out.split(/\s+/).map(Number)
  if (!Number.isFinite(w) || !Number.isFinite(h)) throw new Error(`Cannot identify image: ${path}`)
  return { width: w, height: h }
}
