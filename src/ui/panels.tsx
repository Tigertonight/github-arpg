import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { enemies, zonesById } from '../data/enemies'
import { getEnemyVisual } from '../data/visuals'
import { baseItemsById } from '../data/items'
import { legendaryPowersById } from '../data/legendaryPowers'
import { itemSetsById } from '../data/sets'
import { skillsById, runes, runesById } from '../data/skills'
import { hasPendingRuneChoice, MAX_SKILL_LEVEL, RUNE_SLOT_LEVELS, xpForLevel } from '../engine/skillProgression'
import { TORMENT_MAX, TORMENT_UNLOCK_STAGE, tormentEnemyScalars, tormentLootScalars } from '../engine/progression'
import { achievementsCatalog } from '../data/achievements'
import { analyzeAllArchetypes, type RequirementStatus } from '../engine/buildPlanner'
import { zoneModsById } from '../data/zoneEvents'
import { traitLabel, traitOf } from '../engine/traits'
import { getZoneVisual } from '../data/visuals'
import { deriveCombatStats, formatAffix, getBuildTags, itemScore, rarityMeta, slotLabels, statLabels } from '../domain/formulas'
import { affixesById } from '../data/affixes'
import { useAnimationFrameIndex } from './motion'
import { deriveStageActors, gameAssetBase, HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT } from './stageActors'
import { uiIcons, type UiIconKey } from './uiIcons'
import type { GameAction } from '../engine/actions'
import type { CombatStats, EnemyDefinition, EnemyInstance, EquipmentSlot, GameState, ItemInstance, LootFilterRule, RuneSlotLevel } from '../domain/types'

// InventoryPanel 批量分解阈值回调参数类型
interface InventoryPanelProps {
  game: GameState
  onEquip: (item: ItemInstance) => void
  onSalvage: (item: ItemInstance) => void
  onClaimOffline: () => void
  onToggleAffixLock?: (itemId: string, affixIndex: number) => void
  onRerollAffix?: (itemId: string, affixIndex: number) => void
  onExpandInventory?: () => void
  onSalvageBelow?: (threshold: number) => void
}

function rankWeight(rank: EnemyInstance['rank']): number {
  return rank === 'boss' ? 3 : rank === 'elite' ? 2 : 1
}

function describeGroup(members: EnemyInstance[]): string {
  if (members.length === 0) return '空旷无人'
  if (members.length === 1) return members[0].name
  return `${members[0].name} 等 ${members.length} 名敌人`
}

function groupHpPercent(members: EnemyInstance[]): number {
  const total = members.reduce((sum, e) => sum + e.maxLife, 0)
  if (total <= 0) return 0
  const current = members.reduce((sum, e) => sum + Math.max(0, e.currentLife), 0)
  return Math.max(0, Math.round((current / total) * 100))
}

function totalBleedStacks(members: EnemyInstance[]): number {
  return members.reduce((sum, e) => sum + e.bleed.stacks, 0)
}

const SKILL_ICONS: Record<string, UiIconKey> = {
  cleave: 'skills',
  lacerating_sweep: 'chaos',
  execute: 'boss',
  iron_oath: 'equip',
}

const HERO_CLASS_LABELS: Record<string, string> = {
  oathbreaker: '破誓骑士',
  ash_hunter: '灰烬猎手',
  grave_votary: '墓誓修女',
  iron_gaoler: '铁狱执行官',
}

const STAT_ICON_SRC: Record<string, string> = {
  '流血/秒': `${gameAssetBase}/icon-bleed.png`,
  '闪避率': `${gameAssetBase}/icon-evasion.png`,
  '混沌石': `${gameAssetBase}/icon-chaos-stone.png`,
}

function itemIconSrc(baseItemId: string): string {
  return `${gameAssetBase}/item-${baseItemId.replaceAll('_', '-')}.png`
}

function emptySlotIconSrc(slot: EquipmentSlot): string {
  if (slot === 'weapon' || slot === 'offhand') return `${gameAssetBase}/ui-slot-empty-weapon.png`
  if (slot === 'helm') return `${gameAssetBase}/ui-slot-empty-helm.png`
  if (slot === 'chest' || slot === 'gloves' || slot === 'boots') return `${gameAssetBase}/ui-slot-empty-chest.png`
  return `${gameAssetBase}/ui-slot-empty-ring.png`
}

export function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  )
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  const iconSrc = STAT_ICON_SRC[label]
  return (
    <div className="stat">
      <span>
        {iconSrc ? <img className="stat-icon" src={iconSrc} alt="" /> : null}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  )
}

