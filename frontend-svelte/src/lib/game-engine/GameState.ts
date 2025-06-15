/**
 * QOIN Game State Manager - TypeScript Edition
 * Central state management for the entire QOIN trading bot collective game
 * Fully typed and robust implementation
 */

import type {
  AssetSymbol,
  BotInstance,
  BotConfig,
  GameStateData,
  MarketData,
  Achievement,
  BotUnlock,
  CycleState,
  PlayerStats,
  TradeAction,
  BotPersonality,
  UnlockCondition,
} from "$types/index.js";

import { STARTING_BALANCE, STARTING_PRICES } from "$types/index.js";

interface GamePhases {
  readonly SINGLE_QOIN: "single_qoin";
  readonly BOT_COLLECTION: "bot_collection";
  readonly CREATE_A_BOT: "create_a_bot";
  readonly TRADING_FLOOR: "trading_floor";
  readonly BUBBLE_CYCLE: "bubble_cycle";
}

interface TradingFloorState {
  active: boolean;
  internalTrades: number;
  totalVolume: number;
  bubbleLevel: number; // 0-1, when it hits 1, bubble pops
  lastInternalTrade: Date | null;
}

interface GameSettings {
  autoTrade: boolean;
  soundEnabled: boolean;
  notifications: boolean;
  tradingSpeed: number; // Speed multiplier
}

export default class GameState extends EventTarget {
  public readonly PHASES: GamePhases = {
    SINGLE_QOIN: "single_qoin",
    BOT_COLLECTION: "bot_collection",
    CREATE_A_BOT: "create_a_bot",
    TRADING_FLOOR: "trading_floor",
    BUBBLE_CYCLE: "bubble_cycle",
  } as const;

  private state: GameStateData;
  private tradingFloor: TradingFloorState;
  private gameSettings: GameSettings;

  constructor() {
    super();

    // Initialize trading floor state
    this.tradingFloor = {
      active: false,
      internalTrades: 0,
      totalVolume: 0,
      bubbleLevel: 0,
      lastInternalTrade: null,
    };

    // Initialize game settings
    this.gameSettings = {
      autoTrade: true,
      soundEnabled: true,
      notifications: true,
      tradingSpeed: 1.0,
    };

    // Initialize default state with proper typing
    this.state = {
      player: {
        totalBots: 1,
        totalBalance: STARTING_BALANCE,
        totalTrades: 0,
        totalProfit: 0,
        daysPlayed: 0,
        cyclesSurvived: 0,
      },
      bots: {
        qoin: this.createDefaultBot(),
      },
      market: this.createDefaultMarket(),
      unlocks: this.createDefaultUnlocks(),
      achievements: this.createDefaultAchievements(),
      cycle: this.createDefaultCycle(),
      phase: this.PHASES.SINGLE_QOIN,
      lastSave: Date.now(),
      version: "2.0.0",
    };

    console.log("🎮 GameState initialized with TypeScript support");
  }

  // ============================================================================
  // CORE STATE GETTERS
  // ============================================================================

  public emit(eventType: string, data?: any): void {
    this.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }

  public getPhase(): string {
    return this.state.phase;
  }

  public getPlayer(): PlayerStats {
    return { ...this.state.player };
  }

  public getBots(): Record<string, BotInstance> {
    return { ...this.state.bots };
  }

  public getBot(id: string): BotInstance | null {
    return this.state.bots[id] || null;
  }

  public getMarket(): MarketData {
    return { ...this.state.market };
  }

  public getUnlocks(): BotUnlock[] {
    return [...this.state.unlocks];
  }

  public getAchievements(): Achievement[] {
    return [...this.state.achievements];
  }

  public getTradingFloor(): TradingFloorState {
    return { ...this.tradingFloor };
  }

  // ============================================================================
  // BOT MANAGEMENT
  // ============================================================================

