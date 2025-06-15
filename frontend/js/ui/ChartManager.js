/**
 * QOIN Chart Manager
 * Handles trading chart visualization, bot positioning, and market data display
 */

class ChartManager {
  constructor(canvasId, gameState, botPersonalities) {
    this.canvasId = canvasId;
    this.gameState = gameState;
    this.botPersonalities = botPersonalities;
    this.chart = null;
    this.chartContainer = null;

    // Chart configuration
    this.config = {
      maxDataPoints: 100,
      updateInterval: 1000,
      animationDuration: 300,
      responsiveBreakpoint: 768,
    };

    // Data storage
    this.priceData = {
      labels: [],
      datasets: new Map(),
    };

    // Bot positioning
    this.botElements = new Map();
    this.speechBubbles = new Map();

    // Market cycle visualization
    this.cycleIndicator = null;

    // Asset management
    this.currentAsset = "QOIN";
    this.timeframe = "1h";

    // Chart colors
    this.colors = {
      primary: "#4ecdc4",
      secondary: "#ff6b6b",
      success: "#2ecc71",
      warning: "#f39c12",
      danger: "#e74c3c",
      muted: "rgba(255, 255, 255, 0.6)",
      grid: "rgba(255, 255, 255, 0.1)",
      background: "rgba(78, 205, 196, 0.1)",
    };

    // Initialize
    this.initialize();
  }

  /**
   * Initialize the chart and set up event listeners
   */
  async initialize() {
    try {
      this.chartContainer = document.querySelector(".chart-wrapper");

      if (!this.chartContainer) {
        throw new Error("Chart container not found");
      }

      // Set up Chart.js
      await this.initializeChart();

      // Set up bot positioning system
      this.initializeBotPositioning();

      // Set up asset selector
      this.setupAssetSelector();

      // Set up timeframe buttons
      this.setupTimeframeButtons();

      // Set up cycle indicator
      this.setupCycleIndicator();

      // Start update loop
      this.startUpdateLoop();

      console.log("ChartManager initialized successfully");
    } catch (error) {
      console.error("Failed to initialize ChartManager:", error);
      throw error;
    }
  }

