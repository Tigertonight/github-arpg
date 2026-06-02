import { useEffect, useMemo, useRef, useReducer, useState, type CSSProperties } from 'react'
import { Pause, Play, X } from 'lucide-react'
import './App.css'
import { deriveCombatStats, itemScore } from './domain/formulas'
import { reduce } from './engine/reducer'
import { loadGameState, saveGameState, SAVE_KEY } from './persistence/saveCodec'
import {
  AchievementsPanel,
  BestiaryPanel,
  BuildPlannerPanel,
  DailyGoalsPanel,
  EquipmentPanel,
  InventoryPanel,
  LootFilterPanel,
  SkillPanel,
  StageView,
  StatsPanel,
  TormentPanel,
} from './ui/panels'
import { uiIcons, type UiIconKey } from './ui/uiIcons'

const TICK_MS = 900
const HERO_ENTRY_KEY = 'forge-lane:selected-hero'
type MobilePanel = 'inventory' | 'equipment' | 'skills' | 'build' | 'challenge' | 'bestiary'

type HeroChoiceId = 'oathbreaker' | 'ash_hunter' | 'grave_votary' | 'iron_gaoler'

const heroChoices: Array<{
  id: HeroChoiceId
  name: string
  title: string
  role: string
  status: string
  ready: boolean
  preview: string
  previewKind: 'sheet' | 'atlas' | 'image'
  accent: string
  stats: Array<{ label: string; value: string }>
  traits: string[]
}> = [
  {
    id: 'oathbreaker',
    name: '破誓骑士',
    title: '重甲流血 / 处决',
    role: '稳定前排，适合当前版本推进。',
    status: '可选择',
    ready: true,
    preview: '/assets/game/oathbreaker-hero.png',
    previewKind: 'image',
    accent: '#f0743e',
    stats: [
      { label: '生存', value: 'A' },
      { label: '清场', value: 'B' },
      { label: '单体', value: 'A' },
    ],
    traits: ['流血叠层', '低血处决', '铁誓守护'],
  },
  {
    id: 'ash_hunter',
    name: '灰烬猎手',
    title: '高速点燃 / 标记爆发',
    role: '轻甲高速，依赖闪避和暴击窗口。',
    status: '可选择',
    ready: false,
    preview: '/assets/game/generated-source/heroes/ash_hunter/preview.png',
    previewKind: 'image',
    accent: '#ff8a3d',
    stats: [
      { label: '生存', value: 'C' },
      { label: '清场', value: 'A' },
      { label: '单体', value: 'B' },
    ],
    traits: ['灰刃连斩', '余烬标记', '烬步回避'],
  },
  {
    id: 'grave_votary',
    name: '墓誓修女',
    title: '诅咒 / 召唤 / 护盾',
    role: '长线稳定，擅长削弱敌群。',
    status: '可选择',
    ready: false,
    preview: '/assets/game/generated-source/heroes/grave_votary/preview.png',
    previewKind: 'image',
    accent: '#b980ff',
    stats: [
      { label: '生存', value: 'B' },
      { label: '清场', value: 'B' },
      { label: '单体', value: 'B' },
    ],
    traits: ['墓灯引魂', '黑祷诅咒', '守墓圣幕'],
  },
  {
    id: 'iron_gaoler',
    name: '铁狱执行官',
    title: '重击 / 破甲 / 眩晕',
    role: '慢速高压，专精精英和 Boss。',
    status: '可选择',
    ready: false,
    preview: '/assets/game/generated-source/heroes/iron_gaoler/preview.png',
    previewKind: 'image',
    accent: '#d89b58',
    stats: [
      { label: '生存', value: 'S' },
      { label: '清场', value: 'C' },
      { label: '单体', value: 'A' },
    ],
    traits: ['铁狱断骨', '囚笼横砸', '判刑爆发'],
  },
]

function isHeroChoiceId(value: string | null): value is HeroChoiceId {
  return heroChoices.some((hero) => hero.id === value)
}

