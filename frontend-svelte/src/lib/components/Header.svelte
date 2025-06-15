<script>
  import { scale, fly } from 'svelte/transition';
  import {
    gameStats,
    totalBalance,
    marketData,
    gamePhase,
    gameActions
  } from '../stores/gameStores.js';

  let balanceChange = 0;
  let previousBalance = 0;
  let balanceClass = '';

  // Watch for balance changes to trigger animations
  $: if ($totalBalance !== previousBalance && previousBalance > 0) {
    balanceChange = $totalBalance - previousBalance;
    balanceClass = balanceChange > 0 ? 'positive' : 'negative';

    // Reset animation class after animation completes
    setTimeout(() => {
      balanceClass = '';
    }, 1000);
  }

  $: previousBalance = $totalBalance;

  // Phase display mapping
  const phaseDisplays = {
    'single-bot': {
      name: 'Single Bot',
      description: 'Your philosophical trading companion'
    },
    'small-collective': {
      name: 'Small Collective',
      description: 'Growing your bot family'
    },
    'trading-firm': {
      name: 'Trading Firm',
      description: 'Professional bot operation'
    },
    'market-makers': {
      name: 'Market Makers',
      description: 'Elite trading collective'
    }
  };

  $: currentPhase = phaseDisplays[$gamePhase] || phaseDisplays['single-bot'];

  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Handle control button clicks
  function handleSettings() {
    gameActions.showModal('settings');
  }

  function handleAchievements() {
    gameActions.showModal('achievements');
  }

  function handleHelp() {
    gameActions.showModal('help');
  }
</script>

<header class="game-header">
  <div class="header-content">
    <!-- Game Title and Phase -->
    <div class="game-title">
      <h1>🤖 QOINbots</h1>
      <div class="phase-indicator">
        <span class="phase-name">{currentPhase.name}</span>
        <span class="phase-description">{currentPhase.description}</span>
      </div>
    </div>

    <!-- Game Statistics -->
    <div class="header-stats">
      <div class="stat-item">
        <span class="stat-label">Total Balance</span>
        <div class="balance {balanceClass}" in:scale={{duration: 200}}>
          {formatCurrency($totalBalance)}
          {#if balanceChange !== 0}
            <span class="balance-change" transition:fly={{y: -10, duration: 500}}>
              {balanceChange > 0 ? '+' : ''}{formatCurrency(balanceChange)}
            </span>
          {/if}
        </div>
      </div>

      <div class="stat-item">
        <span class="stat-label">Active Bots</span>
        <div class="bot-count" in:scale={{duration: 200}}>
          {$gameStats.activeBots}
        </div>
      </div>

      <div class="stat-item">
        <span class="stat-label">Market Cycle</span>
        <div class="market-cycle" class:bull={$marketData.cycle === 'Growth'} class:bear={$marketData.cycle === 'Decline'}>
          {$marketData.cycle}
        </div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="header-controls">
      <button class="control-btn" on:click={handleSettings} title="Settings">
        ⚙️
      </button>
      <button class="control-btn" on:click={handleAchievements} title="Achievements">
        🏆
      </button>
      <button class="control-btn" on:click={handleHelp} title="Help">
        ❓
      </button>
    </div>
  </div>
</header>

<style>
  .game-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-bottom: 1px solid #333;
    padding: 1rem 2rem;
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 100;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1400px;
    margin: 0 auto;
  }

  .game-title h1 {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    background: linear-gradient(45deg, #3b82f6, #06d6a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .phase-indicator {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .phase-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #06d6a0;
  }

  .phase-description {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .header-stats {
    display: flex;
    gap: 2rem;
    align-items: center;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  .balance, .bot-count, .market-cycle {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    position: relative;
    transition: all 0.3s ease;
  }

  .balance.positive {
    color: #10b981;
    text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
  }

  .balance.negative {
    color: #ef4444;
    text-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
  }

  .balance-change {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .bot-count {
    color: #3b82f6;
  }

  .market-cycle {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.9rem;
    border: 1px solid #333;
  }

  .market-cycle.bull {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border-color: #10b981;
  }

  .market-cycle.bear {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: #ef4444;
  }

  .header-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .control-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .control-btn:active {
    transform: translateY(0);
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .header-content {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-stats {
      gap: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .game-header {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .game-title h1 {
      font-size: 1.5rem;
      text-align: center;
    }

    .header-stats {
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .stat-item {
      min-width: 80px;
    }

    .balance, .bot-count, .market-cycle {
      font-size: 1rem;
    }

    .control-btn {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .header-stats {
      width: 100%;
      justify-content: space-around;
    }

    .stat-label {
      font-size: 0.7rem;
    }

    .balance, .bot-count, .market-cycle {
      font-size: 0.9rem;
    }
  }
</style>
