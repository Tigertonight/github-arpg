import type { Chapter } from '../domain/types'

export const chapters: Chapter[] = [
  {
    id: 'chapter_act_1',
    name: '黑炉裂痕',
    themeId: 'theme_iron_rust',
    zoneIds: ['black_forge_mines'],
    bossEnemyId: 'vein_butcher',
    unlockStage: 0,
  },
]

export const chaptersById = Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter]))
