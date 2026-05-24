import type { LootTable } from '../domain/types'

export const lootTables: LootTable[] = [
  {
    id: 'black_forge',
    baseItemIds: ['rusted_cleaver', 'black_iron_sword', 'oath_shield', 'miner_helm', 'charred_plate', 'butcher_gloves', 'ashwalkers'],
    currencyWeight: 1,
  },
  {
    id: 'black_forge_elite',
    baseItemIds: ['butcher_gloves', 'red_cord', 'bone_ring', 'forgotten_relic', 'black_iron_sword', 'oath_shield'],
    currencyWeight: 1.35,
  },
  {
    id: 'black_forge_boss',
    baseItemIds: ['rusted_cleaver', 'butcher_gloves', 'red_cord', 'bone_ring', 'forgotten_relic'],
    currencyWeight: 2,
  },
]

export const lootTablesById = Object.fromEntries(lootTables.map((table) => [table.id, table]))
