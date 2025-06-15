/**
 * QOIN Trading Engine
 * Handles market simulation, bot trading coordination, and bubble cycle mechanics
 */

class TradingEngine extends EventTarget {
    constructor(gameState) {
        super();

        this.gameState = gameState;
        this.isRunning = false;
        this.tickInterval = null;
        this.tickRate = 1000; // 1 second ticks

        // Market simulation parameters
        this.marketParams = {
            baseVolatility: 0.02,
            trendStrength: 0.5,
            meanReversion: 0.1,
            bubbleAcceleration: 1.5,
            crashSeverity: 0.7,
            recoveryRate: 0.3
        };

        // Price history for technical analysis
        this.priceHistory = {
            maxLength: 200,
            data: {}
        };

        // Active trading bots
        this.activeBots = new Map();

        // Market cycle state
        this.cycleState = {
            phase: 'growth', // growth, bubble, peak, crash, recovery
            progress: 0, // 0-1 within current phase
            intensity: 0.5, // How intense the current phase is
            duration: 0, // Ticks in current phase
            phaseDurations: {
                growth: 100,    // 100 ticks = ~1.7 minutes
                bubble: 50,     // 50 ticks = ~50 seconds
                peak: 10,       // 10 ticks = ~10 seconds
                crash: 30,      // 30 ticks = ~30 seconds
                recovery: 80    // 80 ticks = ~1.3 minutes
            }
        };

        // Internal market for bot-to-bot trading
        this.internalMarket = {
            active: false,
            assets: new Map(),
            orderBook: new Map(),
            lastTrades: [],
            bubbleLevel: 0 // 0-1, bubble pops at 1
        };

        // Initialize market data
        this.initializeMarket();

        // Bind methods
        this.tick = this.tick.bind(this);
    }

    // Initialize market with base assets
    initializeMarket() {
        const baseAssets = {
            'QOIN': {
                price: 1.0,
                volume: 100,
                volatility: 0.3,
                trend: 0,
                support: 0.5,
                resistance: 2.0
            },
            'HODL': {
                price: 50.0,
                volume: 50,
                volatility: 0.1,
                trend: 0.1,
                support: 30.0,
                resistance: 100.0
            },
            'MOON': {
                price: 0.001,
                volume: 1000,
                volatility: 0.8,
                trend: 0,
                support: 0.0001,
                resistance: 0.01
            }
        };

        // Initialize price history
        Object.keys(baseAssets).forEach(asset => {
            this.priceHistory.data[asset] = [baseAssets[asset].price];
        });

        // Update game state market data
        this.gameState.updateMarketPrices(baseAssets);
    }

    /**
     * Restore market cycle state from saved game data
     */
    restoreMarketState() {
        const market = this.gameState.getMarket();

        // Restore cycle state if it exists in saved data
        if (market.cycle && market.cycleProgress !== undefined) {
            this.cycleState.phase = market.cycle;
            this.cycleState.progress = market.cycleProgress;

            // Calculate duration based on progress and phase
            const maxDuration = this.cycleState.phaseDurations[this.cycleState.phase];
            this.cycleState.duration = Math.floor(this.cycleState.progress * maxDuration);

            console.log(`Restored market cycle: ${this.cycleState.phase} (${Math.round(this.cycleState.progress * 100)}%)`);
        }

        // Restore total cycles count
        if (market.totalCycles !== undefined) {
            this.cycleState.totalCycles = market.totalCycles;
        }

        // Update cycle intensity based on restored state
        this.updateCycleIntensity();
    }

    // Event system for reactive updates
    emit(eventName, data = {}) {
        this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    // Start the trading engine
    start() {
        if (this.isRunning) return;

        // Restore market cycle state from saved data
        this.restoreMarketState();

        this.isRunning = true;
        this.tickInterval = setInterval(this.tick, this.tickRate);
        this.emit('engine_started');

        console.log('QOIN Trading Engine started');
    }

    // Stop the trading engine
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        this.emit('engine_stopped');

        console.log('QOIN Trading Engine stopped');
    }

