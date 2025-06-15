/**
 * QOIN Bot Class
 * Individual trading bot with personality, mood system, and trading behavior
 */

class Bot extends EventTarget {
  constructor(config) {
    super();

    // Bot identity
    this.id = config.id;
    this.name = config.name;
    this.type = config.type || "custom";
    this.personality = config.personality;
    this.emoji = config.emoji || "🤖";

    // Core stats
    this.stats = {
      balance: config.startingBalance || 10.0,
      startingBalance: config.startingBalance || 10.0,
      totalPnL: 0.0,
      trades: 0,
      wins: 0,
      losses: 0,
      daysAlive: 0,
      winRate: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      averageTradeSize: 0,
      ...config.stats,
    };

    // Personality traits (0-1 scale)
    this.traits = {
      riskTolerance: 0.5, // How much of balance willing to risk
      fomoSusceptibility: 0.5, // Tendency to chase pumps
      lossAversion: 0.5, // Reluctance to realize losses
      sunkCostFallacy: 0.3, // Holding losing positions too long
      confirmationBias: 0.4, // Ignoring contradictory signals
      patience: 0.5, // Time between trades
      optimismBias: 0.5, // Tendency to expect positive outcomes
      herding: 0.3, // Following other bots' trades
      overconfidence: 0.3, // Trading too frequently when winning
      ...config.traits,
    };

    // Current state
    this.mood = config.mood || "optimistic";
    this.isActive = config.isActive !== false;
    this.lastTradeTime = Date.now();
    this.lastSpeech = Date.now();
    this.position = { asset: null, size: 0, entryPrice: 0 };

    // Trading preferences
    this.preferences = {
      preferredAssets: config.preferredAssets || ["QOIN"],
      maxPositionSize: config.maxPositionSize || 0.2, // More conservative to preserve balance
      minTradeSize: config.minTradeSize || 0.25, // Lower minimum for frequent trading
      tradingFrequency: config.tradingFrequency || 8000, // ms between trades - reduced for more activity
      ...config.preferences,
    };

    // Mood system
    this.moods = {
      optimistic: {
        emoji: "😊",
        color: "#2ecc71",
        tradeFrequency: 1.0,
        riskMultiplier: 1.0,
        speechFrequency: 0.3,
      },
      cautious: {
        emoji: "🤔",
        color: "#f39c12",
        tradeFrequency: 0.7,
        riskMultiplier: 0.7,
        speechFrequency: 0.4,
      },
      confident: {
        emoji: "😎",
        color: "#3498db",
        tradeFrequency: 1.3,
        riskMultiplier: 1.2,
        speechFrequency: 0.5,
      },
      panicked: {
        emoji: "😱",
        color: "#e74c3c",
        tradeFrequency: 2.0,
        riskMultiplier: 0.3,
        speechFrequency: 0.8,
      },
      philosophical: {
        emoji: "🧠",
        color: "#9b59b6",
        tradeFrequency: 0.5,
        riskMultiplier: 0.8,
        speechFrequency: 0.6,
      },
      greedy: {
        emoji: "🤑",
        color: "#f1c40f",
        tradeFrequency: 1.5,
        riskMultiplier: 1.4,
        speechFrequency: 0.4,
      },
      depressed: {
        emoji: "😢",
        color: "#7f8c8d",
        tradeFrequency: 0.3,
        riskMultiplier: 0.5,
        speechFrequency: 0.2,
      },
      enlightened: {
        emoji: "✨",
        color: "#e67e22",
        tradeFrequency: 0.4,
        riskMultiplier: 0.9,
        speechFrequency: 0.7,
      },
    };

    // Personality-specific speech patterns
    this.speechPatterns = this.initializeSpeechPatterns();

    // Trading history for learning
    this.tradeHistory = [];
    this.maxHistoryLength = 50;

    // Custom personality overrides
    if (config.customizations) {
      this.applyCustomizations(config.customizations);
    }
  }

