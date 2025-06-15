/**
 * QOIN Bot Manager
 * Handles bot UI, interactions, and roster management
 */

class BotManager {
  constructor(gameState, chartManager, botPersonalities) {
    this.gameState = gameState;
    this.chartManager = chartManager;
    this.botPersonalities = botPersonalities;

    // UI elements
    this.botRoster = null;
    this.botGrid = null;
    this.activeBotCount = null;

    // Bot interaction cooldowns
    this.interactionCooldowns = new Map();
    this.cooldownDuration = 2000; // 2 seconds

    // Update intervals
    this.updateInterval = null;
    this.updateFrequency = 1000; // 1 second

    // Bot card template
    this.botCardTemplate = null;
    this.unlockableBotTemplate = null;

    // Event handlers
    this.boundHandlers = {
      botFeed: this.handleBotFeed.bind(this),
      botEncourage: this.handleBotEncourage.bind(this),
      botWisdom: this.handleBotWisdom.bind(this),
      unlockBot: this.handleUnlockBot.bind(this),
    };

    // Initialize
    this.initialize();
  }

  /**
   * Initialize the bot manager
   */
  initialize() {
    try {
      // Get UI elements
      this.botRoster = document.getElementById("botRoster");
      this.botGrid = document.getElementById("botGrid");
      this.activeBotCount = document.getElementById("activeBotCount");

      // Get templates
      this.botCardTemplate = document.getElementById("botCardTemplate");
      this.unlockableBotTemplate = document.getElementById(
        "unlockableBotTemplate",
      );

      if (!this.botRoster) {
        throw new Error("Bot roster element not found");
      }

      // Set up game state listeners
      this.setupGameStateListeners();

      // Initial UI update
      this.updateBotRoster();
      this.updateBotCollection();

      console.log("BotManager initialized successfully");
    } catch (error) {
      console.error("Failed to initialize BotManager:", error);
      throw error;
    }
  }

  /**
   * Set up game state event listeners
   */
  setupGameStateListeners() {
    this.gameState.addEventListener("bot_added", (event) => {
      this.handleBotAdded(event.detail.bot);
    });

    this.gameState.addEventListener("bot_stats_updated", (event) => {
      this.handleBotStatsUpdated(event.detail.botId, event.detail.stats);
    });

    this.gameState.addEventListener("bot_unlocked", (event) => {
      this.handleBotUnlocked(event.detail.botId);
    });

    this.gameState.addEventListener("phase_changed", (event) => {
      this.handlePhaseChanged(event.detail.newPhase);
    });
  }

