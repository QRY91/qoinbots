/**
 * QOIN Bot Class - TypeScript Edition
 * Individual trading bot with personality, mood system, and trading behavior
 * Fully typed and robust implementation
 */

import type {
  BotInstance,
  BotConfig,
  BotPersonality,
  BotMood,
  BotTraits,
  BotPreferences,
  BotStats,
  Trade,
  TradeAction,
  AssetSymbol,
  MarketData,
  BotMoodData,
  TradingSignal,
} from "$types/index.js";

import { STARTING_BALANCE, STARTING_PRICES } from "$types/index.js";

interface Position {
  asset: AssetSymbol | null;
  size: number;
  entryPrice: number;
}

interface MoodConfig extends BotMoodData {
  emoji: string;
  color: string;
  speechFrequency: number;
}

interface SpeechPattern {
  buy: string[];
  sell: string[];
  profit: string[];
  loss: string[];
  idle: string[];
}

export default class Bot extends EventTarget implements BotInstance {
  // Core Identity
  public readonly id: string;
  public readonly name: string;
  public readonly personality: BotPersonality;
  public readonly avatar: string;

  // Progression
  public level: number;
  public experience: number;

  // State
  public mood: BotMood;
  public isActive: boolean;
  public unlocked: boolean;

  // Behavioral Traits
  public traits: BotTraits;
  public preferences: BotPreferences;
  public stats: BotStats;

  // Trading State
  public lastTradeTime: number;
  public lastSpeech: number;
  public tradeHistory: Trade[];

  // Internal State
  private position: Position;
  private speechPatterns: SpeechPattern;
  private moodConfigs: Record<BotMood, MoodConfig>;