const mobilePanels: Array<{ id: MobilePanel; label: string; icon: UiIconKey }> = [
  { id: 'inventory', label: '背包', icon: 'bag' },
  { id: 'equipment', label: '装备', icon: 'equip' },
  { id: 'skills', label: '技能', icon: 'skills' },
  { id: 'build', label: '流派', icon: 'skills' },
  { id: 'challenge', label: '挑战', icon: 'boss' },
  { id: 'bestiary', label: '图鉴', icon: 'log' },
]

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h}小时${m}分钟`
  return `${m}分钟`
}

const QA_PARAM = 'qa'

function isQaUrl(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get(QA_PARAM) === '1'
}

function App() {
  const [game, dispatch] = useReducer(reduce, undefined, () => {
    const initial = loadGameState()
    return isQaUrl() ? { ...initial, qaMode: true } : initial
  })
  const [showHeroSelect, setShowHeroSelect] = useState(() => !isHeroChoiceId(localStorage.getItem(HERO_ENTRY_KEY)))
  const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanel | null>(null)
  const [showBossKill, setShowBossKill] = useState(false)
  const [milestoneToast, setMilestoneToast] = useState<string | null>(null)
  const [showDailyGoals, setShowDailyGoals] = useState(false)
  const [showHeroDrawer, setShowHeroDrawer] = useState(false)
  const stats = useMemo(
    () => game.cachedStats ?? deriveCombatStats(game.hero.equipment, game.itemsById, game.hero.level),
    [game.hero, game.itemsById, game.cachedStats],
  )

  const lastSaveRef = useRef(0)

  useEffect(() => {
    if (game.qaMode) return // QA 模式不写主存档
    const now = Date.now()
    if (!game.running || now - lastSaveRef.current > 30_000) {
      saveGameState(game)
      lastSaveRef.current = now
    }
  }, [game])

  useEffect(() => {
    if (game.qaMode) return
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

  useEffect(() => {
    if (game.qaMode) setActiveMobilePanel('bestiary')
  }, [game.qaMode])

  const reset = () => {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(HERO_ENTRY_KEY)
    dispatch({ type: 'reset' })
    setShowBossKill(false)
    setShowHeroSelect(true)
  }

  const onActivateBurst = () => dispatch({ type: 'activateBurst' })

  const exitQaMode = () => {
    dispatch({ type: 'qaSetMode', enabled: false })
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete(QA_PARAM)
      window.history.replaceState(null, '', url.pathname + (url.search ? `?${url.searchParams}` : ''))
    }
  }

  const enterGame = (heroId: HeroChoiceId) => {
    const hero = heroChoices.find((choice) => choice.id === heroId) ?? heroChoices[0]
    localStorage.setItem(HERO_ENTRY_KEY, heroId)
    dispatch({ type: 'selectHero', heroId, heroName: hero.name })
    setShowHeroSelect(false)
  }

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

  const renderInventoryHub = () => (
    <div className="panel-stack">
      {renderInventory()}
      <section className="panel-subsection">
        <div className="panel-subsection-header">
          <img className="inline-art-icon" src={uiIcons.filter} alt="" />
          <strong>掉落筛选</strong>
          <span>自动分解低价值战利品</span>
        </div>
        {renderFilter()}
      </section>
    </div>
  )

  const renderChallengeHub = () => (
    <div className="panel-stack">
      <section className="panel-subsection">
        <div className="panel-subsection-header">
          <img className="inline-art-icon" src={uiIcons.trophy} alt="" />
          <strong>每日目标</strong>
          <span>任务进度与奖励领取</span>
        </div>
        <DailyGoalsPanel
          game={game}
          onClaim={(goalId) => dispatch({ type: 'claimDailyGoal', goalId })}
        />
      </section>
      <section className="panel-subsection">
        <div className="panel-subsection-header">
          <img className="inline-art-icon" src={uiIcons.boss} alt="" />
          <strong>难度阶梯</strong>
          <span>调整 Torment 与推进目标</span>
        </div>
        <TormentPanel game={game} onSelect={(t) => dispatch({ type: 'setTorment', torment: t })} />
      </section>
    </div>
  )

  const renderMobilePanel = () => {
    switch (activeMobilePanel) {
      case 'inventory':
        return renderInventoryHub()
      case 'equipment':
        return <EquipmentPanel game={game} />
      case 'skills':
        return <SkillPanel game={game} onChooseRune={(skillId, slot, runeId) => dispatch({ type: 'chooseSkillRune', skillId, slot, runeId })} />
      case 'build':
        return <BuildPlannerPanel game={game} />
      case 'challenge':
        return renderChallengeHub()
      case 'bestiary':
        return (
          <BestiaryPanel
            game={game}
            onQaSpawn={(ids) => dispatch({ type: 'qaSpawn', enemyDefIds: ids })}
            onQaExit={exitQaMode}
          />
        )
      default:
        return null
    }
  }

  const activePanelMeta = mobilePanels.find((panel) => panel.id === activeMobilePanel)

  if (showHeroSelect) {
    return <CharacterSelectHome onEnter={enterGame} />
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        {/* 左：游戏标题徽章 */}
        <button type="button" className="game-badge game-badge-button" onClick={() => setShowHeroDrawer(true)} title="打开角色总览">
          <img className="game-badge-icon" src={uiIcons.gameBadge} alt="" />
          <div>
            <span className="game-badge-sub">Forge Lane</span>
            <span className="game-badge-title">破誓骑士</span>
          </div>
        </button>

        {game.qaMode && (
          <button
            type="button"
            className="qa-badge"
            onClick={exitQaMode}
            title="退出 QA 沙盒模式（点击返回正常游戏）"
          >
            QA 模式 · 美术验收
          </button>
        )}

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
          {(game.progression.maxTormentUnlocked > 0 || game.progression.torment > 0) && (
            <button
              type="button"
              className="res-pill res-pill-torment"
              onClick={() => setActiveMobilePanel((current) => (current === 'challenge' ? null : 'challenge'))}
              title={`Torment T${game.progression.torment}（已解锁 T${game.progression.maxTormentUnlocked}）`}
            >
              <img className="res-icon" src={uiIcons.boss} alt="" />
              <span className="res-val">T{game.progression.torment}</span>
            </button>
          )}
        </div>

        {/* 右：操作区 */}
        <div className="topbar-actions">
          <button
            type="button"
            className={`daily-goals-toggle${(game.dailyGoals?.goals.some(g => g.progress >= g.target && !g.claimed)) ? ' daily-goals-toggle-pulse' : ''}`}
            onClick={() => setShowDailyGoals(v => !v)}
            title="每日目标"
          >
            目标
          </button>
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

      {showDailyGoals && (
        <div className="daily-goals-overlay" onClick={() => setShowDailyGoals(false)}>
          <div className="daily-goals-card" onClick={(e) => e.stopPropagation()}>
            <DailyGoalsPanel
              game={game}
              onClaim={(goalId) => dispatch({ type: 'claimDailyGoal', goalId })}
            />
          </div>
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

      {showHeroDrawer ? (
        <div className="mobile-sheet hero-drawer" role="dialog" aria-modal="true" aria-label="角色总览">
          <button type="button" className="mobile-sheet-scrim" aria-label="关闭角色总览" onClick={() => setShowHeroDrawer(false)} />
          <section className="mobile-sheet-panel hero-drawer-panel">
            <header className="mobile-sheet-header">
              <strong>角色总览</strong>
              <button type="button" className="mobile-sheet-close" aria-label="关闭角色总览" onClick={() => setShowHeroDrawer(false)}>
                <X size={20} />
              </button>
            </header>
            <div className="mobile-sheet-body">
              <section className="panel-subsection hero-summary-card">
                <div className="panel-subsection-header">
                  <img className="inline-art-icon" src={uiIcons.gameBadge} alt="" />
                  <strong>破誓骑士</strong>
                  <span>Lv.{game.hero.level} / 层 {game.progression.highestStage}</span>
                </div>
                <button type="button" className="hero-switch-button" onClick={() => { setShowHeroDrawer(false); setShowHeroSelect(true) }}>
                  角色选择
                </button>
              </section>
              <StatsPanel game={game} stats={stats} />
              <AchievementsPanel game={game} />
            </div>
          </section>
        </div>
      ) : null}

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

function CharacterSelectHome({ onEnter }: { onEnter: (heroId: HeroChoiceId) => void }) {
  const [selectedId, setSelectedId] = useState<HeroChoiceId>('oathbreaker')
  const selected = heroChoices.find((hero) => hero.id === selectedId) ?? heroChoices[0]

  return (
    <main className="hero-select-shell">
      <section className="hero-select-stage" style={{ '--hero-accent': selected.accent } as CSSProperties}>
        <div className="hero-select-bg" />
        <header className="hero-select-header">
          <div className="game-badge">
            <img className="game-badge-icon" src={uiIcons.gameBadge} alt="" />
            <div>
              <span className="game-badge-sub">Forge Lane</span>
              <span className="game-badge-title">选择角色</span>
            </div>
          </div>
          <div className="hero-select-status">
            <span>当前版本</span>
            <strong>角色扩展预备阶段</strong>
          </div>
        </header>

        <div className="hero-select-main">
          <aside className="hero-roster" aria-label="角色列表">
            {heroChoices.map((hero) => (
              <button
                type="button"
                key={hero.id}
                className={`hero-choice-card${selected.id === hero.id ? ' active' : ''}${hero.ready ? '' : ' pending-runtime'}`}
                onClick={() => setSelectedId(hero.id)}
                style={{ '--hero-accent': hero.accent } as CSSProperties}
              >
                <span className="hero-choice-thumb">
                  <span
                    className={`hero-choice-thumb-art ${hero.previewKind}`}
                    style={{ backgroundImage: `url("${hero.preview}")` }}
                  />
                </span>
                <span className="hero-choice-copy">
                  <strong>{hero.name}</strong>
                  <span>{hero.title}</span>
                </span>
                <span className="hero-choice-state">{hero.status}</span>
              </button>
            ))}
          </aside>

          <section className="hero-preview-panel" aria-label={`${selected.name}预览`}>
            <div className="hero-preview-art-wrap">
              <div
                className={`hero-preview-art ${selected.previewKind}`}
                style={{ backgroundImage: `url("${selected.preview}")` }}
              />
            </div>
            <div className="hero-preview-copy">
              <span className="hero-preview-kicker">{selected.status}</span>
              <h1>{selected.name}</h1>
              <strong>{selected.title}</strong>
              <p>{selected.role}</p>
              <div className="hero-traits">
                {selected.traits.map((trait) => (
                  <span key={trait}>{trait}</span>
                ))}
              </div>
            </div>
          </section>

          <aside className="hero-loadout-panel">
            <div className="hero-stat-grid">
              {selected.stats.map((stat) => (
                <div className="hero-stat-chip" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
            <div className="hero-start-copy">
              <span>出战状态</span>
              <strong>{selected.ready ? '已完成运行时动作资源' : '可选择，战斗中暂用通用动作'}</strong>
            </div>
            <button
              type="button"
              className="hero-start-button"
              onClick={() => onEnter(selected.id)}
            >
              <Play size={18} />
              选择并出战
            </button>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default App