  public addBot(config: BotConfig): boolean {
    try {
      const bot = this.createBotFromConfig(config);
      this.state.bots[bot.id] = bot;
      this.state.player.totalBots = Object.keys(this.state.bots).length;

      this.emit("bot_added", { bot });
      this.checkUnlocks();
      this.checkAchievements();

      console.log(`✅ Added bot: ${bot.name} (${bot.id})`);
      return true;
    } catch (error) {
      console.error("❌ Failed to add bot:", error);
      return false;
    }
  }

  public updateBotStats(
    botId: string,
    updates: Partial<BotInstance["stats"]>,
  ): void {
    const bot = this.state.bots[botId];
    if (!bot) {
      console.warn(`Bot ${botId} not found for stats update`);
      return;
    }

    // Update bot stats
    bot.stats = { ...bot.stats, ...updates };

    // Update player totals
    this.updatePlayerTotals();

    this.emit("bot_stats_updated", { botId, stats: bot.stats });
  }

  // ============================================================================
  // PHASE MANAGEMENT
  // ============================================================================

  public advancePhase(): void {
    const phases = Object.values(this.PHASES);
    const currentIndex = phases.indexOf(this.state.phase as any);

    if (currentIndex < phases.length - 1) {
      this.state.phase = phases[currentIndex + 1];
      this.emit("phase_advanced", { phase: this.state.phase });
      console.log(`🎯 Advanced to phase: ${this.state.phase}`);
    }
  }

  public setPhase(phase: string): void {
    if (Object.values(this.PHASES).includes(phase as any)) {
      this.state.phase = phase;
      this.emit("phase_changed", { phase });
      console.log(`🎯 Set phase to: ${phase}`);
    }
  }

  // ============================================================================
  // MARKET MANAGEMENT
  // ============================================================================

  public updateMarketPrices(newPrices: Record<AssetSymbol, number>): void {
    for (const [asset, price] of Object.entries(newPrices) as [
      AssetSymbol,
      number,
    ][]) {
      if (this.state.market.assets[asset]) {
        this.state.market.assets[asset].price = price;
      }
    }
    this.state.market.timestamp = Date.now();
  }

  public addBotAsset(symbol: string, initialPrice: number): void {
    this.state.market.botAssets[symbol] = {
      price: initialPrice,
      volume: 0,
      volatility: 0.5,
      trend: 0,
      support: initialPrice * 0.8,
      resistance: initialPrice * 1.2,
    };
    console.log(`🚀 Added bot asset: ${symbol} at $${initialPrice}`);
  }

  // ============================================================================
  // ACHIEVEMENT & UNLOCK SYSTEM
  // ============================================================================

