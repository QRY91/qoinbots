<script>
    import { onMount, onDestroy } from "svelte";
    import {
        marketData,
        gameState,
        tradingEngine,
    } from "../stores/gameStores.js";

    let chartCanvas;
    let chartInstance = null;
    let selectedAsset = "QOIN";
    let selectedTimeframe = "1h";
    let priceHistory = new Map(); // Asset -> Array of {time, price}
    let unsubscribeMarket;

    const timeframes = [
        { value: "5m", label: "5M" },
        { value: "1h", label: "1H" },
        { value: "4h", label: "4H" },
        { value: "all", label: "ALL" },
    ];

    const assets = ["QOIN", "HODL", "MOON"];

    // Chart configuration
    const MAX_DATA_POINTS = {
        "5m": 50, // 5 minutes of data at ~6s intervals
        "1h": 100, // 1 hour of data
        "4h": 200, // 4 hours of data
        all: 500, // All available data
    };

    const BASE_PRICE = 100; // Starting reference price for QOIN

    // Asset starting prices (matching TradingEngine)
    const ASSET_STARTING_PRICES = {
        QOIN: 100.0,
        HODL: 2500.0,
        MOON: 25.0,
    };
    const Y_AXIS_PADDING = 0.15; // 15% padding above/below for visibility

    function initializePriceHistory() {
        // Initialize price history for each asset with their actual starting prices
        assets.forEach((asset) => {
            if (!priceHistory.has(asset)) {
                priceHistory.set(asset, [
                    {
                        time: Date.now(),
                        price: ASSET_STARTING_PRICES[asset] || BASE_PRICE,
                        label: new Date().toLocaleTimeString(),
                    },
                ]);
            }
        });
    }

    function addPricePoint(asset, price) {
        if (!priceHistory.has(asset)) {
            priceHistory.set(asset, []);
        }

        const history = priceHistory.get(asset);
        const now = Date.now();

        // Add new data point
        history.push({
            time: now,
            price: price,
            label: new Date(now).toLocaleTimeString(),
        });

        // Limit data points based on timeframe
        const maxPoints =
            MAX_DATA_POINTS[selectedTimeframe] || MAX_DATA_POINTS.all;
        if (history.length > maxPoints) {
            history.shift();
        }

        priceHistory.set(asset, history);
    }

    function calculateYAxisBounds(data) {
        if (!data || data.length === 0) {
            const startingPrice =
                ASSET_STARTING_PRICES[selectedAsset] || BASE_PRICE;
            return { min: startingPrice * 0.8, max: startingPrice * 1.2 };
        }

        const prices = data.map((point) => point.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Add padding for better visibility
        const range = maxPrice - minPrice;
        const startingPrice =
            ASSET_STARTING_PRICES[selectedAsset] || BASE_PRICE;
        const padding = Math.max(range * Y_AXIS_PADDING, startingPrice * 0.05); // Minimum 5% of starting price

        return {
            min: Math.max(0, minPrice - padding),
            max: maxPrice + padding,
        };
    }

    function getFilteredData(asset, timeframe) {
        const history = priceHistory.get(asset) || [];

        if (timeframe === "all" || history.length === 0) {
            return history;
        }

        const now = Date.now();
        const timeRanges = {
            "5m": 5 * 60 * 1000, // 5 minutes
            "1h": 60 * 60 * 1000, // 1 hour
            "4h": 4 * 60 * 60 * 1000, // 4 hours
        };

        const cutoffTime = now - (timeRanges[timeframe] || timeRanges["1h"]);
        return history.filter((point) => point.time >= cutoffTime);
    }

    function updateChart() {
        if (!chartInstance || !window.Chart) return;

        const data = getFilteredData(selectedAsset, selectedTimeframe);
        const bounds = calculateYAxisBounds(data);

        // Update chart data
        chartInstance.data.labels = data.map((point) => point.label);
        chartInstance.data.datasets[0].data = data.map((point) => point.price);
        chartInstance.data.datasets[0].label = selectedAsset;

        // Update Y-axis bounds
        chartInstance.options.scales.y.min = bounds.min;
        chartInstance.options.scales.y.max = bounds.max;

        chartInstance.update("none"); // No animation for performance
    }

    function handleAssetChange(event) {
        selectedAsset = event.target.value;
        updateChart();
    }

    function handleTimeframeChange(timeframe) {
        selectedTimeframe = timeframe;
        updateChart();
    }

    function getCurrentPrice(asset) {
        const data = $marketData.assets[asset];
        return data?.price || ASSET_STARTING_PRICES[asset] || BASE_PRICE;
    }

    function getPriceChange(asset) {
        const history = priceHistory.get(asset) || [];
        if (history.length < 2) return 0;

        const current = history[history.length - 1].price;
        const previous = history[0].price; // Compare to start of visible range

        return ((current - previous) / previous) * 100;
    }

    onMount(() => {
        initializePriceHistory();

        if (window.Chart && chartCanvas) {
            const ctx = chartCanvas.getContext("2d");

            chartInstance = new window.Chart(ctx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: selectedAsset,
                            data: [],
                            borderColor: "#3b82f6",
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            pointHoverBackgroundColor: "#3b82f6",
                            pointHoverBorderColor: "#ffffff",
                            pointHoverBorderWidth: 2,
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
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            titleColor: "#3b82f6",
                            bodyColor: "#ffffff",
                            borderColor: "#3b82f6",
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                title: (context) => {
                                    return `${selectedAsset} Price`;
                                },
                                label: (context) => {
                                    const price = context.parsed.y;
                                    const history =
                                        priceHistory.get(selectedAsset) || [];
                                    const startPrice =
                                        history[0]?.price || BASE_PRICE;
                                    const change =
                                        ((price - startPrice) / startPrice) *
                                        100;

                                    // Dynamic decimal places for price display
                                    let priceStr;
                                    if (price >= 1000) {
                                        priceStr = price.toFixed(0);
                                    } else if (price >= 100) {
                                        priceStr = price.toFixed(1);
                                    } else {
                                        priceStr = price.toFixed(2);
                                    }

                                    return [
                                        `Price: $${priceStr}`,
                                        `Change: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
                                    ];
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: {
                                color: "rgba(255, 255, 255, 0.1)",
                                drawBorder: false,
                            },
                            ticks: {
                                color: "#9ca3af",
                                maxTicksLimit: 8,
                                callback: function (value, index) {
                                    // Show every nth label to avoid crowding
                                    const data = this.getLabelForValue(value);
                                    return index %
                                        Math.ceil(
                                            this.chart.data.labels.length / 6,
                                        ) ===
                                        0
                                        ? data
                                        : "";
                                },
                            },
                        },
                        y: {
                            grid: {
                                color: "rgba(255, 255, 255, 0.1)",
                                drawBorder: false,
                            },
                            ticks: {
                                color: "#9ca3af",
                                callback: function (value) {
                                    // Dynamic decimal places based on price range
                                    if (value >= 1000) {
                                        return "$" + value.toFixed(0);
                                    } else if (value >= 100) {
                                        return "$" + value.toFixed(1);
                                    } else {
                                        return "$" + value.toFixed(2);
                                    }
                                },
                            },
                            // Bounds will be set dynamically
                            min: ASSET_STARTING_PRICES.QOIN * 0.8,
                            max: ASSET_STARTING_PRICES.QOIN * 1.2,
                        },
                    },
                    elements: {
                        point: {
                            radius: 0,
                            hoverRadius: 4,
                        },
                    },
                    animation: {
                        duration: 0, // Disable animations for real-time updates
                    },
                },
            });

            updateChart();
        }

        // Subscribe to market data updates
        unsubscribeMarket = marketData.subscribe((data) => {
            if (data && data.assets) {
                // Add new price points for all assets
                Object.entries(data.assets).forEach(([asset, assetData]) => {
                    if (assetData.price !== undefined) {
                        addPricePoint(asset, assetData.price);
                    }
                });

                // Update chart if it's initialized
                if (chartInstance) {
                    updateChart();
                }
            }
        });
    });

    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
        if (unsubscribeMarket) {
            unsubscribeMarket();
        }
    });
</script>

<section class="chart-section">
    <div class="chart-container">
        <div class="chart-header">
            <h3>Market Chart</h3>
            <div class="chart-controls">
                <select
                    bind:value={selectedAsset}
                    on:change={handleAssetChange}
                    class="asset-selector"
                >
                    {#each assets as asset}
                        <option value={asset}>{asset}</option>
                    {/each}
                </select>

                <div class="timeframe-buttons">
                    {#each timeframes as timeframe}
                        <button
                            class="timeframe-btn"
                            class:active={selectedTimeframe === timeframe.value}
                            on:click={() =>
                                handleTimeframeChange(timeframe.value)}
                        >
                            {timeframe.label}
                        </button>
                    {/each}
                </div>
            </div>
        </div>

        <div class="chart-wrapper">
            <canvas bind:this={chartCanvas} class="trading-chart"></canvas>

            <!-- Market info overlay -->
            <div class="market-info">
                <div class="price-display">
                    <span class="current-price">
                        ${(() => {
                            const price = getCurrentPrice(selectedAsset);
                            if (price >= 1000) return price.toFixed(0);
                            if (price >= 100) return price.toFixed(1);
                            return price.toFixed(2);
                        })()}
                    </span>
                    <span
                        class="price-change"
                        class:positive={getPriceChange(selectedAsset) >= 0}
                        class:negative={getPriceChange(selectedAsset) < 0}
                    >
                        {getPriceChange(selectedAsset) >= 0
                            ? "+"
                            : ""}{getPriceChange(selectedAsset).toFixed(2)}%
                    </span>
                </div>

                <div class="market-cycle">
                    <span class="cycle-label">Market:</span>
                    <span class="cycle-value"
                        >{$marketData.cycle || "Growth"}</span
                    >
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .chart-section {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .chart-container {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .chart-header h3 {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
    }

    .chart-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .asset-selector {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #ffffff;
        padding: 0.5rem;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .asset-selector:focus {
        outline: none;
        border-color: #3b82f6;
    }

    .timeframe-buttons {
        display: flex;
        gap: 0.25rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 0.25rem;
    }

    .timeframe-btn {
        background: transparent;
        border: none;
        color: #9ca3af;
        padding: 0.375rem 0.75rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .timeframe-btn:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
    }

    .timeframe-btn.active {
        background: #3b82f6;
        color: #ffffff;
    }

    .chart-wrapper {
        flex: 1;
        position: relative;
        min-height: 250px;
    }

    .trading-chart {
        width: 100%;
        height: 100%;
    }

    .market-info {
        position: absolute;
        top: 1rem;
        left: 1rem;
        z-index: 10;
    }

    .price-display {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
    }

    .current-price {
        font-size: 1.5rem;
        font-weight: 700;
        color: #ffffff;
    }

    .price-change {
        font-size: 0.9rem;
        font-weight: 600;
    }

    .price-change.positive {
        color: #10b981;
    }

    .price-change.negative {
        color: #ef4444;
    }

    .market-cycle {
        display: flex;
        gap: 0.5rem;
        font-size: 0.8rem;
    }

    .cycle-label {
        color: #9ca3af;
    }

    .cycle-value {
        color: #ffffff;
        font-weight: 500;
        text-transform: capitalize;
    }

    @media (max-width: 768px) {
        .chart-container {
            margin: 0.5rem;
            padding: 1rem;
        }

        .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .chart-controls {
            width: 100%;
            justify-content: space-between;
        }

        .current-price {
            font-size: 1.25rem;
        }
    }
</style>
