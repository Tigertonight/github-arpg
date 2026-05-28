import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { zonesById } from '../data/enemies'
import { baseItemsById } from '../data/items'
import { legendaryPowersById } from '../data/legendaryPowers'
import { skillsById, runesById } from '../data/skills'
import { formatAffix, getBuildTags, itemScore, rarityMeta, slotLabels, statLabels } from '../domain/formulas'
import { affixesById } from '../data/affixes'
import { useAnimationFrameIndex } from './motion'
import { deriveStageActors, gameAssetBase, HERO_ATTACK_DURATION_MS, HERO_ATTACK_FRAME_COUNT } from './stageActors'
import type { GameAction } from '../engine/actions'
import type { CombatStats, EnemyInstance, EquipmentSlot, GameState, ItemInstance, LootFilterRule } from '../domain/types'

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

const SKILL_ICONS: Record<string, string> = {
  cleave: '⚔',
  lacerating_sweep: '🌀',
  execute: '💀',
  iron_oath: '🛡',
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
  const lead = members.reduce(
    (best, m) => (rankWeight(m.rank) > rankWeight(best.rank) ? m : best),
    members[0],
  )
  const zone = zonesById[game.progression.zoneId] ?? zonesById.black_forge_mines
  const zoneAffixIds = zone.globalAffixIds
  const heroLifePercent = Math.max(0, Math.round((game.hero.currentLife / (game.cachedStats?.life ?? 120)) * 100))
  const stageInZone = ((game.progression.stage - 1) % 10) + 1
  const progressPct = (stageInZone / 10) * 100
  return (
    <div className={`stage-panel stage-${game.stageMode} zone-${game.progression.zoneId} enemy-${lead.rank} ${scene.shakeClass}`}>
      <div className="combat-hud">
        <div className="hero-hud">
          <div className="hero-hud-portrait" />
          <div>
            <strong>{game.hero.name}</strong>
            <span>Lv.{game.hero.level} / 破誓骑士</span>
            <div className="hero-hud-bar-wrap">
              <div className="hero-hud-bar">
                <b style={{ width: `${heroLifePercent}%` }} />
              </div>
              <span className="hero-life-num">{game.hero.currentLife} / {game.cachedStats?.life ?? 120}</span>
            </div>
          </div>
        </div>
        <div className="stage-objective">
          <span>{isTraveling ? '赶往下一场遭遇' : '遭遇战'}</span>
          <strong>{zone.name} 第 {game.progression.stage} 层</strong>
          {zoneAffixIds.length > 0 && (
            <span className="zone-debuff-badge" title={`区域效果：${zoneAffixIds.join(', ')}`}>
              ⚠️
            </span>
          )}
          <div className="zone-progress-bar">
            <div className="zone-progress-fill" style={{ width: `${progressPct}%` }} />
            <span className="zone-progress-label">
              {stageInZone === 10 ? '⚔️ BOSS' : `距 BOSS ${10 - stageInZone} 层`}
            </span>
          </div>
        </div>
        <div className="skill-wheel" aria-label="自动技能轮盘">
          {game.hero.skills.map((skill, index) => {
            const definition = skillsById[skill.skillId]
            const cooldown = Math.ceil(skill.cooldownRemainingMs / 1000)
            const icon = SKILL_ICONS[skill.skillId] ?? definition.name.slice(0, 2)
            return (
              <button className={`skill-orb skill-orb-${index + 1}`} type="button" key={skill.skillId} title={definition.name}>
                <span className="skill-orb-icon">{icon}</span>
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
      {lead.rank === 'boss' && !isTraveling && (
        <div className="boss-healthbar-track">
          <div className="boss-healthbar-label">
            <span className="boss-name-text">💀 {lead.name}</span>
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
          }}
        >
          <div className="hero-frame-viewport" aria-hidden="true">
            {scene.hero.frame.kind === 'sheet' ? (
              <div className={scene.hero.frame.className} />
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
              }}
            >
              <div className="enemy-frame-viewport" aria-hidden="true">
                <img
                  className={actor.frame.className}
                  src={actor.frame.src}
                  alt=""
                />
              </div>
              {actor.showHealthbar ? (
                <div className="enemy-healthbar" aria-label={`${actor.enemy.name} 生命`}>
                  <span style={{ width: `${actor.hpPct}%`, '--hp-pos': `${actor.hpPct}%` } as CSSProperties} />
                </div>
              ) : null}
              {actor.showCrown ? <div className="enemy-crown">{actor.enemy.rank === 'boss' ? 'BOSS' : 'ELITE'}</div> : null}
            </div>
          )
        })}
        {game.lastDrop ? <img className="loot-beam" src={`${gameAssetBase}/loot-drop-beam.png`} alt="" /> : null}
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
            🏃
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
          {isFull ? '⚠️ 背包已满' : `${usedSlots} / ${totalSlots}`}
        </span>
        {usedSlots > 0 && (
          <button
            type="button"
            className="salvage-all-btn"
            onClick={() => onSalvageBelow?.(minEquippedScore)}
            title={`分解低于 ${minEquippedScore} 分的道具`}
          >
            🗑 批量分解
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
              {hasSynergy && <span className="synergy-dot" title="与当前技能组有协同">✦</span>}
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
          📦 扩容背包 -{500 + game.inventory.capacity * 200}G
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
            <span className="affix-text">
              {affixLabel(affix)}
            </span>
            <div className="affix-actions">
              <button
                type="button"
                className={`affix-lock-btn${affix.locked ? ' is-locked' : ''}`}
                onClick={() => onToggleAffixLock?.(item.id, i)}
                title={affix.locked ? '解锁词缀' : '锁定词缀'}
              >
                {affix.locked ? '🔒' : '🔓'}
              </button>
              <button
                type="button"
                className="affix-reroll-btn"
                disabled={affix.locked || game.resources.chaosStones < 3}
                onClick={() => onRerollAffix?.(item.id, i)}
                title={`重铸此词缀（消耗 3 混沌石，当前：${game.resources.chaosStones}）`}
              >
                🎲
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
            {formatAffix(item).slice(0, 5).map((label) => (
              <small key={label}>{label}</small>
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
const EQUIP_LAYOUT: Array<{ slot: EquipmentSlot; label: string; icon: string }> = [
  { slot: 'weapon',  label: '武器', icon: '⚔️' },
  { slot: 'helm',    label: '头盔', icon: '⛏️' },
  { slot: 'amulet',  label: '项链', icon: '️' },
  { slot: 'offhand', label: '副手', icon: '🛡️' },
  { slot: 'chest',   label: '胸甲', icon: '🧳' },
  { slot: 'ring1',   label: '戒指', icon: '💍' },
  { slot: 'gloves',  label: '手套', icon: '🧤' },
  { slot: 'ring2',   label: '戒指', icon: '💍' },
  { slot: 'boots',   label: '靴子', icon: '👢' },
  { slot: 'relic',   label: '遗物', icon: '🔮' },
]

export function EquipmentPanel({ game }: { game: GameState }) {
  const [hoverSlot, setHoverSlot] = useState<string | null>(null)
  return (
    <div className="equip-body">
      {/* 左列：武器 + 副手 */}
      <div className="equip-col equip-col-left">
        {(['weapon', 'offhand'] as EquipmentSlot[]).map((slot) => {
          const meta = EQUIP_LAYOUT.find(e => e.slot === slot)!
          const item = game.hero.equipment[slot] ? game.itemsById[game.hero.equipment[slot]!] ?? null : null
          const legendary = item?.legendaryPowerId ? legendaryPowersById[item.legendaryPowerId] : undefined
          return (
            <div
              key={slot}
              className={`equip-slot${item ? ' equip-slot-filled' : ''}`}
              style={item ? { '--rarity': rarityMeta[item.rarity].color } as CSSProperties : undefined}
              onMouseEnter={() => setHoverSlot(slot)}
              onMouseLeave={() => setHoverSlot(null)}
            >
              <div className="equip-slot-icon">
                {item
                  ? <img src={itemIconSrc(item.baseItemId)} alt={item.name} />
                  : <img className="equip-slot-empty-icon" src={emptySlotIconSrc(slot)} alt="" />
                }
              </div>
              <span className="equip-slot-label">{meta.label}</span>
              {hoverSlot === slot && item ? (
                <div className="equip-tooltip">
                  <strong style={{ color: rarityMeta[item.rarity].color }}>{item.name}</strong>
                  <small>{rarityMeta[item.rarity].label} · Lv.{item.itemLevel} · {itemScore(item)}分</small>
                  {legendary ? <em>{legendary.name}</em> : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* 中列：头盔/胸甲/手套/靴子 */}
      <div className="equip-col equip-col-center">
        <div className="equip-body-silhouette" aria-hidden="true" />
        {(['helm', 'chest', 'gloves', 'boots'] as EquipmentSlot[]).map((slot) => {
          const meta = EQUIP_LAYOUT.find(e => e.slot === slot)!
          const item = game.hero.equipment[slot] ? game.itemsById[game.hero.equipment[slot]!] ?? null : null
          const legendary = item?.legendaryPowerId ? legendaryPowersById[item.legendaryPowerId] : undefined
          return (
            <div
              key={slot}
              className={`equip-slot equip-slot-body equip-slot-${slot}${item ? ' equip-slot-filled' : ''}`}
              style={item ? { '--rarity': rarityMeta[item.rarity].color } as CSSProperties : undefined}
              onMouseEnter={() => setHoverSlot(slot)}
              onMouseLeave={() => setHoverSlot(null)}
            >
              <div className="equip-slot-icon">
                {item
                  ? <img src={itemIconSrc(item.baseItemId)} alt={item.name} />
                  : <img className="equip-slot-empty-icon" src={emptySlotIconSrc(slot)} alt="" />
                }
              </div>
              <span className="equip-slot-label">{meta.label}</span>
              {hoverSlot === slot && item ? (
                <div className="equip-tooltip">
                  <strong style={{ color: rarityMeta[item.rarity].color }}>{item.name}</strong>
                  <small>{rarityMeta[item.rarity].label} · Lv.{item.itemLevel} · {itemScore(item)}分</small>
                  {legendary ? <em>{legendary.name}</em> : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* 右列：项链/戒指x2/遗物 */}
      <div className="equip-col equip-col-right">
        {(['amulet', 'ring1', 'ring2', 'relic'] as EquipmentSlot[]).map((slot) => {
          const meta = EQUIP_LAYOUT.find(e => e.slot === slot)!
          const item = game.hero.equipment[slot] ? game.itemsById[game.hero.equipment[slot]!] ?? null : null
          const legendary = item?.legendaryPowerId ? legendaryPowersById[item.legendaryPowerId] : undefined
          return (
            <div
              key={slot}
              className={`equip-slot${item ? ' equip-slot-filled' : ''}`}
              style={item ? { '--rarity': rarityMeta[item.rarity].color } as CSSProperties : undefined}
              onMouseEnter={() => setHoverSlot(slot)}
              onMouseLeave={() => setHoverSlot(null)}
            >
              <div className="equip-slot-icon">
                {item
                  ? <img src={itemIconSrc(item.baseItemId)} alt={item.name} />
                  : <img className="equip-slot-empty-icon" src={emptySlotIconSrc(slot)} alt="" />
                }
              </div>
              <span className="equip-slot-label">{meta.label}</span>
              {hoverSlot === slot && item ? (
                <div className="equip-tooltip">
                  <strong style={{ color: rarityMeta[item.rarity].color }}>{item.name}</strong>
                  <small>{rarityMeta[item.rarity].label} · Lv.{item.itemLevel} · {itemScore(item)}分</small>
                  {legendary ? <em>{legendary.name}</em> : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 每个技能的颜色主题已从 data/skills.ts 的 SkillDefinition.color 字段获取

export function SkillPanel({ game }: { game: GameState }) {
  const [hoverSkill, setHoverSkill] = useState<string | null>(null)
  return (
    <div className="skill-orb-rack">
      {game.hero.skills.map((skill) => {
        const definition = skillsById[skill.skillId]
        const rune = runesById[skill.runeId]
        const cooldown = Math.ceil(skill.cooldownRemainingMs / 1000)
        const isReady = cooldown <= 0
        const color = definition.color
        const progress = isReady ? 1 : Math.max(0, 1 - skill.cooldownRemainingMs / definition.baseCooldownMs)
        return (
          <div
            key={skill.skillId}
            className={`skill-gem${isReady ? ' skill-gem-ready' : ''}`}
            style={{ '--skill-color': color, '--skill-progress': progress } as CSSProperties}
            onMouseEnter={() => setHoverSkill(skill.skillId)}
            onMouseLeave={() => setHoverSkill(null)}
          >
            {/* 冒气圈“准就”动画 */}
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
            {hoverSkill === skill.skillId ? (
              <div className="skill-gem-tooltip">
                <strong>{definition.name}</strong>
                <em>{rune.name}</em>
                <p>{definition.automation}</p>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function LootFilterPanel({ rules, onToggle }: { rules: LootFilterRule[]; onToggle: (id: LootFilterRule['id']) => void }) {
  return (
    <div className="filter-list">
      {rules.map((rule) => (
        <label className="filter-row" key={rule.id}>
          <input type="checkbox" checked={rule.enabled} onChange={() => onToggle(rule.id)} />
          <span>{rule.label}</span>
        </label>
      ))}
    </div>
  )
}

export function StatsPanel({ stats, game }: { stats: CombatStats; game: GameState }) {
  const xpPercent = Math.round(((game.hero.xp % 140) / 140) * 100)
  return (
    <>
      <div className="stat-list">
        <Stat label="英雄等级" value={game.hero.level} />
        <Stat label="物理伤害" value={Math.round(stats.physicalDamage)} />
        <Stat label="流血/秒" value={Math.round(stats.bleedDamage)} />
        <Stat label="攻速" value={`${stats.attackSpeed.toFixed(2)}x`} />
        <Stat label="生命上限" value={stats.life} />
        <Stat label="装甲" value={Math.round(stats.armor)} />
        <Stat label="混沌石" value={game.resources.chaosStones} />
        <Stat label="魔找" value={`${Math.round(stats.magicFind)}%`} />
      </div>
      <div className="xp-row">
        <span>经验</span>
        <div className="xpbar">
          <span style={{ width: `${xpPercent}%` }} />
        </div>
      </div>
    </>
  )
}
