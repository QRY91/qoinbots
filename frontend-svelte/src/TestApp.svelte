<script>
  import { onMount } from 'svelte';

  let count = $state(0);
  let name = $state('QOINbots Test');
  let isLoaded = $state(false);

  const doubled = $derived(count * 2);
  const message = $derived(`Hello ${name}! Count is ${count}`);

  function increment() {
    count += 1;
  }

  function decrement() {
    count -= 1;
  }

  function reset() {
    count = 0;
  }

  onMount(() => {
    isLoaded = true;
    console.log('🤖 QOINbots Test App mounted successfully!');
  });
</script>

<main class="test-app">
  <div class="container">
    <h1>🤖 {name}</h1>
    <p class="subtitle">Svelte 5 Migration Test</p>

    {#if !isLoaded}
      <div class="loading">Loading...</div>
    {:else}
      <div class="content">
        <div class="message-box">
          <p>{message}</p>
          <p class="derived">Doubled: {doubled}</p>
        </div>

        <div class="controls">
          <button on:click={decrement} class="btn btn-secondary">-</button>
          <span class="count-display">{count}</span>
          <button on:click={increment} class="btn btn-primary">+</button>
        </div>

        <div class="actions">
          <button on:click={reset} class="btn btn-reset">Reset</button>
          <input
            bind:value={name}
            placeholder="Enter name..."
            class="name-input"
          />
        </div>

        <div class="status">
          <div class="status-item">
            <span class="label">Status:</span>
            <span class="value success">✅ Working</span>
          </div>
          <div class="status-item">
            <span class="label">Reactivity:</span>
            <span class="value success">✅ Active</span>
          </div>
          <div class="status-item">
            <span class="label">Mount:</span>
            <span class="value success">✅ Complete</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  .test-app {
    min-height: 100vh;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .container {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    text-align: center;
    backdrop-filter: blur(10px);
  }

  h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(45deg, #3b82f6, #06d6a0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    color: #9ca3af;
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
  }

  .loading {
    font-size: 1.2rem;
    color: #06d6a0;
    animation: pulse 2s ease-in-out infinite;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .message-box {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 1rem;
  }

  .message-box p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
  }

  .derived {
    color: #06d6a0;
    font-weight: 600;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .count-display {
    font-size: 2rem;
    font-weight: 700;
    color: #3b82f6;
    min-width: 3rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover {
    background: #4b5563;
    transform: translateY(-1px);
  }

  .btn-reset {
    background: #ef4444;
    color: white;
  }

  .btn-reset:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }

  .name-input {
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 1rem;
    width: 200px;
  }

  .name-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 0.15);
  }

  .name-input::placeholder {
    color: #9ca3af;
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
  }

  .label {
    color: #9ca3af;
    font-weight: 500;
  }

  .value.success {
    color: #10b981;
    font-weight: 600;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (max-width: 600px) {
    .container {
      padding: 1.5rem;
    }

    h1 {
      font-size: 2rem;
    }

    .controls {
      gap: 0.5rem;
    }

    .count-display {
      font-size: 1.5rem;
    }

    .actions {
      flex-direction: column;
      gap: 0.75rem;
    }

    .name-input {
      width: 100%;
    }
  }
</style>