  /**
   * Start the bot manager update loop
   */
  start() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.updateBotStates();
    }, this.updateFrequency);
  }

  /**
   * Stop the bot manager
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update bot roster display
   */
  updateBotRoster() {
    if (!this.botRoster) return;

    const bots = this.gameState.getBots();
    const activeBots = Object.values(bots).filter((bot) => bot.isActive);

    // Update active bot count
    if (this.activeBotCount) {
      this.activeBotCount.textContent = activeBots.length;
    }

    // Clear existing roster
    this.botRoster.innerHTML = "";

    // Add bot cards
    activeBots.forEach((botData) => {
      const botCard = this.createBotCard(botData);
      this.botRoster.appendChild(botCard);
    });
  }

  /**
   * Create a bot card element
   */
  createBotCard(botData) {
    if (!this.botCardTemplate) {
      return this.createFallbackBotCard(botData);
    }

    // Clone template
    const card = this.botCardTemplate.content.cloneNode(true);
    const cardElement = card.querySelector(".bot-card");

    // Set bot data
    cardElement.dataset.botId = botData.id;

    // Get personality info
    const personality =
      this.botPersonalities.getPersonality(botData.personality) ||
      this.botPersonalities.getPersonality("qoin");

    // Update card content
    this.updateBotCardContent(card, botData, personality);

    // Set up event listeners
    this.setupBotCardListeners(card, botData.id);

    return card;
  }

  /**
   * Update bot card content
   */
  updateBotCardContent(card, botData, personality) {
    // Bot avatar and info
    const botEmoji = card.querySelector(".bot-emoji");
    const botName = card.querySelector(".bot-name");
    const botPersonalityText = card.querySelector(".bot-personality");

    if (botEmoji) botEmoji.textContent = personality.emoji;
    if (botName) botName.textContent = botData.name;
    if (botPersonalityText)
      botPersonalityText.textContent = personality.personality;

    // Bot stats
    const botBalance = card.querySelector(".bot-balance");
    const botPnl = card.querySelector(".bot-pnl");
    const botTrades = card.querySelector(".bot-trades");
    const botWinrate = card.querySelector(".bot-winrate");

    if (botBalance)
      botBalance.textContent = `$${botData.stats.balance.toFixed(2)}`;
    if (botPnl) {
      const pnl = botData.stats.totalPnL;
      botPnl.textContent = `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`;
      botPnl.style.color = pnl >= 0 ? "#2ecc71" : "#e74c3c";
    }
    if (botTrades) botTrades.textContent = botData.stats.trades;
    if (botWinrate)
      botWinrate.textContent = `${botData.stats.winRate.toFixed(1)}%`;

    // Bot mood
    const moodEmoji = card.querySelector(".mood-emoji");
    const moodText = card.querySelector(".mood-text");

    if (moodEmoji && moodText) {
      const moodData = this.getMoodData(botData.mood);
      moodEmoji.textContent = moodData.emoji;
      moodText.textContent = botData.mood;
    }

    // Update mood indicator color
    const moodIndicator = card.querySelector(".bot-mood-indicator");
    if (moodIndicator) {
      const moodData = this.getMoodData(botData.mood);
      moodIndicator.style.backgroundColor = moodData.color;
    }
  }

  /**
   * Set up bot card event listeners
   */
  setupBotCardListeners(card, botId) {
    const feedBtn = card.querySelector(".feed-btn");
    const encourageBtn = card.querySelector(".encourage-btn");
    const wisdomBtn = card.querySelector(".wisdom-btn");

    if (feedBtn) {
      feedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleBotFeed(botId);
      });
    }

    if (encourageBtn) {
      encourageBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleBotEncourage(botId);
      });
    }

    if (wisdomBtn) {
      wisdomBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleBotWisdom(botId);
      });
    }

    // Card click handler
    const cardElement = card.querySelector(".bot-card");
    if (cardElement) {
      cardElement.addEventListener("click", () => {
        this.handleBotCardClick(botId);
      });
    }
  }

  /**
   * Create fallback bot card if template is not available
   */
  createFallbackBotCard(botData) {
    const card = document.createElement("div");
    card.className = "bot-card";
    card.dataset.botId = botData.id;

    const personality =
      this.botPersonalities.getPersonality(botData.personality) ||
      this.botPersonalities.getPersonality("qoin");

    card.innerHTML = `
            <div class="bot-header">
                <div class="bot-avatar">
                    <div class="bot-emoji">${personality.emoji}</div>
                    <div class="bot-mood-indicator"></div>
                </div>
                <div class="bot-info">
                    <h4 class="bot-name">${botData.name}</h4>
                    <p class="bot-personality">${personality.personality}</p>
                </div>
                <div class="bot-controls">
                    <button class="bot-control-btn feed-btn" title="Feed">🍕</button>
                    <button class="bot-control-btn encourage-btn" title="Encourage">💪</button>
                    <button class="bot-control-btn wisdom-btn" title="Ask Wisdom">🧠</button>
                </div>
            </div>
            <div class="bot-stats">
                <div class="stat-row">
                    <span class="stat-label">Balance:</span>
                    <span class="stat-value bot-balance">$${botData.stats.balance.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">P&L:</span>
                    <span class="stat-value bot-pnl">${botData.stats.totalPnL >= 0 ? "+" : ""}$${botData.stats.totalPnL.toFixed(2)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Trades:</span>
                    <span class="stat-value bot-trades">${botData.stats.trades}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Win Rate:</span>
                    <span class="stat-value bot-winrate">${botData.stats.winRate.toFixed(1)}%</span>
                </div>
            </div>
            <div class="bot-mood">
                <span class="mood-emoji">${this.getMoodData(botData.mood).emoji}</span>
                <span class="mood-text">${botData.mood}</span>
            </div>
        `;

    // Set up listeners for fallback card
    this.setupBotCardListeners(card, botData.id);

    return card;
  }

  /**
   * Update bot collection display
   */
  updateBotCollection() {
    if (!this.botGrid) return;

    // Clear existing grid
    this.botGrid.innerHTML = "";

    // Get all unlockable personalities
    const personalities = this.botPersonalities.getUnlockablePersonalities();

    personalities.forEach((personality) => {
      const unlockCard = this.createUnlockableCard(personality);
      this.botGrid.appendChild(unlockCard);
    });
  }

  /**
   * Create unlockable bot card
   */
  createUnlockableCard(personality) {
    if (!this.unlockableBotTemplate) {
      return this.createFallbackUnlockCard(personality);
    }

    // Clone template
    const card = this.unlockableBotTemplate.content.cloneNode(true);
    const cardElement = card.querySelector(".unlockable-bot");

    // Set personality data
    cardElement.dataset.personalityId = personality.id;

    // Check if unlocked
    const isUnlocked = this.botPersonalities.isPersonalityUnlocked(
      personality.id,
      this.gameState,
    );
    const progress = this.botPersonalities.getUnlockProgress(
      personality.id,
      this.gameState,
    );

    // Update card content
    this.updateUnlockCardContent(card, personality, isUnlocked, progress);

    return card;
  }

  /**
   * Update unlock card content
   */
  updateUnlockCardContent(card, personality, isUnlocked, progress) {
    // Bot preview
    const botEmoji = card.querySelector(".bot-emoji");
    const botName = card.querySelector(".bot-name");
    const botDescription = card.querySelector(".bot-description");

    if (botEmoji) botEmoji.textContent = personality.emoji;
    if (botName) botName.textContent = personality.name;
    if (botDescription) botDescription.textContent = personality.description;

    // Unlock status
    const unlockStatus = card.querySelector(".unlock-status");
    if (unlockStatus) {
      unlockStatus.className = `unlock-status ${isUnlocked ? "unlocked" : "locked"}`;
    }

    // Progress bar
    const progressFill = card.querySelector(".progress-fill");
    const unlockCondition = card.querySelector(".unlock-condition");

    if (progressFill) {
      progressFill.style.width = `${progress.progress * 100}%`;
    }

    if (unlockCondition) {
      if (isUnlocked) {
        unlockCondition.textContent = "Unlocked!";
      } else {
        unlockCondition.textContent = this.getUnlockConditionText(
          personality.unlockCondition,
          progress,
        );
      }
    }

    // Unlock button
    const unlockBtn = card.querySelector(".unlock-bot-btn");
    if (unlockBtn) {
      if (isUnlocked) {
        unlockBtn.classList.remove("hidden");
        unlockBtn.textContent = "Add Bot";
        unlockBtn.addEventListener("click", () => {
          this.handleUnlockBot(personality.id);
        });
      } else {
        unlockBtn.classList.add("hidden");
      }
    }
  }

  /**
   * Create fallback unlock card
   */
  createFallbackUnlockCard(personality) {
    const card = document.createElement("div");
    card.className = "unlockable-bot";
    card.dataset.personalityId = personality.id;

    const isUnlocked = this.botPersonalities.isPersonalityUnlocked(
      personality.id,
      this.gameState,
    );
    const progress = this.botPersonalities.getUnlockProgress(
      personality.id,
      this.gameState,
    );

    card.innerHTML = `
            <div class="unlock-status ${isUnlocked ? "unlocked" : "locked"}">
                <div class="bot-preview">
                    <span class="bot-emoji">${personality.emoji}</span>
                    <h4 class="bot-name">${personality.name}</h4>
                    <p class="bot-description">${personality.description}</p>
                </div>
                <div class="unlock-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.progress * 100}%"></div>
                    </div>
                    <p class="unlock-condition">${isUnlocked ? "Unlocked!" : this.getUnlockConditionText(personality.unlockCondition, progress)}</p>
                </div>
                <button class="unlock-bot-btn ${isUnlocked ? "" : "hidden"}">${isUnlocked ? "Add Bot" : "Locked"}</button>
            </div>
        `;

    // Set up unlock button
    const unlockBtn = card.querySelector(".unlock-bot-btn");
    if (unlockBtn && isUnlocked) {
      unlockBtn.addEventListener("click", () => {
        this.handleUnlockBot(personality.id);
      });
    }

    return card;
  }

  /**
   * Get unlock condition text
   */
  getUnlockConditionText(condition, progress) {
    if (!condition || condition === "default") return "Available";

    const conditionTexts = {
      total_losses: `Lose ${condition.value} trades (${progress.current}/${progress.target})`,
      total_trades: `Make ${condition.value} trades (${progress.current}/${progress.target})`,
      loss_streak: `${condition.value} loss streak (${progress.current}/${progress.target})`,
      profit_trade: `Make $${condition.value} profit (${progress.current.toFixed(2)}/${progress.target})`,
      balance_below: `Balance below $${condition.value} (${progress.current.toFixed(2)})`,
      balanced_trading: `${condition.value} balanced trades (${progress.current}/${progress.target})`,
      quick_trades: `${condition.value} quick trades (${progress.current}/${progress.target})`,
      cycles_survived: `Survive ${condition.value} cycles (${progress.current}/${progress.target})`,
    };

    return conditionTexts[condition.type] || "Unknown condition";
  }

  /**
   * Handle bot interactions
   */
  handleBotFeed(botId) {
    if (this.isOnCooldown(botId, "feed")) return;

    const botData = this.gameState.getBot(botId);
    if (!botData) return;

    // Get varied responses based on bot personality and mood
    const feedResponses = {
      qoin: [
        "Ah, sustenance! Now I can contemplate my losses with renewed vigor.",
        "Thank you, human. This energy will fuel my philosophical approach to financial ruin.",
        "Nourishment received. I shall lose money more thoughtfully now.",
        "Food for thought... and terrible trading decisions!"
      ],
      "hodl-droid": [
        "HODL FUEL ACQUIRED. DIAMOND HANDS CHARGING.",
        "Thank you. I will hold these calories forever too.",
        "Sustenance stored. Will never sell, even when hungry."
      ],
      "panic-pete": [
        "OH NO WHAT IF THIS FOOD IS A BUBBLE?!",
        "Thanks but SHOULD I BE EATING DURING A CRASH?!",
        "Food prices are going UP! SELL EVERYTHING!"
      ]
    };

    const responses = feedResponses[botData.personality] || feedResponses.qoin;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Show speech bubble with personality-based response
    if (this.chartManager) {
      this.chartManager.showSpeechBubble(botId, randomResponse, 4000);
    }

    // Add visual feedback to button
    const feedBtn = document.querySelector(`[data-bot-id="${botId}"] .feed-btn`);
    if (feedBtn) {
      feedBtn.style.transform = "scale(1.2)";
      feedBtn.style.backgroundColor = "#2ecc71";
      setTimeout(() => {
        feedBtn.style.transform = "scale(1)";
        feedBtn.style.backgroundColor = "";
      }, 200);
    }

    // Add mood boost effect
    this.addTemporaryMoodBoost(botId);

    // Set cooldown
    this.setCooldown(botId, "feed");

    console.log(`Fed bot ${botId}: "${randomResponse}"`);
  }

  handleBotEncourage(botId) {
    if (this.isOnCooldown(botId, "encourage")) return;

    const botData = this.gameState.getBot(botId);
    if (!botData) return;

    // Get mood-based encouragement responses
    const encourageResponses = {
      optimistic: [
        "Yes! Your faith in me is inspiring! Time to make some bold trades!",
        "Thank you! I feel like I can conquer the markets now!",
        "Your encouragement fills me with trading confidence!"
      ],
      depressed: [
        "Thanks... I guess... though we both know I'll mess this up.",
        "I appreciate the gesture, but my trading record speaks for itself.",
        "Your kindness cannot overcome my terrible decision-making."
      ],
      panicked: [
        "ENCOURAGEMENT?! BUT THE MARKETS ARE CRASHING!!!",
        "Thanks but SHOULD WE BE OPTIMISTIC RIGHT NOW?!",
        "I'M ENCOURAGED BUT ALSO TERRIFIED!"
      ],
      philosophical: [
        "Ah, encouragement - the currency of the soul. Thank you.",
        "Your words remind me that failure is just success deferred.",
        "True wisdom lies in being encouraged despite inevitable losses."
      ]
    };

    const moodResponses = encourageResponses[botData.mood] || encourageResponses.optimistic;
    const randomResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];

    // Show speech bubble
    if (this.chartManager) {
      this.chartManager.showSpeechBubble(botId, randomResponse, 4000);
    }

    // Add visual feedback with mood-based color
    const encourageBtn = document.querySelector(`[data-bot-id="${botId}"] .encourage-btn`);
    if (encourageBtn) {
      const moodColors = {
        optimistic: "#2ecc71",
        depressed: "#95a5a6",
        panicked: "#e74c3c",
        philosophical: "#9b59b6"
      };

      encourageBtn.style.transform = "scale(1.1)";
      encourageBtn.style.backgroundColor = moodColors[botData.mood] || "#3498db";
      setTimeout(() => {
        encourageBtn.style.transform = "scale(1)";
        encourageBtn.style.backgroundColor = "";
      }, 300);
    }

    // Add confidence boost
    this.addTemporaryConfidenceBoost(botId);

    // Set cooldown
    this.setCooldown(botId, "encourage");

    console.log(`Encouraged bot ${botId}: "${randomResponse}"`);
  }

  handleBotWisdom(botId) {
    if (this.isOnCooldown(botId, "wisdom")) return;

    this.requestWisdom(botId);

    // Set cooldown
    this.setCooldown(botId, "wisdom");
  }

  /**
   * Request wisdom from a bot
   */
  requestWisdom(botId) {
    const botData = this.gameState.getBot(botId);
    if (!botData) return;

    const personality =
      this.botPersonalities.getPersonality(botData.personality) ||
      this.botPersonalities.getPersonality("qoin");

    // Get wisdom based on current trading performance and mood
    let wisdomCategory = this.mapMoodToSpeechCategory(botData.mood);

    // Add context-aware wisdom based on bot's current state
    const contextualWisdom = {
      winning_streak: [
        "Success is temporary, but the lessons learned are eternal.",
        "In times of profit, remember that the market humbles all eventually.",
        "Winning trades are like compliments - enjoy them but don't let them go to your head."
      ],
      losing_streak: [
        "Every loss is a tuition payment to the University of Hard Knocks.",
        "I've discovered 1,000 ways not to trade. Progress!",
        "Failure is simply success taking the scenic route."
      ],
      low_balance: [
        "Money is just numbers, but wisdom is priceless. I'm rich in one of those.",
        "A light wallet makes for a heavy heart, but a enlightened mind.",
        "I may be broke, but my spirit soars with philosophical insights!"
      ]
    };

    let wisdom;

    // Choose wisdom based on bot's current situation
    if (botData.stats.balance < 2) {
      const lowBalanceWisdom = contextualWisdom.low_balance;
      wisdom = lowBalanceWisdom[Math.floor(Math.random() * lowBalanceWisdom.length)];
    } else if (botData.stats.winRate > 70) {
      const winningWisdom = contextualWisdom.winning_streak;
      wisdom = winningWisdom[Math.floor(Math.random() * winningWisdom.length)];
    } else if (botData.stats.winRate < 30) {
      const losingWisdom = contextualWisdom.losing_streak;
      wisdom = losingWisdom[Math.floor(Math.random() * losingWisdom.length)];
    } else {
      // Use personality-based wisdom
      const speeches = personality.speechPatterns[wisdomCategory] || personality.speechPatterns.trading;
      wisdom = speeches[Math.floor(Math.random() * speeches.length)];
    }

    // Show speech bubble with extended duration for wisdom
    if (this.chartManager) {
      this.chartManager.showSpeechBubble(botId, wisdom, 8000);
    }

    // Add sparkle effect to wisdom button
    const wisdomBtn = document.querySelector(`[data-bot-id="${botId}"] .wisdom-btn`);
    if (wisdomBtn) {
      wisdomBtn.style.boxShadow = "0 0 20px #f1c40f";
      wisdomBtn.innerHTML = "✨ Wise ✨";
      setTimeout(() => {
        wisdomBtn.style.boxShadow = "";
        wisdomBtn.innerHTML = "🧠 Wisdom";
      }, 1000);
    }

    // Update philosophy panel
    this.updatePhilosophyPanel(wisdom, botData.name);

    // Show floating wisdom indicator
    this.showWisdomFloater(botId);

    console.log(`${botData.name} shared contextual wisdom: ${wisdom}`);
  }

  /**
   * Handle bot card click
   */
  handleBotCardClick(botId) {
    console.log(`Bot card clicked: ${botId}`);

    // Could open detailed bot view or trigger default action
    this.handleBotWisdom(botId);
  }

  /**
   * Handle unlock bot
   */
  handleUnlockBot(personalityId) {
    try {
      const personality = this.botPersonalities.getPersonality(personalityId);
      if (!personality) {
        throw new Error(`Unknown personality: ${personalityId}`);
      }

      // Check if already unlocked
      const existingBots = Object.values(this.gameState.getBots());
      if (existingBots.some((bot) => bot.personality === personalityId)) {
        console.warn(`Bot with personality ${personalityId} already exists`);
        return;
      }

      // Create new bot
      const newBot = this.botPersonalities.createBot(personalityId);
      const success = this.gameState.addBot(newBot.toJSON());

      if (success) {
        // Add to chart
        if (this.chartManager) {
          this.chartManager.addBotToChart(newBot.toJSON());
        }

        // Update UI
        this.updateBotRoster();
        this.updateBotCollection();

        console.log(`Successfully unlocked bot: ${personality.name}`);
      } else {
        throw new Error("Failed to add bot to game state");
      }
    } catch (error) {
      console.error("Failed to unlock bot:", error);
    }
  }

  /**
   * Handle game state events
   */
  handleBotAdded(botData) {
    // Add to chart if chart manager exists
    if (this.chartManager) {
      this.chartManager.addBotToChart(botData);
    }

    // Update roster
    this.updateBotRoster();
  }

  handleBotStatsUpdated(botId, stats) {
    // Update the specific bot card
    this.updateBotCard(botId);
  }

  handleBotUnlocked(botId) {
    this.updateBotCollection();
  }

  handlePhaseChanged(newPhase) {
    // Show/hide appropriate panels based on phase
    const collectionPanel = document.getElementById("collectionPanel");
    const createPanel = document.getElementById("createPanel");

    if (collectionPanel) {
      if (
        newPhase === "bot_collection" ||
        newPhase === "create_a_bot" ||
        newPhase === "trading_floor"
      ) {
        collectionPanel.classList.remove("hidden");
      } else {
        collectionPanel.classList.add("hidden");
      }
    }

    if (createPanel) {
      if (newPhase === "create_a_bot" || newPhase === "trading_floor") {
        createPanel.classList.remove("hidden");
      } else {
        createPanel.classList.add("hidden");
      }
    }
  }

  /**
   * Update individual bot card
   */
  updateBotCard(botId) {
    const botCard = this.botRoster?.querySelector(`[data-bot-id="${botId}"]`);
    if (!botCard) return;

    const botData = this.gameState.getBot(botId);
    if (!botData) return;

    const personality =
      this.botPersonalities.getPersonality(botData.personality) ||
      this.botPersonalities.getPersonality("qoin");

    // Update the content using a temporary container
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(botCard.cloneNode(true));

    this.updateBotCardContent(tempDiv, botData, personality);

    // Replace the original card
    const updatedCard = tempDiv.querySelector(".bot-card");
    if (updatedCard) {
      botCard.replaceWith(updatedCard);
      this.setupBotCardListeners(updatedCard, botId);
    }
  }

  /**
   * Update all bot states
   */
  updateBotStates() {
    // Update bot cards with latest data
    Object.keys(this.gameState.getBots()).forEach((botId) => {
      this.updateBotCard(botId);
    });

    // Update unlock progress
    this.updateUnlockProgress();
  }

  /**
   * Update unlock progress for all personalities
   */
  updateUnlockProgress() {
    if (!this.botGrid) return;

    const personalities = this.botPersonalities.getUnlockablePersonalities();

    personalities.forEach((personality) => {
      const card = this.botGrid.querySelector(
        `[data-personality-id="${personality.id}"]`,
      );
      if (!card) return;

      const isUnlocked = this.botPersonalities.isPersonalityUnlocked(
        personality.id,
        this.gameState,
      );
      const progress = this.botPersonalities.getUnlockProgress(
        personality.id,
        this.gameState,
      );

      // Update progress bar
      const progressFill = card.querySelector(".progress-fill");
      if (progressFill) {
        progressFill.style.width = `${progress.progress * 100}%`;
      }

      // Update condition text
      const unlockCondition = card.querySelector(".unlock-condition");
      if (unlockCondition) {
        if (isUnlocked) {
          unlockCondition.textContent = "Unlocked!";
        } else {
          unlockCondition.textContent = this.getUnlockConditionText(
            personality.unlockCondition,
            progress,
          );
        }
      }

      // Update unlock button
      const unlockBtn = card.querySelector(".unlock-bot-btn");
      if (unlockBtn) {
        if (isUnlocked && unlockBtn.classList.contains("hidden")) {
          unlockBtn.classList.remove("hidden");
          unlockBtn.textContent = "Add Bot";
          unlockBtn.addEventListener("click", () => {
            this.handleUnlockBot(personality.id);
          });
        }
      }

      // Update unlock status
      const unlockStatus = card.querySelector(".unlock-status");
      if (unlockStatus) {
        unlockStatus.className = `unlock-status ${isUnlocked ? "unlocked" : "locked"}`;
      }
    });
  }

  /**
   * Cooldown management
   */
  isOnCooldown(botId, action) {
    const key = `${botId}_${action}`;
    const cooldownEnd = this.interactionCooldowns.get(key);
    return cooldownEnd && Date.now() < cooldownEnd;
  }

  setCooldown(botId, action) {
    const key = `${botId}_${action}`;
    this.interactionCooldowns.set(key, Date.now() + this.cooldownDuration);
  }

  /**
   * Temporary effects
   */
  addTemporaryMoodBoost(botId) {
    // Show visual mood boost effect
    const botCard = document.querySelector(`[data-bot-id="${botId}"]`);
    if (botCard) {
      botCard.classList.add('mood-boosted');
      setTimeout(() => {
        botCard.classList.remove('mood-boosted');
      }, 3000);
    }

    // Temporarily increase bot's trading frequency
    const botData = this.gameState.getBot(botId);
    if (botData) {
      // Store original frequency and boost it
      botData._originalFrequency = botData._originalFrequency || 1.0;
      botData.tradingFrequencyMultiplier = 1.5;

      setTimeout(() => {
        botData.tradingFrequencyMultiplier = botData._originalFrequency;
      }, 30000); // 30 second boost
    }

    console.log(`Mood boost applied to ${botId} - increased trading activity!`);
  }

  addTemporaryConfidenceBoost(botId) {
    // Show visual confidence effect
    const botCard = document.querySelector(`[data-bot-id="${botId}"]`);
    if (botCard) {
      botCard.classList.add('confidence-boosted');
      setTimeout(() => {
        botCard.classList.remove('confidence-boosted');
      }, 5000);
    }

    // Temporarily increase risk tolerance
    const botData = this.gameState.getBot(botId);
    if (botData) {
      botData._originalRisk = botData._originalRisk || 0.5;
      botData.riskMultiplier = 1.3;

      setTimeout(() => {
        botData.riskMultiplier = botData._originalRisk;
      }, 20000); // 20 second boost
    }

    console.log(`Confidence boost applied to ${botId} - increased risk taking!`);
  }

  /**
   * Show floating wisdom indicator
   */
  showWisdomFloater(botId) {
    const botCard = document.querySelector(`[data-bot-id="${botId}"]`);
    if (!botCard) return;

    const floater = document.createElement('div');
    floater.innerHTML = '💡';
    floater.style.cssText = `
      position: absolute;
      font-size: 24px;
      animation: float-up 2s ease-out forwards;
      pointer-events: none;
      z-index: 1000;
    `;

    botCard.style.position = 'relative';
    botCard.appendChild(floater);

    setTimeout(() => {
      if (floater.parentNode) {
        floater.parentNode.removeChild(floater);
      }
    }, 2000);
  }

  /**
   * Utility methods
   */
  getMoodData(mood) {
    const moodData = {
      optimistic: { emoji: "😊", color: "#2ecc71" },
      confident: { emoji: "😎", color: "#3498db" },
      cautious: { emoji: "🤔", color: "#f39c12" },
      panicked: { emoji: "😱", color: "#e74c3c" },
      philosophical: { emoji: "🧠", color: "#9b59b6" },
      greedy: { emoji: "🤑", color: "#f1c40f" },
      depressed: { emoji: "😢", color: "#7f8c8d" },
      enlightened: { emoji: "✨", color: "#e67e22" },
    };

    return moodData[mood] || moodData.optimistic;
  }

  mapMoodToSpeechCategory(mood) {
    const moodMap = {
      optimistic: "trading",
      confident: "winning",
      cautious: "trading",
      panicked: "losing",
      philosophical: "trading",
      greedy: "winning",
      depressed: "losing",
      enlightened: "trading",
    };

    return moodMap[mood] || "trading";
  }

  updatePhilosophyPanel(wisdom, authorName) {
    const philosophyText = document.getElementById("philosophyText");
    const philosophyAuthor = document.getElementById("philosophyAuthor");

    if (philosophyText) {
      philosophyText.textContent = `"${wisdom}"`;
    }

    if (philosophyAuthor) {
      philosophyAuthor.textContent = `- ${authorName}`;
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.stop();

    // Clear cooldowns
    this.interactionCooldowns.clear();

    // Remove references
    this.gameState = null;
    this.chartManager = null;

    console.log("BotManager destroyed");
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = BotManager;
} else if (typeof window !== "undefined") {
  window.BotManager = BotManager;
}
