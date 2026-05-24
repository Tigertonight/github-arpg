import { useEffect, useMemo, useState } from 'react'
import { Axe, Backpack, Coins, FlaskConical, Gem, Pause, Play, RotateCcw, Shield, SlidersHorizontal, Sparkles, Swords } from 'lucide-react'
import './App.css'
import { deriveCombatStats, itemScore, rarityMeta, addLog } from './domain/formulas'
import type { ItemInstance, LootFilterRule } from './domain/types'
import { advanceCombat } from './engine/combatLoop'
import { salvageValue } from './engine/loot'
import { createStarterState } from './persistence/migrations'
import { loadGameState, saveGameState, SAVE_KEY } from './persistence/saveCodec'
import {
  EquipmentPanel,
  InventoryPanel,
  LootFilterPanel,
  PanelTitle,
  SkillPanel,
  StageView,
  Stat,
  StatsPanel,
} from './ui/panels'

function App() {
  const [game, setGame] = useState(loadGameState)
  const stats = useMemo(() => deriveCombatStats(game.hero.equipment, game.itemsById, game.hero.level), [game.hero, game.itemsById])

  useEffect(() => {
    saveGameState(game)
  }, [game])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => (current.running ? advanceCombat(current) : current))
    }, 900)

    return () => window.clearInterval(timer)
  }, [])

  const equipItem = (item: ItemInstance) => {
    setGame((current) => {
      const previous = current.hero.equipment[item.slot]
      const inventoryIds = current.inventory.itemIds.filter((id) => id !== item.id)
      const pendingOfflineLootIds = current.inventory.pendingOfflineLootIds.filter((id) => id !== item.id)
      if (previous) inventoryIds.unshift(previous)

      return {
        ...current,
        hero: {
          ...current.hero,
          equipment: {
            ...current.hero.equipment,
            [item.slot]: item.id,
          },
        },
        inventory: {
          ...current.inventory,
          itemIds: inventoryIds.slice(0, current.inventory.capacity),
          pendingOfflineLootIds,
        },
        combatLog: addLog(current.combatLog, `换上 ${item.name}，装备评分 ${itemScore(item)}。`),
      }
    })
  }

  const salvageItem = (item: ItemInstance) => {
    setGame((current) => {
      const nextEquipment = { ...current.hero.equipment }
      if (nextEquipment[item.slot] === item.id) nextEquipment[item.slot] = null
      const itemsById = { ...current.itemsById }
      delete itemsById[item.id]
      const shards = salvageValue(item)

      return {
        ...current,
        hero: {
          ...current.hero,
          equipment: nextEquipment,
        },
        resources: {
          ...current.resources,
          shards: current.resources.shards + shards,
          gold: current.resources.gold + item.itemLevel * rarityMeta[item.rarity].salvage,
        },
        inventory: {
          ...current.inventory,
          itemIds: current.inventory.itemIds.filter((id) => id !== item.id),
          pendingOfflineLootIds: current.inventory.pendingOfflineLootIds.filter((id) => id !== item.id),
        },
        itemsById,
        combatLog: addLog(current.combatLog, `分解 ${item.name}，获得 ${shards} 裂片。`),
      }
    })
  }

  const toggleFilter = (id: LootFilterRule['id']) => {
    setGame((current) => ({
      ...current,
      inventory: {
        ...current.inventory,
        filter: current.inventory.filter.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)),
      },
    }))
  }

  const claimOffline = () => {
    setGame((current) => ({
      ...current,
      inventory: {
        ...current.inventory,
        itemIds: [...current.inventory.pendingOfflineLootIds, ...current.inventory.itemIds].slice(0, current.inventory.capacity),
        pendingOfflineLootIds: [],
      },
      combatLog: addLog(current.combatLog, '离线战利品已鉴定并放入背包。'),
    }))
  }

  const reset = () => {
    localStorage.removeItem(SAVE_KEY)
    setGame(createStarterState())
  }

  const bestDrop = [...game.inventory.pendingOfflineLootIds, ...game.inventory.itemIds]
    .map((id) => game.itemsById[id])
    .filter(Boolean)
    .sort((a, b) => itemScore(b) - itemScore(a))[0]

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Forge Lane / M1+M2</p>
          <h1>破誓骑士：黑炉流血构筑</h1>
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
        <StageView game={game} />

        <aside className="stats-panel">
          <PanelTitle icon={<Axe size={18} />} title="战斗参数" />
          <StatsPanel game={game} stats={stats} />
        </aside>

        <section className="loot-wrap">
          <PanelTitle icon={<Backpack size={18} />} title="背包掉落" />
          <InventoryPanel game={game} onEquip={equipItem} onSalvage={salvageItem} onClaimOffline={claimOffline} />
        </section>

        <aside className="side-stack">
          <section className="resource-panel">
            <PanelTitle icon={<Coins size={18} />} title="收益" />
            <div className="resource-grid">
              <Stat label="金币" value={game.resources.gold} />
              <Stat label="裂片" value={game.resources.shards} />
              <Stat label="击杀" value={game.progression.kills} />
              <Stat label="最高层" value={game.progression.highestStage} />
            </div>
          </section>

          <section className="skill-panel">
            <PanelTitle icon={<Swords size={18} />} title="技能与符文" />
            <SkillPanel game={game} />
          </section>

          <section className="filter-panel">
            <PanelTitle icon={<SlidersHorizontal size={18} />} title="掉落筛选" />
            <LootFilterPanel rules={game.inventory.filter} onToggle={toggleFilter} />
          </section>

          <section className="equipment-panel">
            <PanelTitle icon={<Shield size={18} />} title="装备栏" />
            <EquipmentPanel game={game} />
          </section>

          <section className="log-panel">
            <PanelTitle icon={<Sparkles size={18} />} title="战斗记录" />
            <ol>
              {game.combatLog.map((entry) => (
                <li key={entry.id}>{entry.text}</li>
              ))}
            </ol>
          </section>
        </aside>
      </section>

      <footer className="footer-strip">
        <Gem size={18} />
        <span>当前目标：叠流血、抓处决窗口、筛出能让 Build 成型的词缀。</span>
        <FlaskConical size={18} />
        {bestDrop ? <strong>背包最佳：{bestDrop.name}</strong> : <strong>等待掉落</strong>}
      </footer>
    </main>
  )
}

export default App
