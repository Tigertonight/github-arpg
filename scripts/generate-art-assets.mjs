import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const root = new URL('..', import.meta.url)
const outDir = new URL('public/assets/game/', root)
const tmpDir = new URL('file:///private/tmp/github-arpg-artgen/')

async function run(args) {
  await exec('magick', args, { cwd: root.pathname, maxBuffer: 1024 * 1024 * 8 })
}

async function svgToPng(name, width, height, body) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff1b8"/><stop offset="0.35" stop-color="#b97931"/><stop offset="1" stop-color="#3b2110"/>
  </linearGradient>
  <linearGradient id="blood" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffb3a2"/><stop offset="0.38" stop-color="#d92323"/><stop offset="1" stop-color="#4c0709"/>
  </linearGradient>
  <radialGradient id="ember" cx="50%" cy="48%" r="58%">
    <stop offset="0" stop-color="#fff0a8"/><stop offset="0.32" stop-color="#ff8a2f"/><stop offset="0.68" stop-color="#8b1e12"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="violet" cx="48%" cy="48%" r="62%">
    <stop offset="0" stop-color="#f6d184"/><stop offset="0.3" stop-color="#7b3cff"/><stop offset="0.68" stop-color="#18071f"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
</defs>
${body}
</svg>`
  const svgPath = new URL(`${name}.svg`, tmpDir)
  await writeFile(svgPath, svg)
  await run(['-background', 'none', svgPath.pathname, new URL(name, outDir).pathname])
}

async function svgToTmpPng(name, width, height, body) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <radialGradient id="ember" cx="50%" cy="48%" r="58%">
    <stop offset="0" stop-color="#fff0a8"/><stop offset="0.32" stop-color="#ff8a2f"/><stop offset="0.68" stop-color="#8b1e12"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
</defs>
${body}
</svg>`
  const svgPath = new URL(`${name}.svg`, tmpDir)
  const pngPath = new URL(name, tmpDir)
  await writeFile(svgPath, svg)
  await run(['-background', 'none', svgPath.pathname, pngPath.pathname])
  return pngPath.pathname
}

const enemySourceFiles = {
  bone_miner: 'enemy-bone-miner.png',
  coal_cultist: 'enemy-coal-cultist.png',
  rust_hound: 'enemy-rust-hound.png',
  black_forge_guard: 'enemy-black-forge-guard.png',
  vein_butcher: 'boss-vein-butcher.png',
  furnace_brute: 'enemy-furnace-brute.png',
  ember_imp: 'enemy-ember-imp.png',
  slag_warden: 'enemy-slag-warden.png',
  forgeheart_ember: 'boss-forgeheart-ember.png',
  pale_chorister: 'enemy-pale-chorister.png',
  crow_acolyte: 'enemy-crow-acolyte.png',
  glasswraith: 'enemy-glasswraith.png',
  silenced_cantor: 'boss-silenced-cantor.png',
  bone_legion: 'enemy-bone-legion.png',
  marrow_drake: 'enemy-marrow-drake.png',
  gravewright: 'enemy-gravewright.png',
  cardinal_husk: 'boss-cardinal-husk.png',
  frost_stalker: 'enemy-frost-stalker.png',
  pale_pilgrim: 'enemy-pale-pilgrim.png',
  winter_throat: 'boss-winter-throat.png',
  iron_caravaneer: 'enemy-iron-caravaneer.png',
  frostforge_warden: 'boss-frostforge-warden.png',
  crimson_hound: 'enemy-crimson-hound.png',
  vow_handmaiden: 'enemy-vow-handmaiden.png',
  gargoyle_warden: 'enemy-gargoyle-warden.png',
  lady_of_red_vow: 'boss-lady-red-vow.png',
  tomb_revenant: 'enemy-tomb-revenant.png',
  mirror_widow: 'enemy-mirror-widow.png',
  lord_of_kept_oaths: 'boss-lord-kept-oaths.png',
  oath_brander: 'enemy-oath-brander.png',
  chained_titan: 'enemy-chained-titan.png',
  wyrm_of_broken_word: 'boss-wyrm-broken-word.png',
  forge_serpent: 'enemy-forge-serpent.png',
  the_first_oathbreaker: 'boss-first-oathbreaker.png',
}

const heroAttackCleanCrops = [
  { frame: '0', crop: '366x580+0+0' },
  { frame: '1', crop: '376x481+18+0' },
  { frame: '2', crop: '411x419+55+0' },
  { frame: '3', crop: '347x422+112+0' },
]

const heroAttackAlignedFrames = [
  { frame: '0', resize: 'x360', offset: '-90+0' },
  { frame: '1', resize: 'x332', offset: '-25+0' },
  { frame: '2', resize: 'x330', offset: '+42+0' },
  { frame: '3', resize: 'x336', offset: '+55+0' },
]

