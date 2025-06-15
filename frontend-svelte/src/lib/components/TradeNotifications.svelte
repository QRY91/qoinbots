<script>
  import { fly, scale } from 'svelte/transition';
  import { notifications, gameActions } from '../stores/gameStores.js';

  // Remove notification manually
  function removeNotification(notificationId) {
    gameActions.removeNotification(notificationId);
  }

  // Get notification icon based on type
  function getNotificationIcon(type) {
    const icons = {
      'profit': '📈',
      'loss': '📉',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'info': 'ℹ️',
      'level-up': '🎉',
      'achievement': '🏆'
    };
    return icons[type] || 'ℹ️';
  }

  // Format the notification message
  function formatMessage(notification) {
    if (notification.botName && notification.message) {
      return `${notification.botName}: ${notification.message}`;
    }
    return notification.message || notification.text || 'Notification';
  }
</script>

<div class="notification-container">
  {#each $notifications as notification (notification.id)}
    <div
      class="trade-notification {notification.type}"
      transition:fly={{x: 300, duration: 400}}
      on:click={() => removeNotification(notification.id)}
    >
      <div class="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>

      <div class="notification-content">
        <div class="notification-message">
          {formatMessage(notification)}
        </div>
        {#if notification.botName && notification.message}
          <div class="notification-bot">
            {notification.botName}
          </div>
        {/if}
      </div>

      <div class="notification-close">
        ✕
      </div>

      <!-- Progress bar for auto-removal -->
      <div class="notification-progress">
        <div
          class="progress-bar"
          style="animation-duration: {notification.duration || 3000}ms"
        ></div>
      </div>
    </div>
  {/each}
</div>

<style>
  .notification-container {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 320px;
    pointer-events: none;
  }

  .trade-notification {
    background: rgba(26, 26, 46, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 1rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.2s ease;
    pointer-events: auto;
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 64px;
    overflow: hidden;
  }

  .trade-notification:hover {
    transform: translateX(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  /* Notification type styling */
  .trade-notification.profit {
    border-left: 4px solid #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
  }

  .trade-notification.loss {
    border-left: 4px solid #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
  }

  .trade-notification.success {
    border-left: 4px solid #06d6a0;
    background: linear-gradient(135deg, rgba(6, 214, 160, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
  }

  .trade-notification.warning {
    border-left: 4px solid #fbbf24;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
  }

  .trade-notification.error {
    border-left: 4px solid #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
  }

  .trade-notification.info {
    border-left: 4px solid #3b82f6;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
  }

  .trade-notification.level-up {
    border-left: 4px solid #8b5cf6;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
    animation: celebrate 0.6s ease-out;
  }

  .trade-notification.achievement {
    border-left: 4px solid #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(26, 26, 46, 0.95) 50%);
    animation: celebrate 0.8s ease-out;
  }

  .notification-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  .notification-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .notification-message {
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.3;
    word-wrap: break-word;
  }

  .notification-bot {
    color: #9ca3af;
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.8;
  }

  .notification-close {
    color: #9ca3af;
    font-size: 0.8rem;
    opacity: 0.6;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .trade-notification:hover .notification-close {
    opacity: 1;
  }

  .notification-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3));
    width: 100%;
    animation: progress-countdown linear forwards;
  }

  /* Color the progress bar based on notification type */
  .trade-notification.profit .progress-bar {
    background: linear-gradient(90deg, #10b981, rgba(16, 185, 129, 0.3));
  }

  .trade-notification.loss .progress-bar {
    background: linear-gradient(90deg, #ef4444, rgba(239, 68, 68, 0.3));
  }

  .trade-notification.success .progress-bar {
    background: linear-gradient(90deg, #06d6a0, rgba(6, 214, 160, 0.3));
  }

  .trade-notification.warning .progress-bar {
    background: linear-gradient(90deg, #fbbf24, rgba(251, 191, 36, 0.3));
  }

  .trade-notification.info .progress-bar {
    background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0.3));
  }

  /* Animations */
  @keyframes progress-countdown {
    from {
      transform: translateX(0%);
    }
    to {
      transform: translateX(-100%);
    }
  }

  @keyframes celebrate {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .notification-container {
      top: 60px;
      right: 10px;
      left: 10px;
      max-width: none;
    }

    .trade-notification {
      padding: 0.75rem;
      min-height: 56px;
    }

    .notification-icon {
      font-size: 1.25rem;
      width: 28px;
      height: 28px;
    }

    .notification-message {
      font-size: 0.85rem;
    }

    .notification-bot {
      font-size: 0.7rem;
    }
  }

  @media (max-width: 480px) {
    .notification-container {
      top: 50px;
      right: 8px;
      left: 8px;
    }

    .trade-notification {
      padding: 0.5rem;
      gap: 0.5rem;
      min-height: 48px;
    }

    .notification-message {
      font-size: 0.8rem;
    }

    .notification-close {
      font-size: 0.7rem;
    }
  }

  /* Special effects for high-value trades */
  .trade-notification[data-high-value="true"] {
    animation: high-value-pulse 2s ease-in-out;
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
  }

  @keyframes high-value-pulse {
    0%, 100% {
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
    }
    50% {
      box-shadow: 0 12px 48px rgba(59, 130, 246, 0.5);
    }
  }
</style>
