/**
 * QOIN Trading Engine - TypeScript Edition
 * Handles market simulation, price updates, and bot trading coordination
 * Fully typed and robust implementation
 */

import type {
  AssetSymbol,
  MarketData,
  MarketCycle,
  CycleState,
  AssetData,
  BotInstance,
  Trade,
  TradeEvent,
  MarketUpdateEvent,
} from "$types/index.js";

import { STARTING_PRICES, ASSET_SYMBOLS } from "$types/index.js";
import Bot from "./Bot.js";
import GameState from "./GameState.js";

interface EngineConfig {
  tickRate: number; // Milliseconds between market updates
  maxDataPoints: number; // Maximum price history points
  animationDuration: number; // UI animation duration
}

interface PriceHistoryPoint {
  timestamp: number;
  prices: Record<AssetSymbol, number>;
}

interface MarketStats {
  totalVolume: number;
  averageVolatility: number;
  cycleProgress: number;
  activeBots: number;
  totalTrades: number;
}

export default class TradingEngine extends EventTarget {
  private gameState: GameState;
  private config: EngineConfig;

  // Market State
  private marketData: MarketData;
  private cycleState: CycleState;
  private priceHistory: PriceHistoryPoint[];

  // Bot Management
  public activeBots: Map<string, Bot>;
  private botTradeQueue: string[];

  // Engine State
  private isRunning: boolean;
  private tickInterval: number | null;
  private lastTickTime: number;
  private totalTicks: number;

  // Market Dynamics
  private volatilityMultipliers: Record<MarketCycle, number>;
  private trendStrengths: Record<AssetSymbol, number>;
  private supportResistanceLevels: Record<
    AssetSymbol,
    { support: number; resistance: number }
  >;

  constructor(gameState: GameState, config?: Partial<EngineConfig>) {
    super();

    this.gameState = gameState;
    this.config = {
      tickRate: 2000, // 2 seconds
      maxDataPoints: 100,
      animationDuration: 500,
      ...config,
    };

    // Initialize market state
    this.marketData = this.initializeMarket();
    this.cycleState = this.initializeCycleState();
    this.priceHistory = [];

    // Initialize bot management
    this.activeBots = new Map();
    this.botTradeQueue = [];

    // Initialize engine state
    this.isRunning = false;
    this.tickInterval = null;
    this.lastTickTime = Date.now();
    this.totalTicks = 0;

    // Initialize market dynamics
    this.volatilityMultipliers = {
      growth: 1.0,
      bubble: 1.5,
      peak: 2.0,
      crash: 3.0,
      recovery: 1.2,
    };

    this.trendStrengths = {
      QOIN: 0,
      HODL: 0,
      MOON: 0,
    };

    this.supportResistanceLevels = {
      QOIN: {
        support: STARTING_PRICES.QOIN * 0.8,
        resistance: STARTING_PRICES.QOIN * 1.2,
      },
      HODL: {
        support: STARTING_PRICES.HODL * 0.8,
        resistance: STARTING_PRICES.HODL * 1.2,
      },
      MOON: {
        support: STARTING_PRICES.MOON * 0.8,
        resistance: STARTING_PRICES.MOON * 1.2,
      },
    };

    // Try to restore previous market state
    this.restoreMarketState();

    console.log("⚡ TradingEngine initialized with TypeScript support");
  }

  // ============================================================================
  // ENGINE CONTROL
  // ============================================================================

  public start(): void {
    if (this.isRunning) {
      console.warn("TradingEngine is already running");
      return;
    }

    this.isRunning = true;
    this.lastTickTime = Date.now();

    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.config.tickRate);

