/**
 * QOIN Game State Manager
 * Central state management for the entire QOIN trading bot collective game
 */

class GameState extends EventTarget {
  constructor() {
    super();

    // Game phases
    this.PHASES = {
      SINGLE_QOIN: "single_qoin",
      BOT_COLLECTION: "bot_collection",
      CREATE_A_BOT: "create_a_bot",
      TRADING_FLOOR: "trading_floor",
      BUBBLE_CYCLE: "bubble_cycle",
    };

    // Initialize default state
    this.state = {
      // Core game progression
      phase: this.PHASES.SINGLE_QOIN,
      gameStartTime: Date.now(),
      totalPlayTime: 0,

      // Player progress
      player: {
        level: 1,
        experience: 0,
        totalBots: 1,
        unlockedBots: ["qoin"], // Original QOIN always unlocked
        achievements: [],
        settings: {
          autoTrade: true,
          soundEnabled: true,
          notifications: true,
          tradingSpeed: 1.0, // Speed multiplier
        },
      },

      // Bot roster - all bots the player has
      bots: {
        qoin: {
          id: "qoin",
          name: "QOIN",
          type: "original",
          personality: "philosophical",
          isActive: true,
          unlocked: true,
          stats: {
            balance: 10.0,
            startingBalance: 10.0,
            totalPnL: 0.0,
            trades: 0,
            wins: 0,
            losses: 0,
            daysAlive: 0,
            winRate: 0,
          },
          mood: "optimistic",
          lastTradeTime: Date.now(),
          customizations: {},
        },
      },

      // Market data and simulation
      market: {
        cycle: "growth", // growth, bubble, peak, crash, recovery
        cycleProgress: 0, // 0-1
        totalCycles: 0,
        assets: {
          // Real-world inspired assets
          QOIN: { price: 1.0, volume: 100, volatility: 0.3 },
          HODL: { price: 50.0, volume: 50, volatility: 0.1 },
          MOON: { price: 0.001, volume: 1000, volatility: 0.8 },
        },
        // Internal bot-created assets (unlocked later)
        botAssets: {},
        priceHistory: [],
        lastUpdate: Date.now(),
      },

      // Unlock conditions and progression
      unlocks: {
        // Bot unlocks based on achievements
        botUnlocks: {
          "hodl-droid": {
            condition: "total_losses",
            value: 3,
            unlocked: false,
          },
          "dip-destructor": {
            condition: "total_trades",
            value: 10,
            unlocked: false,
          },
          bearbot: { condition: "loss_streak", value: 5, unlocked: false },
          "momentum-mike": {
            condition: "profit_trade",
            value: 5.0,
            unlocked: false,
          },
          "panic-pete": {
            condition: "balance_below",
            value: 1.0,
            unlocked: false,
          },
          "zen-master": {
            condition: "balanced_trading",
            value: 20,
            unlocked: false,
          },
          "fomo-frank": {
            condition: "quick_trades",
            value: 10,
            unlocked: false,
          },
          "sage-bot": {
            condition: "cycles_survived",
            value: 1,
            unlocked: false,
          },
        },

        // Feature unlocks
        features: {
          bot_collection: { condition: "first_bot_unlock", unlocked: false },
          create_a_bot: {
            condition: "bots_collected",
            value: 4,
            unlocked: false,
          },
          trading_floor: {
            condition: "bots_collected",
            value: 6,
            unlocked: false,
          },
          bubble_cycles: {
            condition: "internal_trading",
            value: 100,
            unlocked: false,
          },
        },
      },

      // Trading floor state (inter-bot trading)
      tradingFloor: {
        active: false,
        internalTrades: 0,
        totalVolume: 0,
        bubbleLevel: 0, // 0-1, when it hits 1, bubble pops
        lastInternalTrade: null,
      },

      // Achievement system
      achievements: [
        // Trading achievements
        {
          id: "first_trade",
          name: "First Steps",
          description: "Make your first trade",
          unlocked: false,
        },
        {
          id: "broke_but_wise",
          name: "Broke But Wise",
          description: "Lose 90% of starting balance",
          unlocked: false,
        },
        {
          id: "lucky_streak",
          name: "Lucky Streak",
          description: "Win 5 trades in a row",
          unlocked: false,
        },
        {
          id: "diamond_hands",
          name: "Diamond Hands",
          description: "Hold through a 50% loss",
          unlocked: false,
        },

        // Bot collection achievements
        {
          id: "bot_collector",
          name: "Bot Collector",
          description: "Unlock 3 different bots",
          unlocked: false,
        },
        {
          id: "full_roster",
          name: "Full Roster",
          description: "Unlock all 8 base bots",
          unlocked: false,
        },

        // Bubble cycle achievements
        {
          id: "bubble_survivor",
          name: "Bubble Survivor",
          description: "Survive your first market crash",
          unlocked: false,
        },
        {
          id: "enlightened",
          name: "Enlightened",
          description: "Reach maximum wisdom level",
          unlocked: false,
        },
      ],

      // Debug and development
      debug: {
        enabled: false,
        fastMode: false,
        godMode: false,
      },
    };

    // Load saved state if it exists
    this.loadState();

    // Auto-save every 10 seconds
    this.autoSaveInterval = setInterval(() => this.saveState(), 10000);

    // Also save when page is about to close
    window.addEventListener("beforeunload", () => this.saveState());

    // Track play time
    this.playTimeInterval = setInterval(() => {
      this.state.totalPlayTime += 1000; // 1 second
    }, 1000);
  }

