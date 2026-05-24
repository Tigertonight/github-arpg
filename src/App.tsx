import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Axe,
  Backpack,
  Coins,
  Gem,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Sword,
  Zap,
} from 'lucide-react'
import './App.css'

type Slot = 'weapon' | 'armor' | 'charm'
type Rarity = 'common' | 'magic' | 'rare' | 'epic' | 'legendary'

type Item = {
  id: string
  name: string
  slot: Slot
  rarity: Rarity
  power: number
  speed: number
  find: number
  level: number
}

type GameState = {
  running: boolean
  stage: number
  gold: number
  shards: number
  kills: number
  xp: number
  heroHp: number
  enemyHp: number
  enemyMaxHp: number
  enemyName: string
  inventory: Item[]
  equipment: Record<Slot, Item | null>
  log: string[]
  lastSeen: number
}

const STORAGE_KEY = 'forge-lane-arpg-save-v1'
const slots: Slot[] = ['weapon', 'armor', 'charm']
const rarityOrder: Rarity[] = ['common', 'magic', 'rare', 'epic', 'legendary']

const rarityMeta: Record<Rarity, { label: string; color: string; weight: number }> = {
  common: { label: '灰装', color: '#aeb4bb', weight: 52 },
  magic: { label: '魔法', color: '#58a6ff', weight: 27 },
  rare: { label: '稀有', color: '#f2c94c', weight: 14 },
  epic: { label: '史诗', color: '#b980ff', weight: 6 },
  legendary: { label: '传说', color: '#ff8a3d', weight: 1 },
}

const enemies = ['碎骨矿奴', '锈刃猎犬', '幽光盗贼', '黑炉守卫', '裂隙骑士']
const slotNames: Record<Slot, string> = {
  weapon: '武器',
  armor: '护甲',
  charm: '护符',
}

function createEnemy(stage: number) {
  const maxHp = Math.round(86 + stage * 31 + Math.pow(stage, 1.45) * 9)
  return {
    enemyName: enemies[stage % enemies.length],
    enemyHp: maxHp,
    enemyMaxHp: maxHp,
  }
}

function createStarterState(): GameState {
  return {
    running: true,
    stage: 1,
    gold: 0,
    shards: 0,
    kills: 0,
    xp: 0,
    heroHp: 100,
    inventory: [
      makeItem(1, 'weapon', 'common'),
      makeItem(1, 'armor', 'common'),
      makeItem(1, 'charm', 'magic'),
    ],
    equipment: {
      weapon: null,
      armor: null,
      charm: null,
    },
    log: ['营火熄灭，铁轨向前延伸。自动战斗已启动。'],
    lastSeen: Date.now(),
    ...createEnemy(1),
  }
}

function makeItem(stage: number, forcedSlot?: Slot, forcedRarity?: Rarity): Item {
  const slot = forcedSlot ?? slots[Math.floor(Math.random() * slots.length)]
  const rarity = forcedRarity ?? rollRarity()
  const rank = rarityOrder.indexOf(rarity) + 1
  const level = Math.max(1, stage + Math.floor(Math.random() * 3) - 1)
  const prefix = {
    common: '旧制',
    magic: '回响',
    rare: '镀金',
    epic: '裂隙',
    legendary: '星坠',
  }[rarity]
  const base = {
    weapon: ['阔刃', '链斧', '火枪'],
    armor: ['皮甲', '炉甲', '巡林斗篷'],
    charm: ['徽记', '齿轮护符', '黑曜石坠'],
  }[slot]
  const name = `${prefix}${base[Math.floor(Math.random() * base.length)]}`

  return {
    id: crypto.randomUUID(),
    name,
    slot,
    rarity,
    level,
    power: Math.round(level * (4 + rank * 2) + Math.random() * rank * 5),
    speed: Number((rank * 0.04 + Math.random() * 0.08).toFixed(2)),
    find: Math.round(rank * 3 + Math.random() * level),
  }
}

function rollRarity(): Rarity {
  const total = Object.values(rarityMeta).reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total

  for (const rarity of rarityOrder) {
    roll -= rarityMeta[rarity].weight
    if (roll <= 0) return rarity
  }

  return 'common'
}

function itemScore(item: Item | null) {
  if (!item) return 0
  return item.power * 1.7 + item.speed * 70 + item.find * 0.9 + item.level * 2
}

function addLog(log: string[], entry: string) {
  return [entry, ...log].slice(0, 6)
}

