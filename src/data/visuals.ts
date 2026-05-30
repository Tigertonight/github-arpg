import { enemies } from './enemies'
import type { EnemyDefinition, EnemyVisualDefinition, HeroVisualDefinition, ZoneVisualDefinition } from '../domain/types'

export const gameAssetBase = '/assets/game'

const zoneGround = `${gameAssetBase}/lane-ground-black-forge.png`
const foregroundBase = `${gameAssetBase}/zones/foregrounds`

const zoneVisualEntries = {
  black_forge_mines: {
    zoneId: 'black_forge_mines',
    backgroundLoop: `${gameAssetBase}/bg-black-forge-mines-loop.webp`,
    backgroundSize: '4096px 100%',
    ground: zoneGround,
    groundOpacity: 0.68,
    foreground: `${foregroundBase}/forge-fg.png`,
    foregroundOpacity: 0.68,
    ambient: 'embers',
    palette: 'forge',
  },
  bleeding_furnace: {
    zoneId: 'bleeding_furnace',
    backgroundLoop: `${gameAssetBase}/bg-bleeding-furnace.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.74,
    foreground: `${foregroundBase}/furnace-fg.png`,
    foregroundOpacity: 0.72,
    ambient: 'embers',
    palette: 'furnace',
  },
  silent_choir: {
    zoneId: 'silent_choir',
    backgroundLoop: `${gameAssetBase}/bg-silent-choir.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.54,
    foreground: `${foregroundBase}/choir-fg.png`,
    foregroundOpacity: 0.58,
    ambient: 'mist',
    palette: 'choir',
  },
  ossuary_keep: {
    zoneId: 'ossuary_keep',
    backgroundLoop: `${gameAssetBase}/bg-ossuary-keep.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.6,
    foreground: `${foregroundBase}/ossuary-fg.png`,
    foregroundOpacity: 0.64,
    ambient: 'mist',
    palette: 'ossuary',
  },
  pale_wastes: {
    zoneId: 'pale_wastes',
    backgroundLoop: `${gameAssetBase}/bg-pale-wastes.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.5,
    foreground: `${foregroundBase}/wastes-fg.png`,
    foregroundOpacity: 0.62,
    ambient: 'snow',
    palette: 'wastes',
  },
  iron_caravan: {
    zoneId: 'iron_caravan',
    backgroundLoop: `${gameAssetBase}/bg-iron-caravan.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.56,
    foreground: `${foregroundBase}/caravan-fg.png`,
    foregroundOpacity: 0.66,
    ambient: 'snow',
    palette: 'caravan',
  },
  crimson_keep: {
    zoneId: 'crimson_keep',
    backgroundLoop: `${gameAssetBase}/bg-crimson-keep.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.66,
    foreground: `${foregroundBase}/crimson-fg.png`,
    foregroundOpacity: 0.66,
    ambient: 'bloodMoon',
    palette: 'crimson',
  },
  moonblood_crypt: {
    zoneId: 'moonblood_crypt',
    backgroundLoop: `${gameAssetBase}/bg-moonblood-crypt.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.62,
    foreground: `${foregroundBase}/crypt-fg.png`,
    foregroundOpacity: 0.64,
    ambient: 'bloodMoon',
    palette: 'crypt',
  },
  oath_abyss: {
    zoneId: 'oath_abyss',
    backgroundLoop: `${gameAssetBase}/bg-oath-abyss.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.6,
    foreground: `${foregroundBase}/abyss-fg.png`,
    foregroundOpacity: 0.72,
    ambient: 'abyssAsh',
    palette: 'abyss',
  },
  forgemaw_core: {
    zoneId: 'forgemaw_core',
    backgroundLoop: `${gameAssetBase}/bg-forgemaw-core.webp`,
    backgroundSize: 'cover',
    ground: zoneGround,
    groundOpacity: 0.78,
    foreground: `${foregroundBase}/core-fg.png`,
    foregroundOpacity: 0.72,
    ambient: 'embers',
    palette: 'core',
  },
} satisfies Record<string, ZoneVisualDefinition>

export const zoneVisuals: Record<string, ZoneVisualDefinition> = zoneVisualEntries
export const defaultZoneVisual = zoneVisuals.black_forge_mines