  // Event system for reactive updates
  emit(eventName, data = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  // State getters
  getPhase() {
    return this.state.phase;
  }
  getPlayer() {
    return this.state.player;
  }
  getBots() {
    return this.state.bots;
  }
  getBot(id) {
    return this.state.bots[id];
  }
  getMarket() {
    return this.state.market;
  }
  getUnlocks() {
    return this.state.unlocks;
  }
  getAchievements() {
    return this.state.achievements;
  }
  getTradingFloor() {
    return this.state.tradingFloor;
  }

  // Bot management
  addBot(botData) {
    if (this.state.bots[botData.id]) {
      console.warn(`Bot ${botData.id} already exists`);
      return false;
    }

    this.state.bots[botData.id] = {
      ...botData,
      unlocked: true,
      stats: {
        balance: 10.0,
        startingBalance: 10.0,
        totalPnL: 0.0,
        trades: 0,
        wins: 0,
        losses: 0,
        daysAlive: 0,
        winRate: 0,
        ...botData.stats,
      },
    };

    this.state.player.totalBots++;
    this.emit("bot_added", { bot: botData });
    this.checkUnlocks();
    return true;
  }

  updateBotStats(botId, statUpdates) {
    if (!this.state.bots[botId]) return false;

    Object.assign(this.state.bots[botId].stats, statUpdates);

    // Recalculate derived stats
    const bot = this.state.bots[botId];
    if (bot.stats.trades > 0) {
      bot.stats.winRate = (bot.stats.wins / bot.stats.trades) * 100;
    }

    this.emit("bot_stats_updated", { botId, stats: bot.stats });
    this.checkUnlocks();
    return true;
  }

  // Phase management
  advancePhase() {
    const phases = Object.values(this.PHASES);
    const currentIndex = phases.indexOf(this.state.phase);

    if (currentIndex < phases.length - 1) {
      this.state.phase = phases[currentIndex + 1];
      this.emit("phase_changed", {
        oldPhase: phases[currentIndex],
        newPhase: this.state.phase,
      });
    }
  }

  setPhase(phase) {
    if (Object.values(this.PHASES).includes(phase)) {
      const oldPhase = this.state.phase;
      this.state.phase = phase;
      this.emit("phase_changed", { oldPhase, newPhase: phase });
    }
  }

  // Market management
  updateMarketPrices(priceUpdates) {
    Object.assign(this.state.market.assets, priceUpdates);
    this.state.market.lastUpdate = Date.now();
    this.emit("market_updated", { prices: priceUpdates });
  }

  addBotAsset(assetName, initialPrice = 1.0) {
    this.state.market.botAssets[assetName] = {
      price: initialPrice,
      volume: 0,
      volatility: Math.random() * 0.5 + 0.2,
      createdBy: "bot",
      createdAt: Date.now(),
    };
    this.emit("bot_asset_created", { assetName, price: initialPrice });
  }

  // Achievement system
  unlockAchievement(achievementId) {
    const achievement = this.state.achievements.find(
      (a) => a.id === achievementId,
    );
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      this.state.player.experience += 100; // XP for achievements
      this.emit("achievement_unlocked", { achievement });
      return true;
    }
    return false;
  }

