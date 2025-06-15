<script>
    import { onMount } from "svelte";
    import {
        gameState,
        tradingEngine,
        audioManager,
        bots,
        totalBalance,
        gameStats,
        eventFeed,
        notifications,
        currentModal,
        isGameLoaded,
        gameActions,
        loadGame,
    } from "./lib/stores/gameStores.js";

    // Import TypeScript game engine classes
    import GameState from "./lib/game-engine/GameState.ts";
    import TradingEngine from "./lib/game-engine/TradingEngine.ts";
    import Bot from "./lib/game-engine/Bot.ts";
    import AudioManager from "./lib/game-engine/AudioManager.js";
    import { BOT_PERSONALITIES } from "./lib/game-engine/BotPersonalities.js";
    import { STARTING_BALANCE } from "$types/index.js";

    // Import components
    import Header from "./lib/components/Header.svelte";
    import Chart from "./lib/components/Chart.svelte";
    import BotRoster from "./lib/components/BotRoster.svelte";
    import EventFeed from "./lib/components/EventFeed.svelte";
    import TradeNotifications from "./lib/components/TradeNotifications.svelte";
    import Modal from "./lib/components/Modal.svelte";
    import LoadingScreen from "./lib/components/LoadingScreen.svelte";

    let gameInstance = null;
    let engineInstance = null;
    let audioInstance = null;

    async function initializeGame() {
        try {
            console.log("🎮 Initializing QOINbots with TypeScript engine...");

            // Initialize core game systems
            gameInstance = new GameState();
            engineInstance = new TradingEngine(gameInstance);
            audioInstance = new AudioManager();

            // Load saved game or create initial state
            const loadedGame = loadGame();

            if (!loadedGame) {
                // Create first bot if no save exists
                const firstBotConfig = {
                    id: "bot-1",
                    name: "Socratic Sam",
                    personality: "philosophical",
                    avatar: "🤔",
                    level: 1,
                    experience: 0,
                    mood: "optimistic",
                    isActive: false,
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
                };

                // Add bot to game state
                const success = gameInstance.addBot(firstBotConfig);
                if (success) {
                    // Create Bot instance for trading engine
                    const botInstance = new Bot(firstBotConfig);
                    engineInstance.addBot(botInstance);

                    // Update stores
                    gameActions.addBot({
                        id: firstBotConfig.id,
                        name: firstBotConfig.name,
                        personality: firstBotConfig.personality,
                        balance: STARTING_BALANCE,
                        active: true,
                        totalTrades: 0,
                        totalProfit: 0,
                        avatar: firstBotConfig.avatar,
                        level: 1,
                        experience: 0,
                    });

                    gameActions.addEvent({
                        type: "info",
                        text: "Welcome! Meet your first trading bot companion.",
                        botId: "bot-1",
                    });
                } else {
                    throw new Error("Failed to create initial bot");
                }
            } else {
                // Load existing bots into trading engine
                const gameBots = gameInstance.getBots();
                for (const [botId, botData] of Object.entries(gameBots)) {
                    try {
                        const botInstance = new Bot({
                            id: botData.id,
                            name: botData.name,
                            personality: botData.personality,
                            avatar: botData.avatar,
                            level: botData.level,
                            experience: botData.experience,
                            mood: botData.mood,
                            isActive: botData.isActive,
                            stats: botData.stats,
                            traits: botData.traits,
                            preferences: botData.preferences,
                        });
                        engineInstance.addBot(botInstance);
                        console.log(`✅ Loaded bot: ${botData.name}`);
                    } catch (error) {
                        console.error(
                            `❌ Failed to load bot ${botData.name}:`,
                            error,
                        );
                    }
                }
            }

            // Set up game engine event listeners
            engineInstance.addEventListener("bot_trade", (event) => {
                const { botId, trade } = event.detail;
                const bot = gameInstance.getBot(botId);

                if (bot && trade) {
                    gameActions.updateBot(botId, {
                        balance: bot.stats.balance,
                        totalTrades: bot.stats.trades,
                        totalProfit: bot.stats.totalPnL,
                    });

                    gameActions.addEvent({
                        type: trade.pnl > 0 ? "profit" : "loss",
                        text: `${bot.name} ${trade.action} ${trade.asset} for ${trade.pnl > 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`,
                        botId: botId,
                    });

                    gameActions.addNotification({
                        type: trade.pnl > 0 ? "profit" : "loss",
                        message: `${trade.pnl > 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`,
                        botName: bot.name,
                        duration: 2000,
                    });
                }
            });

            engineInstance.addEventListener("market_tick", (event) => {
                const { prices, cycle, timestamp } = event.detail;
                gameActions.updateMarket({
                    assets: prices,
                    cycle: cycle.phase,
                    timestamp: timestamp,
                });
            });

            engineInstance.addEventListener("market_phase_changed", (event) => {
                const { newPhase, cycle } = event.detail;
                gameActions.addEvent({
                    type: "info",
                    text: `📊 Market entered ${newPhase} phase (Cycle ${cycle})`,
                });
            });

            engineInstance.addEventListener("market_crash", (event) => {
                gameActions.addEvent({
                    type: "warning",
                    text: "💥 Market crash! Volatility spiking across all assets!",
                });
            });

            // Listen for bot level ups
            Array.from(engineInstance.activeBots.values()).forEach((bot) => {
                bot.addEventListener("level_up", (event) => {
                    const { botId, level } = event.detail;
                    const botData = gameInstance.getBot(botId);
                    if (botData) {
                        gameActions.updateBot(botId, {
                            level: level,
                            experience: botData.experience,
                        });

                        gameActions.addEvent({
                            type: "success",
                            text: `🎉 ${botData.name} reached level ${level}!`,
                            botId: botId,
                        });
                    }
                });

                bot.addEventListener("mood_changed", (event) => {
                    const { botId, newMood } = event.detail;
                    const botData = gameInstance.getBot(botId);
                    if (botData && Math.random() < 0.3) {
                        // Only show 30% of mood changes
                        gameActions.addEvent({
                            type: "info",
                            text: `😊 ${botData.name} is feeling ${newMood}`,
                            botId: botId,
                        });
                    }
                });

                bot.addEventListener("bot_speech", (event) => {
                    const { botId, name, message, mood, avatar } = event.detail;
                    gameActions.addEvent({
                        type: "info",
                        text: `${avatar} ${name}: "${message}"`,
                        botId: botId,
                    });
                });
            });

            // Initialize stores with game instances
            gameActions.initializeGame(
                gameInstance,
                engineInstance,
                audioInstance,
            );

            // Start the game loop
            engineInstance.start();

            // Enhanced debug functions
            window.qoinDebug = {
                getGameState: () => gameInstance,
                getTradingEngine: () => engineInstance,
                getBots: () => gameInstance.getBots(),
                getActiveBots: () =>
                    Array.from(engineInstance.activeBots.values()),
                forceTrade: (botId) => {
                    const bot = engineInstance.activeBots.get(botId);
                    if (bot) {
                        const market = gameInstance.getMarket();
                        const trade = bot.executeTrade(market, gameInstance);
                        console.log("Forced trade result:", trade);
                        return trade;
                    }
                    console.log("Bot not found or not active:", botId);
                    return null;
                },
                checkTradingConditions: (botId) => {
                    const bot = engineInstance.activeBots.get(botId);
                    if (bot) {
                        const market = gameInstance.getMarket();
                        console.log("=== TRADING CONDITIONS CHECK ===");
                        console.log("Bot:", bot.name);
                        console.log("Balance:", bot.stats.balance);
                        console.log(
                            "Min Trade Size:",
                            bot.preferences.minTradeSize,
                        );
                        console.log(
                            "Time since last trade:",
                            Date.now() - bot.lastTradeTime,
                        );
                        console.log("Required delay:", bot.getTradeDelay());
                        console.log("Should trade:", bot.shouldTrade(market));
                        return bot.shouldTrade(market);
                    }
                    console.log("Bot not found:", botId);
                    return false;
                },
                listBots: () => {
                    const bots = Object.values(gameInstance.getBots());
                    console.log("=== ALL BOTS ===");
                    bots.forEach((bot) => {
                        const engineBot = engineInstance.activeBots.get(bot.id);
                        console.log(
                            `${bot.id}: ${bot.name} - Active: ${bot.isActive}, Balance: $${bot.stats?.balance?.toFixed(2) || "N/A"}, Engine: ${engineBot ? "✅" : "❌"}`,
                        );
                    });
                    return bots;
                },
                addTestBot: (personality = "balanced") => {
                    const testBotId = `test-bot-${Date.now()}`;
                    const testBotConfig = {
                        id: testBotId,
                        name: `Test ${personality}`,
                        personality: personality,
                        avatar: "🧪",
                        level: 1,
                        experience: 0,
                        mood: "neutral",
                        isActive: true,
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
                    };

                    const success = gameInstance.addBot(testBotConfig);
                    if (success) {
                        const botInstance = new Bot(testBotConfig);
                        engineInstance.addBot(botInstance);
                        console.log(`🧪 Added test bot: ${testBotConfig.name}`);
                        return testBotConfig;
                    }
                    return null;
                },
                forceCrash: () => {
                    engineInstance.forceCrash();
                },
                setPhase: (phase) => {
                    engineInstance.forcePhase(phase);
                },
                getMarketStats: () => {
                    return engineInstance.getMarketStats();
                },
                resetGame: () => {
                    console.log("🔄 Resetting QOINbots game...");

                    // Stop current game
                    if (engineInstance) {
                        engineInstance.stop();
                    }

                    // Clear localStorage
                    localStorage.removeItem("qoinbots-save");
                    localStorage.removeItem("qoinbots-market-state");

                    // Reload the page to start fresh
                    window.location.reload();
                },
                clearStorage: () => {
                    localStorage.removeItem("qoinbots-save");
                    localStorage.removeItem("qoinbots-market-state");
                    console.log(
                        "🗑️ Cleared localStorage. Reload page to start fresh.",
                    );
                },
            };

            console.log(
                "🤖 QOINbots TypeScript game initialized successfully!",
            );
            console.log(
                "🔧 Enhanced debug functions available at window.qoinDebug",
            );
            console.log("🎯 Try: window.qoinDebug.addTestBot('momentum')");
            console.log(
                "🔄 Use window.qoinDebug.resetGame() to clear save and restart",
            );
        } catch (error) {
            console.error("❌ Failed to initialize game:", error);
            gameActions.addEvent({
                type: "error",
                text: "Failed to initialize game. Please refresh the page.",
            });

            // Show error details in development
            if (import.meta.env.DEV) {
                console.error("Full error details:", error);
                console.trace();
            }
        }
    }

    onMount(() => {
        // Initialize game on component mount
        initializeGame();

        // Cleanup on component destroy
        return () => {
            if (engineInstance) {
                engineInstance.destroy();
            }
            if (gameInstance) {
                gameInstance.destroy();
            }
        };
    });
