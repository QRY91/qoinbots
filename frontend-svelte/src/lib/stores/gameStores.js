import { writable, readable, derived } from "svelte/store";

// Core game instances
export const gameState = writable(null);
export const tradingEngine = writable(null);
export const audioManager = writable(null);

// Bot management
export const bots = writable([]);
export const activeBots = derived(bots, ($bots) =>
  $bots.filter((bot) => bot.active),
);

// Financial data
export const totalBalance = derived(bots, ($bots) =>
  $bots.reduce((sum, bot) => sum + (bot.balance || 0), 0),
);

export const marketData = writable({
  price: 100,
  trend: "up",
  volatility: 0.1,
  cycle: "Growth",
  assets: {
    QOIN: { price: 100, change: 0 },
    HODL: { price: 50, change: 0 },
    MOON: { price: 200, change: 0 },
  },
});

// UI and events
export const eventFeed = writable([]);
export const notifications = writable([]);
export const currentModal = writable(null);

// Game state
export const gamePhase = writable("single-bot");
export const isGameLoaded = writable(false);
export const isPaused = writable(false);

// Settings and preferences
export const debugMode = writable(false);
export const settings = writable({
  sound: true,
  animations: true,
  theme: "dark",
  autoSave: true,
  notificationDuration: 3000,
});

// Derived game statistics
export const gameStats = derived(
  [bots, totalBalance, marketData],
  ([$bots, $totalBalance, $marketData]) => ({
    totalBots: $bots.length,
    activeBots: $bots.filter((bot) => bot.active).length,
    totalBalance: $totalBalance,
    totalTrades: $bots.reduce((sum, bot) => sum + (bot.totalTrades || 0), 0),
    totalProfit: $bots.reduce((sum, bot) => sum + (bot.totalProfit || 0), 0),
    marketCycle: $marketData.cycle,
  }),
);

// Helper functions for store management
export const gameActions = {
  // Add a new bot
  addBot: (botData) => {
    bots.update((currentBots) => [...currentBots, botData]);
  },

  // Update specific bot
  updateBot: (botId, updates) => {
    bots.update((currentBots) =>
      currentBots.map((bot) =>
        bot.id === botId ? { ...bot, ...updates } : bot,
      ),
    );
  },

  // Remove bot
  removeBot: (botId) => {
    bots.update((currentBots) => currentBots.filter((bot) => bot.id !== botId));
  },

  // Add event to feed
  addEvent: (event) => {
    eventFeed.update((currentEvents) => [
      { ...event, id: Date.now(), timestamp: new Date() },
      ...currentEvents.slice(0, 49), // Keep last 50 events
    ]);
  },

  // Add notification
  addNotification: (notification) => {
    const id = Date.now();
    notifications.update((current) => [
      ...current,
      { ...notification, id, timestamp: new Date() },
    ]);

    // Auto-remove notification after duration
    setTimeout(() => {
      notifications.update((current) => current.filter((n) => n.id !== id));
    }, notification.duration || 3000);
  },

  // Remove notification
  removeNotification: (notificationId) => {
    notifications.update((current) =>
      current.filter((n) => n.id !== notificationId),
    );
  },

  // Clear events
  clearEvents: () => {
    eventFeed.set([]);
  },

  // Update market data
  updateMarket: (marketUpdate) => {
    marketData.update((current) => ({
      ...current,
      ...marketUpdate,
    }));
  },

  // Show modal
  showModal: (modalType, modalData = {}) => {
    currentModal.set({ type: modalType, data: modalData });
  },

  // Hide modal
  hideModal: () => {
    currentModal.set(null);
  },

  // Update settings
  updateSettings: (newSettings) => {
    settings.update((current) => ({ ...current, ...newSettings }));
  },

  // Game state management
  pauseGame: () => {
    isPaused.set(true);
  },

  resumeGame: () => {
    isPaused.set(false);
  },

  // Initialize game
  initializeGame: (gameInstance, engineInstance, audioInstance) => {
    gameState.set(gameInstance);
    tradingEngine.set(engineInstance);
    audioManager.set(audioInstance);
    isGameLoaded.set(true);
  },
};

// Persistence helpers
export const saveGame = () => {
  const gameData = {
    bots: null,
    settings: null,
    gamePhase: null,
  };

  // Get current values
  bots.subscribe((value) => (gameData.bots = value))();
  settings.subscribe((value) => (gameData.settings = value))();
  gamePhase.subscribe((value) => (gameData.gamePhase = value))();

  localStorage.setItem("qoinbots-save", JSON.stringify(gameData));
};

export const loadGame = () => {
  const savedData = localStorage.getItem("qoinbots-save");
  if (savedData) {
    try {
      const gameData = JSON.parse(savedData);
      if (gameData.bots) bots.set(gameData.bots);
      if (gameData.settings) settings.set(gameData.settings);
      if (gameData.gamePhase) gamePhase.set(gameData.gamePhase);
      return true;
    } catch (error) {
      console.error("Failed to load game:", error);
      return false;
    }
  }
  return false;
};

// Auto-save functionality
let autoSaveInterval;
settings.subscribe(($settings) => {
  if ($settings.autoSave) {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(saveGame, 30000); // Save every 30 seconds
  } else {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }
});
