/**
 * QOIN Notification Manager
 * Handles achievements, unlocks, system notifications, and other user feedback
 */

class NotificationManager {
    constructor() {
        // Notification queue and tracking
        this.notifications = new Map();
        this.notificationQueue = [];
        this.maxConcurrentNotifications = 3;
        this.nextNotificationId = 1;

        // Default durations (milliseconds)
        this.durations = {
            achievement: 8000,
            unlock: 6000,
            info: 4000,
            success: 3000,
            warning: 5000,
            error: 7000,
            system: 4000
        };

        // Notification container
        this.container = null;

        // Animation settings
        this.animationDuration = 300;
        this.stackOffset = 80; // Vertical spacing between notifications

        // Sound integration
        this.audioManager = null;

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the notification system
     */
    initialize() {
        this.createNotificationContainer();
        this.setupStyles();
        console.log('NotificationManager initialized');
    }

    /**
     * Create notification container if it doesn't exist
     */
    createNotificationContainer() {
        this.container = document.getElementById('notificationContainer');

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Set up notification styles
     */
    setupStyles() {
        if (document.getElementById('notificationStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'notificationStyles';
        styles.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            }

            .notification {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                max-width: 350px;
                min-width: 300px;
                pointer-events: auto;
                cursor: pointer;
                transition: all 0.3s ease;
                transform: translateX(100%);
                opacity: 0;
            }

            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }

            .notification:hover {
                transform: translateX(-5px) scale(1.02);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
            }

            .notification-content {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                color: white;
            }

            .notification-icon {
                font-size: 2rem;
                flex-shrink: 0;
                animation: iconPulse 2s ease-in-out infinite;
            }

            .notification-body {
                flex: 1;
            }

            .notification-title {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 8px;
                line-height: 1.3;
            }

            .notification-message {
                font-size: 0.9rem;
                line-height: 1.4;
                opacity: 0.9;
                margin-bottom: 12px;
            }

            .notification-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .notification-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                padding: 6px 12px;
                color: white;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .notification-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }

            .notification-btn.primary {
                background: rgba(255, 255, 255, 0.9);
                color: #333;
            }

            .notification-btn.primary:hover {
                background: white;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 0 0 16px 16px;
                transition: width linear;
            }

            .notification-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                color: white;
                font-size: 0.8rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                opacity: 0.7;
            }

            .notification-close:hover {
                background: rgba(255, 255, 255, 0.3);
                opacity: 1;
                transform: scale(1.1);
            }

            /* Notification Types */
            .notification.achievement {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }

            .notification.unlock {
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            }

            .notification.success {
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            }

            .notification.warning {
                background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
            }

            .notification.error {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            }

            .notification.info {
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            }

            .notification.system {
                background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
            }

            .notification.crash {
                background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
                animation: shake 0.5s ease-in-out;
            }

            @keyframes iconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                20%, 40%, 60%, 80% { transform: translateX(3px); }
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                }

