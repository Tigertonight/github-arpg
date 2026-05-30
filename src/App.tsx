import { useEffect, useMemo, useRef, useReducer, useState } from 'react'
import { Pause, Play, X } from 'lucide-react'
import './App.css'
import { deriveCombatStats, itemScore } from './domain/formulas'
import { reduce } from './engine/reducer'
import { loadGameState, saveGameState, SAVE_KEY } from './persistence/saveCodec'
import {
  EquipmentPanel,
  InventoryPanel,
  LootFilterPanel,
  SkillPanel,
  StageView,
  StatsPanel,
} from './ui/panels'
import { uiIcons, type UiIconKey } from './ui/uiIcons'

const TICK_MS = 900
type MobilePanel = 'inventory' | 'equipment' | 'skills' | 'stats' | 'filter' | 'log'

const mobilePanels: Array<{ id: MobilePanel; label: string; icon: UiIconKey }> = [
  { id: 'inventory', label: '背包', icon: 'bag' },
  { id: 'equipment', label: '装备', icon: 'equip' },
  { id: 'skills', label: '技能', icon: 'skills' },
  { id: 'stats', label: '参数', icon: 'stats' },
  { id: 'filter', label: '筛选', icon: 'filter' },
  { id: 'log', label: '日志', icon: 'log' },
]

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h}小时${m}分钟`
  return `${m}分钟`
}

function App() {
  const [game, dispatch] = useReducer(reduce, undefined, () => loadGameState())
  const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanel | null>(null)
  const [showBossKill, setShowBossKill] = useState(false)
  const [milestoneToast, setMilestoneToast] = useState<string | null>(null)
  const stats = useMemo(
    () => game.cachedStats ?? deriveCombatStats(game.hero.equipment, game.itemsById, game.hero.level),
    [game.hero, game.itemsById, game.cachedStats],
  )

  const lastSaveRef = useRef(0)

  useEffect(() => {
    const now = Date.now()
    if (!game.running || now - lastSaveRef.current > 30_000) {
      saveGameState(game)
      lastSaveRef.current = now
    }
  }, [game])

  useEffect(() => {
    const handler = () => saveGameState(game)
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [game])

  useEffect(() => {
    if (game.lastBossKill) {
      setShowBossKill(true)
      const t = setTimeout(() => setShowBossKill(false), 3000)
      return () => clearTimeout(t)
    }
  }, [game.lastBossKill])

  // 里程碑提示
  useEffect(() => {
    const milestones: Array<{ id: string; condition: boolean; text: string }> = [
      {
        id: 'first_equip',
        condition: Object.values(game.hero.equipment).some(Boolean),
        text: '首次装备！属性面板可查看战斗加成',
      },
      {
        id: 'first_elite',
        condition: game.progression.kills > 0 && game.progression.stage >= 3,
        text: '精英敌人出现，伤害更高、奖励更丰厚',
      },
      {
        id: 'first_boss',
        condition: game.progression.stage >= 10,
        text: 'BOSS 层到达！建议确认装备状态再迎战',
      },
      {
        id: 'first_chaos',
        condition: game.resources.chaosStones >= 3,
        text: '已攒 3 个混沌石，可在道具详情页重铸词缀',
      },
      {
        id: 'first_burst',
        condition: game.burstUntilMs > 0,
        text: '爆发激活！攻速 +50%，享受 30 秒狂杀',
      },
    ]
    for (const m of milestones) {
      if (m.condition && !(game.triggeredMilestones ?? []).includes(m.id)) {
        dispatch({ type: 'triggerMilestone', milestoneId: m.id })
        setMilestoneToast(m.text)
        setTimeout(() => setMilestoneToast(null), 4000)
        break // 每次只显示一条
      }
    }
  }, [game.progression.stage, game.progression.kills, game.hero.equipment, game.resources.chaosStones, game.burstUntilMs])

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'tick', dt: TICK_MS }), TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  const reset = () => {
    localStorage.removeItem(SAVE_KEY)
    dispatch({ type: 'reset' })
    setShowBossKill(false)
  }

  const onActivateBurst = () => dispatch({ type: 'activateBurst' })

  const today = new Date().toISOString().slice(0, 10)
  const canCheckIn = game.lastCheckInDate !== today

  const bestDrop = [...game.inventory.pendingOfflineLootIds, ...game.inventory.itemIds]
    .map((id) => game.itemsById[id])
    .filter(Boolean)
    .sort((a, b) => itemScore(b) - itemScore(a))[0]

  const renderInventory = () => (
    <InventoryPanel
      game={game}
      onEquip={(item) => dispatch({ type: 'equipItem', itemId: item.id })}
      onSalvage={(item) => dispatch({ type: 'salvageItem', itemId: item.id })}
      onClaimOffline={() => dispatch({ type: 'claimOffline' })}
      onToggleAffixLock={(itemId, affixIndex) => dispatch({ type: 'toggleAffixLock', itemId, affixIndex })}
      onRerollAffix={(itemId, affixIndex) => dispatch({ type: 'rerollAffix', itemId, affixIndex })}
      onExpandInventory={() => dispatch({ type: 'expandInventory' })}
      onSalvageBelow={(threshold) => dispatch({ type: 'salvageBelow', threshold })}
    />
  )

  const renderFilter = () => (
    <LootFilterPanel
      rules={game.inventory.filter}
      onToggle={(ruleId) => dispatch({ type: 'toggleFilter', ruleId })}
    />
  )

  const renderMobilePanel = () => {
    switch (activeMobilePanel) {
      case 'inventory':
        return renderInventory()
      case 'equipment':
        return <EquipmentPanel game={game} />
      case 'skills':
        return <SkillPanel game={game} />
      case 'stats':
        return <StatsPanel game={game} stats={stats} />
      case 'filter':
        return renderFilter()
      case 'log':
        return (
          <ol className="mobile-log-list">
            {game.combatLog.map((entry) => (
              <li key={entry.id}>{entry.text}</li>
            ))}
          </ol>
        )
      default:
        return null
    }
  }

  const activePanelMeta = mobilePanels.find((panel) => panel.id === activeMobilePanel)

  return (
    <main className="app-shell">
      <header className="topbar">
        {/* 左：游戏标题徽章 */}
        <div className="game-badge">
          <img className="game-badge-icon" src={uiIcons.gameBadge} alt="" />
          <div>
            <span className="game-badge-sub">Forge Lane</span>
            <span className="game-badge-title">破誓骑士</span>
          </div>
        </div>

        {/* 中：资源条 */}
        <div className="topbar-resources">
          <div className="res-pill">
            <img className="res-icon" src={uiIcons.gold} alt="" />
            <span className="res-val">{game.resources.gold.toLocaleString()}</span>
          </div>
          <div className="res-pill">
            <img className="res-icon" src={uiIcons.shards} alt="" />
            <span className="res-val">{game.resources.shards}</span>
          </div>
          <div className="res-pill">
            <img className="res-icon" src={uiIcons.chaos} alt="" />
            <span className="res-val">{game.resources.chaosStones}</span>
          </div>
          <div className="res-pill res-pill-kills">
            <img className="res-icon" src={uiIcons.kills} alt="" />
            <span className="res-val">{game.progression.kills.toLocaleString()}</span>
          </div>
          <div className="res-pill">
            <img className="res-icon" src={uiIcons.trophy} alt="" />
            <span className="res-val">层 {game.progression.highestStage}</span>
          </div>
        </div>

        {/* 右：操作区 */}
        <div className="topbar-actions">
          {canCheckIn && (
            <button
              type="button"
              className="check-in-btn"
              onClick={() => dispatch({ type: 'checkIn' })}
              title={`签到第 ${(game.checkInStreak ?? 0) + 1} 天`}
            >
              <img className="button-art-icon" src={uiIcons.checkIn} alt="" />
            </button>
          )}
          <button
            type="button"
            className={`burst-button${game.burstUntilMs > game.gameTimeMs ? ' burst-active' : ''}`}
            onClick={onActivateBurst}
            disabled={game.resources.gold < 200 || game.burstUntilMs > game.gameTimeMs}
            title="消耗 200 金币激活爆发：攻速+50% 持续 30 秒"
          >
            <img className="button-art-icon" src={uiIcons.burst} alt="" />
            {game.burstUntilMs > game.gameTimeMs ? null : <span>爆发</span>}
          </button>
          <button type="button" className="icon-button" onClick={() => dispatch({ type: 'togglePause' })}>
            {game.running ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" className="icon-button subtle" onClick={reset} title="重开">
            <img className="button-art-icon small" src={uiIcons.reset} alt="" />
          </button>
        </div>
      </header>

      <section className="game-grid">
        <StageView game={game} dispatch={dispatch} />
      </section>

      <footer className="footer-strip">
        <img className="footer-art-icon" src={uiIcons.chaos} alt="" />
        <span>当前目标：叠流血、抓处决窗口、筛出能让 Build 成型的词缀。</span>
        <img className="footer-art-icon" src={uiIcons.reroll} alt="" />
        {bestDrop ? <strong>背包最佳：{bestDrop.name}</strong> : <strong>等待掉落</strong>}
      </footer>

      <nav className="mobile-dock" aria-label="移动端系统菜单">
        {mobilePanels.map(({ id, label, icon }) => (
          <button
            type="button"
            className={activeMobilePanel === id ? 'active' : undefined}
            onClick={() => setActiveMobilePanel((current) => (current === id ? null : id))}
            key={id}
          >
            <img className="mobile-dock-icon" src={uiIcons[icon]} alt="" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {showBossKill && game.lastBossKill && (
        <div className="boss-kill-banner">
          <div className="boss-kill-inner">
            <span className="boss-kill-label">BOSS 已击杀</span>
            <strong className="boss-kill-name">{game.lastBossKill.bossName}</strong>
            <span className="boss-kill-stage">第 {game.lastBossKill.stage} 层</span>
            <span className="boss-kill-reward">{game.lastBossKill.rewardText}</span>
          </div>
        </div>
      )}

      {milestoneToast && (
        <div className="milestone-toast">
          <span>{milestoneToast}</span>
        </div>
      )}

      {game.pendingOfflineResult && (
        <div className="offline-overlay" onClick={() => dispatch({ type: 'dismissOfflineResult' })}>
          <div className="offline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="offline-modal-header">
              <img className="offline-modal-icon" src={uiIcons.log} alt="" />
              <h3>离线结算</h3>
              <button type="button" className="offline-modal-close" onClick={() => dispatch({ type: 'dismissOfflineResult' })}>
                <X size={18} />
              </button>
            </div>
            <div className="offline-stats">
              <div className="offline-stat">
                <img className="offline-stat-icon" src={uiIcons.pause} alt="" />
                <span className="offline-stat-label">离线时长</span>
                <strong className="offline-stat-value">{formatDuration(game.pendingOfflineResult.elapsedMs)}</strong>
              </div>
              <div className="offline-stat">
                <img className="offline-stat-icon" src={uiIcons.kills} alt="" />
                <span className="offline-stat-label">击杀数</span>
                <strong className="offline-stat-value">{game.pendingOfflineResult.kills.toLocaleString()}</strong>
              </div>
              <div className="offline-stat">
                <img className="offline-stat-icon" src={uiIcons.gold} alt="" />
                <span className="offline-stat-label">获得金币</span>
                <strong className="offline-stat-value gold">{game.pendingOfflineResult.goldGained.toLocaleString()}</strong>
              </div>
              <div className="offline-stat">
                <img className="offline-stat-icon" src={uiIcons.checkIn} alt="" />
                <span className="offline-stat-label">获得道具</span>
                <strong className="offline-stat-value items">{game.pendingOfflineResult.itemsFound}</strong>
              </div>
            </div>
            <button className="offline-modal-dismiss" onClick={() => dispatch({ type: 'dismissOfflineResult' })}>继续冒险</button>
          </div>
        </div>
      )}

      {game.bossChoicePending && (
        <div className="boss-choice-overlay">
          <div className="boss-choice-modal">
            <img className="boss-choice-icon" src={uiIcons.boss} alt="" />
            <h3 className="boss-choice-title">BOSS 层</h3>
            <p className="boss-choice-desc">
              {game.enemyGroup.members.find(e => e.rank === 'boss')?.name ?? 'Boss'} 正在等待
            </p>
            <div className="boss-choice-btns">
              <button className="boss-choice-btn boss-choice-fight" onClick={() => dispatch({ type: 'resumeCombat' })}>
                <img className="boss-choice-btn-icon" src={uiIcons.skills} alt="" />
                迎战<span>掉落更多，风险更高</span>
              </button>
              <button className="boss-choice-btn boss-choice-skip" onClick={() => dispatch({ type: 'skipBoss' })}>
                <img className="boss-choice-btn-icon" src={uiIcons.retreat} alt="" />
                绕过<span>跳至下一层，无奖励</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMobilePanel ? (
        <div className="mobile-sheet" role="dialog" aria-modal="true" aria-label={activePanelMeta?.label}>
          <button type="button" className="mobile-sheet-scrim" aria-label="关闭面板" onClick={() => setActiveMobilePanel(null)} />
          <section className="mobile-sheet-panel">
            <header className="mobile-sheet-header">
              <strong>{activePanelMeta?.label}</strong>
              <button type="button" className="mobile-sheet-close" aria-label="关闭面板" onClick={() => setActiveMobilePanel(null)}>
                <X size={20} />
              </button>
            </header>
            <div className="mobile-sheet-body">{renderMobilePanel()}</div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