export function StageView({ game, dispatch }: { game: GameState; dispatch?: (action: GameAction) => void }) {
  const isTraveling = game.stageMode === 'travel'
  const heroAttackFrame = useAnimationFrameIndex(
    !isTraveling && game.running,
    HERO_ATTACK_FRAME_COUNT,
    HERO_ATTACK_DURATION_MS,
  )
  const scene = useMemo(
    () => deriveStageActors(game, heroAttackFrame),
    [game, heroAttackFrame],
  )
  const members = game.enemyGroup.members
  const lead = members.length > 0
    ? members.reduce(
        (best, m) => (rankWeight(m.rank) > rankWeight(best.rank) ? m : best),
        members[0],
      )
    : null
  const zone = zonesById[game.progression.zoneId] ?? zonesById.black_forge_mines
  const zoneVisual = getZoneVisual(game.progression.zoneId)
  const zoneAffixIds = zone.globalAffixIds
  const heroMaxLife = game.cachedStats?.life ?? deriveCombatStats(game.hero.equipment, game.itemsById, game.hero.level).life
  const heroLifePercent = Math.max(0, Math.round((game.hero.currentLife / heroMaxLife) * 100))
  const stageInZone = ((game.progression.stage - 1) % 10) + 1
  const progressPct = (stageInZone / 10) * 100
  const stageStyle = {
    '--stage-bg-image': `url("${zoneVisual.backgroundLoop}")`,
    '--stage-bg-size': zoneVisual.backgroundSize,
    '--stage-ground-image': `url("${zoneVisual.ground}")`,
    '--stage-ground-opacity': zoneVisual.groundOpacity,
    '--stage-foreground-image': `url("${zoneVisual.foreground}")`,
    '--stage-foreground-opacity': zoneVisual.foregroundOpacity,
  } as CSSProperties
  return (
    <div
      className={`stage-panel stage-${game.stageMode} stage-ambient-${zoneVisual.ambient} stage-palette-${zoneVisual.palette} zone-${game.progression.zoneId} enemy-${lead?.rank ?? 'normal'} ${scene.shakeClass}`}
      style={stageStyle}
    >
      <div className="combat-hud">
        <div className="hero-hud">
          <div className="hero-hud-portrait" />
          <div>
            <strong>{game.hero.name}</strong>
            <span>Lv.{game.hero.level} / {HERO_CLASS_LABELS[game.hero.classId] ?? game.hero.name}</span>
            <div className="hero-hud-bar-wrap">
              <div className="hero-hud-bar">
                <b style={{ width: `${heroLifePercent}%` }} />
              </div>
              <span className="hero-life-num">{game.hero.currentLife} / {heroMaxLife}</span>
            </div>
          </div>
        </div>
        <div className="stage-objective">
          <span>{isTraveling ? '赶往下一场遭遇' : '遭遇战'}</span>
          <strong>{zone.name} 第 {game.progression.stage} 层</strong>
          {zoneAffixIds.length > 0 && (
            <span className="zone-debuff-badge" title={`区域效果：${zoneAffixIds.join(', ')}`}>
              <img src={uiIcons.warning} alt="" />
            </span>
          )}
          {game.zoneMod && game.zoneMod.zoneId === game.progression.zoneId && zoneModsById[game.zoneMod.modId] && (
            <span
              className="zone-mod-badge"
              title={zoneModsById[game.zoneMod.modId].description}
            >
              {zoneModsById[game.zoneMod.modId].name}
            </span>
          )}
          {game.crimsonTideActive && (
            <span className="crimson-tide-badge" title="赤潮事件：敌人 +60% 生命 / +40% 伤害，掉落 magic find +80、金币 ×2">
              ⚠ 赤潮
            </span>
          )}
          <div className="zone-progress-bar">
            <div className="zone-progress-fill" style={{ width: `${progressPct}%` }} />
            <span className="zone-progress-label">
              {stageInZone === 10 ? 'BOSS' : `距 BOSS ${10 - stageInZone} 层`}
            </span>
          </div>
        </div>
        <div className="skill-wheel" aria-label="自动技能轮盘">
          {game.hero.skills.map((skill, index) => {
            const definition = skillsById[skill.skillId]
            const cooldown = Math.ceil(skill.cooldownRemainingMs / 1000)
            const icon = SKILL_ICONS[skill.skillId]
            return (
              <button className={`skill-orb skill-orb-${index + 1}`} type="button" key={skill.skillId} title={definition.name}>
                {icon
                  ? <img className="skill-orb-icon" src={uiIcons[icon]} alt="" />
                  : <span className="skill-orb-icon">{definition.name.slice(0, 2)}</span>}
                <small>{cooldown > 0 ? `${cooldown}s` : 'AUTO'}</small>
              </button>
            )
          })}
        </div>
        <div className="loot-toast">
          <span>最近战利品</span>
          <strong>{game.lastDrop?.name ?? '等待掉落'}</strong>
        </div>
      </div>
      {lead && lead.rank === 'boss' && !isTraveling && (
        <div className="boss-healthbar-track">
          <div className="boss-healthbar-label">
            <span className="boss-name-text">
              <img src={uiIcons.boss} alt="" />
              {lead.name}
            </span>
            <span className="boss-hp-num">{lead.currentLife} / {lead.maxLife}</span>
          </div>
          <div className="boss-healthbar-bar">
            <div
              className="boss-healthbar-fill"
              style={{ width: `${Math.max(0, Math.round((lead.currentLife / lead.maxLife) * 100))}%` }}
            />
          </div>
        </div>
      )}
      <div className="lane-sky">
        <div className="moon" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
      </div>
      <div className="lane">
        <div className="road-dust road-dust-a" />
        <div className="road-dust road-dust-b" />
        <div
          className={scene.hero.rootClassName}
          aria-label="破誓骑士"
          style={{
            left: `${scene.hero.xPct}%`,
            transition: scene.hero.transition,
            ...scene.hero.styleVars,
          }}
        >
          <div className="hero-frame-viewport" aria-hidden="true">
            {scene.hero.frame.kind === 'sheet' ? (
              <div
                className={scene.hero.frame.className}
                style={{
                  '--hero-sheet-image': `url("${scene.hero.frame.src}")`,
                  '--hero-sheet-frames': scene.hero.frame.frames,
                } as CSSProperties}
              />
            ) : (
              <img
                key={scene.hero.frame.key}
                className={scene.hero.frame.className}
                src={scene.hero.frame.src}
                alt=""
              />
            )}
          </div>
        </div>
        {scene.hitFrameActive ? (
          <>
            <img className="slash slash-a" src={`${gameAssetBase}/vfx-cleave-impact.png`} alt="" />
            <img className="slash slash-b" src={`${gameAssetBase}/vfx-cleave-impact.png`} alt="" />
          </>
        ) : null}
        {scene.vfx ? (
          <img
            key={scene.vfx.key}
            className={scene.vfx.className}
            src={scene.vfx.src}
            alt=""
            style={{ left: `${scene.vfx.xPct}%` }}
          />
        ) : null}
        {scene.enemies.map((actor) => {
          return (
            <div
              className={actor.rootClassName}
              key={actor.enemy.id}
              style={{
                left: `${actor.xPct}%`,
                transition: actor.transition,
                ...actor.styleVars,
              }}
            >
              <div className="enemy-frame-viewport" aria-hidden="true">
                <img
                  className={actor.frame.className}
                  src={actor.frame.src}
                  alt=""
                  style={
                    actor.frame.kind === 'walk'
                      ? { transform: `translateX(-${actor.frame.frameIndex * (100 / actor.frame.frames)}%)` }
                      : undefined
                  }
                />
              </div>
              {actor.showHealthbar ? (
                <div className="enemy-healthbar" aria-label={`${actor.enemy.name} 生命`}>
                  <span style={{ width: `${actor.hpPct}%`, '--hp-pos': `${actor.hpPct}%` } as CSSProperties} />
                </div>
              ) : null}
              {actor.showCrown ? <div className="enemy-crown">{actor.enemy.rank === 'boss' ? 'BOSS' : 'ELITE'}</div> : null}
              {actor.showCrown && (() => {
                const t = traitOf(actor.enemy)
                return t ? <div className="enemy-trait-badge">{traitLabel(t)}</div> : null
              })()}
            </div>
          )
        })}
        {game.lastDrop ? (
          <div
            className={`loot-beam-wrap rarity-${game.lastDrop.rarity}`}
            style={{ '--rarity': rarityMeta[game.lastDrop.rarity].color } as CSSProperties}
          >
            <img className="loot-beam" src={`${gameAssetBase}/loot-drop-beam.png`} alt="" />
            <div className="loot-pop-ring" />
            <div className="loot-pop-name">{game.lastDrop.name}</div>
          </div>
        ) : null}
        {game.floatingTexts.some(t => t.kind === 'levelup') && (
          <img
            className="vfx-levelup"
            src={`${gameAssetBase}/vfx-level-up-aura.png`}
            alt=""
            style={{ left: `${scene.hero.xPct}%` }}
          />
        )}
        {game.floatingTexts.map((text, index) => (
          <div className={`floating-text ${text.kind}`} style={{ '--float-index': index, '--float-x': `${text.xOffset ?? 0}px` } as CSSProperties} key={text.id}>
            {text.label}
          </div>
        ))}
        <div className="rail rail-a" />
        <div className="rail rail-b" />
      </div>
      <div className="stage-foreground" aria-hidden="true" />
      <div className="stage-hud">
        <div>
          <span>
            {zone.name} / 第 {game.progression.stage} 层
          </span>
          <strong>
            {isTraveling
              ? `下一遭遇：${describeGroup(members)}`
              : describeGroup(members)}
          </strong>
        </div>
        <div className="healthbar" aria-label="敌群生命">
          <span style={{ width: `${groupHpPercent(members)}%` }} />
        </div>
        <span>{isTraveling ? '行进中' : `${members.filter((m) => m.currentLife > 0).length}/${members.length}`}</span>
        <div className="bleed-meter">
          <span className="bleed-label">
            <img src={`${gameAssetBase}/icon-bleed.png`} alt="" />
            流血 {totalBleedStacks(members)} 层
          </span>
          <div>
            <b style={{ width: `${Math.min(100, totalBleedStacks(members) * 6)}%` }} />
          </div>
        </div>
        {dispatch && (
          <button className="retreat-btn" onClick={() => dispatch({ type: 'retreat' })}
            title="撤退到当前区域第 1 层" disabled={game.progression.stage <= 1}>
            <img src={uiIcons.retreat} alt="" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── 道具栏格子常量 ───
const GRID_COLS = 8
const GRID_ROWS = 6
const GRID_TOTAL = GRID_COLS * GRID_ROWS

export function InventoryPanel({
  game,
  onEquip,
  onSalvage,
  onClaimOffline,
  onToggleAffixLock,
  onRerollAffix,
  onExpandInventory,
  onSalvageBelow,
}: InventoryPanelProps) {
  const items = game.inventory.itemIds.map((id) => game.itemsById[id]).filter(Boolean)
  const pending = game.inventory.pendingOfflineLootIds.map((id) => game.itemsById[id]).filter(Boolean)
  const allItems = useMemo(() => [...pending, ...items], [pending, items])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(allItems[0]?.id ?? null)
  const selectedItem = allItems.find((item) => item.id === selectedItemId) ?? allItems[0] ?? null
  const equippedItem = selectedItem ? getEquippedComparableItem(game, selectedItem.slot) : null

  // 建立格子数组：前 N 格放带道具的小格，剩余为空格
  const cells: Array<ItemInstance | null> = Array.from({ length: GRID_TOTAL }, (_, i) => allItems[i] ?? null)

  // 传说协同检测：检查道具的传说 hookId 和英雄当前技能 tags 是否有交集
  const heroSkillIds = game.hero.skills.map(s => s.skillId)

  // 背包容量状态
  const usedSlots = allItems.length
  const totalSlots = Math.min(GRID_TOTAL, game.inventory.capacity)
  const isFull = usedSlots >= totalSlots
  const isNearFull = !isFull && usedSlots >= totalSlots * 0.8
  const equippedIds = Object.values(game.hero.equipment).filter(Boolean) as string[]
  const minEquippedScore = equippedIds.length > 0
    ? Math.min(...equippedIds.map(id => game.itemsById[id] ? itemScore(game.itemsById[id]!) : 0))
    : 0

  return (
    <section className="loot-panel">
      {pending.length > 0 ? (
        <button type="button" className="claim-button" onClick={onClaimOffline}>
          鉴定离线战利品 {pending.length}
        </button>
      ) : null}
      {/* 背包容量头部 */}
      <div className={`inventory-header ${isFull ? 'inv-full' : isNearFull ? 'inv-near-full' : ''}`}>
        <span className="inv-capacity-label">
          {isFull ? <><img className="inline-art-icon" src={uiIcons.warning} alt="" />背包已满</> : `${usedSlots} / ${totalSlots}`}
        </span>
        {usedSlots > 0 && (
          <button
            type="button"
            className="salvage-all-btn"
            onClick={() => onSalvageBelow?.(minEquippedScore)}
            title={`分解低于 ${minEquippedScore} 分的道具`}
          >
            <img className="button-art-icon small" src={uiIcons.salvage} alt="" />
            批量分解
          </button>
        )}
      </div>
      {/* 道具栏格子——传奇/梦幻风格 */}
      <div className="item-grid" style={{ '--grid-cols': GRID_COLS } as CSSProperties}>
        {cells.map((item, idx) => {
          const equippedForSlot = item ? (game.hero.equipment[item.slot] ? game.itemsById[game.hero.equipment[item.slot]!] : null) : null
          const delta = item && equippedForSlot ? itemScore(item) - itemScore(equippedForSlot) : item ? 99 : 0
          // 传说协同检测：道具的传说 hookId 和英雄当前技能 tags 是否有交集
          const legendaryPower = item?.legendaryPowerId ? legendaryPowersById[item.legendaryPowerId] : undefined
          const hasSynergy = legendaryPower && heroSkillIds.some(sid => {
            const def = skillsById[sid]
            return def?.tags?.includes(legendaryPower.hookId) || legendaryPower.hookId.startsWith(sid)
          })
          return item ? (
            <button
              key={item.id}
              type="button"
              className={`item-cell${selectedItem?.id === item.id ? ' item-cell-selected' : ''}${pending.some(p => p.id === item.id) ? ' item-cell-pending' : ''}`}
              style={{ '--rarity': rarityMeta[item.rarity].color } as CSSProperties}
              onClick={() => setSelectedItemId(item.id)}
              title={item.name}
            >
              <img src={itemIconSrc(item.baseItemId)} alt={item.name} />
              <span className="item-cell-score">{itemScore(item)}</span>
              {item && (
                <span className={`item-cell-delta ${delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-new'}`}>
                  {equippedForSlot === null ? 'NEW' : delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
                </span>
              )}
              {hasSynergy && <span className="synergy-dot" title="与当前技能组有协同" />}
            </button>
          ) : (
            <div key={`empty-${idx}`} className="item-cell item-cell-empty" />
          )
        })}
      </div>
      <div className="inventory-footer">
        <button
          type="button"
          className="expand-inventory-btn"
          onClick={() => onExpandInventory?.()}
          disabled={game.resources.gold < 500 + game.inventory.capacity * 200}
          title={`扩容背包 +8 格（消耗 ${500 + game.inventory.capacity * 200} 金币）`}
        >
          <img className="button-art-icon small" src={uiIcons.expandInventory} alt="" />
          扩容背包 -{500 + game.inventory.capacity * 200}G
        </button>
      </div>
      {selectedItem ? (
        <ItemDetailPanel
          item={selectedItem}
          equippedItem={equippedItem}
          onEquip={onEquip}
          onSalvage={onSalvage}
          onToggleAffixLock={onToggleAffixLock}
          onRerollAffix={onRerollAffix}
          game={game}
          onClose={() => setSelectedItemId(null)}
        />
      ) : null}
    </section>
  )
}

export function ItemCard({
  item,
  onSelect,
  selected,
  pending,
}: {
  item: ItemInstance
  onSelect: () => void
  selected?: boolean
  pending?: boolean
}) {
  const tags = getBuildTags(item)
  const base = baseItemsById[item.baseItemId]
  return (
    <button
      type="button"
      className={`loot-card${selected ? ' selected' : ''}`}
      style={{ '--rarity': rarityMeta[item.rarity].color } as CSSProperties}
      onClick={onSelect}
    >
      <div className="item-icon" aria-hidden="true">
        <img src={itemIconSrc(item.baseItemId)} alt="" />
      </div>
      <div>
        <span>
          {pending ? '待鉴定 / ' : ''}
          {slotLabels[item.slot]}
        </span>
        <h3>{item.name}</h3>
        <p>
          Lv.{item.itemLevel} {rarityMeta[item.rarity].label}{base ? ` / ${base.name}` : ''}
        </p>
      </div>
      <div className="loot-numbers">
        <strong>{itemScore(item)}</strong>
        <span>评分</span>
      </div>
      <div className="tag-row">
        {tags.map((tag) => (
          <b key={tag}>{tag}</b>
        ))}
      </div>
    </button>
  )
}

function getEquippedComparableItem(game: GameState, slot: EquipmentSlot): ItemInstance | null {
  const equippedId = game.hero.equipment[slot]
  return equippedId ? game.itemsById[equippedId] ?? null : null
}

function ItemDetailPanel({
  item,
  equippedItem,
  onEquip,
  onSalvage,
  onToggleAffixLock,
  onRerollAffix,
  game,
  onClose,
}: {
  item: ItemInstance
  equippedItem: ItemInstance | null
  onEquip: (item: ItemInstance) => void
  onSalvage: (item: ItemInstance) => void
  onToggleAffixLock?: (itemId: string, affixIndex: number) => void
  onRerollAffix?: (itemId: string, affixIndex: number) => void
  game: GameState
  onClose: () => void
}) {
  const legendary = item.legendaryPowerId ? legendaryPowersById[item.legendaryPowerId] : undefined
  const equippedLegendary = equippedItem?.legendaryPowerId ? legendaryPowersById[equippedItem.legendaryPowerId] : undefined
  const scoreDelta = itemScore(item) - (equippedItem ? itemScore(equippedItem) : 0)
  const affixLabel = (affix: NonNullable<ItemInstance['affixes']>[number]) => {
    const affixDef = affixesById[affix.affixId]
    if (!affixDef) return affix.affixId
    const total = affix.values.reduce((s, v) => s + v, 0)
    const suffix = affixDef.stat === 'attackSpeed' || affixDef.stat === 'executeDamage' ? '%' : ''
    return `[T${affix.tier}] +${total}${suffix} ${statLabels[affixDef.stat]}`
  }
  return (
    <aside className="item-detail-panel" style={{ '--rarity': rarityMeta[item.rarity].color } as CSSProperties}>
      <div className="item-detail-header">
        <div className="item-icon large" aria-hidden="true">
          <img src={itemIconSrc(item.baseItemId)} alt="" />
        </div>
        <div>
          <span>
            {slotLabels[item.slot]} / Lv.{item.itemLevel} {rarityMeta[item.rarity].label}
          </span>
          <h3>{item.name}</h3>
          <p>{baseItemsById[item.baseItemId]?.name ?? item.baseItemId}</p>
          {item.setId && itemSetsById[item.setId] && (
            <p className="item-set-tag">套装：{itemSetsById[item.setId].name}</p>
          )}
        </div>
        <button type="button" className="item-detail-close" onClick={onClose} aria-label="关闭道具详情">
          ×
        </button>
      </div>
      <div className="item-compare-grid">
        <ItemCompareColumn title="当前选择" item={item} legendaryName={legendary?.name} />
        <ItemCompareColumn title="已装备" item={equippedItem} legendaryName={equippedLegendary?.name} />
      </div>
      {/* 词缀操作区 */}
      <div className="affix-operations">
        <strong style={{ color: 'var(--muted)', fontSize: '0.74rem', letterSpacing: '0.06em' }}>词缀操作</strong>
        {item.affixes.map((affix, i) => (
          <div key={i} className={`affix-row${affix.locked ? ' affix-locked' : ''}`}>
            <span className={`affix-text affix-tier-t${affix.tier}`}>
              {affixLabel(affix)}
            </span>
            <div className="affix-actions">
              <button
                type="button"
                className={`affix-lock-btn${affix.locked ? ' is-locked' : ''}`}
                onClick={() => onToggleAffixLock?.(item.id, i)}
                title={affix.locked ? '解锁词缀' : '锁定词缀'}
              >
                <img src={affix.locked ? uiIcons.lock : uiIcons.unlock} alt="" />
              </button>
              <button
                type="button"
                className="affix-reroll-btn"
                disabled={affix.locked || game.resources.chaosStones < 3}
                onClick={() => onRerollAffix?.(item.id, i)}
                title={`重铸此词缀（消耗 3 混沌石，当前：${game.resources.chaosStones}）`}
              >
                <img src={uiIcons.reroll} alt="" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {legendary ? (
        <div className="legendary-power detail">
          <strong>{legendary.name}</strong>
          <p>{legendary.description}</p>
        </div>
      ) : null}
      <div className={`score-delta ${scoreDelta >= 0 ? 'positive' : 'negative'}`}>
        <span>评分变化</span>
        <strong>{scoreDelta >= 0 ? '+' : ''}{scoreDelta}</strong>
      </div>
      <div className="loot-actions item-detail-actions">
        <button type="button" onClick={() => onEquip(item)}>
          装备
        </button>
        <button type="button" onClick={() => onSalvage(item)}>
          分解
        </button>
      </div>
    </aside>
  )
}

function ItemCompareColumn({ title, item, legendaryName }: { title: string; item: ItemInstance | null; legendaryName?: string }) {
  return (
    <div className="item-compare-column">
      <span>{title}</span>
      {item ? (
        <>
          <strong>{itemScore(item)}</strong>
          <small>{item.name}</small>
          <div className="affix-list compact">
            {formatAffix(item).slice(0, 5).map((entry) => (
              <small key={entry.label} className={`affix-tier-t${entry.tier}`}>{entry.label}</small>
            ))}
          </div>
          {legendaryName ? <em>{legendaryName}</em> : null}
        </>
      ) : (
        <p>空槽位</p>
      )}
    </div>
  )
}

// 装备槽位的排列顺序——仿传奇/梦幻的身体轮廓布局
// 左列: 武器/副手   中列: 头盔/胸甲/手套/靴子   右列: 项链/戒指x2/遗物
const EQUIP_LAYOUT: Array<{ slot: EquipmentSlot; label: string }> = [
  { slot: 'weapon',  label: '武器' },
  { slot: 'helm',    label: '头盔' },
  { slot: 'amulet',  label: '项链' },
  { slot: 'offhand', label: '副手' },
  { slot: 'chest',   label: '胸甲' },
  { slot: 'ring1',   label: '戒指' },
  { slot: 'gloves',  label: '手套' },
  { slot: 'ring2',   label: '戒指' },
  { slot: 'boots',   label: '靴子' },
  { slot: 'relic',   label: '遗物' },
]

// Paperdoll grid 4×3 — 显式给每个 slot 标网格位置
const PAPERDOLL_POSITIONS: Record<EquipmentSlot, { row: number; col: number }> = {
  helm:    { row: 1, col: 2 },
  weapon:  { row: 2, col: 1 },
  chest:   { row: 2, col: 2 },
  offhand: { row: 2, col: 3 },
  ring1:   { row: 3, col: 1 },
  gloves:  { row: 3, col: 2 },
  ring2:   { row: 3, col: 3 },
  amulet:  { row: 4, col: 1 },
  boots:   { row: 4, col: 2 },
  relic:   { row: 4, col: 3 },
}

const PAPERDOLL_SLOTS: EquipmentSlot[] = [
  'helm', 'weapon', 'chest', 'offhand', 'ring1', 'gloves', 'ring2', 'amulet', 'boots', 'relic',
]

export function EquipmentPanel({ game }: { game: GameState }) {
  const [hoverSlot, setHoverSlot] = useState<string | null>(null)

  // 顶部汇总
  const equipped = PAPERDOLL_SLOTS.map((s) => game.hero.equipment[s])
    .filter(Boolean)
    .map((id) => game.itemsById[id!])
    .filter(Boolean) as ItemInstance[]
  const totalScore = equipped.reduce((sum, it) => sum + itemScore(it), 0)
  const filledCount = equipped.length
  const totalSlots = PAPERDOLL_SLOTS.length
  // 套装件数（按 setId 聚合）
  const setCounts: Record<string, number> = {}
  for (const it of equipped) {
    if (it.setId) setCounts[it.setId] = (setCounts[it.setId] ?? 0) + 1
  }
  const activeSets = Object.entries(setCounts)
    .map(([id, count]) => ({ name: itemSetsById[id]?.name ?? id, count }))

  return (
    <>
      <div className="equip-summary">
        <div className="equip-summary-stat">
          <span>总评分</span>
          <strong>{totalScore}</strong>
        </div>
        <div className="equip-summary-stat">
          <span>已装备</span>
          <strong>{filledCount}<small>/{totalSlots}</small></strong>
        </div>
        <div className="equip-summary-sets">
          {activeSets.length === 0 ? (
            <span className="equip-summary-empty">无套装</span>
          ) : activeSets.map((s) => (
            <span key={s.name} className="equip-summary-set-tag">{s.name} {s.count}</span>
          ))}
        </div>
      </div>

      <div className="equip-paperdoll">
        <div className="equip-paperdoll-silhouette" aria-hidden="true" />
        {PAPERDOLL_SLOTS.map((slot) => {
          const pos = PAPERDOLL_POSITIONS[slot]
          const meta = EQUIP_LAYOUT.find(e => e.slot === slot)!
          const item = game.hero.equipment[slot] ? game.itemsById[game.hero.equipment[slot]!] ?? null : null
          const legendary = item?.legendaryPowerId ? legendaryPowersById[item.legendaryPowerId] : undefined
          return (
            <div
              key={slot}
              className={`equip-cell${item ? ' equip-cell-filled' : ''}`}
              style={{
                gridRow: pos.row,
                gridColumn: pos.col,
                ...(item ? { '--rarity': rarityMeta[item.rarity].color } as CSSProperties : {}),
              }}
              onMouseEnter={() => setHoverSlot(slot)}
              onMouseLeave={() => setHoverSlot(null)}
              aria-label={meta.label}
            >
              <div className="equip-cell-icon">
                {item
                  ? <img src={itemIconSrc(item.baseItemId)} alt={item.name} />
                  : <img className="equip-cell-empty-icon" src={emptySlotIconSrc(slot)} alt="" />
                }
              </div>
              {item ? <span className="equip-cell-score">{itemScore(item)}</span> : null}
              {hoverSlot === slot && item ? (
                <div className="equip-tooltip">
                  <strong style={{ color: rarityMeta[item.rarity].color }}>{item.name}</strong>
                  <small>{rarityMeta[item.rarity].label} · Lv.{item.itemLevel} · {itemScore(item)}分</small>
                  {legendary ? <em>{legendary.name}</em> : null}
                </div>
              ) : null}
              {hoverSlot === slot && !item ? (
                <div className="equip-tooltip equip-tooltip-empty">
                  <strong>{meta.label}</strong>
                  <small>未装备</small>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}

// 每个技能的颜色主题已从 data/skills.ts 的 SkillDefinition.color 字段获取

export function SkillPanel({ game, onChooseRune }: { game: GameState; onChooseRune?: (skillId: string, slot: RuneSlotLevel, runeId: string) => void }) {
  const [hoverSkill, setHoverSkill] = useState<string | null>(null)
  const [pickerSkillId, setPickerSkillId] = useState<string | null>(null)
  return (
    <>
      <div className="skill-orb-rack">
        {game.hero.skills.map((skill) => {
          const definition = skillsById[skill.skillId]
          const rune = runesById[skill.runeId]
          const cooldown = Math.ceil(skill.cooldownRemainingMs / 1000)
          const isReady = cooldown <= 0
          const color = definition.color
          const progress = isReady ? 1 : Math.max(0, 1 - skill.cooldownRemainingMs / definition.baseCooldownMs)
          const skillProg = game.hero.skillProgress[skill.skillId]
          const skillLevel = skillProg?.level ?? 1
          const xpProgress = skillProg && skillLevel < MAX_SKILL_LEVEL
            ? Math.min(1, skillProg.xp / Math.max(1, xpForLevel(skillLevel)))
            : 1
          const pendingRune = skillProg ? hasPendingRuneChoice(skillProg) : false
          return (
            <div
              key={skill.skillId}
              className={`skill-gem${isReady ? ' skill-gem-ready' : ''}${pendingRune ? ' skill-gem-rune-pending' : ''}`}
              style={{ '--skill-color': color, '--skill-progress': progress } as CSSProperties}
              onMouseEnter={() => setHoverSkill(skill.skillId)}
              onMouseLeave={() => setHoverSkill(null)}
              onClick={() => setPickerSkillId(skill.skillId)}
              role="button"
              tabIndex={0}
            >
              {/* 冒气圈"准就"动画 */}
              <svg className="skill-gem-ring" viewBox="0 0 44 44" aria-hidden="true">
                <circle cx="22" cy="22" r="19" className="skill-gem-ring-bg" />
                <circle
                  cx="22" cy="22" r="19"
                  className="skill-gem-ring-fill"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 19}`,
                    strokeDashoffset: `${2 * Math.PI * 19 * (1 - progress)}`,
                  }}
                />
              </svg>
              <div className="skill-gem-face">
                <span className="skill-gem-abbr">{definition.name.slice(0, 2)}</span>
                {isReady
                  ? <span className="skill-gem-status skill-gem-auto">AUTO</span>
                  : <span className="skill-gem-status">{cooldown}s</span>
                }
              </div>
              <div className="skill-gem-level-badge">Lv.{skillLevel}</div>
              <div className="skill-gem-xpbar"><span style={{ width: `${Math.round(xpProgress * 100)}%` }} /></div>
              {pendingRune ? <div className="skill-gem-rune-dot" aria-label="可选 rune" /> : null}
              {hoverSkill === skill.skillId ? (
                <div className="skill-gem-tooltip">
                  <strong>{definition.name} · Lv.{skillLevel}</strong>
                  <em>{rune.name}</em>
                  <p>{definition.automation}</p>
                  <p className="skill-gem-tooltip-hint">点击查看 rune 进度</p>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {pickerSkillId ? (
        <RunePickerModal
          game={game}
          skillId={pickerSkillId}
          onClose={() => setPickerSkillId(null)}
          onChoose={onChooseRune}
        />
      ) : null}
    </>
  )
}

function RunePickerModal({
  game,
  skillId,
  onClose,
  onChoose,
}: {
  game: GameState
  skillId: string
  onClose: () => void
  onChoose?: (skillId: string, slot: RuneSlotLevel, runeId: string) => void
}) {
  const definition = skillsById[skillId]
  const progress = game.hero.skillProgress[skillId]
  const skillLevel = progress?.level ?? 1
  const xpForNext = skillLevel < MAX_SKILL_LEVEL ? xpForLevel(skillLevel) : 0
  const xpPct = progress && skillLevel < MAX_SKILL_LEVEL
    ? Math.min(100, Math.round((progress.xp / Math.max(1, xpForNext)) * 100))
    : 100
  const color = definition.color
  const [hoverRune, setHoverRune] = useState<string | null>(null)
  return (
    <div className="rune-picker-overlay" onClick={onClose}>
      <div className="rune-tree" onClick={(e) => e.stopPropagation()} style={{ '--skill-color': color } as CSSProperties}>
        <header className="rune-tree-header">
          <div className="rune-tree-title">
            <h3>{definition.name}</h3>
            <span className="rune-tree-level">Lv.{skillLevel}<small>/{MAX_SKILL_LEVEL}</small></span>
          </div>
          {skillLevel < MAX_SKILL_LEVEL ? (
            <div className="rune-tree-xpbar" title={`经验 ${progress?.xp ?? 0} / ${xpForNext}`}>
              <span style={{ width: `${xpPct}%` }} />
            </div>
          ) : (
            <div className="rune-tree-xpbar rune-tree-xpbar-max"><span style={{ width: '100%' }} /></div>
          )}
          <button type="button" className="rune-picker-close" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <div className="rune-tree-body">
          {/* 根节点：技能本体 */}
          <div className="rune-tree-root">
            <div className="rune-tree-root-orb">
              <span>{definition.name.slice(0, 2)}</span>
            </div>
            <p className="rune-tree-root-desc">{definition.automation}</p>
          </div>

          {RUNE_SLOT_LEVELS.map((slot, slotIdx) => {
            const unlocked = skillLevel >= slot
            const chosenRuneId = progress?.runeChoices[slot] ?? null
            const slotRunes = runes.filter((r) => r.skillId === skillId && r.slot === slot)
            const prevTierResolved = slotIdx === 0
              ? true
              : !!progress?.runeChoices[RUNE_SLOT_LEVELS[slotIdx - 1]]
            return (
              <div
                key={slot}
                className={`rune-tree-tier${unlocked ? ' rune-tree-tier-unlocked' : ''}${chosenRuneId ? ' rune-tree-tier-chosen' : ''}`}
              >
                <div className={`rune-tree-connector${prevTierResolved && unlocked ? ' rune-tree-connector-active' : ''}`} aria-hidden="true" />
                <div className="rune-tree-tier-label">
                  <span className="rune-tree-tier-marker">Lv.{slot}</span>
                  {unlocked
                    ? (chosenRuneId ? <em className="rune-tree-tier-status rune-tree-tier-status-chosen">已选定</em> : <em className="rune-tree-tier-status rune-tree-tier-status-pending">请选择</em>)
                    : <em className="rune-tree-tier-status rune-tree-tier-status-locked">未解锁</em>}
                </div>
                <div className="rune-tree-branches">
                  {slotRunes.length === 0 ? (
                    <div className="rune-empty">该技能暂无该 slot 的 rune（即将更新）</div>
                  ) : slotRunes.map((rune) => {
                    const isChosen = chosenRuneId === rune.id
                    const isLocked = !unlocked
                    const dimmed = !!chosenRuneId && !isChosen
                    const canChoose = unlocked && !chosenRuneId && !!onChoose
                    return (
                      <button
                        key={rune.id}
                        type="button"
                        className={[
                          'rune-tree-node',
                          isChosen ? 'rune-tree-node-chosen' : '',
                          isLocked ? 'rune-tree-node-locked' : '',
                          dimmed ? 'rune-tree-node-dimmed' : '',
                          hoverRune === rune.id ? 'rune-tree-node-hover' : '',
                        ].filter(Boolean).join(' ')}
                        disabled={!canChoose}
                        onClick={() => canChoose && onChoose?.(skillId, slot, rune.id)}
                        onMouseEnter={() => setHoverRune(rune.id)}
                        onMouseLeave={() => setHoverRune(null)}
                      >
                        <span className="rune-tree-node-orb" aria-hidden="true" />
                        <strong className="rune-tree-node-name">{rune.name}</strong>
                        <p className="rune-tree-node-desc">{rune.description}</p>
                        {isChosen ? <span className="rune-tree-node-badge">✓ 已选</span> : null}
                        {isLocked ? <span className="rune-tree-node-lock">🔒</span> : null}
                      </button>
                    )
                  })}
                </div>
                {chosenRuneId && unlocked ? (
                  <div className="rune-tree-tier-warning">⚠ 首次选定不可更改</div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function DailyGoalsPanel({ game, onClaim }: { game: GameState; onClaim?: (goalId: 'kill' | 'stage' | 'rareLoot') => void }) {
  const goals = game.dailyGoals?.goals ?? []
  if (goals.length === 0) return null
  return (
    <div className="daily-goals">
      <h4 className="daily-goals-title">每日目标</h4>
      <div className="daily-goals-list">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100))
          const done = goal.progress >= goal.target
          return (
            <div key={goal.id} className={`daily-goal${done ? ' daily-goal-done' : ''}${goal.claimed ? ' daily-goal-claimed' : ''}`}>
              <div className="daily-goal-row">
                <span className="daily-goal-label">{goal.label}</span>
                <span className="daily-goal-progress">{Math.min(goal.progress, goal.target)}/{goal.target}</span>
              </div>
              <div className="daily-goal-bar"><span style={{ width: `${pct}%` }} /></div>
              <div className="daily-goal-reward">
                <span>+{goal.rewardGold} 金币</span>
                <span>+{goal.rewardShards} 裂片</span>
                {goal.claimed
                  ? <span className="daily-goal-tag daily-goal-tag-claimed">已领取</span>
                  : done
                    ? <button type="button" className="daily-goal-claim" onClick={() => onClaim?.(goal.id)}>领取</button>
                    : null
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LootFilterPanel({ rules, onToggle }: { rules: LootFilterRule[]; onToggle: (id: LootFilterRule['id']) => void }) {
  const enabledCount = rules.filter(r => r.enabled).length
  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <span>战利品过滤</span>
        <strong>{enabledCount}<small>/{rules.length}</small></strong>
      </div>
      <div className="filter-chip-grid">
        {rules.map((rule) => (
          <button
            key={rule.id}
            type="button"
            className={`filter-chip${rule.enabled ? ' filter-chip-on' : ''}`}
            onClick={() => onToggle(rule.id)}
            aria-pressed={rule.enabled}
          >
            <span className="filter-chip-dot" aria-hidden="true" />
            <span className="filter-chip-label">{rule.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function StatsPanel({ stats, game }: { stats: CombatStats; game: GameState }) {
  const xpPercent = Math.round(((game.hero.xp % 140) / 140) * 100)
  return (
    <>
      <div className="stat-hero-card">
        <div className="stat-hero-card-row">
          <span className="stat-hero-card-name">{game.hero.name}</span>
          <strong className="stat-hero-card-level">Lv.{game.hero.level}</strong>
        </div>
        <div className="stat-hero-card-xpbar">
          <span style={{ width: `${xpPercent}%` }} />
        </div>
        <span className="stat-hero-card-xpnum">经验 {xpPercent}%</span>
      </div>

      <div className="stat-group">
        <h4 className="stat-group-title">攻击</h4>
        <div className="stat-list compact">
          <Stat label="物理伤害" value={Math.round(stats.physicalDamage)} />
          <Stat label="攻速" value={`${stats.attackSpeed.toFixed(2)}x`} />
          <Stat label="流血/秒" value={Math.round(stats.bleedDamage)} />
          <Stat label="处决伤害" value={`${Math.round((stats.executeDamage - 1) * 100)}%`} />
        </div>
      </div>

      <div className="stat-group">
        <h4 className="stat-group-title">防御</h4>
        <div className="stat-list compact">
          <Stat label="生命上限" value={stats.life} />
          <Stat label="装甲" value={Math.round(stats.armor)} />
          <Stat label="闪避率" value={`${Math.round(stats.evasion ?? 0)}%`} />
        </div>
      </div>

      <div className="stat-group">
        <h4 className="stat-group-title">资源 / 收益</h4>
        <div className="stat-list compact">
          <Stat label="混沌石" value={game.resources.chaosStones} />
          <Stat label="魔找" value={`${Math.round(stats.magicFind)}%`} />
        </div>
      </div>
    </>
  )
}

const FAMILY_LABELS: Record<EnemyDefinition['family'], string> = {
  undead: '亡灵',
  demon: '恶魔',
  cultist: '教徒',
  construct: '构装',
  beast: '野兽',
  primordial: '原初',
}

const RANK_LABELS: Record<EnemyDefinition['rank'], string> = {
  normal: '普通',
  elite: '精英',
  boss: 'BOSS',
}

export function BestiaryPanel({ game, onQaSpawn, onQaExit }: { game: GameState; onQaSpawn?: (ids: string[]) => void; onQaExit?: () => void }) {
  const bestiary = game.bestiary ?? {}
  const qa = !!game.qaMode
  const [qaSelection, setQaSelection] = useState<string[]>([])
  const toggleQaSelect = (defId: string) => {
    setQaSelection((prev) => {
      if (prev.includes(defId)) return prev.filter((id) => id !== defId)
      if (prev.length >= 4) return prev
      return [...prev, defId]
    })
  }
  const totals = useMemo(() => {
    let encountered = 0
    let killed = 0
    for (const def of enemies) {
      const entry = bestiary[def.id]
      if (entry?.encountered) encountered += 1
      if (entry && entry.kills > 0) killed += 1
    }
    return { encountered, killed, total: enemies.length }
  }, [bestiary])

  const grouped = useMemo(() => {
    const buckets: Record<EnemyDefinition['family'], EnemyDefinition[]> = {
      undead: [], demon: [], cultist: [], construct: [], beast: [], primordial: [],
    }
    for (const def of enemies) buckets[def.family].push(def)
    const rankOrder: Record<EnemyDefinition['rank'], number> = { normal: 0, elite: 1, boss: 2 }
    for (const family of Object.keys(buckets) as Array<EnemyDefinition['family']>) {
      buckets[family].sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank] || a.name.localeCompare(b.name))
    }
    return buckets
  }, [])

  return (
    <section className="bestiary-panel">
      {qa ? (
        <div className="bestiary-qa-bar">
          <div className="bestiary-qa-bar-info">
            <strong>QA 沙盒</strong>
            <span>已选 {qaSelection.length} / 4</span>
            <span className="bestiary-qa-hint">点击任意卡片选取怪物（最多 4 只），点击「开始遭遇战」生成。</span>
          </div>
          <div className="bestiary-qa-bar-actions">
            <button
              type="button"
              className="bestiary-qa-btn bestiary-qa-btn-primary"
              disabled={qaSelection.length === 0}
              onClick={() => {
                if (qaSelection.length === 0) return
                onQaSpawn?.(qaSelection)
                setQaSelection([])
              }}
            >
              开始遭遇战
            </button>
            <button
              type="button"
              className="bestiary-qa-btn"
              disabled={qaSelection.length === 0}
              onClick={() => setQaSelection([])}
            >
              清空选择
            </button>
            <button
              type="button"
              className="bestiary-qa-btn bestiary-qa-btn-exit"
              onClick={() => onQaExit?.()}
            >
              返回正常游戏
            </button>
          </div>
        </div>
      ) : null}
      <div className="bestiary-summary">
        <span>击杀种类 <strong>{totals.killed}</strong> / {totals.total}</span>
        <span>已遇见 <strong>{totals.encountered}</strong> / {totals.total}</span>
      </div>
      {(Object.keys(grouped) as Array<EnemyDefinition['family']>).map((family) => {
        const list = grouped[family]
        if (list.length === 0) return null
        return (
          <div className="bestiary-family" key={family}>
            <h4 className="bestiary-family-title">{FAMILY_LABELS[family]} <span className="bestiary-family-count">({list.length})</span></h4>
            <div className="bestiary-grid">
              {list.map((def) => {
                const entry = bestiary[def.id]
                const seen = entry?.encountered ?? false
                const killed = (entry?.kills ?? 0) > 0
                const visual = getEnemyVisual(def.id)
                const idleSrc = visual.actions.idle?.src
                const isSelected = qa && qaSelection.includes(def.id)
                const canSelectMore = qaSelection.length < 4
                const cardClass = [
                  'bestiary-card',
                  qa
                    ? 'bestiary-card-qa-base'
                    : killed ? 'bestiary-card-killed' : seen ? 'bestiary-card-seen' : 'bestiary-card-locked',
                  qa ? 'bestiary-card-qa' : '',
                  isSelected ? 'bestiary-card-qa-selected' : '',
                  qa && !isSelected && !canSelectMore ? 'bestiary-card-qa-disabled' : '',
                ].filter(Boolean).join(' ')
                return (
                  <div
                    key={def.id}
                    className={cardClass}
                    onClick={qa ? () => toggleQaSelect(def.id) : undefined}
                    role={qa ? 'button' : undefined}
                    tabIndex={qa ? 0 : undefined}
                  >
                    <div className="bestiary-card-portrait">
                      {(qa || seen) && idleSrc ? (
                        <span
                          className="bestiary-card-portrait-img"
                          style={{ backgroundImage: `url(${idleSrc})` }}
                          aria-hidden
                        />
                      ) : (
                        <span className="bestiary-card-portrait-fallback" aria-hidden>?</span>
                      )}
                      <span className={`bestiary-card-rank bestiary-rank-${def.rank}`}>{RANK_LABELS[def.rank]}</span>
                      {isSelected ? <span className="bestiary-card-qa-check" aria-hidden>✓</span> : null}
                    </div>
                    <div className="bestiary-card-body">
                      <strong className="bestiary-card-name">{qa || killed || seen ? def.name : '???'}</strong>
                      {killed ? (
                        <div className="bestiary-card-stats">
                          <span>击杀 {entry!.kills}</span>
                          {entry!.eliteKills > 0 ? <span>· 精英 {entry!.eliteKills}</span> : null}
                          {entry!.bossKills > 0 ? <span>· BOSS {entry!.bossKills}</span> : null}
                        </div>
                      ) : seen ? (
                        <div className="bestiary-card-stats bestiary-card-stats-seen">已遇见 · 未击杀</div>
                      ) : (
                        <div className="bestiary-card-stats bestiary-card-stats-locked">未发现</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}

interface TormentPanelProps {
  game: GameState
  onSelect: (torment: number) => void
}

export function TormentPanel({ game, onSelect }: TormentPanelProps) {
  const current = game.progression.torment
  const unlocked = game.progression.maxTormentUnlocked
  const highest = game.progression.highestStage
  const tiers = Array.from({ length: TORMENT_MAX + 1 }, (_, i) => i)

  return (
    <section className="torment-panel mobile-panel-section">
      <header className="torment-panel-head">
        <strong>难度阶梯（Torment）</strong>
        <span className="torment-panel-sub">
          每档敌人 +60% 生命 / +25% 护甲，掉落 +12 magic find / +1 ilvl。
        </span>
        <span className="torment-panel-sub">
          每击杀第 {TORMENT_UNLOCK_STAGE} × N 层 Boss 解锁下一档（当前已解锁 T{unlocked}，最高层 {highest}）。
        </span>
      </header>
      <div className="torment-grid">
        {tiers.map((tier) => {
          const isLocked = tier > unlocked
          const isCurrent = tier === current
          const enemy = tormentEnemyScalars(tier)
          const loot = tormentLootScalars(tier)
          const lifeMul = `×${enemy.life.toFixed(2)}`
          const armorMul = `×${enemy.armor.toFixed(2)}`
          const cls = [
            'torment-cell',
            isCurrent ? 'torment-cell-current' : '',
            isLocked ? 'torment-cell-locked' : 'torment-cell-unlocked',
          ].filter(Boolean).join(' ')
          return (
            <button
              key={tier}
              type="button"
              className={cls}
              disabled={isLocked || isCurrent}
              onClick={() => onSelect(tier)}
            >
              <div className="torment-cell-head">
                <strong className="torment-cell-tier">T{tier}</strong>
                {isCurrent ? <span className="torment-cell-badge">进行中</span>
                  : isLocked ? <span className="torment-cell-badge torment-cell-badge-lock">未解锁</span>
                    : <span className="torment-cell-badge torment-cell-badge-ok">可选</span>}
              </div>
              <div className="torment-cell-stats">
                <span>HP {lifeMul}</span>
                <span>护甲 {armorMul}</span>
              </div>
              <div className="torment-cell-stats torment-cell-loot">
                <span>+{loot.magicFind} MF</span>
                <span>+{loot.ilvlBonus} ilvl</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

interface AchievementsPanelProps {
  game: GameState
}

export function AchievementsPanel({ game }: AchievementsPanelProps) {
  const unlocked = game.unlockedAchievements ?? {}
  const polled = achievementsCatalog.filter((a) => a.trigger === 'polled')
  const event = achievementsCatalog.filter((a) => a.trigger === 'event')
  const totalUnlocked = Object.keys(unlocked).length

  const renderCard = (def: typeof achievementsCatalog[number]) => {
    const isUnlocked = !!unlocked[def.id]
    const progress = def.progress ? def.progress(game) : isUnlocked ? 1 : 0
    const pct = Math.round(progress * 100)
    const rewardParts: string[] = []
    if (def.reward.gold) rewardParts.push(`${def.reward.gold} 金币`)
    if (def.reward.shards) rewardParts.push(`${def.reward.shards} 裂片`)
    if (def.reward.chaosStones) rewardParts.push(`${def.reward.chaosStones} 混沌石`)
    return (
      <div
        key={def.id}
        className={`achievement-card${isUnlocked ? ' achievement-card-unlocked' : ''}${def.trigger === 'event' ? ' achievement-card-event' : ''}`}
      >
        <div className="achievement-card-head">
          <strong className="achievement-card-title">{def.title}</strong>
          {isUnlocked
            ? <span className="achievement-card-badge achievement-card-badge-ok">已解锁</span>
            : def.trigger === 'event'
              ? <span className="achievement-card-badge achievement-card-badge-event">事件型</span>
              : <span className="achievement-card-badge">{pct}%</span>}
        </div>
        <div className="achievement-card-desc">{def.description}</div>
        {def.trigger === 'polled' && !isUnlocked && (
          <div className="achievement-card-bar">
            <div className="achievement-card-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="achievement-card-reward">奖励：{rewardParts.join(' / ') || '—'}</div>
      </div>
    )
  }

  return (
    <section className="achievements-panel mobile-panel-section">
      <header className="achievements-panel-head">
        <strong>成就</strong>
        <span className="achievements-panel-sub">
          已解锁 {totalUnlocked} / {achievementsCatalog.length}
        </span>
      </header>
      <div className="achievements-section-title">累计型</div>
      <div className="achievements-grid">
        {polled.map(renderCard)}
      </div>
      {event.length > 0 && (
        <>
          <div className="achievements-section-title">事件型（待挂钩）</div>
          <div className="achievements-grid">
            {event.map(renderCard)}
          </div>
        </>
      )}
    </section>
  )
}

interface BuildPlannerPanelProps {
  game: GameState
}

const REQUIREMENT_KIND_LABEL: Record<'affix' | 'legendary' | 'rune', string> = {
  affix: '词缀',
  legendary: '传说',
  rune: 'Rune',
}

const STATUS_LABEL: Record<RequirementStatus, string> = {
  have: '已装',
  owned: '已掉落',
  missing: '未获得',
  unknown: '?',
}

export function BuildPlannerPanel({ game }: BuildPlannerPanelProps) {
  const archetypes = useMemo(() => analyzeAllArchetypes(game), [game])

  return (
    <section className="build-planner-panel mobile-panel-section">
      <header className="build-planner-head">
        <strong>流派规划</strong>
        <span className="build-planner-sub">
          根据当前装备与 rune 选择，估算每个流派的成型度。装备/选 rune 后会自动更新。
        </span>
      </header>
      <div className="build-planner-grid">
        {archetypes.map(({ definition, completion, items, haveCount, totalCount }) => {
          const pct = Math.round(completion * 100)
          return (
            <div
              key={definition.id}
              className="build-card"
              style={{ ['--build-accent' as never]: definition.accent } as CSSProperties}
            >
              <div className="build-card-head">
                <span className="build-card-icon" aria-hidden>{definition.icon}</span>
                <div className="build-card-titles">
                  <strong className="build-card-name">{definition.name}</strong>
                  <span className="build-card-tagline">{definition.tagline}</span>
                </div>
                <span className="build-card-pct">{pct}%</span>
              </div>
              <div className="build-card-bar">
                <div className="build-card-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="build-card-counts">
                {haveCount} / {totalCount} 已达成
              </div>
              <div className="build-card-desc">{definition.description}</div>
              <ul className="build-card-reqs">
                {items.length === 0 ? (
                  <li className="build-card-req build-card-req-empty">无固定需求（自由发挥）</li>
                ) : items.map((req) => (
                  <li
                    key={`${req.kind}_${req.id}`}
                    className={`build-card-req build-card-req-${req.status}`}
                  >
                    <span className="build-card-req-kind">{REQUIREMENT_KIND_LABEL[req.kind]}</span>
                    <span className="build-card-req-label">{req.label}</span>
                    <span className="build-card-req-status">{STATUS_LABEL[req.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