async function makeHeroWalkAlignedSheet() {
  const framePaths = []
  for (let i = 0; i < 4; i += 1) {
    const framePath = new URL(`oathbreaker-walk-aligned-${i}.png`, tmpDir).pathname
    framePaths.push(framePath)
    await run([
      '-size',
      '560x620',
      'xc:none',
      '(',
      new URL('oathbreaker-walk-sheet.png', outDir).pathname,
      '-crop',
      `496x793+${i * 496}+0`,
      '+repage',
      '-trim',
      '+repage',
      '-resize',
      'x360',
      ')',
      '-gravity',
      'south',
      '-geometry',
      '+0+0',
      '-composite',
      framePath,
    ])
  }
  await run([...framePaths, '+append', new URL('oathbreaker-walk-aligned-sheet.png', outDir).pathname])
}

async function makeHeroAttackCleanFrames() {
  for (const spec of heroAttackCleanCrops) {
    const cleanPath = new URL(`oathbreaker-attack-clean-frame-${spec.frame}.png`, outDir).pathname
    const args = [
      new URL(`oathbreaker-attack-frame-${spec.frame}.png`, outDir).pathname,
      '-crop',
      spec.crop,
      '+repage',
    ]
    if (spec.erase) {
      args.push('-alpha', 'set', '-fill', 'none', '-draw', spec.erase)
    }
    args.push(cleanPath)
    await run(args)
  }

  for (const spec of heroAttackAlignedFrames) {
    const cleanPath = new URL(`oathbreaker-attack-clean-frame-${spec.frame}.png`, outDir).pathname
    await run([
      '-size',
      '560x620',
      'xc:none',
      '(',
      cleanPath,
      '-trim',
      '+repage',
      '-resize',
      spec.resize,
      ')',
      '-gravity',
      'south',
      '-geometry',
      spec.offset,
      '-composite',
      new URL(`oathbreaker-attack-aligned-frame-${spec.frame}.png`, outDir).pathname,
    ])
  }
}

async function makeEnemyWalkSheet(enemyId, sourceFile) {
  const source = new URL(sourceFile, outDir).pathname
  const baseName = `enemy-${enemyId.replaceAll('_', '-')}`
  const frames = [
    [`${baseName}-walk-0.png`, '330x380', '-1.3'],
    [`${baseName}-walk-1.png`, '344x372', '2.2'],
    [`${baseName}-walk-2.png`, '330x380', '1.1'],
    [`${baseName}-walk-3.png`, '344x372', '-2.2'],
  ]
  const framePaths = []

  for (const [name, resize, rotate] of frames) {
    const framePath = new URL(name, tmpDir).pathname
    framePaths.push(framePath)
    await run([
      source,
      '-trim',
      '+repage',
      '-resize',
      resize,
      '-background',
      'none',
      '-rotate',
      rotate,
      '-gravity',
      'south',
      '-extent',
      '360x420',
      framePath,
    ])
  }

  await run([...framePaths, '+append', new URL(`${baseName}-walk-sheet.png`, outDir).pathname])
}