  // Check all unlock conditions
  checkUnlocks() {
    // Check bot unlocks
    Object.entries(this.state.unlocks.botUnlocks).forEach(([botId, unlock]) => {
      if (!unlock.unlocked && this.checkUnlockCondition(unlock)) {
        unlock.unlocked = true;
        this.state.player.unlockedBots.push(botId);
        this.emit("bot_unlocked", { botId, unlock });
      }
    });

    // Check feature unlocks
    Object.entries(this.state.unlocks.features).forEach(([feature, unlock]) => {
      if (!unlock.unlocked && this.checkUnlockCondition(unlock)) {
        unlock.unlocked = true;
        this.emit("feature_unlocked", { feature, unlock });
      }
    });

    // Check achievements
    this.checkAchievements();
  }

  checkUnlockCondition(unlock) {
    const condition = unlock.condition;
    const value = unlock.value;

    switch (condition) {
      case "total_losses":
        return this.getTotalLosses() >= value;
      case "total_trades":
        return this.getTotalTrades() >= value;
      case "loss_streak":
        return this.getLongestLossStreak() >= value;
      case "profit_trade":
        return this.getBiggestProfit() >= value;
      case "balance_below":
        return this.getLowestBalance() <= value;
      case "bots_collected":
        return this.state.player.unlockedBots.length >= value;
      case "cycles_survived":
        return this.state.market.totalCycles >= value;
      default:
        return false;
    }
  }

  checkAchievements() {
    // First trade
    if (this.getTotalTrades() >= 1) {
      this.unlockAchievement("first_trade");
    }

    // Broke but wise (lose 90% of balance)
    if (this.getLowestBalance() <= 1.0) {
      this.unlockAchievement("broke_but_wise");
    }

    // Bot collector
    if (this.state.player.unlockedBots.length >= 3) {
      this.unlockAchievement("bot_collector");
    }

    // Full roster
    if (this.state.player.unlockedBots.length >= 8) {
      this.unlockAchievement("full_roster");
    }
  }

  // Statistics helpers
  getTotalTrades() {
    return Object.values(this.state.bots).reduce(
      (total, bot) => total + bot.stats.trades,
      0,
    );
  }

  getTotalLosses() {
    return Object.values(this.state.bots).reduce(
      (total, bot) => total + bot.stats.losses,
      0,
    );
  }

  getLongestLossStreak() {
    // Implementation would track loss streaks across all bots
    return Math.max(
      ...Object.values(this.state.bots).map((bot) => bot.lossStreak || 0),
    );
  }

  getBiggestProfit() {
    return Math.max(
      ...Object.values(this.state.bots).map((bot) => bot.biggestProfit || 0),
    );
  }

  getLowestBalance() {
    return Math.min(
      ...Object.values(this.state.bots).map((bot) => bot.stats.balance),
    );
  }

  getTotalBalance() {
    return Object.values(this.state.bots).reduce(
      (total, bot) => total + bot.stats.balance,
      0,
    );
  }

  getQuickTradeCount() {
    // Count trades that happened within 30 seconds of each other
    // For now, use a simple heuristic based on total trades and bot activity
    const totalTrades = this.getTotalTrades();
    const activeBots = Object.values(this.state.bots).filter(
      (bot) => bot.isActive,
    ).length;

    // Estimate quick trades as trades beyond normal trading frequency
    // This is a simplified implementation - could be enhanced with actual timestamp tracking
    const normalTradeRate = activeBots * 2; // 2 trades per bot baseline
    return Math.max(0, totalTrades - normalTradeRate);
  }

