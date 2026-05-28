import type { GameState } from '../domain/types'
import { applyOfflineProgress } from '../engine/offline'
import {
  CURRENT_SAVE_VERSION,
  migrateLegacyState,
  migrateV2ToV3,
  migrateV3ToV4,
  migrateV4ToV5,
  migrateV5ToV6,
  migrateV6ToV7,
  migrateV7ToV8,
} from './migrations'
import { createStarterState } from './starterState'

export const SAVE_KEY = 'forge-lane-arpg-save-v2'
export const LEGACY_SAVE_KEY = 'forge-lane-arpg-save-v1'

export function loadGameState(storage: Storage = localStorage) {
  const saved = storage.getItem(SAVE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      const upgraded = upgradeSave(parsed)
      if (upgraded && isValidGameState(upgraded)) {
        return applyOfflineProgress(upgraded)
      }
    } catch (err) {
      console.warn('[saveCodec] failed to load v2 save, falling back to starter', err)
    }
  }

  try {
    const migrated = migrateLegacyState(storage.getItem(LEGACY_SAVE_KEY))
    if (migrated && isValidGameState(migrated)) return applyOfflineProgress(migrated)
  } catch (err) {
    console.warn('[saveCodec] failed to migrate v1 save, falling back to starter', err)
  }
  return createStarterState()
}

function isValidGameState(state: any): state is GameState {
  return (
    state &&
    typeof state === 'object' &&
    state.version === CURRENT_SAVE_VERSION &&
    state.hero &&
    typeof state.hero.x === 'number' &&
    Array.isArray(state.hero.skills) &&
    state.hero.skills.length > 0 &&
    state.enemyGroup &&
    typeof state.enemyGroup.x === 'number' &&
    Array.isArray(state.enemyGroup.members) &&
    state.enemyGroup.members.length > 0 &&
    state.inventory &&
    Array.isArray(state.inventory.filter) &&
    typeof state.rngSeed === 'number'
  )
}

export function saveGameState(state: GameState, storage: Storage = localStorage) {
  storage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }))
}

/**
 * 按 version 顺序逐步升级。每个 version step 一个 migrate 函数。
 */
function upgradeSave(parsed: any): GameState | null {
  if (!parsed || typeof parsed !== 'object') return null
  let state: any = parsed
  if (state.version === 2) state = migrateV2ToV3(normalizeV2State(state))
  if (state.version === 3) state = migrateV3ToV4(state)
  if (state.version === 4) state = migrateV4ToV5(state)
  if (state.version === 5) state = migrateV5ToV6(state)
  if (state.version === 6) state = migrateV6ToV7(state)
  if (state.version === 7) state = migrateV7ToV8(state)
  if (state.version !== CURRENT_SAVE_VERSION) return null
  return state as GameState
}

function normalizeV2State(state: any) {
  return {
    ...state,
    stageMode: state.stageMode ?? 'combat',
    stageModeUntil: state.stageModeUntil ?? 0,
  }
}