    // Main engine tick - called every second
    tick() {
        try {
            // Update market cycle
            this.updateMarketCycle();

            // Simulate market price movements
            this.simulateMarketPrices();

            // Process bot trading decisions
            this.processBotTrading();

            // Update internal market if active
            if (this.internalMarket.active) {
                this.updateInternalMarket();
            }

            // Check for phase transitions
            this.checkPhaseTransitions();

            // Emit tick event for UI updates
            this.emit('market_tick', {
                prices: this.gameState.getMarket().assets,
                cycle: this.cycleState,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('Trading engine tick error:', error);
        }
    }

    // Update market cycle phase and progress
    updateMarketCycle() {
        this.cycleState.duration++;
        const maxDuration = this.cycleState.phaseDurations[this.cycleState.phase];
        this.cycleState.progress = Math.min(1, this.cycleState.duration / maxDuration);

        // Save cycle state to game state for persistence
        this.gameState.state.market.cycle = this.cycleState.phase;
        this.gameState.state.market.cycleProgress = this.cycleState.progress;

        // Advance to next phase if current phase is complete
        if (this.cycleState.progress >= 1) {
            this.advanceMarketPhase();
        }

        this.updateCycleIntensity();
    }

    // Advance to next market phase
    advanceMarketPhase() {
        const phases = ['growth', 'bubble', 'peak', 'crash', 'recovery'];
        const currentIndex = phases.indexOf(this.cycleState.phase);
        const nextIndex = (currentIndex + 1) % phases.length;

        const oldPhase = this.cycleState.phase;
        this.cycleState.phase = phases[nextIndex];
        this.cycleState.duration = 0;
        this.cycleState.progress = 0;

        // Special handling for cycle completion
        if (oldPhase === 'recovery') {
            this.gameState.state.market.totalCycles++;
            this.emit('cycle_completed', {
                cycleNumber: this.gameState.state.market.totalCycles
            });
        }

        // Special crash handling
        if (this.cycleState.phase === 'crash') {
            this.triggerMarketCrash();
        }

        this.emit('phase_changed', {
            oldPhase,
            newPhase: this.cycleState.phase,
            cycleNumber: this.gameState.state.market.totalCycles
        });
    }

    // Update cycle intensity based on phase and progress
    updateCycleIntensity() {
        const phase = this.cycleState.phase;
        const progress = this.cycleState.progress;

        switch (phase) {
            case 'growth':
                this.cycleState.intensity = 0.3 + (progress * 0.4); // 0.3 to 0.7
                break;
            case 'bubble':
                this.cycleState.intensity = 0.7 + (progress * 0.3); // 0.7 to 1.0
                break;
            case 'peak':
                this.cycleState.intensity = 1.0; // Maximum intensity
                break;
            case 'crash':
                this.cycleState.intensity = 1.0 - (progress * 0.7); // 1.0 to 0.3
                break;
            case 'recovery':
                this.cycleState.intensity = 0.3 + (progress * 0.2); // 0.3 to 0.5
                break;
        }
    }

    // Simulate market price movements
    simulateMarketPrices() {
        const market = this.gameState.getMarket();
        const newPrices = {};

        Object.entries(market.assets).forEach(([asset, data]) => {
            const newPrice = this.calculateNewPrice(asset, data);
            newPrices[asset] = {
                ...data,
                price: newPrice,
                change: ((newPrice - data.price) / data.price) * 100,
                volume: this.calculateNewVolume(data.volume)
            };

            // Update price history
            this.updatePriceHistory(asset, newPrice);
        });

        // Update game state with new prices
        this.gameState.updateMarketPrices(newPrices);
    }

    // Calculate new price for an asset
    calculateNewPrice(asset, data) {
        let price = data.price;
        const volatility = data.volatility * this.getVolatilityMultiplier();

        // Random walk component
        const randomMove = (Math.random() - 0.5) * volatility;

        // Trend component based on market cycle
        const trendMove = this.getTrendMove(asset) * volatility;

        // Mean reversion component
        const meanReversionMove = this.getMeanReversionMove(asset, price) * volatility;

        // Combine all movements
        const totalMove = randomMove + trendMove + meanReversionMove;

        // Apply movement
        price *= (1 + totalMove);

        // Apply support/resistance levels
        price = Math.max(data.support || 0, price);
        if (data.resistance) {
            price = Math.min(data.resistance, price);
        }

        return Math.max(0.0001, price); // Prevent negative prices
    }

    // Get volatility multiplier based on market cycle
    getVolatilityMultiplier() {
        const phase = this.cycleState.phase;
        const intensity = this.cycleState.intensity;

        const multipliers = {
            growth: 0.8,
            bubble: 1.5,
            peak: 2.0,
            crash: 3.0,
            recovery: 1.2
        };

        return (multipliers[phase] || 1.0) * intensity;
    }

    // Get trend movement based on market phase
    getTrendMove(asset) {
        const phase = this.cycleState.phase;
        const progress = this.cycleState.progress;

        // Asset-specific trend sensitivity
        const trendSensitivity = {
            'QOIN': 1.0,
            'HODL': 0.5,  // More stable
            'MOON': 2.0   // More volatile
        };

        const sensitivity = trendSensitivity[asset] || 1.0;

        switch (phase) {
            case 'growth':
                return 0.02 * sensitivity * progress;
            case 'bubble':
                return 0.05 * sensitivity * progress;
            case 'peak':
                return 0.01 * sensitivity; // Sideways movement
            case 'crash':
                return -0.08 * sensitivity * (1 - progress);
            case 'recovery':
                return 0.01 * sensitivity * progress;
            default:
                return 0;
        }
    }

    // Get mean reversion force
    getMeanReversionMove(asset, currentPrice) {
        const history = this.priceHistory.data[asset] || [];
        if (history.length < 20) return 0;

        // Calculate 20-period moving average
        const recentPrices = history.slice(-20);
        const average = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;

        // Mean reversion force
        const deviation = (currentPrice - average) / average;
        return -deviation * this.marketParams.meanReversion;
    }

    // Calculate new volume
    calculateNewVolume(currentVolume) {
        const volatilityMultiplier = this.getVolatilityMultiplier();
        const volumeChange = (Math.random() - 0.5) * 0.2 * volatilityMultiplier;

        return Math.max(10, currentVolume * (1 + volumeChange));
    }

    // Update price history
    updatePriceHistory(asset, price) {
        if (!this.priceHistory.data[asset]) {
            this.priceHistory.data[asset] = [];
        }

        this.priceHistory.data[asset].push(price);

        // Trim history to max length
        if (this.priceHistory.data[asset].length > this.priceHistory.maxLength) {
            this.priceHistory.data[asset].shift();
        }
    }

    // Process trading for all active bots
    processBotTrading() {
        const bots = this.gameState.getBots();
        const market = this.gameState.getMarket();

        console.log(`🤖 Processing trading for ${Object.keys(bots).length} bots`);

        Object.values(bots).forEach(botData => {
            if (!botData.isActive) {
                console.log(`${botData.name}: Inactive, skipping`);
                return;
            }

            // Create Bot instance if not exists
            if (!this.activeBots.has(botData.id)) {
                console.log(`${botData.name}: Creating new Bot instance`);
                this.activeBots.set(botData.id, new Bot(botData));
            }

            const bot = this.activeBots.get(botData.id);

            // Execute trade if bot decides to
            const trade = bot.executeTrade(market, this.gameState);

            if (trade) {
                console.log(`💰 TRADE COMPLETED by ${botData.name}:`, trade);

                // Update game state with new bot stats
                this.gameState.updateBotStats(botData.id, bot.stats);

                // Emit trade event
                this.emit('bot_trade', { botId: botData.id, trade });
            } else {
                console.log(`${botData.name}: No trade executed this tick`);
            }
        });
    }

    // Trigger market crash
    triggerMarketCrash() {
        console.log('MARKET CRASH TRIGGERED!');

        // Broadcast crash warning from BEARBOT if it exists
        const bearbot = this.activeBots.get('bearbot');
        if (bearbot) {
            bearbot.speak("I TOLD YOU IT WOULD CRASH! THE BUBBLE HAS POPPED!");
        }

        // Panic sell from emotional bots
        this.activeBots.forEach(bot => {
            if (['panic', 'fomo'].includes(bot.personality)) {
                bot.changeMood('panicked');
            }
        });

        this.emit('market_crash', {
            phase: this.cycleState.phase,
            intensity: this.cycleState.intensity
        });
    }

    // Update internal bot-to-bot market
    updateInternalMarket() {
        // Increase bubble level based on internal trading activity
        const tradingActivity = this.getTradingActivity();
        this.internalMarket.bubbleLevel += tradingActivity * 0.01;

        // Create new bot assets randomly
        if (Math.random() < 0.02 && this.internalMarket.bubbleLevel > 0.3) {
            this.createBotAsset();
        }

        // Check for bubble pop
        if (this.internalMarket.bubbleLevel >= 1.0) {
            this.popInternalBubble();
        }

        // Update bot asset prices
        this.updateBotAssetPrices();
    }

    // Get overall trading activity level
    getTradingActivity() {
        const recentTrades = Array.from(this.activeBots.values()).reduce((count, bot) => {
            return count + (Date.now() - bot.lastTradeTime < 30000 ? 1 : 0);
        }, 0);

        return recentTrades / Math.max(1, this.activeBots.size);
    }

    // Create a new bot-generated asset
    createBotAsset() {
        const assetNames = [
            'EnlightenmentCoin', 'WisdomToken', 'PhilosophyBucks', 'ZenCoin',
            'DiamondCoin', 'HODLToken', 'PanicCoin', 'FOMOBucks', 'MoonShares'
        ];

        const creators = Array.from(this.activeBots.keys());
        if (creators.length === 0) return;

        const creator = creators[Math.floor(Math.random() * creators.length)];
        const assetName = assetNames[Math.floor(Math.random() * assetNames.length)];

        // Don't create duplicate assets
        if (this.internalMarket.assets.has(assetName)) return;

        const initialPrice = Math.random() * 10 + 0.1;

        this.internalMarket.assets.set(assetName, {
            name: assetName,
            price: initialPrice,
            creator: creator,
            volume: 0,
            createdAt: Date.now(),
            bubbleLevel: 0
        });

        // Add to game state
        this.gameState.addBotAsset(assetName, initialPrice);

        // Creator bot announces the new asset
        const creatorBot = this.activeBots.get(creator);
        if (creatorBot) {
            creatorBot.speak(`I have created ${assetName}! The future of finance!`);
        }

        this.emit('bot_asset_created', { assetName, creator, initialPrice });
    }

    // Update prices of bot-created assets
    updateBotAssetPrices() {
        this.internalMarket.assets.forEach((asset, name) => {
            // Bot assets are more volatile and trend-following
            const volatility = 0.1 + (this.internalMarket.bubbleLevel * 0.4);
            const bubbleTrend = this.internalMarket.bubbleLevel * 0.05;

            const priceChange = (Math.random() - 0.5 + bubbleTrend) * volatility;
            asset.price *= (1 + priceChange);
            asset.price = Math.max(0.001, asset.price);

            // Increase asset's individual bubble level
            if (priceChange > 0) {
                asset.bubbleLevel = Math.min(1, asset.bubbleLevel + 0.01);
            }
        });
    }

    // Pop the internal bubble
    popInternalBubble() {
        console.log('INTERNAL BUBBLE POPPED!');

        // Crash all bot assets
        this.internalMarket.assets.forEach(asset => {
            asset.price *= 0.1; // 90% crash
            asset.bubbleLevel = 0;
        });

        // Reset bubble level
        this.internalMarket.bubbleLevel = 0;

        // SAGE-BOT realizes the truth
        const sageBot = this.activeBots.get('sage-bot');
        if (sageBot) {
            sageBot.speak("I have achieved enlightenment: all these assets are illusions!");
        }

        this.emit('internal_bubble_popped');
    }

    // Check for game phase transitions
    checkPhaseTransitions() {
        const unlocks = this.gameState.getUnlocks();

        // Check if trading floor should be activated
        if (!this.internalMarket.active &&
            unlocks.features.trading_floor &&
            unlocks.features.trading_floor.unlocked) {
            this.activateInternalMarket();
        }
    }

    // Activate internal bot-to-bot trading
    activateInternalMarket() {
        this.internalMarket.active = true;
        this.gameState.state.tradingFloor.active = true;

        console.log('Internal trading market activated!');
        this.emit('internal_market_activated');
    }

    // Add a bot to active trading
    addBot(bot) {
        this.activeBots.set(bot.id, bot);
        this.emit('bot_added_to_trading', { botId: bot.id });
    }

    // Remove a bot from active trading
    removeBot(botId) {
        this.activeBots.delete(botId);
        this.emit('bot_removed_from_trading', { botId });
    }

    // Get market statistics
    getMarketStats() {
        const market = this.gameState.getMarket();

        return {
            cycle: this.cycleState,
            totalVolume: Object.values(market.assets).reduce((sum, asset) => sum + asset.volume, 0),
            marketCap: Object.values(market.assets).reduce((sum, asset) => sum + (asset.price * asset.volume), 0),
            activeBots: this.activeBots.size,
            internalAssets: this.internalMarket.assets.size,
            bubbleLevel: this.internalMarket.bubbleLevel
        };
    }

    // Get price history for an asset
    getPriceHistory(asset, length = 50) {
        const history = this.priceHistory.data[asset] || [];
        return history.slice(-length);
    }

    // Debug methods
    forceCrash() {
        if (this.gameState.state.debug.enabled) {
            this.cycleState.phase = 'crash';
            this.cycleState.duration = 0;
            this.cycleState.progress = 0;
            this.triggerMarketCrash();
        }
    }

    forcePhase(phase) {
        if (this.gameState.state.debug.enabled) {
            this.cycleState.phase = phase;
            this.cycleState.duration = 0;
            this.cycleState.progress = 0;
        }
    }

    // Cleanup
    destroy() {
        this.stop();
        this.activeBots.clear();
        this.internalMarket.assets.clear();
    }
}

// Export for use in other modules
window.TradingEngine = TradingEngine;
