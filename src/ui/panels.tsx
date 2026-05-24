import type { CSSProperties, ReactNode } from 'react'
import { skillsById, runesById } from '../data/skills'
import { formatAffix, getBuildTags, itemScore, rarityMeta, slotLabels } from '../domain/formulas'
import type { CombatStats, GameState, ItemInstance, LootFilterRule } from '../domain/types'

const gameAssetBase = '/assets/game'

const enemyWalkSheets: Record<string, string> = {
  bone_miner: `${gameAssetBase}/enemy-humanoid-walk-sheet.png`,
  coal_cultist: `${gameAssetBase}/enemy-humanoid-walk-sheet.png`,
  rust_hound: `${gameAssetBase}/enemy-beast-walk-sheet.png`,
  black_forge_guard: `${gameAssetBase}/enemy-brute-walk-sheet.png`,
  vein_butcher: `${gameAssetBase}/enemy-brute-walk-sheet.png`,
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
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function StageView({ game }: { game: GameState }) {
  const isTraveling = game.stageMode === 'travel'
  const hpPercent = Math.max(0, Math.round((game.enemy.currentLife / game.enemy.maxLife) * 100))
  const bleedPercent = Math.min(100, game.enemy.bleed.stacks * 11)
  const heroLifePercent = Math.max(0, Math.round((game.hero.currentLife / 120) * 100))
  return (
    <div className={`stage-panel stage-${game.stageMode} enemy-${game.enemy.rank}`}>
      <div className="combat-hud">
        <div className="hero-hud">
          <div className="hero-hud-portrait" />
          <div>
            <strong>{game.hero.name}</strong>
            <span>Lv.{game.hero.level} / 破誓骑士</span>
            <div className="hero-hud-bar">
              <b style={{ width: `${heroLifePercent}%` }} />
            </div>
          </div>
        </div>
        <div className="stage-objective">
          <span>{isTraveling ? '赶往下一场遭遇' : '遭遇战'}</span>
          <strong>黑炉矿道 第 {game.progression.stage} 层</strong>
        </div>
        <div className="skill-wheel" aria-label="自动技能轮盘">
          {game.hero.skills.map((skill, index) => {
            const definition = skillsById[skill.skillId]
            const cooldown = Math.ceil(skill.cooldownRemainingMs / 1000)
            return (
              <button className={`skill-orb skill-orb-${index + 1}`} type="button" key={skill.skillId} title={definition.name}>
                <span>{definition.name.slice(0, 2)}</span>
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
      <div className="lane-sky">
        <div className="moon" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
      </div>
      <div className="lane">
        <div className="road-dust road-dust-a" />
        <div className="road-dust road-dust-b" />
        <div className="hero-sprite" aria-label="破誓骑士">
          <img src={`${gameAssetBase}/oathbreaker-hero.png`} alt="" />
        </div>
        {!isTraveling ? (
          <>
            <img className="slash slash-a" src={`${gameAssetBase}/blood-slash-effect.png`} alt="" />
            <img className="slash slash-b" src={`${gameAssetBase}/blood-slash-effect.png`} alt="" />
          </>
        ) : null}
        {!isTraveling ? (
          <div className="enemy-sprite">
            <div
              className={`sprite-sheet enemy-walk-sheet ${game.enemy.enemyDefId === 'rust_hound' ? 'enemy-sheet-beast' : ['black_forge_guard', 'vein_butcher'].includes(game.enemy.enemyDefId) ? 'enemy-sheet-brute' : 'enemy-sheet-humanoid'}`}
              style={{ backgroundImage: `url(${enemyWalkSheets[game.enemy.enemyDefId] ?? enemyWalkSheets.bone_miner})` }}
              aria-hidden="true"
            />
            {game.enemy.rank !== 'normal' ? <div className="enemy-crown">{game.enemy.rank === 'boss' ? 'BOSS' : 'ELITE'}</div> : null}
          </div>
        ) : null}
        {game.lastDrop ? <img className="loot-beam" src={`${gameAssetBase}/loot-drop-beam.png`} alt="" /> : null}
        {game.floatingTexts.map((text, index) => (
          <div className={`floating-text ${text.kind}`} style={{ '--float-index': index } as CSSProperties} key={text.id}>
            {text.label}
          </div>
        ))}
        <div className="rail rail-a" />
        <div className="rail rail-b" />
      </div>
      <div className="stage-hud">
        <div>
          <span>
            {game.progression.zoneId === 'black_forge_mines' ? '黑炉矿道' : game.progression.zoneId} / 第 {game.progression.stage} 层
          </span>
          <strong>{isTraveling ? `下一遭遇：${game.enemy.name}` : game.enemy.name}</strong>
        </div>
        <div className="healthbar" aria-label="怪物生命">
          <span style={{ width: `${hpPercent}%` }} />
        </div>
        <span>{isTraveling ? '行进中' : `${hpPercent}%`}</span>
        <div className="bleed-meter">
          <span>流血 {game.enemy.bleed.stacks} 层</span>
          <div>
            <b style={{ width: `${bleedPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function InventoryPanel({
  game,
  onEquip,
  onSalvage,
  onClaimOffline,
}: {
  game: GameState
  onEquip: (item: ItemInstance) => void
  onSalvage: (item: ItemInstance) => void
  onClaimOffline: () => void
}) {
  const items = game.inventory.itemIds.map((id) => game.itemsById[id]).filter(Boolean)
  const pending = game.inventory.pendingOfflineLootIds.map((id) => game.itemsById[id]).filter(Boolean)
  return (
    <section className="loot-panel">
      {pending.length > 0 ? (
        <button type="button" className="claim-button" onClick={onClaimOffline}>
          鉴定离线战利品 {pending.length}
        </button>
      ) : null}
      <div className="loot-list">
        {[...pending, ...items].map((item) => (
          <ItemCard item={item} key={item.id} onEquip={onEquip} onSalvage={onSalvage} pending={pending.some((entry) => entry.id === item.id)} />
        ))}
      </div>
    </section>
  )
}

function ItemCard({
  item,
  onEquip,
  onSalvage,
  pending,
}: {
  item: ItemInstance
  onEquip: (item: ItemInstance) => void
  onSalvage: (item: ItemInstance) => void
  pending?: boolean
}) {
  const tags = getBuildTags(item)
  return (
    <article className="loot-card" style={{ '--rarity': rarityMeta[item.rarity].color } as CSSProperties}>
      <div>
        <span>
          {pending ? '待鉴定 / ' : ''}
          {slotLabels[item.slot]}
        </span>
        <h3>{item.name}</h3>
        <p>
          Lv.{item.itemLevel} {rarityMeta[item.rarity].label}
        </p>
      </div>
      <div className="loot-numbers">
        <strong>{itemScore(item)}</strong>
        <span>评分</span>
      </div>
      <div className="affix-list">
        {formatAffix(item).slice(0, 4).map((label) => (
          <small key={label}>{label}</small>
        ))}
      </div>
      <div className="tag-row">
        {tags.map((tag) => (
          <b key={tag}>{tag}</b>
        ))}
      </div>
      <div className="loot-actions">
        <button type="button" onClick={() => onEquip(item)}>
          装备
        </button>
        <button type="button" onClick={() => onSalvage(item)}>
          分解
        </button>
      </div>
    </article>
  )
}

export function EquipmentPanel({ game }: { game: GameState }) {
  return (
    <div className="equipment-slots">
      {Object.entries(game.hero.equipment).map(([slot, itemId]) => {
        const item = itemId ? game.itemsById[itemId] : null
        return (
          <div className="equipment-slot" key={slot}>
            <span>{slotLabels[slot as keyof typeof slotLabels]}</span>
            <strong>{item?.name ?? '空槽位'}</strong>
            <small>{item ? `${rarityMeta[item.rarity].label} / ${itemScore(item)}` : '等待掉落'}</small>
          </div>
        )
      })}
    </div>
  )
}

export function SkillPanel({ game }: { game: GameState }) {
  return (
    <div className="skill-list">
      {game.hero.skills.map((skill) => {
        const definition = skillsById[skill.skillId]
        const rune = runesById[skill.runeId]
        const cooldown = Math.ceil(skill.cooldownRemainingMs / 1000)
        return (
          <div className="skill-card" key={skill.skillId}>
            <div>
              <strong>{definition.name}</strong>
              <span>{rune.name}</span>
            </div>
            <p>{definition.automation}</p>
            <kbd>{cooldown > 0 ? `${cooldown}s` : 'READY'}</kbd>
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