    this.dispatchEvent(
      new CustomEvent("engine_started", {
        detail: { tickRate: this.config.tickRate },
      }),
    );
    console.log(
      `🚀 TradingEngine started with ${this.config.tickRate}ms tick rate`,
    );
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.dispatchEvent(
      new CustomEvent("engine_stopped", {
        detail: { totalTicks: this.totalTicks },
      }),
    );
    console.log(`🛑 TradingEngine stopped after ${this.totalTicks} ticks`);
  }

  // ============================================================================
  // MAIN GAME LOOP
  // ============================================================================

  private tick(): void {
    try {
      const now = Date.now();
      const deltaTime = now - this.lastTickTime;

      // Update market cycle
      this.updateMarketCycle(deltaTime);

      // Advance market phase if needed
      this.advanceMarketPhase();

      // Update cycle intensity
      this.updateCycleIntensity();

      // Simulate market prices
      this.simulateMarketPrices();

      // Update price history
      this.updatePriceHistory();

      // Process bot trading
      this.processBotTrading();

      // Update internal market (bot-created assets)
      this.updateInternalMarket();

      // Check for phase transitions
      this.checkPhaseTransitions();

      // Emit market update event
      this.dispatchEvent(
        new CustomEvent("market_tick", {
          detail: this.createMarketUpdateEvent(),
        }),
      );

      // Update state
      this.lastTickTime = now;
      this.totalTicks++;
    } catch (error) {
      console.error("❌ Error in trading engine tick:", error);
    }
  }

  // ============================================================================
  // MARKET CYCLE MANAGEMENT
  // ============================================================================

  private updateMarketCycle(deltaTime: number): void {
    const ticksPerSecond = 1000 / this.config.tickRate;
    const progressIncrement =
      deltaTime /
      (this.cycleState.phaseDurations[this.cycleState.phase] * 1000);

    this.cycleState.progress += progressIncrement;
    this.cycleState.duration += deltaTime / 1000;

    // Update market cycle in market data
    this.marketData.cycle = this.cycleState.phase;
    this.marketData.cycleProgress = this.cycleState.progress;
  }

  private advanceMarketPhase(): void {
    if (this.cycleState.progress >= 1.0) {
      const phases: MarketCycle[] = [
        "growth",
        "bubble",
        "peak",
        "crash",
        "recovery",
      ];
      const currentIndex = phases.indexOf(this.cycleState.phase);
      const nextIndex = (currentIndex + 1) % phases.length;

      // Advance to next phase
      this.cycleState.phase = phases[nextIndex];
      this.cycleState.progress = 0;
      this.cycleState.duration = 0;

      // If we completed a full cycle
      if (nextIndex === 0) {
        this.marketData.totalCycles++;
        this.gameState.getPlayer().cyclesSurvived = this.marketData.totalCycles;
      }

      // Emit phase change event
      this.dispatchEvent(
        new CustomEvent("market_phase_changed", {
          detail: {
            newPhase: this.cycleState.phase,
            cycle: this.marketData.totalCycles,
          },
        }),
      );

      console.log(`📊 Market phase changed to: ${this.cycleState.phase}`);
    }
  }

  private updateCycleIntensity(): void {
    // Intensity varies based on phase and progress
    switch (this.cycleState.phase) {
      case "growth":
        this.cycleState.intensity = 0.3 + this.cycleState.progress * 0.4;
        break;
      case "bubble":
        this.cycleState.intensity = 0.7 + this.cycleState.progress * 0.3;
        break;
      case "peak":
        this.cycleState.intensity = 1.0;
        break;
      case "crash":
        this.cycleState.intensity = 1.0 - this.cycleState.progress * 0.3;
        break;
      case "recovery":
        this.cycleState.intensity = 0.2 + this.cycleState.progress * 0.3;
        break;
    }
  }

  // ============================================================================
  // PRICE SIMULATION
  // ============================================================================

  private simulateMarketPrices(): void {
    for (const symbol of ASSET_SYMBOLS) {
      const asset = this.marketData.assets[symbol];
      const newPrice = this.calculateNewPrice(symbol, asset);

      // Update price and related metrics
      asset.change = ((newPrice - asset.price) / asset.price) * 100;
      asset.price = newPrice;
      asset.volume = this.calculateNewVolume(symbol, asset);

      // Update trend
      this.updateTrendStrength(symbol, asset.change);
      asset.trend = this.trendStrengths[symbol];

      // Update support/resistance levels
      this.updateSupportResistance(symbol, newPrice);
      asset.support = this.supportResistanceLevels[symbol].support;
      asset.resistance = this.supportResistanceLevels[symbol].resistance;
    }

    this.marketData.timestamp = Date.now();
  }

  private calculateNewPrice(symbol: AssetSymbol, asset: AssetData): number {
    const basePrice = asset.price;

    // Get volatility multiplier for current cycle
    const cycleVolatility = this.volatilityMultipliers[this.cycleState.phase];
    const effectiveVolatility =
      asset.volatility * cycleVolatility * this.cycleState.intensity;

    // Calculate price movement components
    const randomMove = this.getRandomMove(effectiveVolatility);
    const trendMove = this.getTrendMove(symbol, basePrice);
    const meanReversionMove = this.getMeanReversionMove(symbol, basePrice);

    // Combine movements
    const totalMove = randomMove + trendMove + meanReversionMove;
    let newPrice = basePrice * (1 + totalMove);

    // Apply phase-specific price adjustments
    newPrice = this.applyPhaseAdjustments(symbol, newPrice, basePrice);

    // Ensure price doesn't go negative
    return Math.max(0.01, newPrice);
  }

  private getRandomMove(volatility: number): number {
    // Box-Muller transform for more realistic price movements
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return z0 * volatility * 0.1; // Scale down for realistic moves
  }

  private getTrendMove(symbol: AssetSymbol, currentPrice: number): number {
    const trendStrength = this.trendStrengths[symbol];
    const phaseMultiplier = this.getPhaseMultiplier();

    return trendStrength * 0.05 * phaseMultiplier;
  }

  private getMeanReversionMove(
    symbol: AssetSymbol,
    currentPrice: number,
  ): number {
    const startingPrice = STARTING_PRICES[symbol];
    const deviation = (currentPrice - startingPrice) / startingPrice;

    // Stronger mean reversion for larger deviations
    const reversionStrength = 0.02 * Math.abs(deviation);
    return -Math.sign(deviation) * reversionStrength;
  }

  private applyPhaseAdjustments(
    symbol: AssetSymbol,
    newPrice: number,
    basePrice: number,
  ): number {
    const adjustment = this.getPhaseAdjustment(symbol);
    return newPrice * (1 + adjustment);
  }

  private getPhaseMultiplier(): number {
    switch (this.cycleState.phase) {
      case "growth":
        return 1.2;
      case "bubble":
        return 2.0;
      case "peak":
        return 0.5;
      case "crash":
        return -2.0;
      case "recovery":
        return 0.8;
      default:
        return 1.0;
    }
  }

  private getPhaseAdjustment(symbol: AssetSymbol): number {
    const baseAdjustment = this.cycleState.progress * 0.01;

    switch (this.cycleState.phase) {
      case "growth":
        return baseAdjustment * 0.5;
      case "bubble":
        return baseAdjustment * 1.5;
      case "peak":
        return -baseAdjustment * 0.2;
      case "crash":
        return -baseAdjustment * 2.0;
      case "recovery":
        return baseAdjustment * 0.3;
      default:
        return 0;
    }
  }

  private calculateNewVolume(symbol: AssetSymbol, asset: AssetData): number {
    const baseVolume = 100; // Default volume
    const volatilityMultiplier = 1 + asset.volatility * 2;
    const phaseMultiplier = this.getVolumePhaseMultiplier();

    return baseVolume * volatilityMultiplier * phaseMultiplier;
  }

  private getVolumePhaseMultiplier(): number {
    switch (this.cycleState.phase) {
      case "growth":
        return 1.2;
      case "bubble":
        return 2.5;
      case "peak":
        return 3.0;
      case "crash":
        return 4.0;
      case "recovery":
        return 0.8;
      default:
        return 1.0;
    }
  }

  private updateTrendStrength(symbol: AssetSymbol, priceChange: number): void {
    const currentTrend = this.trendStrengths[symbol];
    const momentum = priceChange > 0 ? 0.1 : -0.1;
    const decay = 0.95; // Trend decay factor

    this.trendStrengths[symbol] = currentTrend * decay + momentum;

    // Clamp between -1 and 1
    this.trendStrengths[symbol] = Math.max(
      -1,
      Math.min(1, this.trendStrengths[symbol]),
    );
  }

  private updateSupportResistance(
    symbol: AssetSymbol,
    currentPrice: number,
  ): void {
    const levels = this.supportResistanceLevels[symbol];
    const adaptationRate = 0.001; // Slow adaptation

    // Update support (slowly moves up towards price)
    if (currentPrice > levels.support) {
      levels.support += (currentPrice - levels.support) * adaptationRate;
    }

    // Update resistance (slowly moves up with price)
    if (currentPrice > levels.resistance) {
      levels.resistance += (currentPrice - levels.resistance) * adaptationRate;
    }
  }

  private updatePriceHistory(): void {
    const historyPoint: PriceHistoryPoint = {
      timestamp: Date.now(),
      prices: {} as Record<AssetSymbol, number>,
    };

    // Copy current prices
    for (const symbol of ASSET_SYMBOLS) {
      historyPoint.prices[symbol] = this.marketData.assets[symbol].price;
    }

    this.priceHistory.push(historyPoint);

    // Trim history to max data points
    if (this.priceHistory.length > this.config.maxDataPoints) {
      this.priceHistory = this.priceHistory.slice(-this.config.maxDataPoints);
    }
  }

  // ============================================================================
  // BOT TRADING MANAGEMENT
  // ============================================================================

  private processBotTrading(): void {
    // Shuffle bot order for fair trading
    const botIds = Array.from(this.activeBots.keys()).sort(
      () => Math.random() - 0.5,
    );

    for (const botId of botIds) {
      const bot = this.activeBots.get(botId);
      if (!bot || !bot.isActive) continue;

      try {
        const trade = bot.executeTrade(this.marketData, this.gameState);

        if (trade) {
          this.handleBotTrade(botId, trade);
        }
      } catch (error) {
        console.error(`❌ Error processing trade for bot ${botId}:`, error);
      }
    }
  }

  private handleBotTrade(botId: string, trade: Trade): void {
    // Update game state
    this.gameState.updateBotStats(botId, {
      balance: this.activeBots.get(botId)?.stats.balance || 0,
      totalPnL: (this.activeBots.get(botId)?.stats.totalPnL || 0) + trade.pnl,
      trades: (this.activeBots.get(botId)?.stats.trades || 0) + 1,
    });

    // Create trade event
    const tradeEvent: TradeEvent = {
      botId,
      trade,
    };

    // Emit bot trade event
    this.dispatchEvent(new CustomEvent("bot_trade", { detail: tradeEvent }));

    // Apply price impact to market (if significant trade)
    this.applyPriceImpact(trade);
  }

  private applyPriceImpact(trade: Trade): void {
    const asset = this.marketData.assets[trade.asset];
    if (!asset) return;

    const impactThreshold = 100; // Minimum trade size for market impact
    if (trade.size < impactThreshold) return;

    const impactStrength = Math.min(0.001, trade.size / (asset.volume * 1000));
    const impactDirection = trade.action === "buy" ? 1 : -1;

    asset.price *= 1 + impactDirection * impactStrength;
  }

  // ============================================================================
  // MARKET EVENTS & SPECIAL CONDITIONS
  // ============================================================================

  public triggerMarketCrash(): void {
    console.log("💥 Triggering market crash!");

    // Force crash phase
    this.cycleState.phase = "crash";
    this.cycleState.progress = 0;
    this.cycleState.intensity = 1.0;

    // Apply immediate price drops
    for (const symbol of ASSET_SYMBOLS) {
      const asset = this.marketData.assets[symbol];
      const crashMagnitude = 0.15 + Math.random() * 0.35; // 15-50% drop
      asset.price *= 1 - crashMagnitude;
      asset.volatility = Math.min(1.0, asset.volatility * 2); // Double volatility
    }

    this.dispatchEvent(
      new CustomEvent("market_crash", {
        detail: {
          phase: this.cycleState.phase,
          assets: this.marketData.assets,
        },
      }),
    );
  }

  private checkPhaseTransitions(): void {
    // Check for automatic crash conditions
    if (this.cycleState.phase === "peak" && this.cycleState.progress > 0.8) {
      if (Math.random() < 0.1) {
        // 10% chance per tick
        this.triggerMarketCrash();
      }
    }

    // Check for recovery conditions
    if (this.cycleState.phase === "crash" && this.cycleState.progress > 0.9) {
      // Recovery is more likely if prices are very low
      const avgPrice =
        ASSET_SYMBOLS.reduce((sum, symbol) => {
          return (
            sum + this.marketData.assets[symbol].price / STARTING_PRICES[symbol]
          );
        }, 0) / ASSET_SYMBOLS.length;

      if (avgPrice < 0.5) {
        // Average 50% below starting prices
        this.cycleState.phase = "recovery";
        this.cycleState.progress = 0;
      }
    }
  }

  // ============================================================================
  // INTERNAL MARKET (BOT ASSETS)
  // ============================================================================

  private updateInternalMarket(): void {
    // Update bot-created assets if they exist
    for (const [symbol, asset] of Object.entries(this.marketData.botAssets)) {
      const newPrice = this.calculateBotAssetPrice(symbol, asset);
      asset.price = newPrice;
      asset.volume = Math.max(1, asset.volume * (0.95 + Math.random() * 0.1));
    }
  }

  private calculateBotAssetPrice(symbol: string, asset: AssetData): number {
    // Simplified price calculation for bot assets
    const volatility =
      asset.volatility * this.volatilityMultipliers[this.cycleState.phase];
    const randomMove = (Math.random() - 0.5) * volatility * 0.2;

    return Math.max(0.01, asset.price * (1 + randomMove));
  }

  public createBotAsset(
    symbol: string,
    initialPrice: number,
    creatorBotId: string,
  ): void {
    if (this.marketData.botAssets[symbol]) {
      console.warn(`Bot asset ${symbol} already exists`);
      return;
    }

    this.marketData.botAssets[symbol] = {
      price: initialPrice,
      volume: 10,
      volatility: 0.6 + Math.random() * 0.4, // High volatility for new assets
      trend: 0,
      support: initialPrice * 0.7,
      resistance: initialPrice * 1.5,
    };

    this.dispatchEvent(
      new CustomEvent("bot_asset_created", {
        detail: {
          symbol,
          initialPrice,
          creatorBotId,
        },
      }),
    );

    console.log(
      `🚀 Bot asset created: ${symbol} by ${creatorBotId} at $${initialPrice}`,
    );
  }

  // ============================================================================
  // BOT MANAGEMENT
  // ============================================================================

  public addBot(bot: Bot): void {
    this.activeBots.set(bot.id, bot);
    console.log(`🤖 Added bot to trading engine: ${bot.name}`);
  }

  public removeBot(botId: string): void {
    this.activeBots.delete(botId);
    console.log(`🗑️ Removed bot from trading engine: ${botId}`);
  }

  // ============================================================================
  // STATISTICS & ANALYSIS
  // ============================================================================

  public getMarketStats(): MarketStats {
    const assets = Object.values(this.marketData.assets);
    const totalVolume = assets.reduce((sum, asset) => sum + asset.volume, 0);
    const averageVolatility =
      assets.reduce((sum, asset) => sum + asset.volatility, 0) / assets.length;

    return {
      totalVolume,
      averageVolatility,
      cycleProgress: this.cycleState.progress,
      activeBots: this.activeBots.size,
      totalTrades: this.totalTicks, // Simplified
    };
  }

  public getPriceHistory(symbol?: AssetSymbol): PriceHistoryPoint[] {
    if (symbol) {
      return this.priceHistory.map((point) => ({
        timestamp: point.timestamp,
        prices: Object.fromEntries([[symbol, point.prices[symbol]]]) as Record<
          AssetSymbol,
          number
        >,
      }));
    }
    return [...this.priceHistory];
  }

  public getTradingActivity(): { volume: number; trades: number } {
    const volume = Object.values(this.marketData.assets).reduce(
      (sum, asset) => sum + asset.volume,
      0,
    );

    return {
      volume,
      trades: this.activeBots.size, // Simplified
    };
  }

  // ============================================================================
  // ADMIN/DEBUG FUNCTIONS
  // ============================================================================

  public forceCrash(): void {
    console.log("🔧 DEBUG: Forcing market crash");
    this.triggerMarketCrash();
  }

  public forcePhase(phase: MarketCycle): void {
    console.log(`🔧 DEBUG: Forcing phase change to ${phase}`);
    this.cycleState.phase = phase;
    this.cycleState.progress = 0;
    this.cycleState.duration = 0;
  }

  // ============================================================================
  // INITIALIZATION & UTILITY
  // ============================================================================

  private initializeMarket(): MarketData {
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

  private initializeCycleState(): CycleState {
    return {
      phase: "growth",
      progress: 0,
      intensity: 0.5,
      duration: 0,
      phaseDurations: {
        growth: 300, // 5 minutes
        bubble: 120, // 2 minutes
        peak: 30, // 30 seconds
        crash: 60, // 1 minute
        recovery: 180, // 3 minutes
      },
    };
  }

  private restoreMarketState(): void {
    try {
      const savedState = localStorage.getItem("qoinbots-market-state");
      if (savedState) {
        const parsed = JSON.parse(savedState);

        // Restore market data carefully
        if (parsed.marketData) {
          this.marketData = { ...this.marketData, ...parsed.marketData };
        }

        if (parsed.cycleState) {
          this.cycleState = { ...this.cycleState, ...parsed.cycleState };
        }

        console.log("📂 Market state restored from localStorage");
      }
    } catch (error) {
      console.warn("⚠️ Failed to restore market state:", error);
    }
  }

  private createMarketUpdateEvent(): MarketUpdateEvent {
    return {
      prices: { ...this.marketData.assets },
      cycle: { ...this.cycleState },
      timestamp: Date.now(),
    };
  }

  public destroy(): void {
    // Save market state before destroying
    try {
      const stateToSave = {
        marketData: this.marketData,
        cycleState: this.cycleState,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        "qoinbots-market-state",
        JSON.stringify(stateToSave),
      );
    } catch (error) {
      console.warn("⚠️ Failed to save market state:", error);
    }

    // Stop the engine
    this.stop();

    // Clear all bots
    this.activeBots.clear();

    console.log("🔥 TradingEngine destroyed and state saved");
  }
}