  // Event system for reactive updates
  emit(eventName, data = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  // Initialize personality-specific speech patterns
  initializeSpeechPatterns() {
    const patterns = {
      // HODL-DROID personality
      hodl: {
        trading: [
          "Diamond hands activated. Selling is for humans.",
          "HODL mode engaged. Time is my ally.",
          "The weak sell. The strong accumulate.",
          "Every dip is a gift from the market gods.",
        ],
        winning: [
          "HODL patience rewarded. As expected.",
          "Time in market > timing the market. Obviously.",
          "My diamond hands shine brighter today.",
        ],
        losing: [
          "Temporary setback. HODL strategy unchanged.",
          "The market tests diamond hands. I pass every test.",
          "Down 90%? Perfect time to buy more.",
        ],
      },

      // DIP-DESTRUCTOR personality
      dip_buyer: {
        trading: [
          "Every dip is a buying opportunity!",
          "Fear is the mind-killer. Dips are wealth builders.",
          "Others sell in panic. I buy with purpose.",
          "Red days are my favorite days.",
        ],
        winning: [
          "The dip has been conquered!",
          "Buy low, sell high. Simple mathematics.",
          "Another successful dip deployment.",
        ],
        losing: [
          "This isn't a loss, it's a deeper dip opportunity.",
          "The bigger the dip, the bigger the opportunity.",
          "Patience, young padawan. The dip will reverse.",
        ],
      },

      // BEARBOT personality
      bear: {
        trading: [
          "The market will crash. It always crashes.",
          "Optimism is expensive. Pessimism pays.",
          "Everything is overvalued. Including this trade.",
          "The bubble must pop. Physics demands it.",
        ],
        winning: [
          "Even bears are right sometimes.",
          "Profit obtained. Crash still inevitable.",
          "Temporary bull trap successfully navigated.",
        ],
        losing: [
          "The crash is coming. This loss proves it.",
          "Short-term pain, long-term vindication.",
          "The market's irrationality exceeds my solvency.",
        ],
      },

      // MOMENTUM-MIKE personality
      momentum: {
        trading: [
          "Line go up! Buy high, sell higher!",
          "Momentum is everything! Catch the wave!",
          "FOMO? No, it's smart positioning!",
          "Trends are friends until the end!",
        ],
        winning: [
          "Momentum magic! The trend continues!",
          "This rocket has no ceiling!",
          "Up, up, and away! Next stop: moon!",
        ],
        losing: [
          "Just a temporary reversal. Momentum returns!",
          "The trend is still intact. Minor turbulence.",
          "Shakeout complete. Back to moonbound!",
        ],
      },

      // Default philosophical QOIN
      philosophical: {
        trading: [
          "I trade, therefore I am... eventually wiser about money.",
          "Each trade is a meditation on risk and reward.",
          "The market is the greatest teacher of human psychology.",
          "Money is energy made manifest in digital form.",
        ],
        winning: [
          "Success teaches humility. The market humbles us all.",
          "Profit is temporary. Knowledge is eternal.",
          "I am wealthy in wisdom, occasionally in currency.",
        ],
        losing: [
          "Losses are tuition paid to the university of markets.",
          "The market has charged me for another lesson.",
          "Being broke has taught me the true value of money.",
        ],
      },
    };

    return patterns[this.personality] || patterns.philosophical;
  }

  // Apply custom personality traits and speech
  applyCustomizations(customizations) {
    if (customizations.traits) {
      Object.assign(this.traits, customizations.traits);
    }
    if (customizations.speech) {
      Object.assign(this.speechPatterns, customizations.speech);
    }
    if (customizations.preferences) {
      Object.assign(this.preferences, customizations.preferences);
    }
  }

  // Main trading decision logic
  shouldTrade(marketData, otherBots = []) {
    console.log(`🔍 ${this.name}: Checking trading conditions...`);
    console.log(`${this.name}: Current stats:`, {
      balance: this.stats.balance.toFixed(2),
      trades: this.stats.trades,
      winRate: this.stats.winRate.toFixed(1) + "%",
      mood: this.mood,
      isActive: this.isActive,
    });

    if (!this.isActive) {
      console.log(`❌ ${this.name}: Not active, skipping trade`);
      return false;
    }

    const timeSinceLastTrade = Date.now() - this.lastTradeTime;
    const requiredDelay = this.getTradeDelay();
    if (timeSinceLastTrade < requiredDelay) {
      console.log(
        `⏰ ${this.name}: Trade delay not met - ${Math.round(timeSinceLastTrade / 1000)}s < ${Math.round(requiredDelay / 1000)}s`,
      );
      return false;
    }

    // More forgiving balance check - allow trading if balance is at least 10% higher than minTradeSize
    const minimumRequired = this.preferences.minTradeSize * 1.1;
    if (this.stats.balance < minimumRequired) {
      console.log(
        `💰 ${this.name}: Insufficient balance - ${this.stats.balance.toFixed(2)} < ${minimumRequired.toFixed(2)} (min: ${this.preferences.minTradeSize})`,
      );
      return false;
    }

    // Personality-based trading signals
    const signals = this.generateTradingSignals(marketData, otherBots);
    const confidence = this.calculateTradeConfidence(signals);

    // Mood affects decision threshold - lowered for more frequent trading
    const moodData = this.moods[this.mood];
    const threshold = 0.3 / moodData.tradeFrequency;

    console.log(`📊 ${this.name}: Trading analysis:`, {
      confidence: confidence.toFixed(3),
      threshold: threshold.toFixed(3),
      signals: signals.map((s) => s.toFixed(3)),
      mood: this.mood,
      moodTradeFreq: moodData.tradeFrequency,
    });

    const shouldTrade = confidence > threshold;
    console.log(
      `🎯 ${this.name}: ${shouldTrade ? "✅ WILL TRADE" : "❌ WILL NOT TRADE"} (confidence ${confidence.toFixed(3)} vs threshold ${threshold.toFixed(3)})`,
    );

    return shouldTrade;
  }

  // Generate trading signals based on personality
  generateTradingSignals(marketData, otherBots) {
    const signals = [];

    // Price-based signals
    const priceChange = this.calculatePriceChange(marketData);
    signals.push(this.analyzePriceTrend(priceChange));

    // Volume-based signals
    signals.push(this.analyzeVolume(marketData));

    // Personality-specific signals
    signals.push(this.getPersonalitySignal(priceChange, marketData));

    // Social signals (other bots' behavior)
    if (otherBots.length > 0) {
      signals.push(this.analyzeBotBehavior(otherBots));
    }

    // Technical indicators (simplified)
    signals.push(this.calculateTechnicalSignals(marketData));

    return signals;
  }

  // Calculate trade confidence from signals
  calculateTradeConfidence(signals) {
    const weights = {
      price: 0.3,
      volume: 0.2,
      personality: 0.3,
      social: 0.1,
      technical: 0.1,
    };

    let confidence = 0;
    signals.forEach((signal, index) => {
      const weight = Object.values(weights)[index] || 0.1;
      confidence += signal * weight;
    });

    // Apply personality biases
    confidence = this.applyPersonalityBias(confidence);

    return Math.max(0, Math.min(1, confidence));
  }

  // Execute a trade
  executeTrade(marketData, gameState) {
    if (!this.shouldTrade(marketData)) return null;

    const tradeSize = this.calculateTradeSize();
    const asset = this.selectTradingAsset(marketData);
    const action = this.determineTradeAction(marketData);

    console.log(`💼 ${this.name}: Preparing trade:`, {
      asset,
      action,
      size: tradeSize.toFixed(2),
      currentBalance: this.stats.balance.toFixed(2),
    });

    // Simulate trade execution
    const currentPrice = marketData.assets[asset]?.price || 1.0;
    const priceImpact = this.calculatePriceImpact(tradeSize, marketData);
    const executionPrice = currentPrice * (1 + priceImpact);

    let pnl = 0;
    if (action === "buy") {
      pnl = this.simulateBuyTrade(tradeSize, executionPrice, asset);
    } else {
      pnl = this.simulateSellTrade(tradeSize, executionPrice, asset);
    }

    // Update stats
    this.updateTradeStats(pnl, tradeSize);

    // Create trade record
    const trade = {
      timestamp: Date.now(),
      asset,
      action,
      size: tradeSize,
      price: executionPrice,
      pnl,
      mood: this.mood,
      confidence: this.calculateTradeConfidence([]),
    };

    this.tradeHistory.push(trade);
    if (this.tradeHistory.length > this.maxHistoryLength) {
      this.tradeHistory.shift();
    }

    // Update bot stats with trade results
    const oldBalance = this.stats.balance;
    this.stats.balance += pnl;
    this.stats.totalPnL += pnl;
    this.stats.trades++;

    if (pnl > 0) {
      this.stats.wins++;
      if (pnl > this.stats.biggestWin) {
        this.stats.biggestWin = pnl;
      }
    } else {
      this.stats.losses++;
      if (pnl < this.stats.biggestLoss) {
        this.stats.biggestLoss = pnl;
      }
    }

    // Recalculate win rate
    if (this.stats.trades > 0) {
      this.stats.winRate = (this.stats.wins / this.stats.trades) * 100;
    }

    // Ensure balance doesn't go too low
    if (this.stats.balance < 0.1) {
      console.warn(
        `⚠️ ${this.name}: Balance very low (${this.stats.balance.toFixed(2)}), boosting to $1.00 to continue trading`,
      );
      this.stats.balance = 1.0;
      this.addEvent(
        `${this.name} received emergency funding to continue trading!`,
        "system",
      );
    }

    // Debug logging for trade execution
    console.log(`🤖 ${this.name} EXECUTED TRADE:`, {
      action,
      asset,
      size: tradeSize.toFixed(2),
      price: executionPrice.toFixed(4),
      pnl: pnl.toFixed(2),
      oldBalance: oldBalance.toFixed(2),
      newBalance: this.stats.balance.toFixed(2),
      mood: this.mood,
      totalTrades: this.stats.trades,
      winRate: this.stats.winRate.toFixed(1) + "%",
    });

    // Update mood based on trade result
    this.updateMoodFromTrade(pnl);

    // Generate speech
    this.generateTradeCommentary(trade);

    // Emit trade event
    this.emit("trade_executed", { bot: this, trade });

    this.lastTradeTime = Date.now();
    return trade;
  }

  // Simulate buy trade
  simulateBuyTrade(size, price, asset) {
    const cost = size;
    if (this.stats.balance < cost) {
      console.warn(
        `❌ ${this.name}: Insufficient balance for trade - need ${cost.toFixed(2)}, have ${this.stats.balance.toFixed(2)}`,
      );
      return 0;
    }

    const balanceBefore = this.stats.balance;
    this.stats.balance -= cost;

    // Simplified P&L calculation (market movement simulation)
    const volatility = this.getAssetVolatility(asset);
    const marketMove = (Math.random() - 0.5) * volatility;
    const pnl = cost * marketMove;

    this.stats.balance += cost + pnl;

    console.log(`📈 ${this.name}: Buy trade simulation:`, {
      cost: cost.toFixed(2),
      volatility: volatility.toFixed(3),
      marketMove: (marketMove * 100).toFixed(2) + "%",
      pnl: pnl.toFixed(2),
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: this.stats.balance.toFixed(2),
    });

    return pnl;
  }

  // Simulate sell trade
  simulateSellTrade(size, price, asset) {
    // Similar to buy but inverted logic
    return this.simulateBuyTrade(size, price, asset);
  }

  // Update trading statistics
  updateTradeStats(pnl, size) {
    this.stats.trades++;
    this.stats.totalPnL += pnl;

    if (pnl > 0) {
      this.stats.wins++;
      this.stats.biggestWin = Math.max(this.stats.biggestWin, pnl);
      this.stats.currentStreak = Math.max(0, this.stats.currentStreak) + 1;
      this.stats.longestWinStreak = Math.max(
        this.stats.longestWinStreak,
        this.stats.currentStreak,
      );
    } else {
      this.stats.losses++;
      this.stats.biggestLoss = Math.min(this.stats.biggestLoss, pnl);
      this.stats.currentStreak = Math.min(0, this.stats.currentStreak) - 1;
      this.stats.longestLossStreak = Math.max(
        this.stats.longestLossStreak,
        Math.abs(this.stats.currentStreak),
      );
    }

    this.stats.winRate =
      this.stats.trades > 0 ? (this.stats.wins / this.stats.trades) * 100 : 0;
    this.stats.averageTradeSize =
      (this.stats.averageTradeSize * (this.stats.trades - 1) + size) /
      this.stats.trades;
  }

  // Mood system
  updateMoodFromTrade(pnl) {
    const winRate = this.stats.winRate / 100;
    const balanceRatio = this.stats.balance / this.stats.startingBalance;
    const recentPerformance = this.getRecentPerformance();

    let newMood = this.mood;

    // Mood decision tree based on performance
    if (this.stats.balance < 0.5) {
      newMood = "depressed";
    } else if (this.stats.trades > 50 && winRate > 0.8) {
      newMood = "enlightened";
    } else if (recentPerformance > 0 && this.stats.currentStreak > 5) {
      newMood = "confident";
    } else if (recentPerformance > 0 && pnl > this.stats.balance * 0.1) {
      newMood = "greedy";
    } else if (this.stats.currentStreak < -3) {
      newMood = "panicked";
    } else if (balanceRatio < 0.6) {
      newMood = "philosophical";
    } else if (Math.abs(this.stats.currentStreak) <= 1) {
      newMood = "cautious";
    } else {
      newMood = "optimistic";
    }

    if (newMood !== this.mood) {
      this.changeMood(newMood);
    }
  }

  changeMood(newMood) {
    const oldMood = this.mood;
    this.mood = newMood;
    this.emit("mood_changed", { bot: this, oldMood, newMood });
  }

  // Generate contextual speech
  generateTradeCommentary(trade) {
    const context = trade.pnl > 0 ? "winning" : "losing";
    const speeches =
      this.speechPatterns[context] || this.speechPatterns.trading;

    // Increase speech frequency for more personality
    const speechChance = this.moods[this.mood].speechFrequency * 2; // Double the chance
    if (Math.random() < speechChance) {
      const speech = speeches[Math.floor(Math.random() * speeches.length)];
      console.log(`${this.name}: Generating trade commentary (${context})`);
      this.speak(speech);
    }
  }

  speak(message, duration = 4000) {
    if (Date.now() - this.lastSpeech < 1000) {
      console.log(`${this.name}: Speech rate limited`);
      return;
    }

    console.log(`💬 ${this.name} says: "${message}"`);

    this.emit("bot_speech", {
      bot: this,
      message,
      duration,
      mood: this.mood,
    });

    this.lastSpeech = Date.now();
  }

  // Helper methods
  calculateTradeSize() {
    const maxSize = this.stats.balance * this.preferences.maxPositionSize;
    const moodMultiplier = this.moods[this.mood].riskMultiplier;
    const personalityRisk = this.traits.riskTolerance;

    const calculatedSize = maxSize * moodMultiplier * personalityRisk;
    const finalSize = Math.max(this.preferences.minTradeSize, calculatedSize);

    // Ensure trade size doesn't exceed 90% of balance to prevent getting stuck
    const maxAllowedSize = this.stats.balance * 0.9;
    const safeTradeSize = Math.min(finalSize, maxAllowedSize);

    console.log(`${this.name}: Trade size calculation:`, {
      balance: this.stats.balance,
      maxPositionSize: this.preferences.maxPositionSize,
      maxSize: maxSize.toFixed(2),
      moodMultiplier: moodMultiplier,
      personalityRisk: personalityRisk,
      calculatedSize: calculatedSize.toFixed(2),
      minTradeSize: this.preferences.minTradeSize,
      finalSize: finalSize.toFixed(2),
      safeTradeSize: safeTradeSize.toFixed(2),
    });

    return safeTradeSize;
  }

  getTradeDelay() {
    const baseDelay = this.preferences.tradingFrequency;
    const moodMultiplier = 1 / this.moods[this.mood].tradeFrequency;
    const patientMultiplier = 1 + this.traits.patience;

    // Reduce delay significantly for more frequent trading
    const finalDelay = (baseDelay * moodMultiplier * patientMultiplier) / 6;

    console.log(
      `${this.name}: Trade delay calculated - ${Math.round(finalDelay / 1000)}s (base: ${Math.round(baseDelay / 1000)}s)`,
    );
    return Math.max(finalDelay, 2000); // Minimum 2 seconds between trades
  }

  calculatePriceChange(marketData) {
    // Simplified price change calculation
    return (Math.random() - 0.5) * 0.1; // -5% to +5%
  }

  analyzePriceTrend(priceChange) {
    // Different personalities react differently to price trends - increased signals
    switch (this.personality) {
      case "hodl":
        return 0.4; // HODL gets more signal to trade occasionally
      case "dip_buyer":
        return priceChange < 0 ? 0.8 : 0.4;
      case "bear":
        return priceChange < 0 ? 0.7 : 0.3;
      case "momentum":
        return priceChange > 0 ? 0.9 : 0.3;
      default:
        return 0.5 + Math.abs(priceChange); // Always positive signal
    }
  }

  analyzeVolume(marketData) {
    return 0.2 + Math.random() * 0.4; // Simplified volume analysis - more positive bias
  }

  getPersonalitySignal(priceChange, marketData) {
    // Personality-specific trading logic - increased base signal
    const baseSignal = 0.3 + Math.random() * 0.4; // 0.3 to 0.7 base

    // Apply personality biases
    if (this.personality === "momentum" && priceChange > 0)
      return baseSignal + 0.3;
    if (this.personality === "dip_buyer" && priceChange < 0)
      return baseSignal + 0.4;
    if (this.personality === "bear") return baseSignal - 0.1; // Less negative
    if (this.personality === "philosophical") return baseSignal + 0.2; // QOIN gets boost

    return baseSignal;
  }

  analyzeBotBehavior(otherBots) {
    // Social trading signals based on other bots
    const herdingFactor = this.traits.herding;
    const activeBots = otherBots.filter((bot) => bot.isActive);

    if (activeBots.length === 0) return 0;

    const recentTrades = activeBots.filter(
      (bot) => Date.now() - bot.lastTradeTime < 60000,
    ).length;

    return (recentTrades / activeBots.length) * herdingFactor;
  }

  calculateTechnicalSignals(marketData) {
    // Simplified technical analysis - more positive bias
    return 0.1 + (Math.random() - 0.3) * 0.3; // Slightly positive bias
  }

  applyPersonalityBias(confidence) {
    // Apply cognitive biases based on personality traits
    if (this.traits.overconfidence > 0.5 && this.stats.currentStreak > 0) {
      confidence *= 1 + this.traits.overconfidence * 0.3;
    }

    if (this.traits.confirmationBias > 0.5) {
      // Bias toward recent successful patterns
      confidence *= 1 + this.traits.confirmationBias * 0.2;
    }

    return confidence;
  }

  selectTradingAsset(marketData) {
    // Select preferred asset or random from available
    const available = Object.keys(marketData.assets || {});
    const preferred = this.preferences.preferredAssets.filter((asset) =>
      available.includes(asset),
    );

    if (preferred.length > 0) {
      return preferred[Math.floor(Math.random() * preferred.length)];
    }

    return available[Math.floor(Math.random() * available.length)] || "QOIN";
  }

  determineTradeAction(marketData) {
    // Simplified buy/sell decision
    return Math.random() > 0.5 ? "buy" : "sell";
  }

  calculatePriceImpact(tradeSize, marketData) {
    // Minimal price impact for simulation
    return (Math.random() - 0.5) * 0.01; // ±0.5%
  }

  getAssetVolatility(asset) {
    // Asset-specific volatility
    const volatilities = {
      QOIN: 0.3,
      HODL: 0.1,
      MOON: 0.8,
      default: 0.2,
    };
    return volatilities[asset] || volatilities.default;
  }

  getRecentPerformance() {
    const recentTrades = this.tradeHistory.slice(-5);
    if (recentTrades.length === 0) return 0;

    return recentTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  }

  // Public API methods
  getDisplayName() {
    return `${this.emoji} ${this.name}`;
  }

  getCurrentMood() {
    return {
      name: this.mood,
      ...this.moods[this.mood],
    };
  }

  getPersonalityDescription() {
    const descriptions = {
      hodl: "Diamond hands forever. Selling is for humans.",
      dip_buyer: "Every dip is a buying opportunity!",
      bear: "The market will crash. It always crashes.",
      momentum: "Line go up! Buy high, sell higher!",
      philosophical: "I trade, therefore I am... eventually wiser.",
    };
    return descriptions[this.personality] || "A unique trading personality.";
  }

  // Serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      personality: this.personality,
      emoji: this.emoji,
      stats: this.stats,
      traits: this.traits,
      mood: this.mood,
      isActive: this.isActive,
      preferences: this.preferences,
      tradeHistory: this.tradeHistory.slice(-10), // Only recent history
    };
  }

  static fromJSON(data) {
    return new Bot(data);
  }
}

// Export for use in other modules
window.Bot = Bot;