                .notification {
                    max-width: none;
                    min-width: 0;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Set audio manager for sound effects
     */
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    /**
     * Show a generic notification
     */
    show(message, type = 'info', options = {}) {
        const config = {
            title: options.title || this.getDefaultTitle(type),
            message: message,
            icon: options.icon || this.getDefaultIcon(type),
            duration: options.duration || this.durations[type] || this.durations.info,
            actions: options.actions || [],
            showProgress: options.showProgress !== false,
            autoClose: options.autoClose !== false,
            onClick: options.onClick,
            ...options
        };

        return this.createNotification(type, config);
    }

    /**
     * Show achievement notification
     */
    showAchievement(achievement) {
        const config = {
            title: 'Achievement Unlocked!',
            message: `${achievement.name}: ${achievement.description}`,
            icon: '🏆',
            duration: this.durations.achievement,
            actions: [
                {
                    text: 'Awesome!',
                    primary: true,
                    onClick: (notification) => this.dismiss(notification.id)
                }
            ]
        };

        this.playSound('achievement');
        return this.createNotification('achievement', config);
    }

    /**
     * Show bot unlock notification
     */
    showBotUnlock(botData) {
        const config = {
            title: 'New Bot Unlocked!',
            message: `${botData.name} is now available in your collection`,
            icon: botData.emoji || '🤖',
            duration: this.durations.unlock,
            actions: [
                {
                    text: 'View Bot',
                    primary: true,
                    onClick: (notification) => {
                        this.dismiss(notification.id);
                        // Could trigger bot view here
                    }
                },
                {
                    text: 'Dismiss',
                    onClick: (notification) => this.dismiss(notification.id)
                }
            ]
        };

        this.playSound('unlock');
        return this.createNotification('unlock', config);
    }

    /**
     * Show market crash notification
     */
    showMarketCrash() {
        const config = {
            title: 'MARKET CRASH!',
            message: 'The bubble has burst! All assets are crashing down.',
            icon: '💥',
            duration: this.durations.error,
            actions: [
                {
                    text: 'Oh No!',
                    primary: true,
                    onClick: (notification) => this.dismiss(notification.id)
                }
            ]
        };

        this.playSound('crash');
        return this.createNotification('crash', config);
    }

    /**
     * Show welcome message
     */
    showWelcome() {
        const config = {
            title: 'Welcome to QOIN!',
            message: 'Your philosophical trading bot adventure begins now.',
            icon: '🤖',
            duration: this.durations.info,
            actions: [
                {
                    text: 'Let\'s Trade!',
                    primary: true,
                    onClick: (notification) => this.dismiss(notification.id)
                }
            ]
        };

        this.playSound('welcome');
        return this.createNotification('info', config);
    }

    /**
     * Show error notification
     */
    showError(message, details = null) {
        const config = {
            title: 'Error',
            message: message,
            icon: '❌',
            duration: this.durations.error,
            actions: details ? [
                {
                    text: 'Details',
                    onClick: () => console.error('Error details:', details)
                },
                {
                    text: 'Dismiss',
                    primary: true,
                    onClick: (notification) => this.dismiss(notification.id)
                }
            ] : []
        };

        return this.createNotification('error', config);
    }

    /**
     * Show info notification
     */
    showInfo(message, title = 'Info') {
        return this.show(message, 'info', { title });
    }

    /**
     * Show success notification
     */
    showSuccess(message, title = 'Success') {
        return this.show(message, 'success', { title });
    }

    /**
     * Show warning notification
     */
    showWarning(message, title = 'Warning') {
        return this.show(message, 'warning', { title });
    }

    /**
     * Create and display a notification
     */
    createNotification(type, config) {
        const id = this.nextNotificationId++;

        // Check if we have too many notifications
        if (this.notifications.size >= this.maxConcurrentNotifications) {
            this.notificationQueue.push({ type, config, id });
            return id;
        }

        // Create notification element
        const notification = this.createElement(type, config, id);

        // Store notification
        this.notifications.set(id, {
            element: notification,
            config: config,
            type: type,
            createdAt: Date.now(),
            timeoutId: null
        });

        // Add to container
        this.container.appendChild(notification);

        // Position notification
        this.updateNotificationPositions();

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Set up auto-close timer
        if (config.autoClose && config.duration > 0) {
            this.setAutoCloseTimer(id, config.duration);
        }

        return id;
    }

    /**
     * Create notification DOM element
     */
    createElement(type, config, id) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.notificationId = id;

        // Create content
        const content = document.createElement('div');
        content.className = 'notification-content';

        // Icon
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.textContent = config.icon;

        // Body
        const body = document.createElement('div');
        body.className = 'notification-body';

        // Title
        const title = document.createElement('div');
        title.className = 'notification-title';
        title.textContent = config.title;

        // Message
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = config.message;

        body.appendChild(title);
        body.appendChild(message);

        // Actions
        if (config.actions && config.actions.length > 0) {
            const actions = document.createElement('div');
            actions.className = 'notification-actions';

            config.actions.forEach(action => {
                const button = document.createElement('button');
                button.className = `notification-btn ${action.primary ? 'primary' : ''}`;
                button.textContent = action.text;
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (action.onClick) {
                        action.onClick(this.notifications.get(id));
                    }
                });
                actions.appendChild(button);
            });