async function main() {
  await mkdir(outDir, { recursive: true })
  await mkdir(tmpDir, { recursive: true })

  const attack1 = new URL('public/assets/game/oathbreaker-attack-frame-1.png', root).pathname
  const attack3 = new URL('public/assets/game/oathbreaker-attack-frame-3.png', root).pathname
  const idle = new URL('hero-idle-frame.png', outDir).pathname
  const death = new URL('hero-death-frame.png', outDir).pathname
  const burst = new URL('hero-burst-frame.png', outDir).pathname

  await run([attack1, '-trim', '+repage', '-resize', '116x176', '-gravity', 'center', '-background', 'none', '-extent', '128x192', idle])
  await run([attack3, '-trim', '+repage', '-resize', '154x118', '-background', 'none', '-rotate', '64', '-gravity', 'south', '-extent', '128x192', death])

  const burstAura = await svgToTmpPng('hero-burst-aura.png', 128, 192, `
<ellipse cx="64" cy="112" rx="48" ry="72" fill="url(#ember)" opacity="0.55" filter="url(#glow)"/>
<path d="M25 174 C38 136 27 117 48 78 C42 113 60 126 55 160 C72 119 63 91 84 48 C82 93 104 119 95 169 C112 130 105 106 119 78 C119 121 124 151 110 184 Z" fill="#ff8a2f" opacity="0.42" filter="url(#soft)"/>
<path d="M38 166 C52 124 49 96 64 58 C78 96 77 126 91 168" fill="none" stroke="#ffd06c" stroke-width="2" opacity="0.7" filter="url(#glow)"/>`)
  await run([burstAura, idle, '-gravity', 'center', '-composite', burst])
  await run([attack1, '-crop', '190x190+210+40', '+repage', '-resize', '64x64^', '-gravity', 'center', '-extent', '64x64', new URL('hero-portrait.png', outDir).pathname])

  await svgToPng('vfx-cleave-impact.png', 128, 128, `
<path d="M13 83 C43 52 79 31 116 20 C88 48 57 77 31 110 Z" fill="url(#blood)" opacity="0.9" filter="url(#glow)"/>
<path d="M20 88 C54 62 82 43 112 32" fill="none" stroke="#fff1d6" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
<g fill="#b40f16" opacity="0.88"><circle cx="86" cy="75" r="4"/><circle cx="98" cy="68" r="2.5"/><circle cx="73" cy="90" r="3"/><circle cx="111" cy="55" r="2"/></g>`)
  await svgToPng('vfx-sweep-trail.png', 200, 80, `
<path d="M11 55 C61 4 139 1 190 37 C123 25 65 39 20 72 Z" fill="#dff7ff" opacity="0.42" filter="url(#glow)"/>
<path d="M17 58 C68 18 132 15 184 38" fill="none" stroke="#bceeff" stroke-width="8" stroke-linecap="round" opacity="0.88"/>
<path d="M28 67 C78 43 123 39 172 51" fill="none" stroke="#4aa7ff" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
<g fill="#f5fdff"><circle cx="62" cy="24" r="2"/><circle cx="104" cy="16" r="1.8"/><circle cx="141" cy="24" r="2.2"/><circle cx="161" cy="44" r="1.7"/></g>`)
  await svgToPng('vfx-execute-burst.png', 160, 160, `
<circle cx="80" cy="80" r="63" fill="url(#violet)" opacity="0.9" filter="url(#glow)"/>
<path d="M80 14 C95 47 130 48 145 80 C111 75 97 104 80 146 C68 108 40 108 15 80 C48 72 61 45 80 14 Z" fill="none" stroke="#f1c66c" stroke-width="5" opacity="0.8"/>
<path d="M29 116 C58 75 101 54 132 35 M26 42 C68 68 96 96 131 127" stroke="#120018" stroke-width="12" opacity="0.85" stroke-linecap="round"/>`)
  await svgToPng('vfx-oath-shield.png', 128, 128, `
<polygon points="64,10 111,37 111,91 64,118 17,91 17,37" fill="#e8fbff" opacity="0.16" stroke="#c9f5ff" stroke-width="4" filter="url(#glow)"/>
<polygon points="64,24 98,44 98,84 64,104 30,84 30,44" fill="none" stroke="#77cfff" stroke-width="3" opacity="0.85"/>
<path d="M64 28 V101 M31 45 L97 83 M97 45 L31 83" stroke="#fff" stroke-width="1.4" opacity="0.44"/>`)
  await svgToPng('vfx-crit-flash.png', 96, 96, `
<path d="M48 3 L57 37 L92 48 L57 58 L48 93 L38 58 L3 48 L38 37 Z" fill="#ffe779" opacity="0.95" filter="url(#glow)"/>
<circle cx="48" cy="48" r="13" fill="#fff4b8"/><circle cx="48" cy="48" r="31" fill="none" stroke="#c78325" stroke-width="2" opacity="0.72"/>`)

  await svgToPng('ui-panel-corner.png', 32, 32, `
<path d="M30 4 C17 4 8 12 5 29" fill="none" stroke="url(#bronze)" stroke-width="3" stroke-linecap="round"/>
<path d="M28 10 C18 10 12 16 10 28" fill="none" stroke="#4f2b12" stroke-width="2" stroke-linecap="round"/>
<path d="M19 6 L26 6 L26 13" fill="none" stroke="#f1ce83" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="#9a2d20" stroke="#e7bd69"/>`)
  await svgToPng('ui-divider-ornament.png', 200, 12, `
<path d="M4 6 H86 M114 6 H196" stroke="url(#bronze)" stroke-width="2" stroke-linecap="round"/>
<path d="M100 1 L110 6 L100 11 L90 6 Z" fill="#111" stroke="url(#bronze)" stroke-width="1.4"/><circle cx="100" cy="6" r="2.4" fill="#bd3120"/>`)

  const slot = (name, content) => svgToPng(name, 64, 64, `
<rect x="6" y="6" width="52" height="52" rx="7" fill="#0b0d0f" opacity="0.22" stroke="#7b5927" stroke-width="2"/>
<rect x="12" y="12" width="40" height="40" rx="5" fill="none" stroke="#2d2113" stroke-width="1"/>
${content}`)
  await slot('ui-slot-empty-weapon.png', `<path d="M44 10 L50 16 L25 41 L18 44 L21 37 Z M16 46 L22 40" fill="none" stroke="#b98a45" stroke-width="3" stroke-linecap="round"/><path d="M15 50 L26 39" stroke="#5e3b1b" stroke-width="2"/>`)
  await slot('ui-slot-empty-chest.png', `<path d="M22 17 L31 22 L42 17 L49 27 L43 32 L43 50 L21 50 L21 32 L15 27 Z" fill="none" stroke="#b98a45" stroke-width="3" stroke-linejoin="round"/><path d="M25 25 H39 M25 34 H39" stroke="#5e3b1b" stroke-width="2"/>`)
  await slot('ui-slot-empty-helm.png', `<path d="M18 36 C18 19 27 13 33 13 C43 13 49 23 46 38 L39 48 H24 Z" fill="none" stroke="#b98a45" stroke-width="3"/><path d="M22 32 H45 M31 17 V47" stroke="#5e3b1b" stroke-width="2"/>`)
  await slot('ui-slot-empty-ring.png', `<circle cx="32" cy="34" r="15" fill="none" stroke="#b98a45" stroke-width="4"/><path d="M25 20 L32 10 L40 20" fill="none" stroke="#d8b16a" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="11" r="3" fill="#9a2d20"/>`)

  await svgToPng('lane-ground-black-forge.png', 960, 80, `
<rect width="960" height="80" fill="#070707"/>
<g opacity="0.5">${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 58} ${42 + (i % 3) * 8} L${i * 58 + 70} ${38 + (i % 4) * 6}" stroke="#1d1712" stroke-width="${8 + (i % 2) * 4}"/>`).join('')}</g>
<g fill="none" stroke-linecap="round">${Array.from({ length: 13 }, (_, i) => `<path d="M${20 + i * 78} ${56 - (i % 4) * 5} C${44 + i * 78} ${42} ${55 + i * 78} ${70} ${91 + i * 78} ${51}" stroke="#c24a18" stroke-width="2" opacity="0.65" filter="url(#glow)"/>`).join('')}</g>
<g opacity="0.38">${Array.from({ length: 20 }, (_, i) => `<rect x="${i * 51}" y="${50 + (i % 5)}" width="38" height="11" fill="#15120f" stroke="#2b2118"/>`).join('')}</g>`)

  await svgToPng('icon-bleed.png', 32, 32, `<path d="M16 2 C23 12 28 17 28 23 C28 28 23 31 16 31 C9 31 4 28 4 23 C4 17 10 12 16 2 Z" fill="url(#blood)" filter="url(#glow)"/><path d="M11 21 C12 25 15 27 20 27" fill="none" stroke="#ffb3a2" stroke-width="1.5" opacity="0.7"/>`)
  await svgToPng('icon-evasion.png', 32, 32, `<path d="M4 19 C11 11 17 9 28 10 C20 13 18 17 13 23" fill="none" stroke="#f1fbff" stroke-width="3" stroke-linecap="round" opacity="0.86" filter="url(#glow)"/><path d="M3 25 C9 22 13 22 19 23 M7 13 C13 7 18 5 26 5" stroke="#8fd4ff" stroke-width="2" stroke-linecap="round" opacity="0.58"/>`)
  await svgToPng('icon-chaos-stone.png', 32, 32, `<circle cx="16" cy="16" r="13" fill="#150622" stroke="#8957ff" stroke-width="2" filter="url(#glow)"/><path d="M9 17 C11 8 25 9 23 17 C22 25 9 25 10 15" fill="none" stroke="#bfa1ff" stroke-width="2"/><path d="M12 7 L18 16 L11 25 M22 8 L16 16 L23 24" stroke="#31125c" stroke-width="1.8"/>`)

  await run([new URL('bg-forgemaw-core.webp', outDir).pathname, '-resize', '1200x400^', '-gravity', 'center', '-extent', '1200x400', new URL('bg-forgemaw-core.webp', outDir).pathname])
  await run([new URL('item-rusted-cleaver.png', outDir).pathname, '-resize', '64x64', new URL('item-rusted-cleaver.png', outDir).pathname])
  await run([new URL('item-charred-plate.png', outDir).pathname, '-resize', '64x64', new URL('item-charred-plate.png', outDir).pathname])

  await makeHeroWalkAlignedSheet()
  await makeHeroAttackCleanFrames()

  for (const [enemyId, sourceFile] of Object.entries(enemySourceFiles)) {
    await makeEnemyWalkSheet(enemyId, sourceFile)
  }

  console.log('Generated Oathbreaker art assets.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