  // Persistence
  saveState() {
    try {
      const saveData = {
        ...this.state,
        lastSaved: Date.now(),
        version: "1.0.0",
      };

      localStorage.setItem("qoin_game_state", JSON.stringify(saveData));
      this.emit("game_saved");
    } catch (error) {
      console.error("Failed to save game state:", error);
      this.emit("save_error", { error });
    }
  }

  loadState() {
    try {
      const savedData = localStorage.getItem("qoin_game_state");
      if (savedData) {
        const parsed = JSON.parse(savedData);

        // Merge saved data with default state (handles version upgrades)
        this.state = this.mergeStates(this.state, parsed);

        // Calculate offline progress if time has passed
        this.calculateOfflineProgress(parsed.lastSaved || Date.now());

        console.log("Game state loaded successfully");
        this.emit("game_loaded");
        return true;
      }
    } catch (error) {
      console.error("Failed to load game state:", error);
      this.emit("load_error", { error });
    }
    return false;
  }

  mergeStates(defaultState, savedState) {
    // Deep merge, preferring saved values but keeping new default structure
    const merged = JSON.parse(JSON.stringify(defaultState));

    // Custom merge logic for different state sections
    if (savedState.player) {
      merged.player = { ...merged.player, ...savedState.player };
      if (savedState.player.settings) {
        merged.player.settings = {
          ...merged.player.settings,
          ...savedState.player.settings,
        };
      }
    }

    if (savedState.bots) {
      // Preserve all saved bots, but ensure they have default structure
      Object.keys(savedState.bots).forEach((botId) => {
        merged.bots[botId] = {
          ...(merged.bots[botId] || {}),
          ...savedState.bots[botId],
        };
      });
    }

    if (savedState.market) {
      merged.market = { ...merged.market, ...savedState.market };
      if (savedState.market.assets) {
        merged.market.assets = {
          ...merged.market.assets,
          ...savedState.market.assets,
        };
      }
    }

    if (savedState.unlocks) {
      merged.unlocks = { ...merged.unlocks, ...savedState.unlocks };
      if (savedState.unlocks.botUnlocks) {
        merged.unlocks.botUnlocks = {
          ...merged.unlocks.botUnlocks,
          ...savedState.unlocks.botUnlocks,
        };
      }
    }

    if (savedState.tradingFloor) {
      merged.tradingFloor = {
        ...merged.tradingFloor,
        ...savedState.tradingFloor,
      };
    }

    // Preserve scalar values
    merged.phase = savedState.phase || merged.phase;
    merged.gameStartTime = savedState.gameStartTime || merged.gameStartTime;
    merged.totalPlayTime = savedState.totalPlayTime || merged.totalPlayTime;

    return merged;
  }

  // Debug utilities
  enableDebug() {
    this.state.debug.enabled = true;
    this.state.debug.fastMode = true;
    console.log("QOIN Debug Mode Enabled");
  }

  unlockAllBots() {
    if (!this.state.debug.enabled) return;

    Object.keys(this.state.unlocks.botUnlocks).forEach((botId) => {
      this.state.unlocks.botUnlocks[botId].unlocked = true;
      if (!this.state.player.unlockedBots.includes(botId)) {
        this.state.player.unlockedBots.push(botId);
      }
    });

    this.emit("debug_unlock_all");
  }