  constructor(config: BotConfig) {
    super();

    // Initialize core identity
    this.id = config.id;
    this.name = config.name;
    this.personality = config.personality;
    this.avatar = config.avatar;

    // Initialize progression
    this.level = config.level || 1;
    this.experience = config.experience || 0;

    // Initialize state
    this.mood = config.mood || "neutral";
    this.isActive = config.isActive ?? true;
    this.unlocked = true;

    // Initialize behavioral traits with personality-based defaults
    this.traits = this.initializeTraits(config.traits);
    this.preferences = this.initializePreferences(config.preferences);
    this.stats = this.initializeStats(config.stats);

    // Initialize trading state
    this.lastTradeTime = Date.now();
    this.lastSpeech = 0;
    this.tradeHistory = [];

    // Initialize internal state
    this.position = { asset: null, size: 0, entryPrice: 0 };
    this.speechPatterns = this.initializeSpeechPatterns();
    this.moodConfigs = this.initializeMoodConfigs();

    console.log(`🤖 Bot created: ${this.name} (${this.personality})`);
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  public emit(eventType: string, data?: any): void {
    this.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }

  // ============================================================================
  // TRADING LOGIC
  // ============================================================================

  public shouldTrade(market: MarketData): boolean {
    if (!this.isActive) return false;

    // Check minimum balance
    if (this.stats.balance < this.preferences.minTradeSize) {
      return false;
    }

    // Check time since last trade
    const timeSinceLastTrade = Date.now() - this.lastTradeTime;
    const requiredDelay = this.getTradeDelay();

    if (timeSinceLastTrade < requiredDelay) {
      return false;
    }

    // Generate trading signals
    const signals = this.generateTradingSignals(market);
    const confidence = this.calculateTradeConfidence(signals, market);

    // Mood-based trading threshold
    const moodData = this.moodConfigs[this.mood];
    const baseThreshold = 0.6;
    const adjustedThreshold = baseThreshold / moodData.tradeFrequency;

    return confidence > adjustedThreshold;
  }

  public executeTrade(market: MarketData, gameState: any): Trade | null {
    try {
      if (!this.shouldTrade(market)) {
        return null;
      }

      // Select asset and action
      const asset = this.selectTradingAsset(market);
      const action = this.determineTradeAction(asset, market);
      const size = this.calculateTradeSize(action, market);

      if (size < this.preferences.minTradeSize) {
        return null;
      }

      const currentPrice = market.assets[asset].price;
      const priceImpact = this.calculatePriceImpact(
        size,
        market.assets[asset].volume,
      );
      const executionPrice =
        currentPrice * (1 + (action === "buy" ? priceImpact : -priceImpact));

      // Calculate PnL
      const pnl =
        action === "buy"
          ? this.simulateBuyTrade(asset, size, executionPrice, market)
          : this.simulateSellTrade(asset, size, executionPrice);

      // Create trade record
      const trade: Trade = {
        timestamp: Date.now(),
        asset,
        action,
        size,
        price: executionPrice,
        pnl,
        mood: this.mood,
        confidence: this.calculateTradeConfidence(
          this.generateTradingSignals(market),
          market,
        ),
      };

      // Execute the trade
      this.updateTradeStats(trade);
      this.updateMoodFromTrade(trade);
      this.lastTradeTime = Date.now();

      // Add to history
      this.tradeHistory.push(trade);
      if (this.tradeHistory.length > 100) {
        this.tradeHistory = this.tradeHistory.slice(-100);
      }

      // Generate commentary
      this.generateTradeCommentary(trade);

      // Emit trade event
      this.emit("trade_executed", { botId: this.id, trade });

      console.log(
        `💹 ${this.name} executed ${action} ${asset} for ${pnl > 0 ? "+" : ""}$${pnl.toFixed(2)}`,
      );

      return trade;
    } catch (error) {
      console.error(`❌ Trade execution failed for ${this.name}:`, error);
      return null;
    }
  }

  private generateTradingSignals(market: MarketData): TradingSignal[] {
    const signals: TradingSignal[] = [];

    // Technical analysis signals
    signals.push(...this.calculateTechnicalSignals(market));

    // Personality-based signals
    signals.push(this.getPersonalitySignal(market));

    // Mood-based signals
    const moodData = this.moodConfigs[this.mood];
    signals.push({
      strength: (moodData.optimismBias - 0.5) * 2,
      source: "mood",
      confidence: 0.3,
    });

    return signals;
  }

  private calculateTradeConfidence(
    signals: TradingSignal[],
    market: MarketData,
  ): number {
    if (signals.length === 0) return 0;

    // Weighted average of signal strengths
    const totalWeight = signals.reduce(
      (sum, signal) => sum + signal.confidence,
      0,
    );
    const weightedStrength = signals.reduce(
      (sum, signal) => sum + Math.abs(signal.strength) * signal.confidence,
      0,
    );

    const baseConfidence = totalWeight > 0 ? weightedStrength / totalWeight : 0;

    // Apply personality bias
    return this.applyPersonalityBias(baseConfidence, market);
  }

  private simulateBuyTrade(
    asset: AssetSymbol,
    size: number,
    price: number,
    market: MarketData,
  ): number {
    // Simple simulation: assume random price movement
    const volatility = market.assets[asset].volatility;
    const priceChange = (Math.random() - 0.5) * volatility;
    const newPrice = price * (1 + priceChange);

    // Calculate position value change
    const shares = size / price;
    const newValue = shares * newPrice;
    const pnl = newValue - size;

    return pnl;
  }

  private simulateSellTrade(
    asset: AssetSymbol,
    size: number,
    price: number,
  ): number {
    // For selling, assume we had a position and calculate realized PnL
    // This is simplified - in a real implementation, we'd track actual positions
    const averageHoldingPeriod = 0.1; // 10% average return assumption
    return size * averageHoldingPeriod * (Math.random() - 0.3); // Slight negative bias
  }

  // ============================================================================
  // TRADING CALCULATIONS
  // ============================================================================

  private calculateTradeSize(action: TradeAction, market: MarketData): number {
    const moodData = this.moodConfigs[this.mood];
    const baseSize = this.stats.balance * this.preferences.maxPositionSize;
    const adjustedSize = baseSize * moodData.riskMultiplier;

    // Apply personality traits
    const riskAdjustment = this.traits.riskTolerance;
    const finalSize = adjustedSize * riskAdjustment;

    return Math.max(this.preferences.minTradeSize, finalSize);
  }

  private getTradeDelay(): number {
    const baseDelay = this.preferences.tradingFrequency;
    const moodMultiplier = this.moodConfigs[this.mood].tradeFrequency;
    const patienceMultiplier = this.traits.patience;

    return baseDelay / (moodMultiplier * (2 - patienceMultiplier));
  }

  private selectTradingAsset(market: MarketData): AssetSymbol {
    // Filter preferred assets that exist in market
    const availableAssets = this.preferences.preferredAssets.filter(
      (asset) => asset in market.assets,
    ) as AssetSymbol[];

    if (availableAssets.length === 0) {
      // Fallback to QOIN
      return "QOIN";
    }

    // Weight selection by volatility preference and personality
    const weights = availableAssets.map((asset) => {
      const assetData = market.assets[asset];
      const volatilityPreference = this.traits.riskTolerance;
      const volatilityMatch =
        1 - Math.abs(assetData.volatility - volatilityPreference);
      return Math.max(0.1, volatilityMatch);
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < availableAssets.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return availableAssets[i];
      }
    }

    return availableAssets[0];
  }

  private determineTradeAction(
    asset: AssetSymbol,
    market: MarketData,
  ): TradeAction {
    const signals = this.generateTradingSignals(market);
    const avgSignalStrength =
      signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;

    // Apply personality bias
    const personalityBias = this.getPersonalityBias();
    const finalSignal = avgSignalStrength + personalityBias;

    return finalSignal > 0 ? "buy" : "sell";
  }

  private calculatePriceImpact(
    tradeSize: number,
    marketVolume: number,
  ): number {
    // Simple price impact model
    const impact = tradeSize / (marketVolume * 1000);
    return Math.min(0.01, impact); // Cap at 1%
  }

  // ============================================================================
  // MOOD & PERSONALITY SYSTEM
  // ============================================================================

  private updateMoodFromTrade(trade: Trade): void {
    const moodShift = this.calculateMoodShift(trade);

    if (Math.abs(moodShift) > 0.1) {
      this.changeMood(this.calculateNewMood(moodShift));
    }
  }

  private calculateMoodShift(trade: Trade): number {
    const pnlRatio = trade.pnl / this.stats.balance;
    const baseShift = pnlRatio * 2; // Scale to mood impact

    // Personality affects mood sensitivity
    const sensitivity = 1 - this.traits.patience;

    return baseShift * sensitivity;
  }

  private calculateNewMood(shift: number): BotMood {
    const moodOrder: BotMood[] = [
      "depressed",
      "pessimistic",
      "neutral",
      "optimistic",
      "euphoric",
    ];
    const currentIndex = moodOrder.indexOf(this.mood);

    let newIndex = currentIndex;
    if (shift > 0.2)
      newIndex = Math.min(moodOrder.length - 1, currentIndex + 1);
    else if (shift < -0.2) newIndex = Math.max(0, currentIndex - 1);

    return moodOrder[newIndex];
  }

  public changeMood(newMood: BotMood): void {
    if (newMood !== this.mood) {
      const oldMood = this.mood;
      this.mood = newMood;
      this.emit("mood_changed", { botId: this.id, oldMood, newMood });
      console.log(`😊 ${this.name} mood changed: ${oldMood} → ${newMood}`);
    }
  }

  // ============================================================================
  // SPEECH & COMMENTARY SYSTEM
  // ============================================================================

  private generateTradeCommentary(trade: Trade): void {
    if (Date.now() - this.lastSpeech < 10000) return; // Don't spam

    const moodData = this.moodConfigs[this.mood];
    if (Math.random() > moodData.speechFrequency) return;

    const category = trade.pnl > 0 ? "profit" : "loss";
    const patterns = this.speechPatterns[category];
    const comment = patterns[Math.floor(Math.random() * patterns.length)];

    this.speak(comment);
  }

  public speak(message: string): void {
    this.lastSpeech = Date.now();
    this.emit("bot_speech", {
      botId: this.id,
      name: this.name,
      message,
      mood: this.mood,
      avatar: this.avatar,
    });
  }

  // ============================================================================
  // STATISTICS & ANALYSIS
  // ============================================================================

  private updateTradeStats(trade: Trade): void {
    // Update balance
    this.stats.balance += trade.pnl;
    this.stats.balance = Math.max(0, this.stats.balance); // Prevent negative balance

    // Update trade statistics
    this.stats.trades++;
    this.stats.totalPnL += trade.pnl;

    if (trade.pnl > 0) {
      this.stats.wins++;
      this.stats.biggestWin = Math.max(this.stats.biggestWin || 0, trade.pnl);
    } else {
      this.stats.losses++;
      this.stats.biggestLoss = Math.min(this.stats.biggestLoss || 0, trade.pnl);
    }

    // Update win rate
    this.stats.winRate = this.stats.wins / this.stats.trades;

    // Update experience (simplified)
    this.experience += Math.abs(trade.pnl);

    // Check for level up
    const newLevel = Math.floor(this.experience / 100) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.emit("level_up", { botId: this.id, level: this.level });
    }
  }