            body.appendChild(actions);
        }

        content.appendChild(icon);
        content.appendChild(body);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismiss(id);
        });

        notification.appendChild(content);
        notification.appendChild(closeBtn);

        // Progress bar
        if (config.showProgress && config.duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'notification-progress';
            progress.style.width = '100%';
            notification.appendChild(progress);

            // Animate progress
            setTimeout(() => {
                progress.style.transition = `width ${config.duration}ms linear`;
                progress.style.width = '0%';
            }, 100);
        }

        // Click handler
        notification.addEventListener('click', () => {
            if (config.onClick) {
                config.onClick(this.notifications.get(id));
            } else {
                this.dismiss(id);
            }
        });

        return notification;
    }

    /**
     * Update positions of all notifications
     */
    updateNotificationPositions() {
        const notifications = Array.from(this.container.children);

        notifications.forEach((notification, index) => {
            const offset = index * this.stackOffset;
            notification.style.transform = `translateY(${offset}px)`;
        });
    }

    /**
     * Set auto-close timer for notification
     */
    setAutoCloseTimer(id, duration) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        if (notificationData.timeoutId) {
            clearTimeout(notificationData.timeoutId);
        }

        notificationData.timeoutId = setTimeout(() => {
            this.dismiss(id);
        }, duration);
    }

    /**
     * Dismiss a notification
     */
    dismiss(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const { element, timeoutId } = notificationData;

        // Clear timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Animate out
        element.classList.remove('show');
        element.classList.add('hide');

        // Remove after animation
        setTimeout(() => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
            this.notifications.delete(id);
            this.updateNotificationPositions();
            this.processQueue();
        }, this.animationDuration);
    }

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.dismiss(id));
    }

    /**
     * Process notification queue
     */
    processQueue() {
        if (this.notificationQueue.length === 0) return;
        if (this.notifications.size >= this.maxConcurrentNotifications) return;

        const { type, config, id } = this.notificationQueue.shift();
        this.createNotification(type, config);
    }

    /**
     * Play notification sound
     */
    playSound(soundType) {
        if (!this.audioManager) return;

        switch (soundType) {
            case 'achievement':
                this.audioManager.playAchievement();
                break;
            case 'unlock':
                this.audioManager.playBotUnlock();
                break;
            case 'crash':
                this.audioManager.playMarketCrash();
                break;
            case 'welcome':
                this.audioManager.playWelcome();
                break;
            default:
                this.audioManager.playButtonClick();
        }
    }

    /**
     * Get default title for notification type
     */
    getDefaultTitle(type) {
        const titles = {
            info: 'Information',
            success: 'Success',
            warning: 'Warning',
            error: 'Error',
            system: 'System',
            achievement: 'Achievement',
            unlock: 'Unlocked',
            crash: 'Market Event'
        };

        return titles[type] || 'Notification';
    }

    /**
     * Get default icon for notification type
     */
    getDefaultIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            system: '🔧',
            achievement: '🏆',
            unlock: '🔓',
            crash: '💥'
        };

        return icons[type] || '📢';
    }

    /**
     * Get notification count
     */
    getNotificationCount() {
        return this.notifications.size;
    }

    /**
     * Get queue length
     */
    getQueueLength() {
        return this.notificationQueue.length;
    }

    /**
     * Clear notification queue
     */
    clearQueue() {
        this.notificationQueue = [];
    }

    /**
     * Cleanup method
     */
    destroy() {
        // Dismiss all notifications
        this.dismissAll();

        // Clear queue
        this.clearQueue();

        // Remove container
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }

        // Remove styles
        const styles = document.getElementById('notificationStyles');
        if (styles && styles.parentElement) {
            styles.parentElement.removeChild(styles);
        }

        // Clear references
        this.audioManager = null;

        console.log('NotificationManager destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
} else if (typeof window !== 'undefined') {
    window.NotificationManager = NotificationManager;
}
