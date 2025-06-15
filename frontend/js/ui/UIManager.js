/**
 * QOIN UI Manager
 * Coordinates all UI components and handles global UI state management
 */

class UIManager {
    constructor(gameState, managers) {
        this.gameState = gameState;
        this.chartManager = managers.chartManager;
        this.botManager = managers.botManager;
        this.notificationManager = managers.notificationManager;
        this.audioManager = managers.audioManager;

        // UI state
        this.currentPhase = this.gameState.getPhase();
        this.isInitialized = false;
        this.updateInterval = null;

        // UI elements
        this.elements = {
            // Header elements
            totalBalance: document.getElementById('totalBalance'),
            activeBots: document.getElementById('activeBots'),
            marketCycle: document.getElementById('marketCycle'),
            phaseIndicator: document.getElementById('phaseIndicator'),

            // Market stats
            totalTrades: document.getElementById('totalTrades'),
            overallWinRate: document.getElementById('overallWinRate'),
            marketCap: document.getElementById('marketCap'),
            bubbleLevel: document.getElementById('bubbleLevel'),

            // Philosophy panel
            philosophyText: document.getElementById('philosophyText'),
            philosophyAuthor: document.getElementById('philosophyAuthor'),
            requestWisdom: document.getElementById('requestWisdom'),

            // Event feed
            eventFeed: document.getElementById('eventFeed'),
            clearEvents: document.getElementById('clearEvents'),

            // Modals
            settingsModal: document.getElementById('settingsModal'),
            helpModal: document.getElementById('helpModal'),

            // Controls
            settingsBtn: document.getElementById('settingsBtn'),
            achievementsBtn: document.getElementById('achievementsBtn'),
            helpBtn: document.getElementById('helpBtn')
        };

        // Event feed management
        this.eventFeed = [];
        this.maxEventFeedItems = 100;

        // Update frequencies
        this.fastUpdateInterval = 1000; // 1 second for critical updates
        this.slowUpdateInterval = 5000; // 5 seconds for less critical updates

        // Bind methods
        this.boundHandlers = {
            gameStateChange: this.handleGameStateChange.bind(this),
            marketUpdate: this.handleMarketUpdate.bind(this),
            botTrade: this.handleBotTrade.bind(this),
            phaseChange: this.handlePhaseChange.bind(this)
        };

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the UI Manager
     */
    initialize() {
        try {
            this.setupEventListeners();
            this.setupModalHandlers();
            this.setupControlHandlers();
            this.loadSettings();
            this.updateAllUI();

            this.isInitialized = true;
            console.log('UIManager initialized successfully');

        } catch (error) {
            console.error('Failed to initialize UIManager:', error);
            throw error;
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Game state events
        this.gameState.addEventListener('bot_added', this.boundHandlers.gameStateChange);
        this.gameState.addEventListener('bot_stats_updated', this.boundHandlers.gameStateChange);
        this.gameState.addEventListener('achievement_unlocked', this.boundHandlers.gameStateChange);
        this.gameState.addEventListener('phase_changed', this.boundHandlers.phaseChange);

        // Trading engine events (these come through the main game controller)
        document.addEventListener('market_tick', this.boundHandlers.marketUpdate);
        document.addEventListener('bot_trade', this.boundHandlers.botTrade);

        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    /**
     * Set up modal handlers
     */
    setupModalHandlers() {
        // Settings modal
        if (this.elements.settingsBtn && this.elements.settingsModal) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.openModal('settings');
                this.audioManager?.playModalOpen();
            });
        }

        // Help modal
        if (this.elements.helpBtn && this.elements.helpModal) {
            this.elements.helpBtn.addEventListener('click', () => {
                this.openModal('help');
                this.audioManager?.playModalOpen();
            });
        }

        // Close modal handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
                this.audioManager?.playModalClose();
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                    this.audioManager?.playModalClose();
                }
            });
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Set up control handlers
     */
    setupControlHandlers() {
        // Request wisdom button
        if (this.elements.requestWisdom) {
            this.elements.requestWisdom.addEventListener('click', () => {
                this.requestRandomWisdom();
                this.audioManager?.playButtonClick();
            });
        }

        // Clear events button
        if (this.elements.clearEvents) {
            this.elements.clearEvents.addEventListener('click', () => {
                this.clearEventFeed();
                this.audioManager?.playButtonClick();
            });
        }

        // Add hover effects for buttons
        document.querySelectorAll('button, .control-btn, .bot-control-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                this.audioManager?.playButtonHover();
            });

            btn.addEventListener('click', () => {
                this.audioManager?.playButtonClick();
            });
        });
    }

    /**
     * Load settings from game state
     */
    loadSettings() {
        const settings = this.gameState.state.player.settings;

        // Update settings UI
        const autoTradeToggle = document.getElementById('autoTradeToggle');
        const soundToggle = document.getElementById('soundToggle');
        const notificationsToggle = document.getElementById('notificationsToggle');
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');

        if (autoTradeToggle) autoTradeToggle.checked = settings.autoTrade;
        if (soundToggle) soundToggle.checked = settings.soundEnabled;
        if (notificationsToggle) notificationsToggle.checked = settings.notifications;
        if (speedSlider) speedSlider.value = settings.tradingSpeed;
        if (speedValue) speedValue.textContent = `${settings.tradingSpeed.toFixed(1)}x`;

        // Apply settings
        if (this.audioManager) {
            this.audioManager.setEnabled(settings.soundEnabled);
        }
    }

    /**
     * Start UI update loops
     */
    start() {
        if (this.updateInterval) return;

        // Fast update loop for critical UI elements
        this.updateInterval = setInterval(() => {
            this.updateCriticalUI();
        }, this.fastUpdateInterval);

        // Slower update loop for less critical elements
        this.slowUpdateInterval = setInterval(() => {
            this.updateSlowUI();
        }, this.slowUpdateInterval);
    }

    /**
     * Stop UI updates
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.slowUpdateInterval) {
            clearInterval(this.slowUpdateInterval);
            this.slowUpdateInterval = null;
        }
    }

    /**
     * Update all UI components
     */
    updateAllUI() {
        this.updateStats();
        this.updatePhase(this.currentPhase);
        this.updateMarketStats();
        this.updateEventFeed();
    }

    /**
     * Update critical UI elements (called frequently)
     */
    updateCriticalUI() {
        this.updateStats();
        this.updateMarketStats();
    }

    /**
     * Update less critical UI elements (called less frequently)
     */
    updateSlowUI() {
        this.updatePhase(this.currentPhase);
        this.cleanupOldEvents();
    }

    /**
     * Update header statistics
     */
    updateStats() {
        const bots = this.gameState.getBots();
        const activeBots = Object.values(bots).filter(bot => bot.isActive);

        // Total balance
        const totalBalance = activeBots.reduce((sum, bot) => sum + bot.stats.balance, 0);
        if (this.elements.totalBalance) {
            this.elements.totalBalance.textContent = `$${totalBalance.toFixed(2)}`;
        }

        // Active bots count
        if (this.elements.activeBots) {
            this.elements.activeBots.textContent = activeBots.length;
        }

        // Market cycle (this gets updated by market events)
        // Already handled in updateMarketData method
    }

    /**
     * Update market statistics panel
     */
    updateMarketStats() {
        const bots = this.gameState.getBots();
        const allBots = Object.values(bots);

        // Total trades
        const totalTrades = allBots.reduce((sum, bot) => sum + bot.stats.trades, 0);
        if (this.elements.totalTrades) {
            this.elements.totalTrades.textContent = totalTrades;
        }

        // Overall win rate
        const totalWins = allBots.reduce((sum, bot) => sum + bot.stats.wins, 0);
        const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
        if (this.elements.overallWinRate) {
            this.elements.overallWinRate.textContent = `${overallWinRate.toFixed(1)}%`;
        }

        // Market cap (simplified calculation)
        const market = this.gameState.getMarket();
        const marketCap = Object.values(market.assets).reduce((sum, asset) => {
            return sum + (asset.price * asset.volume);
        }, 0);
        if (this.elements.marketCap) {
            this.elements.marketCap.textContent = `$${this.formatLargeNumber(marketCap)}`;
        }

        // Bubble level
        const tradingFloor = this.gameState.getTradingFloor();
        const bubbleLevel = (tradingFloor.bubbleLevel * 100).toFixed(1);
        if (this.elements.bubbleLevel) {
            this.elements.bubbleLevel.textContent = `${bubbleLevel}%`;
        }
    }

    /**
     * Update phase indicator
     */
    updatePhase(newPhase) {
        this.currentPhase = newPhase;

        if (!this.elements.phaseIndicator) return;

        const phaseInfo = this.getPhaseInfo(newPhase);

        const phaseName = this.elements.phaseIndicator.querySelector('.phase-name');
        const phaseDescription = this.elements.phaseIndicator.querySelector('.phase-description');

        if (phaseName) phaseName.textContent = phaseInfo.name;
        if (phaseDescription) phaseDescription.textContent = phaseInfo.description;

        // Update phase-specific UI visibility
        this.updatePhaseVisibility(newPhase);
    }

    /**
     * Update market data from trading engine
     */
    updateMarketData(prices, cycle) {
        // Update market cycle indicator
        if (this.elements.marketCycle) {
            this.elements.marketCycle.textContent = this.capitalizeFirst(cycle.phase);
        }

        // The cycle indicator is handled by ChartManager
        // We just need to update any global cycle-related UI here
    }

    /**
     * Handle bot trade events
     */
    handleBotTrade(botId, trade) {
        // Add event to feed
        const botData = this.gameState.getBot(botId);
        const botName = botData ? botData.name : botId;

        const eventText = `${botName} ${trade.action} ${trade.asset} for $${trade.price.toFixed(4)} (${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)})`;

        this.addEvent(eventText, trade.pnl >= 0 ? 'trade' : 'loss');

        // Update stats immediately
        this.updateStats();
        this.updateMarketStats();
    }

    /**
     * Request wisdom from a random bot
     */
    requestRandomWisdom() {
        const bots = Object.values(this.gameState.getBots()).filter(bot => bot.isActive);
        if (bots.length === 0) return;

        const randomBot = bots[Math.floor(Math.random() * bots.length)];

        if (this.botManager) {
            this.botManager.requestWisdom(randomBot.id);
        }
    }

    /**
     * Event feed management
     */
    addEvent(text, type = 'system') {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        const event = {
            timestamp,
            text,
            type,
            id: Date.now() + Math.random()
        };

        this.eventFeed.unshift(event);

        // Limit feed size
        if (this.eventFeed.length > this.maxEventFeedItems) {
            this.eventFeed = this.eventFeed.slice(0, this.maxEventFeedItems);
        }

        this.updateEventFeedDisplay();
    }

    updateEventFeed() {
        this.updateEventFeedDisplay();
    }

    updateEventFeedDisplay() {
        if (!this.elements.eventFeed) return;

        // Clear current feed
        this.elements.eventFeed.innerHTML = '';

        // Add events (show last 10)
        const recentEvents = this.eventFeed.slice(0, 10);

        recentEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-item ${event.type}`;

            eventElement.innerHTML = `
                <span class="event-time">${event.timestamp}</span>
                <span class="event-text">${event.text}</span>
            `;

            this.elements.eventFeed.appendChild(eventElement);
        });

        // If no events, show placeholder
        if (recentEvents.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'event-item system';
            placeholder.innerHTML = `
                <span class="event-time">--:--</span>
                <span class="event-text">No recent events</span>
            `;
            this.elements.eventFeed.appendChild(placeholder);
        }
    }

    clearEventFeed() {
        this.eventFeed = [];
        this.updateEventFeedDisplay();
        this.addEvent('Event feed cleared', 'system');
    }

    cleanupOldEvents() {
        // Remove events older than 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.eventFeed = this.eventFeed.filter(event => event.id > oneHourAgo);
    }

    /**
     * Modal management
     */
    openModal(modalType) {
        const modal = document.getElementById(`${modalType}Modal`);
        if (modal) {
            modal.classList.remove('hidden');

            // Focus management
            const firstFocusable = modal.querySelector('button, input, select, textarea');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    /**
     * Event handlers
     */
    handleGameStateChange(event) {
        // Respond to game state changes
        this.updateStats();
        this.updateMarketStats();
    }

    handleMarketUpdate(event) {
        const { prices, cycle } = event.detail;
        this.updateMarketData(prices, cycle);
    }

    handlePhaseChange(event) {
        const { newPhase } = event.detail;
        this.updatePhase(newPhase);

        // Add phase change to event feed
        const phaseInfo = this.getPhaseInfo(newPhase);
        this.addEvent(`Advanced to ${phaseInfo.name}`, 'system');
    }

    handleResize() {
        // Handle responsive layout changes
        // Could trigger chart resizes or layout adjustments
    }

    handleBeforeUnload() {
        // Save any pending UI state
        this.gameState.saveState();
    }

    /**
     * Phase management
     */
    getPhaseInfo(phase) {
        const phaseData = {
            single_qoin: {
                name: 'Single Bot',
                description: 'Your philosophical trading companion'
            },
            bot_collection: {
                name: 'Bot Collection',
                description: 'Unlock diverse trading personalities'
            },
            create_a_bot: {
                name: 'Create-A-Bot',
                description: 'Design custom trading psychology'
            },
            trading_floor: {
                name: 'Trading Floor',
                description: 'Bots trade with each other'
            },
            bubble_cycle: {
                name: 'Bubble Cycle',
                description: 'Market mania and inevitable crashes'
            }
        };

        return phaseData[phase] || { name: 'Unknown', description: 'Unknown phase' };
    }

    updatePhaseVisibility(phase) {
        // Show/hide UI elements based on current phase
        const collectionPanel = document.getElementById('collectionPanel');
        const createPanel = document.getElementById('createPanel');

        if (collectionPanel) {
            if (phase === 'bot_collection' || phase === 'create_a_bot' || phase === 'trading_floor' || phase === 'bubble_cycle') {
                collectionPanel.classList.remove('hidden');
            } else {
                collectionPanel.classList.add('hidden');
            }
        }

        if (createPanel) {
            if (phase === 'create_a_bot' || phase === 'trading_floor' || phase === 'bubble_cycle') {
                createPanel.classList.remove('hidden');
            } else {
                createPanel.classList.add('hidden');
            }
        }
    }

    /**
     * Utility methods
     */
    formatLargeNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toFixed(2);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Public API methods
     */
    showNotification(message, type = 'info') {
        if (this.notificationManager) {
            this.notificationManager.show(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    updateBotRoster() {
        if (this.botManager) {
            this.botManager.updateBotRoster();
        }
    }

    updateBotCollection() {
        if (this.botManager) {
            this.botManager.updateBotCollection();
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stop();

        // Remove event listeners
        this.gameState.removeEventListener('bot_added', this.boundHandlers.gameStateChange);
        this.gameState.removeEventListener('bot_stats_updated', this.boundHandlers.gameStateChange);
        this.gameState.removeEventListener('achievement_unlocked', this.boundHandlers.gameStateChange);
        this.gameState.removeEventListener('phase_changed', this.boundHandlers.phaseChange);

        document.removeEventListener('market_tick', this.boundHandlers.marketUpdate);
        document.removeEventListener('bot_trade', this.boundHandlers.botTrade);

        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);

        // Clear references
        this.gameState = null;
        this.chartManager = null;
        this.botManager = null;
        this.notificationManager = null;
        this.audioManager = null;

        // Clear data
        this.eventFeed = [];

        console.log('UIManager destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}