const heroVisualEntries = {
  oathbreaker: {
    id: 'oathbreaker',
    portrait: `${gameAssetBase}/hero-portrait.png`,
    anchor: { x: 0.5, y: 1 },
    scale: 1,
    actions: {
      idle: { src: `${gameAssetBase}/heroes/oathbreaker/idle-sheet.png`, frames: 4, durationMs: 1000 },
      walk: { src: `${gameAssetBase}/heroes/oathbreaker/walk-sheet.png`, frames: 4, durationMs: 720 },
      attack: { src: `${gameAssetBase}/heroes/oathbreaker/cleave-sheet.png`, frames: 4, durationMs: 900 },
      hit: { src: `${gameAssetBase}/heroes/oathbreaker/hit-sheet.png`, frames: 4, durationMs: 320 },
      death: { src: `${gameAssetBase}/heroes/oathbreaker/death-sheet.png`, frames: 4, durationMs: 900 },
      cleave: { src: `${gameAssetBase}/heroes/oathbreaker/cleave-sheet.png`, frames: 4, durationMs: 900 },
      sweep: { src: `${gameAssetBase}/heroes/oathbreaker/sweep-sheet.png`, frames: 4, durationMs: 900 },
      execute: { src: `${gameAssetBase}/heroes/oathbreaker/execute-sheet.png`, frames: 4, durationMs: 900 },
      shield: { src: `${gameAssetBase}/heroes/oathbreaker/shield-sheet.png`, frames: 4, durationMs: 900 },
    },
    attackFrames: [
      `${gameAssetBase}/oathbreaker-attack-aligned-frame-0.png`,
      `${gameAssetBase}/oathbreaker-attack-aligned-frame-1.png`,
      `${gameAssetBase}/oathbreaker-attack-aligned-frame-2.png`,
      `${gameAssetBase}/oathbreaker-attack-aligned-frame-3.png`,
    ],
    vfx: {
      cleave: `${gameAssetBase}/vfx-cleave-impact.png`,
      lacerating_sweep: `${gameAssetBase}/vfx-sweep-trail.png`,
      execute: `${gameAssetBase}/vfx-execute-burst.png`,
      iron_oath: `${gameAssetBase}/vfx-oath-shield.png`,
      crit: `${gameAssetBase}/vfx-crit-flash.png`,
      burst: `${gameAssetBase}/vfx-ember-burst.png`,
    },
  },
} satisfies Record<string, HeroVisualDefinition>

export const heroVisuals: Record<string, HeroVisualDefinition> = heroVisualEntries
export const defaultHeroVisual = heroVisuals.oathbreaker

const stableRootEnemyMotionIds = new Set([
  'bone_miner',
  'rust_hound',
  'coal_cultist',
  'black_forge_guard',
])

export const enemyVisuals = Object.fromEntries(
  enemies.map((enemy) => [enemy.id, makeEnemyVisual(enemy)]),
) as Record<string, EnemyVisualDefinition>

export function getZoneVisual(zoneId: string): ZoneVisualDefinition {
  return zoneVisuals[zoneId] ?? defaultZoneVisual
}

export function getHeroVisual(heroId = 'oathbreaker'): HeroVisualDefinition {
  return heroVisuals[heroId] ?? defaultHeroVisual
}

export function getEnemyVisual(enemyDefId: string): EnemyVisualDefinition {
  return enemyVisuals[enemyDefId] ?? makeEnemyVisual({
    id: enemyDefId,
    name: enemyDefId,
    family: 'undead',
    rank: 'normal',
    baseLife: 1,
    baseArmor: 0,
    lootTableId: 'black_forge',
  })
}

function makeEnemyVisual(enemy: EnemyDefinition): EnemyVisualDefinition {
  const slug = enemy.id.replaceAll('_', '-')
  const familyClass = enemyFamilyClass(enemy.family)
  const rootWalk = `${gameAssetBase}/enemy-${slug}-walk-sheet.png`
  const runtimeBase = `${gameAssetBase}/enemies/runtime/${slug}`
  const usesRootMotion = stableRootEnemyMotionIds.has(enemy.id)
  const walk = usesRootMotion
    ? { src: rootWalk, frames: 4, durationMs: 720 }
    : { src: `${runtimeBase}/walk-sheet.png`, frames: 4, durationMs: 720 }
  const idle = usesRootMotion
    ? { src: rootWalk, frames: 4, durationMs: 900 }
    : { src: `${runtimeBase}/idle-sheet.png`, frames: 4, durationMs: 900 }
  const attack = stableRootEnemyMotionIds.has(enemy.id)
    ? { src: `${gameAssetBase}/enemy-${slug}-attack-sheet.png`, frames: 2, durationMs: 620 }
    : { src: `${runtimeBase}/attack-sheet.png`, frames: 4, durationMs: 760 }
  const death = usesRootMotion
    ? { src: rootWalk, frames: 4, durationMs: 900 }
    : { src: `${runtimeBase}/death-sheet.png`, frames: 4, durationMs: 900 }
  return {
    enemyDefId: enemy.id,
    familyClass,
    anchor: { x: 0.5, y: 1 },
    scale: enemy.rank === 'boss' ? 1.12 : enemy.rank === 'elite' ? 1.04 : familyClass === 'enemy-sheet-beast' ? 0.9 : 1,
    actions: {
      walk,
      idle,
      attack,
      death,
    },
  }
}

function enemyFamilyClass(family: EnemyDefinition['family']): EnemyVisualDefinition['familyClass'] {
  if (family === 'beast') return 'enemy-sheet-beast'
  if (family === 'construct' || family === 'demon' || family === 'primordial') return 'enemy-sheet-brute'
  return 'enemy-sheet-humanoid'
}