  public unlockAchievement(achievementId: string): boolean {
    const achievement = this.state.achievements.find(
      (a) => a.id === achievementId,
    );
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      this.emit("achievement_unlocked", { achievement });
      console.log(`🏆 Achievement unlocked: ${achievement.name}`);
      return true;
    }
    return false;
  }

  public checkUnlocks(): void {
    for (const unlock of this.state.unlocks) {
      if (!unlock.unlocked && this.checkAllConditions(unlock.conditions)) {
        unlock.unlocked = true;
        this.emit("bot_unlocked", { botId: unlock.botId });
        console.log(`🔓 Bot unlocked: ${unlock.botId}`);
      }
    }
  }

  private checkAllConditions(conditions: UnlockCondition[]): boolean {
    return conditions.every((condition) =>
      this.checkUnlockCondition(condition),
    );
  }

  private checkUnlockCondition(condition: UnlockCondition): boolean {
    let currentValue: number;

    switch (condition.type) {
      case "trades":
        currentValue = this.getTotalTrades();
        break;
      case "losses":
        currentValue = this.getTotalLosses();
        break;
      case "streak":
        currentValue = this.getLongestLossStreak();
        break;
      case "profit":
        currentValue = this.getBiggestProfit();
        break;
      case "balance":
        currentValue = this.getTotalBalance();
        break;
      case "cycles":
        currentValue = this.state.player.cyclesSurvived;
        break;
      default:
        return false;
    }

    switch (condition.comparison) {
      case "gte":
        return currentValue >= condition.value;
      case "lte":
        return currentValue <= condition.value;
      case "eq":
        return currentValue === condition.value;
      default:
        return false;
    }
  }

  public checkAchievements(): void {
    const totalTrades = this.getTotalTrades();
    const totalBalance = this.getTotalBalance();
    const activeBots = Object.values(this.state.bots).filter(
      (b) => b.isActive,
    ).length;

    // First trade
    if (totalTrades >= 1) {
      this.unlockAchievement("first_trade");
    }

    // Broke but wise
    if (totalBalance <= STARTING_BALANCE * 0.1) {
      this.unlockAchievement("broke_but_wise");
    }

    // Bot collector
    if (activeBots >= 3) {
      this.unlockAchievement("bot_collector");
    }

    // Full roster
    if (activeBots >= 8) {
      this.unlockAchievement("full_roster");
    }
  }

  // ============================================================================
  // STATISTICS CALCULATIONS
  // ============================================================================

  public getTotalTrades(): number {
    return Object.values(this.state.bots).reduce(
      (total, bot) => total + bot.stats.trades,
      0,
    );
  }

  public getTotalLosses(): number {
    return Object.values(this.state.bots).reduce(
      (total, bot) => total + bot.stats.losses,
      0,
    );
  }

  public getLongestLossStreak(): number {
    // Implementation would track loss streaks across all bots
    return Math.max(
      ...Object.values(this.state.bots).map((bot) => {
        // Calculate loss streak from trade history
        let currentStreak = 0;
        let maxStreak = 0;

        for (let i = bot.tradeHistory.length - 1; i >= 0; i--) {
          if (bot.tradeHistory[i].pnl < 0) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }

        return maxStreak;
      }),
    );
  }

  public getBiggestProfit(): number {
    return Math.max(
      ...Object.values(this.state.bots).map((bot) => bot.stats.biggestWin || 0),
    );
  }

  public getLowestBalance(): number {
    return Math.min(
      ...Object.values(this.state.bots).map((bot) => bot.stats.balance),
    );
  }

  public getTotalBalance(): number {
    return Object.values(this.state.bots).reduce(
      (total, bot) => total + bot.stats.balance,
      0,
    );
  }

  public getQuickTradeCount(): number {
    const quickThreshold = 10000; // 10 seconds
    let quickTrades = 0;

    Object.values(this.state.bots).forEach((bot) => {
      for (let i = 1; i < bot.tradeHistory.length; i++) {
        const timeDiff =
          bot.tradeHistory[i].timestamp - bot.tradeHistory[i - 1].timestamp;
        if (timeDiff < quickThreshold) {
          quickTrades++;
        }
      }
    });

    return quickTrades;
  }

  // ============================================================================
  // SAVE/LOAD SYSTEM
  // ============================================================================

  public saveState(): boolean {
    try {
      const saveData = {
        ...this.state,
        tradingFloor: this.tradingFloor,
        gameSettings: this.gameSettings,
        lastSave: Date.now(),
      };

      localStorage.setItem("qoinbots-save", JSON.stringify(saveData));
      console.log("💾 Game state saved successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to save game state:", error);
      return false;
    }
  }

  public loadState(): boolean {
    try {
      const saveData = localStorage.getItem("qoinbots-save");
      if (!saveData) {
        console.log("📁 No save data found, using defaults");
        return false;
      }

      const parsed = JSON.parse(saveData);
      this.state = this.mergeStates(this.state, parsed);

      if (parsed.tradingFloor) {
        this.tradingFloor = parsed.tradingFloor;
      }

      if (parsed.gameSettings) {
        this.gameSettings = parsed.gameSettings;
      }

      console.log("📂 Game state loaded successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to load game state:", error);
      return false;
    }
  }

  private mergeStates(
    defaultState: GameStateData,
    savedState: any,
  ): GameStateData {
    // Deep merge logic to handle version compatibility
    const merged: GameStateData = {
      ...defaultState,
      ...savedState,
      player: { ...defaultState.player, ...savedState.player },
      bots: { ...defaultState.bots, ...savedState.bots },
      market: { ...defaultState.market, ...savedState.market },
      cycle: { ...defaultState.cycle, ...savedState.cycle },
    };

    // Ensure all bots have proper structure
    Object.keys(merged.bots).forEach((botId) => {
      merged.bots[botId] = this.validateBotStructure(merged.bots[botId]);
    });

    return merged;
  }

  // ============================================================================
  // DEBUG & DEVELOPMENT
  // ============================================================================

  public enableDebug(): void {
    (window as any).gameStateDebug = this;
    console.log("🔧 Debug mode enabled - access via window.gameStateDebug");
  }

  public unlockAllBots(): void {
    this.state.unlocks.forEach((unlock) => {
      unlock.unlocked = true;
    });
    console.log("🔓 All bots unlocked for debugging");
  }

  // ============================================================================
  // OFFLINE PROGRESS SIMULATION
  // ============================================================================

  public calculateOfflineProgress(offlineMinutes: number): void {
    if (offlineMinutes < 5) return; // Don't simulate very short offline periods

    const maxOfflineHours = 24; // Cap offline progress
    const actualHours = Math.min(offlineMinutes / 60, maxOfflineHours);

    console.log(
      `⏰ Simulating ${actualHours.toFixed(1)} hours of offline progress`,
    );

    Object.values(this.state.bots).forEach((bot) => {
      if (!bot.isActive) return;

      const multiplier = this.getBotOfflineMultiplier(bot);
      const estimatedTrades = Math.floor(actualHours * multiplier);

      for (let i = 0; i < estimatedTrades; i++) {
        this.simulateOfflineTrade(bot);
      }
    });

    this.updatePlayerTotals();
    this.emit("offline_progress_calculated", { hours: actualHours });
  }

  private getBotOfflineMultiplier(bot: BotInstance): number {
    // Base trading frequency (trades per hour)
    let baseFreq = 0.5;

    // Personality modifiers
    switch (bot.personality) {
      case "momentum":
      case "panic":
        baseFreq *= 2.0;
        break;
      case "diamond_hands":
        baseFreq *= 0.3;
        break;
    }

    return baseFreq;
  }

  private simulateOfflineTrade(bot: BotInstance): void {
    const winProbability = this.getBotWinProbability(bot);
    const isWin = Math.random() < winProbability;

    const tradeSize = bot.stats.balance * 0.1; // Conservative 10% position
    const priceChange = (Math.random() - 0.5) * 0.2; // ±10% price change
    const pnl = isWin
      ? Math.abs(priceChange) * tradeSize
      : -Math.abs(priceChange) * tradeSize;

    // Update bot stats
    bot.stats.balance += pnl;
    bot.stats.totalPnL += pnl;
    bot.stats.trades++;

    if (isWin) {
      bot.stats.wins++;
      bot.stats.biggestWin = Math.max(bot.stats.biggestWin || 0, pnl);
    } else {
      bot.stats.losses++;
      bot.stats.biggestLoss = Math.min(bot.stats.biggestLoss || 0, pnl);
    }

    bot.stats.winRate = bot.stats.wins / bot.stats.trades;
  }

  private getBotWinProbability(bot: BotInstance): number {
    // Base probability
    let probability = 0.5;

    // Adjust based on bot traits and current performance
    if (bot.stats.winRate > 0.6) {
      probability += 0.1; // Good bots stay good
    } else if (bot.stats.winRate < 0.4) {
      probability -= 0.1; // Bad bots stay bad (for now)
    }

    return Math.max(0.2, Math.min(0.8, probability));
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private createDefaultBot(): BotInstance {
    return {
      id: "qoin",
      name: "QOIN",
      personality: "philosophical",
      avatar: "🤔",
      level: 1,
      experience: 0,
      mood: "optimistic",
      isActive: true,
      unlocked: true,
      traits: {
        riskTolerance: 0.5,
        greed: 0.3,
        fear: 0.4,
        intelligence: 0.7,
        patience: 0.8,
        herding: 0.2,
        contrarian: 0.6,
      },
      preferences: {
        preferredAssets: ["QOIN"],
        maxPositionSize: 0.3,
        minTradeSize: 10.0,
        tradingFrequency: 30000,
      },
      stats: {
        balance: STARTING_BALANCE,
        startingBalance: STARTING_BALANCE,
        totalPnL: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        daysAlive: 0,
        winRate: 0,
      },
      lastTradeTime: Date.now(),
      lastSpeech: 0,
      tradeHistory: [],
    };
  }

  private createBotFromConfig(config: BotConfig): BotInstance {
    return {
      id: config.id,
      name: config.name,
      personality: config.personality,
      avatar: config.avatar,
      level: config.level || 1,
      experience: config.experience || 0,
      mood: config.mood || "neutral",
      isActive: config.isActive ?? true,
      unlocked: true,
      traits: {
        riskTolerance: 0.5,
        greed: 0.5,
        fear: 0.5,
        intelligence: 0.5,
        patience: 0.5,
        herding: 0.5,
        contrarian: 0.5,
        ...config.traits,
      },
      preferences: {
        preferredAssets: ["QOIN"],
        maxPositionSize: 0.3,
        minTradeSize: 10.0,
        tradingFrequency: 30000,
        ...config.preferences,
      },
      stats: {
        balance: STARTING_BALANCE,
        startingBalance: STARTING_BALANCE,
        totalPnL: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        daysAlive: 0,
        winRate: 0,
        ...config.stats,
      },
      lastTradeTime: Date.now(),
      lastSpeech: 0,
      tradeHistory: [],
    };
  }

  private createDefaultMarket(): MarketData {
    return {
      cycle: "growth",
      cycleProgress: 0,
      totalCycles: 0,
      assets: {
        QOIN: {
          price: STARTING_PRICES.QOIN,
          volume: 100,
          volatility: 0.3,
          trend: 0,
          support: STARTING_PRICES.QOIN * 0.8,
          resistance: STARTING_PRICES.QOIN * 1.2,
        },
        HODL: {
          price: STARTING_PRICES.HODL,
          volume: 50,
          volatility: 0.1,
          trend: 0,
          support: STARTING_PRICES.HODL * 0.8,
          resistance: STARTING_PRICES.HODL * 1.2,
        },
        MOON: {
          price: STARTING_PRICES.MOON,
          volume: 1000,
          volatility: 0.8,
          trend: 0,
          support: STARTING_PRICES.MOON * 0.8,
          resistance: STARTING_PRICES.MOON * 1.2,
        },
      },
      botAssets: {},
      timestamp: Date.now(),
    };
  }

  private createDefaultUnlocks(): BotUnlock[] {
    return [
      {
        botId: "hodl-droid",
        conditions: [{ type: "losses", value: 3, comparison: "gte" }],
        unlocked: false,
      },
      {
        botId: "dip-destructor",
        conditions: [{ type: "trades", value: 10, comparison: "gte" }],
        unlocked: false,
      },
      {
        botId: "bearbot",
        conditions: [{ type: "streak", value: 5, comparison: "gte" }],
        unlocked: false,
      },
      {
        botId: "momentum-mike",
        conditions: [{ type: "profit", value: 50, comparison: "gte" }],
        unlocked: false,
      },
      {
        botId: "panic-pete",
        conditions: [{ type: "balance", value: 100, comparison: "lte" }],
        unlocked: false,
      },
      {
        botId: "zen-master",
        conditions: [{ type: "trades", value: 20, comparison: "gte" }],
        unlocked: false,
      },
      {
        botId: "sage-bot",
        conditions: [{ type: "cycles", value: 1, comparison: "gte" }],
        unlocked: false,
      },
    ];
  }

  private createDefaultAchievements(): Achievement[] {
    return [
      {
        id: "first_trade",
        name: "First Steps",
        description: "Make your first trade",
        icon: "🎯",
        unlocked: false,
      },
      {
        id: "broke_but_wise",
        name: "Broke But Wise",
        description: "Lose 90% of starting balance",
        icon: "💸",
        unlocked: false,
      },
      {
        id: "lucky_streak",
        name: "Lucky Streak",
        description: "Win 5 trades in a row",
        icon: "🍀",
        unlocked: false,
      },
      {
        id: "diamond_hands",
        name: "Diamond Hands",
        description: "Hold through a 50% loss",
        icon: "💎",
        unlocked: false,
      },
      {
        id: "bot_collector",
        name: "Bot Collector",
        description: "Unlock 3 different bots",
        icon: "🤖",
        unlocked: false,
      },
      {
        id: "full_roster",
        name: "Full Roster",
        description: "Unlock all 8 base bots",
        icon: "👥",
        unlocked: false,
      },
      {
        id: "bubble_survivor",
        name: "Bubble Survivor",
        description: "Survive your first market bubble",
        icon: "🫧",
        unlocked: false,
      },
    ];
  }

  private createDefaultCycle(): CycleState {
    return {
      phase: "growth",
      progress: 0,
      intensity: 0.5,
      duration: 0,
      phaseDurations: {
        growth: 300,
        bubble: 120,
        peak: 30,
        crash: 60,
        recovery: 180,
      },
    };
  }

  private validateBotStructure(bot: any): BotInstance {
    // Ensure bot has all required properties with defaults
    return {
      id: bot.id,
      name: bot.name || "Unknown Bot",
      personality: bot.personality || "balanced",
      avatar: bot.avatar || "🤖",
      level: bot.level || 1,
      experience: bot.experience || 0,
      mood: bot.mood || "neutral",
      isActive: bot.isActive ?? true,
      unlocked: bot.unlocked ?? false,
      traits: {
        riskTolerance: 0.5,
        greed: 0.5,
        fear: 0.5,
        intelligence: 0.5,
        patience: 0.5,
        herding: 0.5,
        contrarian: 0.5,
        ...bot.traits,
      },
      preferences: {
        preferredAssets: ["QOIN"],
        maxPositionSize: 0.3,
        minTradeSize: 10.0,
        tradingFrequency: 30000,
        ...bot.preferences,
      },
      stats: {
        balance: STARTING_BALANCE,
        startingBalance: STARTING_BALANCE,
        totalPnL: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        daysAlive: 0,
        winRate: 0,
        ...bot.stats,
      },
      lastTradeTime: bot.lastTradeTime || Date.now(),
      lastSpeech: bot.lastSpeech || 0,
      tradeHistory: bot.tradeHistory || [],
    };
  }

  private updatePlayerTotals(): void {
    const bots = Object.values(this.state.bots);

    this.state.player.totalBalance = bots.reduce(
      (sum, bot) => sum + bot.stats.balance,
      0,
    );
    this.state.player.totalTrades = bots.reduce(
      (sum, bot) => sum + bot.stats.trades,
      0,
    );
    this.state.player.totalProfit = bots.reduce(
      (sum, bot) => sum + bot.stats.totalPnL,
      0,
    );
    this.state.player.totalBots = bots.length;
  }

  public destroy(): void {
    // Cleanup method for when the game is destroyed
    this.saveState();
    console.log("🔥 GameState destroyed and final save completed");
  }
}
