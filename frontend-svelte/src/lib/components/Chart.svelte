<script>
  import { onMount, afterUpdate } from 'svelte';
  import { marketData, gameActions } from '../stores/gameStores.js';

  let chartCanvas;
  let chartInstance = null;
  let selectedAsset = 'QOIN';
  let selectedTimeframe = '1h';

  const timeframes = [
    { value: '1h', label: '1H' },
    { value: '1d', label: '1D' },
    { value: 'all', label: 'ALL' }
  ];

  const assets = ['QOIN', 'HODL', 'MOON'];

  // Mock chart data for now
  let chartData = {
    labels: [],
    datasets: [{
      label: selectedAsset,
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  function handleAssetChange(event) {
    selectedAsset = event.target.value;
    updateChart();
  }

  function handleTimeframeChange(timeframe) {
    selectedTimeframe = timeframe;
    updateChart();
  }

  function updateChart() {
    if (!chartInstance || !window.Chart) return;

    // Generate mock data based on current market state
    const dataPoints = selectedTimeframe === '1h' ? 60 : selectedTimeframe === '1d' ? 24 : 100;
    const basePrice = $marketData.assets[selectedAsset]?.price || 100;

    const labels = [];
    const data = [];

    for (let i = 0; i < dataPoints; i++) {
      labels.push(i);
      // Generate realistic price movement
      const variation = (Math.random() - 0.5) * 0.1;
      const price = basePrice * (1 + variation * (i / dataPoints));
      data.push(price);
    }

    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].label = selectedAsset;
    chartInstance.update();
  }

  onMount(() => {
    if (window.Chart && chartCanvas) {
      const ctx = chartCanvas.getContext('2d');

      chartInstance = new window.Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              display: false
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#9ca3af',
                callback: function(value) {
                  return '$' + value.toFixed(2);
                }
              }
            }
          },
          elements: {
            point: {
              radius: 0,
              hoverRadius: 4
            }
          }
        }
      });

      updateChart();
    }
  });

  // Update chart when market data changes
  $: if (chartInstance && $marketData) {
    updateChart();
  }
</script>

<section class="chart-section">
  <div class="chart-container">
    <div class="chart-header">
      <h3>Market Overview</h3>
      <div class="chart-controls">
        <select bind:value={selectedAsset} on:change={handleAssetChange} class="asset-selector">
          {#each assets as asset}
            <option value={asset}>{asset}</option>
          {/each}
        </select>

        <div class="timeframe-buttons">
          {#each timeframes as timeframe}
            <button
              class="timeframe-btn"
              class:active={selectedTimeframe === timeframe.value}
              on:click={() => handleTimeframeChange(timeframe.value)}
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
            ${$marketData.assets[selectedAsset]?.price?.toFixed(2) || '100.00'}
          </span>
          <span class="price-change" class:positive={$marketData.assets[selectedAsset]?.change >= 0} class:negative={$marketData.assets[selectedAsset]?.change < 0}>
            {$marketData.assets[selectedAsset]?.change >= 0 ? '+' : ''}{$marketData.assets[selectedAsset]?.change?.toFixed(2) || '0.00'}%
          </span>
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
    min-height: 300px;
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
