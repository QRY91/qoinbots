<script>
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  export let progress = 0;

  let mounted = false;
  let loadingMessages = [
    "Initializing AI trading bots...",
    "Loading market data...",
    "Connecting to exchanges...",
    "Calibrating bot personalities...",
    "Setting up trading algorithms...",
    "Loading your trading bot collective..."
  ];

  let currentMessageIndex = 0;
  let currentMessage = loadingMessages[0];

  onMount(() => {
    mounted = true;

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random progress between 5-20%

      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      }
    }, 200);

    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
      currentMessage = loadingMessages[currentMessageIndex];
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  });
</script>

{#if mounted}
  <div class="loading-screen" transition:fade={{ duration: 300 }}>
    <div class="loading-content">
      <div class="loading-logo" transition:scale={{ duration: 500, delay: 100 }}>
        🤖
      </div>

      <h1 class="loading-title" transition:fade={{ duration: 400, delay: 200 }}>
        QOIN<span class="title-accent">bots</span>
      </h1>

      <p class="loading-message" transition:fade={{ duration: 300, delay: 300 }}>
        {currentMessage}
      </p>

      <div class="loading-bar-container" transition:fade={{ duration: 400, delay: 400 }}>
        <div class="loading-bar">
          <div
            class="loading-progress"
            style="width: {progress}%"
          ></div>
        </div>
        <span class="loading-percentage">{Math.round(progress)}%</span>
      </div>

      <div class="loading-dots" transition:fade={{ duration: 300, delay: 500 }}>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
{/if}

<style>
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .loading-content {
    text-align: center;
    max-width: 400px;
    padding: 2rem;
  }

  .loading-logo {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: pulse 2s ease-in-out infinite;
    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
  }

  .loading-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6, #06d6a0);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-shift 3s ease infinite;
  }

  .title-accent {
    color: #06d6a0;
  }

  .loading-message {
    color: #a1a1aa;
    font-size: 1rem;
    margin-bottom: 2rem;
    min-height: 1.5rem;
    transition: opacity 0.3s ease;
  }

  .loading-bar-container {
    margin-bottom: 2rem;
  }

  .loading-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
    position: relative;
  }

  .loading-progress {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06d6a0);
    background-size: 200% 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
    animation: shimmer 2s ease-in-out infinite;
    position: relative;
  }

  .loading-progress::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: sweep 1.5s ease-in-out infinite;
  }

  .loading-percentage {
    color: #06d6a0;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite both;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes sweep {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    .loading-content {
      padding: 1rem;
    }

    .loading-logo {
      font-size: 3rem;
    }

    .loading-title {
      font-size: 2rem;
    }

    .loading-message {
      font-size: 0.9rem;
    }
  }
</style>
