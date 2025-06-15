/**
 * QOIN Main Game Controller
 * Initializes and coordinates all game systems
 */

class QoinGame {
  constructor() {
    this.initialized = false;
    this.gameState = null;
    this.tradingEngine = null;
    this.uiManager = null;
    this.chartManager = null;
    this.botManager = null;
    this.notificationManager = null;
    this.audioManager = null;

    // Debug utilities
    this.debug = {
      enabled: false,
      log: (...args) => {
        if (this.debug.enabled) {
          console.log("[QOIN Debug]", ...args);
        }
      },
    };

    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleError = this.handleError.bind(this);

    // Set up error handling
    window.addEventListener("error", this.handleError);
    window.addEventListener("unhandledrejection", this.handleError);
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.debug.log("Starting QOIN initialization...");

      // Show loading screen
      this.showLoadingScreen();

      // Initialize core systems in order
      await this.initializeGameState();
      await this.initializeManagers();
      await this.initializeTradingEngine();
      await this.setupEventListeners();
      await this.startGameSystems();

      // Hide loading screen and show game
      await this.completeInitialization();

      this.initialized = true;
      this.debug.log("QOIN initialization complete!");
    } catch (error) {
      console.error("Failed to initialize QOIN:", error);
      this.showErrorScreen(error);
    }
  }

  showLoadingScreen() {
    const loadingScreen = document.getElementById("loadingScreen");
    const progressBar = loadingScreen.querySelector(".loading-progress");

    // Animate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressBar.style.width = `${progress}%`;
    }, 200);

    // Store interval for cleanup
    this.loadingInterval = interval;
  }

  async initializeGameState() {
    this.debug.log("Initializing game state...");

    // Initialize Bot Personalities first since we need it to create the initial bot
    this.botPersonalities = new BotPersonalities();

    this.gameState = new GameState();

    // Listen for game state events
    this.gameState.addEventListener("bot_added", (event) => {
      this.debug.log("Bot added:", event.detail);
      if (this.notificationManager) {
        this.notificationManager.showBotUnlock(event.detail.bot);
      }
    });

    this.gameState.addEventListener("achievement_unlocked", (event) => {
      this.debug.log("Achievement unlocked:", event.detail);
      if (this.notificationManager) {
        this.notificationManager.showAchievement(event.detail.achievement);
      }
    });

    this.gameState.addEventListener("phase_changed", (event) => {
      this.debug.log("Phase changed:", event.detail);
      if (this.uiManager) {
        this.uiManager.updatePhase(event.detail.newPhase);
      }
    });

    // Initialize with QOIN bot
    const originalQoin = this.botPersonalities.createBot("qoin");
    this.gameState.addBot(originalQoin.toJSON());

    await this.delay(300); // Simulate loading time
  }

  async initializeManagers() {
    this.debug.log("Initializing managers...");

    // Initialize Audio Manager
    this.audioManager = new AudioManager();

    // Initialize Notification Manager
    this.notificationManager = new NotificationManager();

    // Initialize Chart Manager
    this.chartManager = new ChartManager(
      "mainChart",
      this.gameState,
      this.botPersonalities,
    );

    // Initialize Bot Manager
    this.botManager = new BotManager(
      this.gameState,
      this.chartManager,
      this.botPersonalities,
    );

    // Initialize UI Manager
    this.uiManager = new UIManager(this.gameState, {
      chartManager: this.chartManager,
      botManager: this.botManager,
      notificationManager: this.notificationManager,
      audioManager: this.audioManager,
    });

    await this.delay(300);
  }

  async initializeTradingEngine() {
    this.debug.log("Initializing trading engine...");

    // Check if TradingEngine class is loaded
    if (typeof TradingEngine === "undefined") {
      console.error(
        "❌ TradingEngine class is not defined! Check script loading order.",
      );
      console.log("Available classes:", {
        GameState: typeof GameState,
        Bot: typeof Bot,
        BotPersonalities: typeof BotPersonalities,
        ChartManager: typeof ChartManager,
        EventTarget: typeof EventTarget,
      });
      throw new Error("TradingEngine class not loaded");
    }

    try {
      console.log("✅ TradingEngine class found, creating instance...");
      this.tradingEngine = new TradingEngine(this.gameState);
      console.log("✅ TradingEngine created successfully");
    } catch (error) {
      console.error("❌ Failed to create TradingEngine:", error);
      throw error;
    }

    // Set up trading engine event listeners
    this.tradingEngine.addEventListener("bot_trade", (event) => {
      const { botId, trade } = event.detail;
      this.debug.log(`Bot ${botId} executed trade:`, trade);

      // Update UI immediately for real-time feel
      if (this.uiManager) {
        this.uiManager.handleBotTrade(botId, trade);
        // Force immediate critical UI updates
        this.uiManager.updateCriticalUI();
      }

      // Update chart immediately
      if (this.chartManager) {
        this.chartManager.addTradePoint(trade);
      }

      // Bot manager updates handled by UI refresh

      // Play sound
      if (this.audioManager) {
        this.audioManager.playTradeSound(trade.pnl > 0);
      }
    });

    this.tradingEngine.addEventListener("market_tick", (event) => {
      const { prices, cycle } = event.detail;

      // Update chart
      if (this.chartManager) {
        this.chartManager.updatePrices(prices);
        this.chartManager.updateCycle(cycle);
      }

      // Update UI
      if (this.uiManager) {
        this.uiManager.updateMarketData(prices, cycle);
      }
    });

    this.tradingEngine.addEventListener("market_crash", (event) => {
      this.debug.log("Market crash triggered!", event.detail);

      if (this.notificationManager) {
        this.notificationManager.showMarketCrash();
      }

      if (this.audioManager) {
        this.audioManager.playMarketCrash();
      }
    });

    this.tradingEngine.addEventListener("phase_changed", (event) => {
      this.debug.log("Market phase changed:", event.detail);

      if (this.uiManager) {
        this.uiManager.updatePhase(event.detail);
      }
    });

    this.tradingEngine.addEventListener("bot_speech", (event) => {
      const { bot, message, duration } = event.detail;

      if (this.chartManager) {
        this.chartManager.showSpeechBubble(bot.id, message, duration);
      }
    });

    await this.delay(300);
  }

  async setupEventListeners() {
    this.debug.log("Setting up event listeners...");

    // Page visibility change
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    // Before unload (save game)
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    // Keyboard shortcuts
    document.addEventListener("keydown", (event) => {
      this.handleKeyboardShortcut(event);
    });

    // Settings modal
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsModal = document.getElementById("settingsModal");
    const closeSettings = document.getElementById("closeSettings");

    settingsBtn?.addEventListener("click", () => {
      settingsModal?.classList.remove("hidden");
    });

    closeSettings?.addEventListener("click", () => {
      settingsModal?.classList.add("hidden");
    });

    // Help modal
    const helpBtn = document.getElementById("helpBtn");
    const helpModal = document.getElementById("helpModal");
    const closeHelp = document.getElementById("closeHelp");

    helpBtn?.addEventListener("click", () => {
      helpModal?.classList.remove("hidden");
    });

    closeHelp?.addEventListener("click", () => {
      helpModal?.classList.add("hidden");
    });

    // Debug mode toggle
    const debugModeBtn = document.getElementById("debugModeBtn");
    debugModeBtn?.addEventListener("click", () => {
      this.toggleDebugMode();
    });

    // Reset game
    const resetGameBtn = document.getElementById("resetGameBtn");
    resetGameBtn?.addEventListener("click", () => {
      this.resetGame();
    });

    // Unlock all bots (debug)
    const unlockAllBtn = document.getElementById("unlockAllBtn");
    unlockAllBtn?.addEventListener("click", () => {
      if (this.debug.enabled) {
        this.gameState.unlockAllBots();
        this.uiManager.updateBotCollection();
      }
    });

    // Settings controls
    this.setupSettingsControls();

    await this.delay(200);
  }

  setupSettingsControls() {
    // Auto-trade toggle
    const autoTradeToggle = document.getElementById("autoTradeToggle");
    autoTradeToggle?.addEventListener("change", (event) => {
      this.gameState.state.player.settings.autoTrade = event.target.checked;
      this.gameState.saveState();
    });

    // Sound toggle
    const soundToggle = document.getElementById("soundToggle");
    soundToggle?.addEventListener("change", (event) => {
      this.gameState.state.player.settings.soundEnabled = event.target.checked;
      if (this.audioManager) {
        this.audioManager.setEnabled(event.target.checked);
      }
      this.gameState.saveState();
    });

    // Notifications toggle
    const notificationsToggle = document.getElementById("notificationsToggle");
    notificationsToggle?.addEventListener("change", (event) => {
      this.gameState.state.player.settings.notifications = event.target.checked;
      this.gameState.saveState();
    });

    // Trading speed
    const speedSlider = document.getElementById("speedSlider");
    const speedValue = document.getElementById("speedValue");

    speedSlider?.addEventListener("input", (event) => {
      const speed = parseFloat(event.target.value);
      this.gameState.state.player.settings.tradingSpeed = speed;
      speedValue.textContent = `${speed.toFixed(1)}x`;

      // Update trading engine speed
      if (this.tradingEngine) {
        this.tradingEngine.tickRate = 1000 / speed;
      }

      this.gameState.saveState();
    });
  }

  async startGameSystems() {
    this.debug.log("Starting game systems...");

    // Start trading engine
    console.log("🚀 Starting trading engine...");
    try {
      this.tradingEngine.start();
      console.log(
        "✅ Trading engine started successfully, isRunning:",
        this.tradingEngine.isRunning,
      );
    } catch (error) {
      console.error("❌ Failed to start trading engine:", error);
    }

    // Start UI updates
    if (this.uiManager) {
      this.uiManager.start();
    }

    // Start bot manager
    if (this.botManager) {
      this.botManager.start();
    }

    // Initial UI update
    await this.updateUI();

    // Final system status check
    console.log("🎮 Game systems status:", {
      tradingEngineRunning: this.tradingEngine?.isRunning,
      activeBots: this.tradingEngine?.activeBots?.size || 0,
      gameStateReady: !!this.gameState,
      totalBots: Object.keys(this.gameState?.getBots() || {}).length,
    });

    await this.delay(300);
  }

  async completeInitialization() {
    this.debug.log("Completing initialization...");

    // Clear loading interval
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }

    // Complete loading bar
    const progressBar = document.querySelector(".loading-progress");
    if (progressBar) {
      progressBar.style.width = "100%";
    }

    await this.delay(500);

    // Hide loading screen
    const loadingScreen = document.getElementById("loadingScreen");
    loadingScreen?.classList.add("hidden");

    // Show game container
    const gameContainer = document.getElementById("gameContainer");
    gameContainer?.classList.remove("hidden");

    // Play welcome sound
    if (this.audioManager) {
      this.audioManager.playWelcome();
    }

    // Show welcome message
    if (this.notificationManager) {
      this.notificationManager.showWelcome();
    }

    // Initialize player hint system
    this.initializePlayerHints();

    // Set up offline progress listener
    this.setupOfflineProgressListener();

    await this.delay(200);
  }

  async updateUI() {
    if (!this.uiManager) return;

    // Update all UI components
    this.uiManager.updateStats();
    this.uiManager.updateBotRoster();
    this.uiManager.updateMarketStats();
    this.uiManager.updatePhase(this.gameState.getPhase());
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Page hidden - pause or slow down
      this.debug.log("Page hidden, pausing intensive operations");

      if (this.tradingEngine) {
        this.tradingEngine.tickRate = 5000; // Slow down to 5 seconds
      }
    } else {
      // Page visible - resume normal operation
      this.debug.log("Page visible, resuming normal operations");

      if (this.tradingEngine) {
        const speed = this.gameState.state.player.settings.tradingSpeed;
        this.tradingEngine.tickRate = 1000 / speed;
      }
    }
  }

  handleBeforeUnload(event) {
    // Save game state before leaving
    if (this.gameState) {
      this.gameState.saveState();
    }

    this.debug.log("Game saved before unload");
  }

  handleError(event) {
    console.error("QOIN Game Error:", event.error || event.reason);

    // Show error notification
    if (this.notificationManager) {
      this.notificationManager.showError("An unexpected error occurred");
    }
  }

  handleKeyboardShortcut(event) {
    // Only handle shortcuts if no input is focused
    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA"
    ) {
      return;
    }

    switch (event.code) {
      case "KeyD":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleDebugMode();
        }
        break;

      case "KeyS":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.gameState?.saveState();
          this.notificationManager?.showInfo("Game saved");
        }
        break;

      case "KeyH":
        if (!event.ctrlKey && !event.metaKey) {
          const helpModal = document.getElementById("helpModal");
          helpModal?.classList.toggle("hidden");
        }
        break;

      case "Space":
        event.preventDefault();
        // Request wisdom from random bot
        const bots = Object.values(this.gameState?.getBots() || {});
        if (bots.length > 0) {
          const randomBot = bots[Math.floor(Math.random() * bots.length)];
          this.botManager?.requestWisdom(randomBot.id);
        }
        break;
    }
  }

  toggleDebugMode() {
    this.debug.enabled = !this.debug.enabled;
    this.gameState.state.debug.enabled = this.debug.enabled;

    if (this.debug.enabled) {
      this.gameState.enableDebug();
      console.log("🐛 QOIN Debug Mode Enabled");
      console.log("Available debug commands:", {
        "game.unlockAllBots()": "Unlock all bot personalities",
        "game.gameState.state": "View full game state",
        "game.tradingEngine.forceCrash()": "Trigger market crash",
        'game.tradingEngine.forcePhase("bubble")': "Force market phase",
        "game.testOfflineProgress(30)": "Test offline progress (30 minutes)",
        "game.debugStatus()": "Check system status",
        "game.forceTrade('qoin')": "Force bot to trade now",
        "game.makeBotsChat()": "Make all bots speak wisdom",
        "game.speedUpTrading(10)": "Speed up trading 10x",
        "game.debug.enabled = false": "Disable debug mode",
      });

      // Make debug accessible globally
      window.game = this;

      // Add debug methods
      this.testOfflineProgress = (minutes = 30) => {
        console.log(`🧪 Testing offline progress for ${minutes} minutes...`);
        const fakeLastSaved = Date.now() - minutes * 60 * 1000;
        this.gameState.calculateOfflineProgress(fakeLastSaved);
      };

      this.debugStatus = () => {
        console.log(`🔍 QOIN Debug Status:`, {
          gameState: !!this.gameState,
          tradingEngine: !!this.tradingEngine,
          chartManager: !!this.chartManager,
          botManager: !!this.botManager,
          audioManager: !!this.audioManager,
          botPersonalities: !!this.botPersonalities,
          activeBots: this.tradingEngine
            ? this.tradingEngine.activeBots.size
            : 0,
          totalBots: this.gameState
            ? Object.keys(this.gameState.getBots()).length
            : 0,
          isRunning: this.tradingEngine ? this.tradingEngine.isRunning : false,
          tickRate: this.tradingEngine ? this.tradingEngine.tickRate : "N/A",
        });
      };

      this.forceTrade = (botId = "qoin") => {
        console.log(`🔨 Forcing trade for bot: ${botId}`);
        if (!this.tradingEngine) {
          console.log(`❌ Trading engine not initialized yet`);
          return;
        }
        if (!this.tradingEngine.activeBots) {
          console.log(`❌ Active bots not initialized`);
          return;
        }

        const bot = this.tradingEngine.activeBots.get(botId);
        if (bot) {
          // Reset trade cooldown to force immediate trade
          bot.lastTradeTime = 0;

          const market = this.gameState.getMarket();
          const trade = bot.executeTrade(market, this.gameState);
          if (trade) {
            this.gameState.updateBotStats(botId, bot.stats);
            console.log(`✅ Forced trade successful:`, trade);
            this.updateUI(); // Refresh UI to show changes
          } else {
            console.log(`❌ Forced trade failed - checking bot state...`);
            console.log(`Bot details:`, {
              name: bot.name,
              balance: bot.stats.balance,
              isActive: bot.isActive,
              lastTrade: new Date(bot.lastTradeTime).toLocaleTimeString(),
            });
          }
        } else {
          console.log(`❌ Bot ${botId} not found in active bots`);
          console.log(
            `Available bots:`,
            Array.from(this.tradingEngine.activeBots.keys()),
          );
        }
      };

      this.makeBotsChat = () => {
        console.log(`💬 Making all bots chat...`);
        Object.keys(this.gameState.getBots()).forEach((botId) => {
          if (this.botManager) {
            this.botManager.requestWisdom(botId);
          }
        });
      };

      this.restartTrading = () => {
        console.log(`🔄 Restarting trading for all bots...`);
        if (!this.tradingEngine) {
          console.log(`❌ Trading engine not initialized yet`);
          return;
        }

        // Reset lastTradeTime for all active bots
        this.tradingEngine.activeBots.forEach((bot, botId) => {
          const oldTime = bot.lastTradeTime;
          bot.lastTradeTime = Date.now() - bot.getTradeDelay() - 1000; // Allow immediate trading
          console.log(
            `🔄 Reset ${bot.name} trade timer: ${new Date(oldTime).toLocaleTimeString()} → ${new Date(bot.lastTradeTime).toLocaleTimeString()}`,
          );
        });

        // Force a trading engine tick
        if (this.tradingEngine.isRunning) {
          console.log(`⚡ Forcing immediate trading tick...`);
          this.tradingEngine.tick();
        } else {
          console.log(`⚠️ Trading engine is not running - starting it...`);
          this.tradingEngine.start();
        }

        console.log(
          `✅ Trading restart complete - ${this.tradingEngine.activeBots.size} bots ready to trade`,
        );
      };

      this.speedUpTrading = (multiplier = 5) => {
        console.log(`⚡ Speeding up trading by ${multiplier}x`);
        if (!this.tradingEngine) {
          console.log(`❌ Trading engine not initialized`);
          return;
        }
        this.tradingEngine.tickRate = Math.max(200, 1000 / multiplier);
      };

      this.notificationManager?.showInfo(
        "Debug mode enabled! Check console for commands.",
      );
    } else {
      console.log("🐛 QOIN Debug Mode Disabled");
      delete window.game;
      this.notificationManager?.showInfo("Debug mode disabled");
    }

    this.gameState.saveState();
  }

  async resetGame() {
    if (
      !confirm(
        "Are you sure you want to reset the game? This will delete all progress.",
      )
    ) {
      return;
    }

    this.debug.log("Resetting game...");

    try {
      // Stop all systems
      this.tradingEngine?.stop();
      this.uiManager?.stop();
      this.botManager?.stop();

      // Clear saved data
      localStorage.removeItem("qoin_game_state");

      // Show loading screen
      const gameContainer = document.getElementById("gameContainer");
      const loadingScreen = document.getElementById("loadingScreen");

      gameContainer?.classList.add("hidden");
      loadingScreen?.classList.remove("hidden");

      // Reinitialize after a delay
      await this.delay(1000);

      this.initialized = false;
      await this.initialize();
    } catch (error) {
      console.error("Failed to reset game:", error);
      this.showErrorScreen(error);
    }
  }

  showErrorScreen(error) {
    const loadingScreen = document.getElementById("loadingScreen");
    const loadingContent = loadingScreen?.querySelector(".loading-content");

    if (loadingContent) {
      loadingContent.innerHTML = `
                <div class="loading-logo">💥</div>
                <h2>Oops!</h2>
                <p>Something went wrong loading QOIN</p>
                <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 1rem;">
                    ${error.message || "Unknown error occurred"}
                </p>
                <button onclick="location.reload()" style="
                    margin-top: 2rem;
                    padding: 0.5rem 1rem;
                    background: #e74c3c;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                ">
                    Reload Game
                </button>
            `;
    }
  }

  // Utility method for delays
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set up offline progress listener
   */
  setupOfflineProgressListener() {
    this.gameState.addEventListener("offline_progress_calculated", (event) => {
      const { timeAway, tradesSimulated } = event.detail;
      this.showWelcomeBackScreen(timeAway, tradesSimulated);
    });
  }

  /**
   * Show welcome back screen with offline progress
   */
  showWelcomeBackScreen(minutesAway, tradesSimulated) {
    if (minutesAway < 1) return; // Don't show for very short absences

    // Create welcome back modal
    const modal = document.createElement("div");
    modal.className = "welcome-back-modal";
    modal.innerHTML = `
      <div class="welcome-back-content">
        <div class="welcome-back-header">
          <h2>🎉 Welcome Back!</h2>
          <p>Your trading bots have been busy while you were away</p>
        </div>

        <div class="offline-progress">
          <div class="progress-stat">
            <span class="stat-emoji">⏰</span>
            <div class="stat-info">
              <span class="stat-label">Time Away</span>
              <span class="stat-value">${this.formatTimeAway(minutesAway)}</span>
            </div>
          </div>

          <div class="progress-stat">
            <span class="stat-emoji">🤖</span>
            <div class="stat-info">
              <span class="stat-label">Trades Simulated</span>
              <span class="stat-value">${tradesSimulated}</span>
            </div>
          </div>

          <div class="progress-stat">
            <span class="stat-emoji">💰</span>
            <div class="stat-info">
              <span class="stat-label">Current Balance</span>
              <span class="stat-value">$${this.gameState.getTotalBalance().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="welcome-back-message">
          <p>Your bots continued their philosophical trading journey!</p>
          <p><em>"Time is an illusion, but compound losses are very real." - QOIN</em></p>
        </div>

        <button class="continue-btn" onclick="this.parentElement.parentElement.remove()">
          Continue Trading 🚀
        </button>
      </div>
    `;

    // Style the modal
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;

    // Add CSS for the modal content
    const style = document.createElement("style");
    style.textContent = `
      .welcome-back-content {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 20px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        text-align: center;
        border: 2px solid rgba(78, 205, 196, 0.3);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        animation: modalSlideIn 0.5s ease-out;
      }

      @keyframes modalSlideIn {
        0% { opacity: 0; transform: scale(0.8) translateY(-50px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }

      .welcome-back-header h2 {
        color: #4ecdc4;
        margin-bottom: 0.5rem;
        font-size: 1.8rem;
      }

      .welcome-back-header p {
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 1.5rem;
      }

      .offline-progress {
        display: grid;
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .progress-stat {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .stat-emoji {
        font-size: 2rem;
      }

      .stat-info {
        flex: 1;
        text-align: left;
      }

      .stat-label {
        display: block;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
      }

      .stat-value {
        display: block;
        color: #4ecdc4;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .welcome-back-message {
        background: rgba(78, 205, 196, 0.1);
        border-radius: 12px;
        padding: 1rem;
        margin: 1.5rem 0;
        border-left: 4px solid #4ecdc4;
      }

      .welcome-back-message p {
        color: rgba(255, 255, 255, 0.9);
        margin: 0.5rem 0;
      }

      .welcome-back-message em {
        color: #4ecdc4;
        font-style: italic;
      }

      .continue-btn {
        background: linear-gradient(135deg, #4ecdc4, #45b7d1);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
        margin-top: 1rem;
      }

      .continue-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(78, 205, 196, 0.3);
      }
    `;
    document.head.appendChild(style);

    // Add to document
    document.body.appendChild(modal);

    // Play welcome sound if audio is enabled
    if (this.audioManager) {
      setTimeout(() => {
        this.audioManager.playWelcome();
      }, 500);
    }
  }

  /**
   * Format time away into readable string
   */
  formatTimeAway(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours} hours`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0
        ? `${days}d ${remainingHours}h`
        : `${days} days`;
    }
  }

  /**
   * Initialize player hint system to show what they can do
   */
  initializePlayerHints() {
    // Show initial action hints after a short delay
    setTimeout(() => {
      this.showActionHint("Click on your QOIN bot to interact!", "🤖");
    }, 2000);

    setTimeout(() => {
      this.showActionHint(
        "Try feeding, encouraging, or asking for wisdom!",
        "💡",
      );
    }, 5000);

    setTimeout(() => {
      this.showActionHint("Watch the market and see how QOIN reacts!", "📈");
    }, 8000);

    // Set up achievement progress hints
    this.setupProgressHints();
  }

  /**
   * Show an action hint to the player
   */
  showActionHint(message, emoji = "💡") {
    // Create hint element
    const hint = document.createElement("div");
    hint.className = "action-hint";
    hint.innerHTML = `
      <span class="hint-emoji">${emoji}</span>
      <span class="hint-text">${message}</span>
      <button class="hint-close">×</button>
    `;

    // Style the hint
    hint.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(78, 205, 196, 0.9), rgba(52, 152, 219, 0.9));
      color: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: Inter, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideInFromRight 0.5s ease-out;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Add CSS animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideInFromRight {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
      .action-hint { display: flex; align-items: center; gap: 8px; }
      .hint-emoji { font-size: 18px; }
      .hint-text { flex: 1; }
      .hint-close {
        background: none; border: none; color: white;
        font-size: 18px; cursor: pointer; padding: 0;
        width: 20px; height: 20px; display: flex;
        align-items: center; justify-content: center;
        border-radius: 50%; transition: background 0.2s;
      }
      .hint-close:hover { background: rgba(255, 255, 255, 0.2); }
    `;
    document.head.appendChild(style);

    // Add to document
    document.body.appendChild(hint);

    // Set up close button
    const closeBtn = hint.querySelector(".hint-close");
    closeBtn.addEventListener("click", () => {
      hint.style.animation = "slideInFromRight 0.3s ease-out reverse";
      setTimeout(() => hint.remove(), 300);
    });

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (hint.parentNode) {
        hint.style.animation = "slideInFromRight 0.3s ease-out reverse";
        setTimeout(() => hint.remove(), 300);
      }
    }, 8000);
  }

  /**
   * Set up progress hints based on game state
   */
  setupProgressHints() {
    // Check for unlock progress every 30 seconds
    setInterval(() => {
      this.checkAndShowProgressHints();
    }, 30000);
  }

  /**
   * Check game progress and show helpful hints
   */
  checkAndShowProgressHints() {
    const totalTrades = this.gameState.getTotalTrades();
    const totalLosses = this.gameState.getTotalLosses();
    const unlockedBots = this.gameState.state.player.unlockedBots.length;

    // Show progress hints based on current state
    if (totalTrades >= 5 && totalTrades < 10 && unlockedBots === 1) {
      this.showActionHint(
        "You're getting close to unlocking your first new bot! Keep trading!",
        "🔓",
      );
    } else if (totalLosses >= 2 && unlockedBots === 1) {
      this.showActionHint(
        "HODL-DROID unlocks after 3 losses - diamond hands incoming! 💎",
        "🤖",
      );
    } else if (this.gameState.getLowestBalance() < 5 && unlockedBots === 1) {
      this.showActionHint(
        "Your balance is getting low - Panic Pete might unlock soon! 😱",
        "💸",
      );
    }
  }

  // Cleanup method
  destroy() {
    this.debug.log("Destroying QOIN game instance...");

    // Stop all systems
    this.tradingEngine?.destroy();
    this.uiManager?.destroy();
    this.botManager?.destroy();
    this.chartManager?.destroy();
    this.audioManager?.destroy();

    // Save final state
    this.gameState?.destroy();

    // Remove event listeners
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleError);

    // Clear intervals
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }

    // Remove debug global
    delete window.game;

    this.initialized = false;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("🤖 Starting QOIN - The Trading Bot Collective");

    const game = new QoinGame();
    await game.initialize();

    // Make available globally for debugging
    if (game.debug.enabled) {
      window.game = game;
    }

    console.log("🎮 QOIN is ready to trade!");
  } catch (error) {
    console.error("Failed to start QOIN:", error);
  }
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  // Final cleanup if needed
  if (window.game) {
    window.game.destroy();
  }
});

// Export for potential module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = QoinGame;
}