  /**
   * Initialize Chart.js instance
   */
  async initializeChart() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) {
      throw new Error(`Canvas element ${this.canvasId} not found`);
    }

    const ctx = canvas.getContext("2d");

    // Initial data
    this.priceData.labels = ["Start"];
    this.priceData.datasets.set(this.currentAsset, [1.0]);

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.priceData.labels,
        datasets: [
          {
            label: this.currentAsset,
            data: this.priceData.datasets.get(this.currentAsset),
            borderColor: this.colors.primary,
            backgroundColor: this.colors.background,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this.colors.primary,
            pointHoverBorderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: this.colors.primary,
            bodyColor: "#fff",
            borderColor: this.colors.primary,
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => {
                return `${this.currentAsset} Price`;
              },
              label: (context) => {
                const price = context.parsed.y;
                const change = this.calculatePriceChange(context.dataIndex);
                return [
                  `Price: $${price.toFixed(4)}`,
                  `Change: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: this.colors.grid,
              drawBorder: false,
            },
            ticks: {
              color: this.colors.muted,
              maxTicksLimit: 8,
            },
          },
          y: {
            grid: {
              color: this.colors.grid,
              drawBorder: false,
            },
            ticks: {
              color: this.colors.muted,
              callback: function (value) {
                return "$" + value.toFixed(4);
              },
            },
          },
        },
        animation: {
          duration: this.config.animationDuration,
          easing: "easeInOutQuart",
        },
        onHover: (event, elements) => {
          canvas.style.cursor = elements.length > 0 ? "pointer" : "default";
        },
      },
    });

    // Handle chart clicks
    canvas.addEventListener("click", (event) => {
      this.handleChartClick(event);
    });
  }

  /**
   * Initialize bot positioning system
   */
  initializeBotPositioning() {
    const botsContainer = document.getElementById("chartBots");
    if (!botsContainer) {
      console.warn("Chart bots container not found");
      return;
    }

    // Clear existing bots
    botsContainer.innerHTML = "";
    this.botElements.clear();

    // Add bots from game state
    const bots = this.gameState.getBots();
    Object.values(bots).forEach((botData) => {
      this.addBotToChart(botData);
    });
  }

  /**
   * Add a bot to the chart visualization
   */
  addBotToChart(botData) {
    const botsContainer = document.getElementById("chartBots");
    if (!botsContainer) return;

    // Create bot element
    const botElement = document.createElement("div");
    botElement.className = "chart-bot";
    botElement.dataset.botId = botData.id;

    const botAvatar = document.createElement("div");
    botAvatar.className = "chart-bot-avatar";

    // Get bot personality for emoji
    const personality =
      this.botPersonalities.getPersonality(botData.personality) ||
      this.botPersonalities.getPersonality("qoin");
    botAvatar.textContent = personality.emoji;

    botElement.appendChild(botAvatar);
    botsContainer.appendChild(botElement);

    // Store reference
    this.botElements.set(botData.id, botElement);

    // Position bot
    this.updateBotPosition(botData.id);

    // Add click handler
    botElement.addEventListener("click", () => {
      this.handleBotClick(botData.id);
    });

    // Add hover effects
    botElement.addEventListener("mouseenter", () => {
      this.handleBotHover(botData.id, true);
    });

    botElement.addEventListener("mouseleave", () => {
      this.handleBotHover(botData.id, false);
    });
  }

  /**
   * Update bot position on chart based on balance
   */
  updateBotPosition(botId) {
    const botElement = this.botElements.get(botId);
    const botData = this.gameState.getBot(botId);

    if (!botElement || !botData || !this.chart) return;

    try {
      // Get chart dimensions
      const chartArea = this.chart.chartArea;
      if (!chartArea) return;

      // Calculate position based on current price and bot balance
      const currentDataIndex = this.chart.data.labels.length - 1;
      const currentPrice = this.getCurrentPrice();

      // X position: latest data point
      const xPosition = this.chart.scales.x.getPixelForValue(currentDataIndex);

      // Y position: based on bot's balance relative to current price
      // Higher balance = higher on chart
      const balanceRatio = Math.min(1, botData.stats.balance / 50); // Normalize to 0-1
      const yRange = chartArea.bottom - chartArea.top;
      const yPosition = chartArea.top + yRange * (1 - balanceRatio);

      // Apply position
      botElement.style.left = `${xPosition - 25}px`;
      botElement.style.top = `${yPosition - 25}px`;

      // Update mood class
      this.updateBotMood(botId, botData.mood);
    } catch (error) {
      console.warn(`Failed to update bot position for ${botId}:`, error);
    }
  }

  /**
   * Update bot mood visualization
   */
  updateBotMood(botId, mood) {
    const botElement = this.botElements.get(botId);
    if (!botElement) return;

    // Remove existing mood classes
    botElement.classList.remove(
      "mood-happy",
      "mood-sad",
      "mood-thinking",
      "mood-excited",
    );

    // Add new mood class
    const moodClasses = {
      optimistic: "mood-happy",
      confident: "mood-excited",
      happy: "mood-happy",
      sad: "mood-sad",
      panicked: "mood-sad",
      depressed: "mood-sad",
      philosophical: "mood-thinking",
      cautious: "mood-thinking",
      enlightened: "mood-thinking",
    };

    const moodClass = moodClasses[mood] || "mood-thinking";
    botElement.classList.add(moodClass);
  }

  /**
   * Show speech bubble for a bot
   */
  showSpeechBubble(botId, message, duration = 4000) {
    const botElement = this.botElements.get(botId);
    if (!botElement) return;

    // Remove existing bubble
    this.removeSpeechBubble(botId);

    // Create speech bubble
    const bubble = document.createElement("div");
    bubble.className = "speech-bubble";

    const bubbleContent = document.createElement("div");
    bubbleContent.className = "bubble-content";
    bubbleContent.textContent = message;

    const bubbleArrow = document.createElement("div");
    bubbleArrow.className = "bubble-arrow";

    bubble.appendChild(bubbleContent);
    bubble.appendChild(bubbleArrow);

    // Position bubble
    const botRect = botElement.getBoundingClientRect();
    const containerRect = this.chartContainer.getBoundingClientRect();

    bubble.style.left = `${botRect.left - containerRect.left + 60}px`;
    bubble.style.top = `${botRect.top - containerRect.top - 70}px`;

    // Add to container
    this.chartContainer.appendChild(bubble);
    this.speechBubbles.set(botId, bubble);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeSpeechBubble(botId);
    }, duration);
  }

  /**
   * Remove speech bubble for a bot
   */
  removeSpeechBubble(botId) {
    const bubble = this.speechBubbles.get(botId);
    if (bubble && bubble.parentElement) {
      bubble.parentElement.removeChild(bubble);
      this.speechBubbles.delete(botId);
    }
  }

  /**
   * Update chart with new price data
   */
  updatePrices(priceData) {
    if (!this.chart) return;

    const currentPrice = priceData[this.currentAsset]?.price;
    if (currentPrice === undefined) return;

    // Add new data point
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    this.chart.data.labels.push(timestamp);
    this.chart.data.datasets[0].data.push(currentPrice);

    // Store in price data
    if (!this.priceData.datasets.has(this.currentAsset)) {
      this.priceData.datasets.set(this.currentAsset, []);
    }
    this.priceData.datasets.get(this.currentAsset).push(currentPrice);

    // Limit data points
    if (this.chart.data.labels.length > this.config.maxDataPoints) {
      this.chart.data.labels.shift();
      this.chart.data.datasets[0].data.shift();
      this.priceData.datasets.get(this.currentAsset).shift();
    }

    // Update chart
    this.chart.update("none"); // No animation for real-time updates

    // Update bot positions
    this.updateAllBotPositions();
  }

  /**
   * Update all bot positions
   */
  updateAllBotPositions() {
    Object.keys(this.gameState.getBots()).forEach((botId) => {
      this.updateBotPosition(botId);
    });
  }

  /**
   * Update market cycle indicator
   */
  updateCycle(cycleData) {
    const cycleFill = document.getElementById("cycleFill");
    const cycleText = document.getElementById("cycleText");

    if (cycleFill && cycleText) {
      cycleFill.style.width = `${cycleData.progress * 100}%`;
      cycleText.textContent = `${cycleData.phase} Phase (${Math.round(cycleData.progress * 100)}%)`;

      // Update color based on phase
      const phaseColors = {
        growth: "#2ecc71",
        bubble: "#f39c12",
        peak: "#ff6b6b",
        crash: "#e74c3c",
        recovery: "#3498db",
      };

      cycleFill.style.background = phaseColors[cycleData.phase] || "#4ecdc4";
    }
  }

  /**
   * Add trade point marker
   */
  addTradePoint(trade) {
    // Visual indicator for trade execution
    const dataIndex = this.chart.data.labels.length - 1;

    // Add temporary marker
    const marker = {
      type: "point",
      x: dataIndex,
      y: trade.price,
      backgroundColor: trade.pnl > 0 ? this.colors.success : this.colors.danger,
      borderColor: "#fff",
      borderWidth: 2,
      radius: 8,
    };

    // Could add trade markers as annotations if chart.js annotation plugin is available
    console.log("Trade executed:", trade);
  }

  /**
   * Switch to different asset
   */
  switchAsset(assetName) {
    if (this.currentAsset === assetName) return;

    this.currentAsset = assetName;

    // Update chart dataset
    if (this.chart) {
      this.chart.data.datasets[0].label = assetName;

      // Get stored data for this asset or initialize
      let assetData = this.priceData.datasets.get(assetName);
      if (!assetData) {
        assetData = [1.0]; // Default starting price
        this.priceData.datasets.set(assetName, assetData);
      }

      this.chart.data.datasets[0].data = [...assetData];
      this.chart.update();
    }

    // Update bot positions
    this.updateAllBotPositions();
  }

  /**
   * Setup asset selector
   */
  setupAssetSelector() {
    const assetSelector = document.getElementById("assetSelector");
    if (!assetSelector) return;

    assetSelector.addEventListener("change", (event) => {
      this.switchAsset(event.target.value);
    });
  }

  /**
   * Setup timeframe buttons
   */
  setupTimeframeButtons() {
    const timeframeButtons = document.querySelectorAll(".timeframe-btn");

    timeframeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        timeframeButtons.forEach((btn) => btn.classList.remove("active"));

        // Add active class to clicked button
        button.classList.add("active");

        // Update timeframe
        this.timeframe = button.dataset.timeframe;

        // Could implement different data aggregation based on timeframe
        console.log("Timeframe changed to:", this.timeframe);
      });
    });
  }

  /**
   * Setup cycle indicator
   */
  setupCycleIndicator() {
    this.cycleIndicator = document.getElementById("cycleIndicator");

    if (this.cycleIndicator) {
      // Initial state
      this.updateCycle({
        phase: "growth",
        progress: 0,
        intensity: 0.5,
      });
    }
  }

  /**
   * Handle chart click events
   */
  handleChartClick(event) {
    const points = this.chart.getElementsAtEventForMode(
      event,
      "nearest",
      { intersect: true },
      true,
    );

    if (points.length > 0) {
      const point = points[0];
      const dataIndex = point.index;
      const price = this.chart.data.datasets[0].data[dataIndex];
      const label = this.chart.data.labels[dataIndex];

      console.log("Chart clicked:", { dataIndex, price, label });

      // Could show detailed price info or trigger actions
    }
  }

  /**
   * Handle bot click events
   */
  handleBotClick(botId) {
    const botData = this.gameState.getBot(botId);
    if (!botData) return;

    console.log("Bot clicked:", botId);

    // Request wisdom from bot
    this.showSpeechBubble(
      botId,
      "Click! You want my wisdom? *thinking deeply*",
      2000,
    );

    // Emit event for other systems
    if (this.gameState) {
      this.gameState.emit("bot_clicked", { botId, botData });
    }
  }

  /**
   * Handle bot hover events
   */
  handleBotHover(botId, isHovering) {
    const botElement = this.botElements.get(botId);
    if (!botElement) return;

    if (isHovering) {
      botElement.style.transform = "scale(1.1)";
      botElement.style.zIndex = "1001";
    } else {
      botElement.style.transform = "scale(1)";
      botElement.style.zIndex = "1000";
    }
  }

  /**
   * Start update loop
   */
  startUpdateLoop() {
    setInterval(() => {
      this.updateChartDisplay();
    }, this.config.updateInterval);
  }

  /**
   * Update chart display elements
   */
  updateChartDisplay() {
    // Update responsiveness
    this.handleResponsive();

    // Clean up old speech bubbles
    this.cleanupOldBubbles();
  }

  /**
   * Handle responsive behavior
   */
  handleResponsive() {
    if (!this.chart) return;

    const isSmallScreen = window.innerWidth < this.config.responsiveBreakpoint;

    // Adjust chart options for small screens
    if (isSmallScreen) {
      this.chart.options.scales.x.ticks.maxTicksLimit = 4;
      this.chart.options.scales.y.ticks.maxTicksLimit = 6;
    } else {
      this.chart.options.scales.x.ticks.maxTicksLimit = 8;
      this.chart.options.scales.y.ticks.maxTicksLimit = 8;
    }
  }

  /**
   * Clean up old speech bubbles
   */
  cleanupOldBubbles() {
    // Remove bubbles that are no longer attached
    for (const [botId, bubble] of this.speechBubbles.entries()) {
      if (!bubble.parentElement) {
        this.speechBubbles.delete(botId);
      }
    }
  }

  /**
   * Get current price for the active asset
   */
  getCurrentPrice() {
    const market = this.gameState.getMarket();
    return market.assets[this.currentAsset]?.price || 1.0;
  }

  /**
   * Calculate price change percentage
   */
  calculatePriceChange(dataIndex) {
    if (!this.chart || dataIndex < 1) return 0;

    const currentPrice = this.chart.data.datasets[0].data[dataIndex];
    const previousPrice = this.chart.data.datasets[0].data[dataIndex - 1];

    if (!previousPrice || previousPrice === 0) return 0;

    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }

  /**
   * Remove bot from chart
   */
  removeBotFromChart(botId) {
    const botElement = this.botElements.get(botId);
    if (botElement && botElement.parentElement) {
      botElement.parentElement.removeChild(botElement);
      this.botElements.delete(botId);
    }

    this.removeSpeechBubble(botId);
  }

  /**
   * Get chart statistics
   */
  getChartStats() {
    if (!this.chart) return null;

    const data = this.chart.data.datasets[0].data;
    if (!data.length) return null;

    const prices = [...data];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const current = prices[prices.length - 1];
    const start = prices[0];

    return {
      current,
      min,
      max,
      change: ((current - start) / start) * 100,
      volatility: this.calculateVolatility(prices),
      dataPoints: prices.length,
    };
  }

  /**
   * Calculate price volatility
   */
  calculateVolatility(prices) {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * 100; // Return as percentage
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Stop update loop
    // (Would need to store interval ID to clear it)

    // Destroy Chart.js instance
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Clear bot elements
    this.botElements.clear();
    this.speechBubbles.clear();

    // Clear data
    this.priceData.datasets.clear();
    this.priceData.labels = [];

    console.log("ChartManager destroyed");
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ChartManager;
} else if (typeof window !== "undefined") {
  window.ChartManager = ChartManager;
}
