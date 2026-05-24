import type { GameState } from '../domain/types'
import { applyOfflineProgress } from '../engine/offline'
import { createStarterState, migrateLegacyState } from './migrations'

export const SAVE_KEY = 'forge-lane-arpg-save-v2'
export const LEGACY_SAVE_KEY = 'forge-lane-arpg-save-v1'

export function loadGameState(storage: Storage = localStorage) {
  const saved = storage.getItem(SAVE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as GameState
      if (parsed.version === 2) return applyOfflineProgress(normalizeV2State(parsed))
    } catch {
      return createStarterState()
    }
  }

  const migrated = migrateLegacyState(storage.getItem(LEGACY_SAVE_KEY))
  return migrated ? applyOfflineProgress(migrated) : createStarterState()
}

export function saveGameState(state: GameState, storage: Storage = localStorage) {
  storage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }))
}

function normalizeV2State(state: GameState): GameState {
  return {
    ...state,
    stageMode: state.stageMode ?? 'combat',
    stageModeUntil: state.stageModeUntil ?? 0,
  }
}