  /**
   * Calculate offline progress while player was away
   */
  calculateOfflineProgress(lastSaved) {
    const now = Date.now();
    const timeAway = now - lastSaved;

    // Only calculate if player was away for more than 30 seconds
    if (timeAway < 30000) return;

    const secondsAway = Math.floor(timeAway / 1000);
    const minutesAway = Math.floor(secondsAway / 60);

    console.log(
      `Player was away for ${minutesAway} minutes, calculating offline progress...`,
    );

    // Simulate simplified trading activity while away
    // Each bot gets a chance to trade based on their personality
    Object.values(this.state.bots).forEach((bot) => {
      if (!bot.isActive) return;

      // Calculate how many trades this bot might have made
      const baseTradeFrequency = 60; // seconds between trades
      const personalityMultiplier = this.getBotOfflineMultiplier(
        bot.personality,
      );
      const actualFrequency = baseTradeFrequency / personalityMultiplier;

      const possibleTrades = Math.floor(secondsAway / actualFrequency);
      const actualTrades = Math.min(
        possibleTrades,
        Math.floor(minutesAway / 2),
      ); // Cap at reasonable rate

      // Simulate each trade with simplified logic
      for (let i = 0; i < actualTrades; i++) {
        this.simulateOfflineTrade(bot);
      }
    });

    // Update total play time
    this.state.totalPlayTime += timeAway;

    // Show offline progress notification
    this.emit("offline_progress_calculated", {
      timeAway: minutesAway,
      tradesSimulated: Object.values(this.state.bots).reduce(
        (sum, bot) => sum + (bot.offlineTradesCount || 0),
        0,
      ),
    });

    // Clean up temporary offline tracking
    Object.values(this.state.bots).forEach((bot) => {
      delete bot.offlineTradesCount;
    });
  }

  /**
   * Get offline trading multiplier based on bot personality
   */
  getBotOfflineMultiplier(personality) {
    const multipliers = {
      philosophical: 0.8, // Slower, more thoughtful
      aggressive: 1.5, // More active
      hodl: 0.3, // Very infrequent
      panic: 1.8, // Panic trades frequently
      momentum: 1.2, // Moderate activity
      contrarian: 0.9, // Slightly below average
      zen: 0.6, // Calm and patient
      sage: 0.7, // Wise but not rushed
    };

    return multipliers[personality] || 1.0;
  }

  /**
   * Simulate a single offline trade for a bot
   */
  simulateOfflineTrade(bot) {
    // Simple win/loss probability based on personality
    const winProbability = this.getBotWinProbability(bot.personality);
    const isWin = Math.random() < winProbability;

    // Calculate trade size (smaller for offline trades)
    const maxRisk = 0.1; // 10% max risk for offline trades
    const tradeSize = Math.min(bot.stats.balance * maxRisk, 2.0);

    if (tradeSize < 0.1) return; // Skip if balance too low

    // Calculate P&L
    const maxGainLoss = tradeSize * 0.2; // 20% max gain/loss
    const pnl = isWin
      ? Math.random() * maxGainLoss
      : -Math.random() * maxGainLoss;

    // Update bot stats
    bot.stats.balance += pnl;
    bot.stats.totalPnL += pnl;
    bot.stats.trades++;
    bot.offlineTradesCount = (bot.offlineTradesCount || 0) + 1;

    if (isWin) {
      bot.stats.wins++;
    } else {
      bot.stats.losses++;
    }

    // Recalculate win rate
    if (bot.stats.trades > 0) {
      bot.stats.winRate = (bot.stats.wins / bot.stats.trades) * 100;
    }

    // Ensure balance doesn't go negative
    if (bot.stats.balance < 0) {
      bot.stats.balance = 0.01;
    }
  }

  /**
   * Get win probability for offline trading based on personality
   */
  getBotWinProbability(personality) {
    const probabilities = {
      philosophical: 0.45, // Slightly worse than random
      aggressive: 0.4, // Risk leads to losses
      hodl: 0.55, // Patient approach pays off
      panic: 0.35, // Panic leads to bad decisions
      momentum: 0.48, // Decent but not great
      contrarian: 0.52, // Contrarian can be profitable
      zen: 0.6, // Balanced approach works
      sage: 0.58, // Wisdom pays off
    };

    return probabilities[personality] || 0.45;
  }

  // Cleanup
  destroy() {
    clearInterval(this.autoSaveInterval);
    clearInterval(this.playTimeInterval);
    this.saveState();
  }
}

// Export for ES6 modules
export default GameState;
window.GameState = GameState;
