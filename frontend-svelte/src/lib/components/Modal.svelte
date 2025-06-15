<script>
  import { fade, scale, fly } from 'svelte/transition';
  import { createEventDispatcher, onMount } from 'svelte';
  import { currentModal, gameActions, settings, gameStats, bots } from '../stores/gameStores.js';

  const dispatch = createEventDispatcher();

  let modalElement;
  let isClosing = false;

  // Close modal function
  function closeModal() {
    if (isClosing) return;
    isClosing = true;
    gameActions.hideModal();
    setTimeout(() => {
      isClosing = false;
    }, 300);
  }

  // Handle backdrop click
  function handleBackdropClick(event) {
    if (event.target === modalElement) {
      closeModal();
    }
  }

  // Handle escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  // Settings form data
  let localSettings = { ...$settings };

  // Update settings
  function updateSettings() {
    gameActions.updateSettings(localSettings);
    gameActions.addNotification({
      type: 'success',
      message: 'Settings updated successfully',
      duration: 2000
    });
    closeModal();
  }

  // Reset settings to defaults
  function resetSettings() {
    localSettings = {
      sound: true,
      animations: true,
      theme: 'dark',
      autoSave: true,
      notificationDuration: 3000
    };
  }

  // Handle bot creation
  function handleAddBot() {
    // Placeholder for bot creation logic
    gameActions.addNotification({
      type: 'info',
      message: 'Bot creation coming soon!',
      duration: 2000
    });
    closeModal();
  }

  onMount(() => {
    // Focus trap and keyboard handling
    const handleGlobalKeydown = (event) => {
      if ($currentModal) {
        handleKeydown(event);
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  // Reactive updates
  $: if ($currentModal) {
    localSettings = { ...$settings };
  }
</script>

{#if $currentModal}
  <div
    class="modal-backdrop"
    bind:this={modalElement}
    on:click={handleBackdropClick}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="modal-container"
      transition:scale={{ duration: 300, start: 0.9 }}
    >
      <div class="modal-header">
        <h2 class="modal-title">
          {#if $currentModal.type === 'settings'}
            ⚙️ Settings
          {:else if $currentModal.type === 'help'}
            ❓ Help & Guide
          {:else if $currentModal.type === 'achievements'}
            🏆 Achievements
          {:else if $currentModal.type === 'bot-details'}
            🤖 Bot Details
          {:else if $currentModal.type === 'add-bot'}
            ➕ Add New Bot
          {:else}
            📋 Information
          {/if}
        </h2>
        <button class="modal-close" on:click={closeModal} title="Close">
          ✕
        </button>
      </div>

      <div class="modal-content">
        {#if $currentModal.type === 'settings'}
          <div class="settings-form">
            <div class="setting-group">
              <h4>Audio & Visual</h4>
              <div class="setting-item">
                <label class="setting-label">
                  <input
                    type="checkbox"
                    bind:checked={localSettings.sound}
                    class="setting-checkbox"
                  />
                  <span>Sound Effects</span>
                </label>
              </div>
              <div class="setting-item">
                <label class="setting-label">
                  <input
                    type="checkbox"
                    bind:checked={localSettings.animations}
                    class="setting-checkbox"
                  />
                  <span>Animations</span>
                </label>
              </div>
            </div>

            <div class="setting-group">
              <h4>Gameplay</h4>
              <div class="setting-item">
                <label class="setting-label">
                  <input
                    type="checkbox"
                    bind:checked={localSettings.autoSave}
                    class="setting-checkbox"
                  />
                  <span>Auto Save</span>
                </label>
              </div>
              <div class="setting-item">
                <label class="setting-label">
                  <span>Notification Duration</span>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    bind:value={localSettings.notificationDuration}
                    class="setting-range"
                  />
                  <span class="range-value">{localSettings.notificationDuration / 1000}s</span>
                </label>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" on:click={resetSettings}>
                Reset to Defaults
              </button>
              <button class="btn btn-primary" on:click={updateSettings}>
                Save Settings
              </button>
            </div>
          </div>

        {:else if $currentModal.type === 'help'}
          <div class="help-content">
            <div class="help-section">
              <h4>🎮 How to Play</h4>
              <ul>
                <li><strong>Start with one bot:</strong> Begin your journey with a single AI trading bot companion</li>
                <li><strong>Watch them trade:</strong> Your bots will automatically buy and sell based on their personalities</li>
                <li><strong>Grow your collective:</strong> As you progress, unlock more bot personalities and trading strategies</li>
                <li><strong>Learn market psychology:</strong> Each bot teaches different aspects of behavioral finance</li>
              </ul>
            </div>

            <div class="help-section">
              <h4>🤖 Bot Personalities</h4>
              <ul>
                <li><strong>Philosopher:</strong> Makes thoughtful, long-term decisions</li>
                <li><strong>Gambler:</strong> Takes high-risk, high-reward trades</li>
                <li><strong>Conservative:</strong> Focuses on steady, low-risk gains</li>
                <li><strong>Trendy:</strong> Follows market momentum and social signals</li>
              </ul>
            </div>

            <div class="help-section">
              <h4>📊 Understanding the Interface</h4>
              <ul>
                <li><strong>Chart:</strong> Shows real-time market data and price movements</li>
                <li><strong>Bot Roster:</strong> Manage and monitor your trading bot collective</li>
                <li><strong>Event Feed:</strong> Track all trading activities and bot updates</li>
                <li><strong>Notifications:</strong> Get instant feedback on trades and achievements</li>
              </ul>
            </div>
          </div>

        {:else if $currentModal.type === 'achievements'}
          <div class="achievements-content">
            <div class="achievement-item unlocked">
              <div class="achievement-icon">🎯</div>
              <div class="achievement-info">
                <h4>First Trade</h4>
                <p>Complete your first trading transaction</p>
              </div>
              <div class="achievement-status">✅</div>
            </div>

            <div class="achievement-item locked">
              <div class="achievement-icon">💰</div>
              <div class="achievement-info">
                <h4>Profit Maker</h4>
                <p>Reach $100 in total profit</p>
              </div>
              <div class="achievement-status">🔒</div>
            </div>

            <div class="achievement-item locked">
              <div class="achievement-icon">🏆</div>
              <div class="achievement-info">
                <h4>Bot Collector</h4>
                <p>Unlock 5 different bot personalities</p>
              </div>
              <div class="achievement-status">🔒</div>
            </div>

            <div class="achievement-item locked">
              <div class="achievement-icon">📈</div>
              <div class="achievement-info">
                <h4>Market Master</h4>
                <p>Survive 3 complete market cycles</p>
              </div>
              <div class="achievement-status">🔒</div>
            </div>
          </div>

        {:else if $currentModal.type === 'bot-details'}
          <div class="bot-details-content">
            {#if $currentModal.data?.bot}
              {@const bot = $currentModal.data.bot}
              <div class="bot-profile">
                <div class="bot-avatar-large">
                  {bot.avatar || '🤖'}
                </div>
                <div class="bot-info-detailed">
                  <h3>{bot.name}</h3>
                  <p class="bot-personality-detailed">{bot.personality?.name || 'Unknown Personality'}</p>
                  <p class="bot-description">{bot.personality?.description || 'A mysterious trading bot with unknown strategies.'}</p>
                </div>
              </div>

              <div class="bot-stats-detailed">
                <div class="stat-card">
                  <span class="stat-label">Current Balance</span>
                  <span class="stat-value">${(bot.balance || 0).toFixed(2)}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Total Trades</span>
                  <span class="stat-value">{bot.totalTrades || 0}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Total Profit</span>
                  <span class="stat-value {bot.totalProfit >= 0 ? 'positive' : 'negative'}">
                    ${(bot.totalProfit || 0).toFixed(2)}
                  </span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Level</span>
                  <span class="stat-value">Level {bot.level || 1}</span>
                </div>
              </div>
            {:else}
              <p>Bot information not available.</p>
            {/if}
          </div>

        {:else if $currentModal.type === 'add-bot'}
          <div class="add-bot-content">
            <div class="coming-soon">
              <div class="coming-soon-icon">🚧</div>
              <h3>Coming Soon!</h3>
              <p>The ability to add new bots will be unlocked as you progress through the game. Keep trading and growing your collective!</p>
              <button class="btn btn-primary" on:click={closeModal}>
                Got it!
              </button>
            </div>
          </div>

        {:else}
          <div class="default-content">
            <p>Modal content will appear here.</p>
          </div>
        {/if}
      </div>

      {#if $currentModal.type !== 'settings' && $currentModal.type !== 'add-bot'}
        <div class="modal-footer">
          <button class="btn btn-secondary" on:click={closeModal}>
            Close
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }

  .modal-container {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
  }

  .modal-title {
    color: #ffffff;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .modal-close {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 50%;
    color: #ef4444;
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }

  .modal-close:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .modal-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    color: #ffffff;
  }

  .modal-footer {
    padding: 1rem 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  /* Settings Form Styles */
  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .setting-group h4 {
    color: #06d6a0;
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .setting-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    flex: 1;
  }

  .setting-checkbox {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .setting-range {
    flex: 1;
    margin: 0 1rem;
  }

  .range-value {
    min-width: 3rem;
    text-align: right;
    font-weight: 600;
    color: #06d6a0;
  }

  /* Help Content Styles */
  .help-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .help-section h4 {
    color: #06d6a0;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .help-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .help-section li {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 3px solid #3b82f6;
  }

  /* Achievements Styles */
  .achievements-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .achievement-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .achievement-item.unlocked {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .achievement-item.locked {
    background: rgba(107, 114, 128, 0.1);
    border-color: rgba(107, 114, 128, 0.3);
    opacity: 0.6;
  }

  .achievement-icon {
    font-size: 2rem;
    width: 48px;
    text-align: center;
  }

  .achievement-info {
    flex: 1;
  }

  .achievement-info h4 {
    margin: 0 0 0.25rem 0;
    color: #ffffff;
    font-size: 1rem;
  }

  .achievement-info p {
    margin: 0;
    color: #9ca3af;
    font-size: 0.9rem;
  }

  .achievement-status {
    font-size: 1.25rem;
  }

  /* Bot Details Styles */
  .bot-profile {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    align-items: center;
  }

  .bot-avatar-large {
    font-size: 4rem;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 50%;
    border: 2px solid rgba(59, 130, 246, 0.3);
  }

  .bot-info-detailed h3 {
    margin: 0 0 0.5rem 0;
    color: #ffffff;
    font-size: 1.5rem;
  }

  .bot-personality-detailed {
    color: #06d6a0;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .bot-description {
    color: #9ca3af;
    margin: 0;
    line-height: 1.5;
  }

  .bot-stats-detailed {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .stat-card .stat-label {
    color: #9ca3af;
    font-size: 0.8rem;
    text-transform: uppercase;
    font-weight: 500;
  }

  .stat-card .stat-value {
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .stat-card .stat-value.positive {
    color: #10b981;
  }

  .stat-card .stat-value.negative {
    color: #ef4444;
  }

  /* Coming Soon Styles */
  .coming-soon {
    text-align: center;
    padding: 2rem;
  }

  .coming-soon-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .coming-soon h3 {
    color: #ffffff;
    margin: 0 0 1rem 0;
  }

  .coming-soon p {
    color: #9ca3af;
    margin: 0 0 2rem 0;
    line-height: 1.6;
  }

  /* Button Styles */
  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: #3b82f6;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-container {
      max-width: none;
      border-radius: 12px;
    }

    .modal-header, .modal-content, .modal-footer {
      padding: 1rem;
    }

    .bot-profile {
      flex-direction: column;
      text-align: center;
    }

    .bot-stats-detailed {
      grid-template-columns: 1fr;
    }

    .help-section li {
      padding: 0.5rem;
    }

    .modal-actions {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .modal-header {
      padding: 0.75rem;
    }

    .modal-title {
      font-size: 1.1rem;
    }

    .modal-content {
      padding: 0.75rem;
    }

    .setting-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .setting-label {
      width: 100%;
    }
  }
</style>