</script>

<main class="app">
    {#if !$isGameLoaded}
        <LoadingScreen />
    {:else}
        <div class="game-container">
            <!-- Header with stats -->
            <Header />

            <!-- Main game area -->
            <div class="game-main">
                <!-- Left panel -->
                <div class="left-panel">
                    <Chart />
                    <BotRoster />
                </div>

                <!-- Right panel -->
                <div class="right-panel">
                    <EventFeed />
                </div>
            </div>
        </div>

        <!-- Floating notifications -->
        <TradeNotifications />

        <!-- Modal system -->
        {#if $currentModal}
            <Modal />
        {/if}
    {/if}
</main>

<style>
    .app {
        width: 100%;
        height: 100vh;
        background: var(--bg-primary, #0a0a0a);
        color: var(--text-primary, #ffffff);
        font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        overflow: hidden;
    }

    .game-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    .game-main {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .left-panel {
        flex: 2;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 1px solid var(--border-color, #333);
        gap: 1rem;
    }

    .left-panel :global(.chart-section) {
        flex: 2;
        min-height: 0;
    }

    .left-panel :global(.bot-roster) {
        flex: 1;
        min-height: 200px;
        max-height: 300px;
    }

    .right-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 300px;
        max-width: 400px;
    }

    @media (max-width: 1024px) {
        .game-main {
            flex-direction: column;
        }

        .left-panel {
            border-right: none;
            border-bottom: 1px solid var(--border-color, #333);
        }

        .right-panel {
            min-width: unset;
            max-width: unset;
        }
    }

    @media (max-width: 768px) {
        .left-panel,
        .right-panel {
            flex: 1;
        }
    }
</style>
