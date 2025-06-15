<script>
  import { fly, fade } from 'svelte/transition';
  import { eventFeed, gameActions } from '../stores/gameStores.js';

  // Format timestamp for display
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Get event icon based on type
  function getEventIcon(eventType) {
    const icons = {
      'profit': '📈',
      'loss': '📉',
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'trade': '💰',
      'level-up': '🎉',
      'bot-added': '🤖',
      'market-change': '📊'
    };
    return icons[eventType] || 'ℹ️';
  }

  // Clear all events
  function clearEvents() {
    gameActions.clearEvents();
  }

  // Handle event click for more details
  function handleEventClick(event) {
    if (event.botId) {
      gameActions.showModal('bot-details', { botId: event.botId });
    }
  }
</script>

<section class="event-feed">
  <div class="feed-header">
    <h3>Event Feed</h3>
    <button
      class="clear-btn"
      on:click={clearEvents}
      title="Clear all events"
      disabled={$eventFeed.length === 0}
    >
      🗑️
    </button>
  </div>

  <div class="event-list" class:empty={$eventFeed.length === 0}>
    {#each $eventFeed as event (event.id)}
      <div
        class="event-item {event.type}"
        transition:fly={{y: -20, duration: 300}}
        on:click={() => handleEventClick(event)}
        class:clickable={event.botId}
      >
        <div class="event-icon">
          {getEventIcon(event.type)}
        </div>

        <div class="event-content">
          <div class="event-text">
            {event.text}
          </div>
          <div class="event-time">
            {formatTime(event.timestamp)}
          </div>
        </div>

        {#if event.botId}
          <div class="event-arrow">
            →
          </div>
        {/if}
      </div>
    {/each}

    {#if $eventFeed.length === 0}
      <div class="empty-state" transition:fade>
        <div class="empty-icon">📰</div>
        <h4>No events yet</h4>
        <p>Trading activities and bot updates will appear here in real-time.</p>
      </div>
    {/if}
  </div>

  <!-- Event stats footer -->
  {#if $eventFeed.length > 0}
    <div class="feed-footer" transition:fade>
      <span class="event-count">
        {$eventFeed.length} event{$eventFeed.length !== 1 ? 's' : ''}
      </span>
      <span class="last-update">
        Last: {formatTime($eventFeed[0]?.timestamp)}
      </span>
    </div>
  {/if}
</section>

<style>
  .event-feed {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
  }

  .feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .feed-header h3 {
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }

  .clear-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    color: #ef4444;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
  }

  .clear-btn:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .clear-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .event-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-right: 0.5rem;
  }

  .event-list::-webkit-scrollbar {
    width: 4px;
  }

  .event-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  .event-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  .event-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }

  .event-item.clickable {
    cursor: pointer;
  }

  .event-item.clickable:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateX(2px);
  }

  /* Event type styling */
  .event-item.profit {
    border-left: 3px solid #10b981;
    background: rgba(16, 185, 129, 0.05);
  }

  .event-item.loss {
    border-left: 3px solid #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  .event-item.success {
    border-left: 3px solid #06d6a0;
    background: rgba(6, 214, 160, 0.05);
  }

  .event-item.warning {
    border-left: 3px solid #fbbf24;
    background: rgba(251, 191, 36, 0.05);
  }

  .event-item.error {
    border-left: 3px solid #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  .event-item.info {
    border-left: 3px solid #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  .event-icon {
    font-size: 1.1rem;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }

  .event-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .event-text {
    color: #ffffff;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .event-time {
    color: #9ca3af;
    font-size: 0.75rem;
    font-family: 'Monaco', 'Menlo', monospace;
  }

  .event-arrow {
    color: #9ca3af;
    font-size: 0.8rem;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
    flex: 1;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h4 {
    color: #ffffff;
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .empty-state p {
    color: #9ca3af;
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .feed-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .event-count, .last-update {
    color: #9ca3af;
    font-size: 0.75rem;
  }

  .last-update {
    font-family: 'Monaco', 'Menlo', monospace;
  }

  @media (max-width: 768px) {
    .event-feed {
      margin: 0.5rem;
      padding: 1rem;
      min-height: 300px;
    }

    .event-item {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .event-text {
      font-size: 0.8rem;
    }

    .event-time {
      font-size: 0.7rem;
    }

    .feed-footer {
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
    }
  }

  @media (max-width: 480px) {
    .event-item {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }

    .event-content {
      width: 100%;
    }

    .event-arrow {
      align-self: flex-end;
    }
  }
</style>