function loadState(): GameState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createStarterState()

  try {
    const parsed = JSON.parse(raw) as GameState
    const offlineMinutes = Math.min(240, Math.floor((Date.now() - parsed.lastSeen) / 60000))
    if (offlineMinutes > 0) {
      parsed.gold += offlineMinutes * Math.max(3, parsed.stage * 2)
      parsed.xp += offlineMinutes * Math.max(2, parsed.stage)
      parsed.log = addLog(parsed.log, `离线巡猎 ${offlineMinutes} 分钟，带回金币与经验。`)
    }
    return { ...parsed, running: true, lastSeen: Date.now() }
  } catch {
    return createStarterState()
  }
}

function App() {
  const [game, setGame] = useState<GameState>(loadState)

  const stats = useMemo(() => {
    const equipped = Object.values(game.equipment)
    const gearPower = equipped.reduce((sum, item) => sum + (item?.power ?? 0), 0)
    const speed = equipped.reduce((sum, item) => sum + (item?.speed ?? 0), 1)
    const find = equipped.reduce((sum, item) => sum + (item?.find ?? 0), 8)
    const level = Math.floor(game.xp / 120) + 1
    const dps = Math.round((12 + level * 4 + gearPower) * speed)
    const toughness = 100 + (game.equipment.armor?.power ?? 0) * 4 + level * 12

    return { dps, find, gearPower, level, speed, toughness }
  }, [game.equipment, game.xp])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...game, lastSeen: Date.now() }))
  }, [game])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => (current.running ? advanceCombat(current, stats) : current))
    }, 900)

    return () => window.clearInterval(timer)
  }, [stats])

  const equipItem = (item: Item) => {
    setGame((current) => {
      const previous = current.equipment[item.slot]
      const inventory = current.inventory.filter((entry) => entry.id !== item.id)
      if (previous) inventory.unshift(previous)

      return {
        ...current,
        equipment: { ...current.equipment, [item.slot]: item },
        inventory: inventory.sort((a, b) => itemScore(b) - itemScore(a)).slice(0, 18),
        log: addLog(current.log, `换上 ${item.name}，战力提升到 ${Math.round(itemScore(item))}。`),
      }
    })
  }

  const salvageItem = (item: Item) => {
    const rank = rarityOrder.indexOf(item.rarity) + 1
    setGame((current) => ({
      ...current,
      shards: current.shards + rank,
      gold: current.gold + item.level * rank * 4,
      inventory: current.inventory.filter((entry) => entry.id !== item.id),
      log: addLog(current.log, `分解 ${item.name}，获得 ${rank} 裂片。`),
    }))
  }

  const burst = () => {
    if (game.shards < 3) return
    setGame((current) => ({
      ...current,
      shards: current.shards - 3,
      enemyHp: Math.max(0, current.enemyHp - stats.dps * 3),
      log: addLog(current.log, '释放过载斩击，下一只怪物也听见了动静。'),
    }))
  }

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY)
    setGame(createStarterState())
  }

  const bestDrop = game.inventory[0]
  const hpPercent = Math.max(0, Math.round((game.enemyHp / game.enemyMaxHp) * 100))
  const xpPercent = Math.round(((game.xp % 120) / 120) * 100)

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Forge Lane Prototype</p>
          <h1>横版挂机刷宝 ARPG</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" className="icon-button" onClick={() => setGame({ ...game, running: !game.running })}>
            {game.running ? <Pause size={18} /> : <Play size={18} />}
            <span>{game.running ? '暂停' : '继续'}</span>
          </button>
          <button type="button" className="icon-button subtle" onClick={reset}>
            <RotateCcw size={18} />
            <span>重开</span>
          </button>
        </div>
      </header>

      <section className="game-grid">
        <div className="stage-panel">
          <div className="lane-sky">
            <div className="moon" />
            <div className="cloud cloud-a" />
            <div className="cloud cloud-b" />
          </div>
          <div className="lane">
            <div className="hero-sprite" aria-label="自动战斗角色">
              <div className="hero-cape" />
              <div className="hero-body" />
              <Sword className="hero-blade" size={44} />
            </div>
            <div className="slash slash-a" />
            <div className="slash slash-b" />
            <div className="enemy-sprite">
              <div className="enemy-core" />
              <div className="enemy-eye" />
            </div>
            <div className="rail rail-a" />
            <div className="rail rail-b" />
          </div>
          <div className="stage-hud">
            <div>
              <span>第 {game.stage} 段矿道</span>
              <strong>{game.enemyName}</strong>
            </div>
            <div className="healthbar" aria-label="怪物生命">
              <span style={{ width: `${hpPercent}%` }} />
            </div>
            <span>{hpPercent}%</span>
          </div>
        </div>

        <aside className="stats-panel">
          <PanelTitle icon={<Axe size={18} />} title="战斗参数" />
          <div className="stat-list">
            <Stat label="英雄等级" value={stats.level} />
            <Stat label="每跳伤害" value={stats.dps} />
            <Stat label="装备战力" value={stats.gearPower} />
            <Stat label="寻宝值" value={stats.find} />
          </div>
          <div className="xp-row">
            <span>经验</span>
            <div className="xpbar">
              <span style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
          <button type="button" className="primary-skill" disabled={game.shards < 3} onClick={burst}>
            <Zap size={18} />
            <span>过载斩击</span>
            <kbd>3 裂片</kbd>
          </button>
        </aside>

        <section className="loot-panel">
          <PanelTitle icon={<Backpack size={18} />} title="背包掉落" />
          <div className="loot-list">
            {game.inventory.map((item) => (
              <article className="loot-card" key={item.id} style={{ '--rarity': rarityMeta[item.rarity].color } as CSSProperties}>
                <div>
                  <span>{slotNames[item.slot]}</span>
                  <h3>{item.name}</h3>
                  <p>
                    Lv.{item.level} {rarityMeta[item.rarity].label}
                  </p>
                </div>
                <div className="loot-numbers">
                  <strong>{Math.round(itemScore(item))}</strong>
                  <span>评分</span>
                </div>
                <div className="loot-actions">
                  <button type="button" onClick={() => equipItem(item)}>装备</button>
                  <button type="button" onClick={() => salvageItem(item)}>分解</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="side-stack">
          <section className="resource-panel">
            <PanelTitle icon={<Coins size={18} />} title="收益" />
            <div className="resource-grid">
              <Stat label="金币" value={game.gold} />
              <Stat label="裂片" value={game.shards} />
              <Stat label="击杀" value={game.kills} />
              <Stat label="攻速" value={`${stats.speed.toFixed(2)}x`} />
            </div>
          </section>

          <section className="equipment-panel">
            <PanelTitle icon={<Shield size={18} />} title="装备栏" />
            <div className="equipment-slots">
              {slots.map((slot) => {
                const item = game.equipment[slot]
                return (
                  <div className="equipment-slot" key={slot}>
                    <span>{slotNames[slot]}</span>
                    <strong>{item?.name ?? '空槽位'}</strong>
                    <small>{item ? `${rarityMeta[item.rarity].label} / ${Math.round(itemScore(item))}` : '等待掉落'}</small>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="log-panel">
            <PanelTitle icon={<Sparkles size={18} />} title="战斗记录" />
            <ol>
              {game.log.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ol>
          </section>
        </aside>
      </section>

      <footer className="footer-strip">
        <Gem size={18} />
        <span>当前目标：验证横版挂机战斗、掉落驱动和装备替换是否有持续反馈。</span>
        {bestDrop ? <strong>背包最佳：{bestDrop.name}</strong> : null}
      </footer>
    </main>
  )
}

function advanceCombat(current: GameState, stats: { dps: number; find: number; level: number }) {
  const nextHp = current.enemyHp - stats.dps
  if (nextHp > 0) {
    return { ...current, enemyHp: nextHp, heroHp: Math.min(100, current.heroHp + 1) }
  }

  const stage = current.kills > 0 && current.kills % 7 === 0 ? current.stage + 1 : current.stage
  const dropChance = Math.min(0.82, 0.28 + stats.find / 220)
  const dropped = Math.random() < dropChance ? makeItem(stage) : null
  const gold = Math.round(10 + stage * 6 + Math.random() * stage * 4)
  const xp = Math.round(18 + stage * 5)
  const inventory = dropped ? [dropped, ...current.inventory].sort((a, b) => itemScore(b) - itemScore(a)).slice(0, 18) : current.inventory
  const logEntry = dropped
    ? `${current.enemyName} 掉落 ${dropped.name}。`
    : `${current.enemyName} 被击破，矿灯继续向前。`

  return {
    ...current,
    ...createEnemy(stage),
    stage,
    inventory,
    gold: current.gold + gold,
    xp: current.xp + xp,
    kills: current.kills + 1,
    shards: current.shards + (stage % 5 === 0 ? 1 : 0),
    log: addLog(current.log, logEntry),
  }
}

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