  public getRecentPerformance(): {
    profit: number;
    winRate: number;
    trades: number;
  } {
    const recentTrades = this.tradeHistory.slice(-10);
    const profit = recentTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const wins = recentTrades.filter((trade) => trade.pnl > 0).length;

    return {
      profit,
      winRate: recentTrades.length > 0 ? wins / recentTrades.length : 0,
      trades: recentTrades.length,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getPersonalitySignal(market: MarketData): TradingSignal {
    let strength = 0;
    let confidence = 0.5;

    switch (this.personality) {
      case "momentum":
        // Follow market trends
        const avgTrend =
          Object.values(market.assets).reduce(
            (sum, asset) => sum + (asset.trend || 0),
            0,
          ) / Object.keys(market.assets).length;
        strength = avgTrend * 2;
        confidence = 0.7;
        break;

      case "contrarian":
        // Go against the crowd
        const marketSentiment = this.analyzeBotBehavior(market);
        strength = -marketSentiment;
        confidence = 0.6;
        break;

      case "diamond_hands":
        // Prefer holding, rarely trade
        strength = 0.1;
        confidence = 0.3;
        break;

      case "panic":
        // Reactive to volatility
        const avgVolatility =
          Object.values(market.assets).reduce(
            (sum, asset) => sum + asset.volatility,
            0,
          ) / Object.keys(market.assets).length;
        strength = avgVolatility > 0.5 ? -1 : 0.5;
        confidence = 0.8;
        break;

      default:
        strength = (Math.random() - 0.5) * 0.5;
        confidence = 0.4;
    }

    return { strength, source: "personality", confidence };
  }

  private analyzeBotBehavior(market: MarketData): number {
    // Simplified analysis of market sentiment
    // In a real implementation, this would analyze other bots' recent trades
    return (Math.random() - 0.5) * 2;
  }

  private calculateTechnicalSignals(market: MarketData): TradingSignal[] {
    // Simplified technical analysis
    return [
      {
        strength: (Math.random() - 0.5) * 2,
        source: "technical",
        confidence: 0.5,
      },
    ];
  }

  private applyPersonalityBias(
    baseConfidence: number,
    market: MarketData,
  ): number {
    let adjustedConfidence = baseConfidence;

    // Apply overconfidence bias
    if (this.stats.winRate > 0.6) {
      adjustedConfidence *= 1 + this.traits.greed;
    }

    // Apply herding bias
    adjustedConfidence += this.traits.herding * 0.1;

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  private getPersonalityBias(): number {
    switch (this.personality) {
      case "philosophical":
        return 0.05;
      case "pessimistic":
        return -0.1;
      case "contrarian":
        return -0.05;
      default:
        return 0;
    }
  }

  // ============================================================================
  // INITIALIZATION METHODS
  // ============================================================================

  private initializeTraits(customTraits?: Partial<BotTraits>): BotTraits {
    const defaultTraits: BotTraits = {
      riskTolerance: 0.5,
      greed: 0.5,
      fear: 0.5,
      intelligence: 0.5,
      patience: 0.5,
      herding: 0.5,
      contrarian: 0.5,
    };

    // Apply personality-based defaults
    const personalityTraits = this.getPersonalityTraits();

    return {
      ...defaultTraits,
      ...personalityTraits,
      ...customTraits,
    };
  }

  private getPersonalityTraits(): Partial<BotTraits> {
    switch (this.personality) {
      case "diamond_hands":
        return { patience: 0.9, fear: 0.2, riskTolerance: 0.8 };
      case "panic":
        return { patience: 0.1, fear: 0.9, riskTolerance: 0.3 };
      case "contrarian":
        return { contrarian: 0.9, herding: 0.1, intelligence: 0.7 };
      case "momentum":
        return { herding: 0.8, greed: 0.7, patience: 0.3 };
      case "pessimistic":
        return { fear: 0.8, riskTolerance: 0.2, patience: 0.7 };
      case "philosophical":
        return { intelligence: 0.9, patience: 0.8, greed: 0.2 };
      default:
        return {};
    }
  }

  private initializePreferences(
    customPrefs?: Partial<BotPreferences>,
  ): BotPreferences {
    return {
      preferredAssets: ["QOIN"],
      maxPositionSize: 0.3,
      minTradeSize: 10.0,
      tradingFrequency: 30000,
      ...customPrefs,
    };
  }

  private initializeStats(customStats?: Partial<BotStats>): BotStats {
    return {
      balance: STARTING_BALANCE,
      startingBalance: STARTING_BALANCE,
      totalPnL: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      daysAlive: 0,
      winRate: 0,
      ...customStats,
    };
  }

  private initializeSpeechPatterns(): SpeechPattern {
    const patterns: Record<BotPersonality, SpeechPattern> = {
      philosophical: {
        buy: [
          "The market whispers secrets to those who listen...",
          "Perhaps this is the way.",
          "The dao of trading flows through this decision.",
        ],
        sell: [
          "All positions are temporary, like thoughts in meditation.",
          "Attachment to profits leads to suffering.",
          "The wise trader knows when to let go.",
        ],
        profit: [
          "Wealth is not the goal, but understanding is.",
          "The market has smiled upon our contemplation.",
          "Success teaches us as much as failure.",
        ],
        loss: [
          "Every loss is a teacher in disguise.",
          "The market humbles even the wisest.",
          "In loss, we find the seeds of wisdom.",
        ],
        idle: [
          "Watching the markets flow like a river...",
          "Patience is the trader's greatest virtue.",
          "The best trades often come from not trading.",
        ],
      },
      diamond_hands: {
        buy: [
          "HODL mode activated! 💎🙌",
          "Time in the market beats timing the market!",
          "Buying the dip like a champion!",
        ],
        sell: [
          "Finally taking some profit after HODLing!",
          "Diamond hands never fold easily!",
          "This better be worth breaking my HODL streak!",
        ],
        profit: [
          "HODL strategy paying off! 💎",
          "Diamond hands create diamond profits!",
          "Patience rewarded once again!",
        ],
        loss: [
          "HODL through the storm! 💎🙌",
          "Diamond hands don't break under pressure!",
          "Short-term pain, long-term gain!",
        ],
        idle: [
          "HODLing strong through all market conditions...",
          "Diamond hands never get tired!",
          "Building wealth one HODL at a time...",
        ],
      },
      contrarian: {
        buy: [
          "When others fear, I get greedy!",
          "Buying while the crowd panics!",
          "Contrarian wisdom in action!",
        ],
        sell: [
          "Time to fade the hype!",
          "Selling into the euphoria!",
          "Going against the grain pays off!",
        ],
        profit: [
          "Contrarian strategy wins again!",
          "Profit from going against the crowd!",
          "Independent thinking pays dividends!",
        ],
        loss: [
          "Even contrarians can be wrong sometimes...",
          "The crowd got this one right, apparently.",
          "Recalibrating my contrarian compass...",
        ],
        idle: [
          "Watching for crowd extremes to fade...",
          "The best opportunities come from contrarian thinking.",
          "When everyone agrees, someone's wrong...",
        ],
      },
      pessimistic: {
        buy: [
          "Reluctantly entering this position...",
          "This will probably go wrong, but...",
          "Against my better judgment, buying...",
        ],
        sell: [
          "Finally cutting this losing position!",
          "Getting out before it gets worse!",
          "Selling before the inevitable crash!",
        ],
        profit: [
          "Shocked this actually worked out...",
          "Unexpected profit in these dark times.",
          "Even a broken clock is right twice a day...",
        ],
        loss: [
          "I knew this would happen!",
          "Another disappointment, as expected.",
          "The market never fails to disappoint...",
        ],
        idle: [
          "Expecting the worst, hoping for less...",
          "Market looking dangerous as usual...",
          "Everything is overvalued and doomed...",
        ],
      },
      momentum: {
        buy: [
          "Riding the momentum wave! 🚀",
          "Trend is my friend!",
          "Mo-mo-momentum building up!",
        ],
        sell: [
          "Momentum shifting, time to exit!",
          "Riding the wave down now!",
          "Momentum says sell!",
        ],
        profit: [
          "Momentum trading for the win! 🚀",
          "Surfing the profit wave!",
          "Trend following pays off again!",
        ],
        loss: [
          "Momentum turned against me...",
          "Even good trends end sometimes.",
          "Whipsaw got me this time!",
        ],
        idle: [
          "Scanning for the next big momentum play...",
          "Waiting for the trend to become clear...",
          "Momentum builds slowly, then all at once...",
        ],
      },
      panic: {
        buy: [
          "FOMO kicking in! Must buy now!",
          "Can't miss this opportunity!",
          "Panic buying mode activated!",
        ],
        sell: [
          "PANIC SELL! GET OUT NOW!",
          "Everything is crashing! SELL!",
          "Emergency exit protocol!",
        ],
        profit: [
          "Phew! Got out with a profit somehow!",
          "Panic paid off this time!",
          "Lucky escape with gains!",
        ],
        loss: [
          "DISASTER! Should have sold earlier!",
          "Panic wasn't fast enough!",
          "This is a catastrophe!",
        ],
        idle: [
          "Constantly worried about the next crash...",
          "Something bad is about to happen...",
          "Why is everything so scary?!",
        ],
      },
      balanced: {
        buy: [
          "Making a calculated purchase.",
          "Risk/reward looks favorable here.",
          "Balanced approach to this opportunity.",
        ],
        sell: [
          "Taking profits systematically.",
          "Rebalancing the portfolio.",
          "Disciplined exit strategy.",
        ],
        profit: [
          "Steady profits from balanced approach.",
          "Risk management paying off.",
          "Consistent strategy showing results.",
        ],
        loss: [
          "Acceptable loss within risk parameters.",
          "Part of the balanced trading plan.",
          "Managing downside as planned.",
        ],
        idle: [
          "Maintaining portfolio balance...",
          "Steady as she goes...",
          "Discipline over emotion, always.",
        ],
      },
      enlightened: {
        buy: [
          "The cosmic flow suggests accumulation.",
          "Universal abundance flows through this trade.",
          "Manifesting prosperity through mindful action.",
        ],
        sell: [
          "Releasing attachment to material gains.",
          "The universe provides what we need.",
          "Flowing with the cosmic trading currents.",
        ],
        profit: [
          "Gratitude for the universe's abundance!",
          "Prosperity flows to those aligned with truth.",
          "The cosmic traders' blessing received!",
        ],
        loss: [
          "The universe teaches through all experiences.",
          "Cosmic lessons come in many forms.",
          "Enlightenment through financial tribulation.",
        ],
        idle: [
          "Meditating on the cosmic market forces...",
          "Aligning with universal trading energy...",
          "Transcending the illusion of profit and loss...",
        ],
      },
    };

    return patterns[this.personality] || patterns.balanced;
  }

  private initializeMoodConfigs(): Record<BotMood, MoodConfig> {
    return {
      euphoric: {
        emoji: "🤩",
        color: "#00ff88",
        tradeFrequency: 2.0,
        riskMultiplier: 1.5,
        optimismBias: 0.8,
        speechFrequency: 0.7,
      },
      optimistic: {
        emoji: "😊",
        color: "#2ecc71",
        tradeFrequency: 1.2,
        riskMultiplier: 1.1,
        optimismBias: 0.6,
        speechFrequency: 0.4,
      },
      neutral: {
        emoji: "😐",
        color: "#95a5a6",
        tradeFrequency: 1.0,
        riskMultiplier: 1.0,
        optimismBias: 0.5,
        speechFrequency: 0.3,
      },
      pessimistic: {
        emoji: "😔",
        color: "#f39c12",
        tradeFrequency: 0.8,
        riskMultiplier: 0.7,
        optimismBias: 0.3,
        speechFrequency: 0.5,
      },
      depressed: {
        emoji: "😞",
        color: "#e74c3c",
        tradeFrequency: 0.5,
        riskMultiplier: 0.5,
        optimismBias: 0.2,
        speechFrequency: 0.6,
      },
      confused: {
        emoji: "😵‍💫",
        color: "#9b59b6",
        tradeFrequency: 1.5,
        riskMultiplier: 0.8,
        optimismBias: 0.5,
        speechFrequency: 0.4,
      },
      confident: {
        emoji: "😎",
        color: "#3498db",
        tradeFrequency: 1.3,
        riskMultiplier: 1.2,
        optimismBias: 0.7,
        speechFrequency: 0.5,
      },
      anxious: {
        emoji: "😰",
        color: "#e67e22",
        tradeFrequency: 1.8,
        riskMultiplier: 0.6,
        optimismBias: 0.3,
        speechFrequency: 0.8,
      },
    };
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  public getDisplayName(): string {
    return `${this.avatar} ${this.name}`;
  }

  public getCurrentMood(): MoodConfig {
    return this.moodConfigs[this.mood];
  }

  public getPersonalityDescription(): string {
    const descriptions: Record<BotPersonality, string> = {
      philosophical: "A deep thinker who sees trading as a path to wisdom",
      diamond_hands: "HODLs through thick and thin with unwavering conviction",
      contrarian:
        "Goes against the crowd when everyone else is following trends",
      pessimistic: "Expects the worst but is sometimes pleasantly surprised",
      momentum: "Rides the waves of market trends with enthusiasm",
      panic: "Reacts quickly to market changes, sometimes too quickly",
      balanced: "Takes a measured approach to all trading decisions",
      enlightened: "Sees trading as part of a greater cosmic plan",
    };

    return descriptions[this.personality] || "A unique trading personality";
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  public toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      personality: this.personality,
      avatar: this.avatar,
      level: this.level,
      experience: this.experience,
      mood: this.mood,
      isActive: this.isActive,
      unlocked: this.unlocked,
      traits: this.traits,
      preferences: this.preferences,
      stats: this.stats,
      lastTradeTime: this.lastTradeTime,
      lastSpeech: this.lastSpeech,
      tradeHistory: this.tradeHistory,
    };
  }

  public static fromJSON(data: any): Bot {
    return new Bot(data);
  }
}
