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

    // Import game engine classes
    import GameState from "./lib/game-engine/GameState.js";
    import TradingEngine from "./lib/game-engine/TradingEngine.js";
    import AudioManager from "./lib/game-engine/AudioManager.js";
    import { BOT_PERSONALITIES } from "./lib/game-engine/BotPersonalities.js";

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
            // Initialize core game systems
            gameInstance = new GameState();
            engineInstance = new TradingEngine(gameInstance);
            audioInstance = new AudioManager();

            // Load saved game or create initial state
            const loadedGame = loadGame();

            if (!loadedGame) {
                // Create first bot if no save exists
                const firstBot = {
                    id: "bot-1",
                    name: "Socratic Sam",
                    personality: BOT_PERSONALITIES.qoin,
                    balance: 10.0,
                    active: true,
                    totalTrades: 0,
                    totalProfit: 0,
                    avatar: "🤔",
                    level: 1,
                    experience: 0,
                };

                gameActions.addBot(firstBot);
                gameActions.addEvent({
                    type: "info",
                    text: "Welcome! Meet your first trading bot companion.",
                    botId: "bot-1",
                });
            }

            // Set up game engine event listeners
            engineInstance.on("trade", (tradeData) => {
                gameActions.updateBot(tradeData.botId, {
                    balance: tradeData.newBalance,
                    totalTrades: tradeData.totalTrades,
                    totalProfit: tradeData.totalProfit,
                });

                gameActions.addEvent({
                    type: tradeData.profit > 0 ? "profit" : "loss",
                    text: `${tradeData.botName} ${tradeData.action} ${tradeData.asset} for ${tradeData.profit > 0 ? "+" : ""}$${tradeData.profit.toFixed(2)}`,
                    botId: tradeData.botId,
                });

                gameActions.addNotification({
                    type: tradeData.profit > 0 ? "profit" : "loss",
                    message: `${tradeData.profit > 0 ? "+" : ""}$${tradeData.profit.toFixed(2)}`,
                    botName: tradeData.botName,
                    duration: 2000,
                });
            });

            engineInstance.on("marketUpdate", (marketData) => {
                gameActions.updateMarket(marketData);
            });

            engineInstance.on("botLevelUp", (botData) => {
                gameActions.updateBot(botData.id, {
                    level: botData.level,
                    experience: botData.experience,
                });

                gameActions.addEvent({
                    type: "success",
                    text: `🎉 ${botData.name} reached level ${botData.level}!`,
                    botId: botData.id,
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

            console.log("🤖 QOINbots game initialized successfully!");
        } catch (error) {
            console.error("Failed to initialize game:", error);
            gameActions.addEvent({
                type: "error",
                text: "Failed to initialize game. Please refresh the page.",
            });
        }
    }

    onMount(() => {
        // Initialize game on component mount
        initializeGame();

        // Cleanup on component destroy
        return () => {
            if (engineInstance) {
                engineInstance.stop();
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
