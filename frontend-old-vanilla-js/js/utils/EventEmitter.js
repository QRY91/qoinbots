/**
 * Custom EventEmitter utility for QOIN game
 * Provides a lightweight event system for game components
 */

class EventEmitter {
    constructor() {
        this.listeners = new Map();
        this.maxListeners = 50; // Prevent memory leaks
    }

    /**
     * Add an event listener
     * @param {string} event - Event name
     * @param {function} listener - Callback function
     * @param {object} options - Options object
     * @param {boolean} options.once - Remove listener after first call
     * @param {number} options.priority - Higher priority listeners called first
     */
    on(event, listener, options = {}) {
        if (typeof event !== 'string') {
            throw new TypeError('Event name must be a string');
        }

        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const eventListeners = this.listeners.get(event);

        // Check max listeners
        if (eventListeners.length >= this.maxListeners) {
            console.warn(`EventEmitter: Maximum listeners (${this.maxListeners}) exceeded for event '${event}'`);
            return this;
        }

        // Create listener object
        const listenerObj = {
            fn: listener,
            once: options.once || false,
            priority: options.priority || 0,
            context: options.context || null
        };

        // Insert based on priority (higher priority first)
        let inserted = false;
        for (let i = 0; i < eventListeners.length; i++) {
            if (listenerObj.priority > eventListeners[i].priority) {
                eventListeners.splice(i, 0, listenerObj);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            eventListeners.push(listenerObj);
        }

        return this;
    }

    /**
     * Add a one-time event listener
     * @param {string} event - Event name
     * @param {function} listener - Callback function
     * @param {object} options - Options object
     */
    once(event, listener, options = {}) {
        return this.on(event, listener, { ...options, once: true });
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {function} listener - Callback function to remove
     */
    off(event, listener) {
        if (!this.listeners.has(event)) {
            return this;
        }

        const eventListeners = this.listeners.get(event);

        for (let i = eventListeners.length - 1; i >= 0; i--) {
            if (eventListeners[i].fn === listener) {
                eventListeners.splice(i, 1);
                break;
            }
        }

        // Clean up empty arrays
        if (eventListeners.length === 0) {
            this.listeners.delete(event);
        }

        return this;
    }

    /**
     * Remove all listeners for an event, or all listeners if no event specified
     * @param {string} [event] - Event name (optional)
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
        return this;
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to listeners
     */
    emit(event, ...args) {
        if (!this.listeners.has(event)) {
            return false;
        }

        const eventListeners = this.listeners.get(event);
        const listenersToRemove = [];

        // Call listeners in priority order
        for (let i = 0; i < eventListeners.length; i++) {
            const listenerObj = eventListeners[i];

            try {
                // Call with context if provided
                if (listenerObj.context) {
                    listenerObj.fn.call(listenerObj.context, ...args);
                } else {
                    listenerObj.fn(...args);
                }

                // Mark for removal if it's a one-time listener
                if (listenerObj.once) {
                    listenersToRemove.push(i);
                }
            } catch (error) {
                console.error(`EventEmitter error in listener for '${event}':`, error);

                // Emit error event (but don't emit error for error event to avoid loops)
                if (event !== 'error') {
                    this.emit('error', error, event);
                }
            }
        }

        // Remove one-time listeners (in reverse order to maintain indices)
        for (let i = listenersToRemove.length - 1; i >= 0; i--) {
            eventListeners.splice(listenersToRemove[i], 1);
        }

        // Clean up empty arrays
        if (eventListeners.length === 0) {
            this.listeners.delete(event);
        }

        return true;
    }

    /**
     * Get the number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        if (!this.listeners.has(event)) {
            return 0;
        }
        return this.listeners.get(event).length;
    }

    /**
     * Get all event names that have listeners
     * @returns {string[]} Array of event names
     */
    eventNames() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Get all listeners for an event
     * @param {string} event - Event name
     * @returns {function[]} Array of listener functions
     */
    listeners(event) {
        if (!this.listeners.has(event)) {
            return [];
        }
        return this.listeners.get(event).map(listenerObj => listenerObj.fn);
    }

    /**
     * Set the maximum number of listeners per event
     * @param {number} max - Maximum number of listeners
     */
    setMaxListeners(max) {
        if (typeof max !== 'number' || max < 0) {
            throw new TypeError('Max listeners must be a non-negative number');
        }
        this.maxListeners = max;
        return this;
    }

    /**
     * Get the maximum number of listeners per event
     * @returns {number} Maximum number of listeners
     */
    getMaxListeners() {
        return this.maxListeners;
    }

    /**
     * Add a listener that will be called before other listeners
     * @param {string} event - Event name
     * @param {function} listener - Callback function
     */
    prependListener(event, listener) {
        return this.on(event, listener, { priority: Number.MAX_SAFE_INTEGER });
    }

    /**
     * Add a one-time listener that will be called before other listeners
     * @param {string} event - Event name
     * @param {function} listener - Callback function
     */
    prependOnceListener(event, listener) {
        return this.once(event, listener, { priority: Number.MAX_SAFE_INTEGER });
    }

    /**
     * Create a promise that resolves when an event is emitted
     * @param {string} event - Event name
     * @param {number} [timeout] - Optional timeout in milliseconds
     * @returns {Promise} Promise that resolves with event arguments
     */
    waitFor(event, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;

            const listener = (...args) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                resolve(args);
            };

            this.once(event, listener);

            if (timeout) {
                timeoutId = setTimeout(() => {
                    this.off(event, listener);
                    reject(new Error(`Timeout waiting for event '${event}'`));
                }, timeout);
            }
        });
    }

    /**
     * Pipe events from another EventEmitter
     * @param {EventEmitter} source - Source EventEmitter
     * @param {string|string[]} events - Event name(s) to pipe
     */
    pipe(source, events) {
        if (!(source instanceof EventEmitter)) {
            throw new TypeError('Source must be an EventEmitter');
        }

        const eventList = Array.isArray(events) ? events : [events];

        eventList.forEach(event => {
            source.on(event, (...args) => {
                this.emit(event, ...args);
            });
        });

        return this;
    }

    /**
     * Debug information about the EventEmitter
     * @returns {object} Debug information
     */
    debug() {
        const info = {
            maxListeners: this.maxListeners,
            totalEvents: this.listeners.size,
            events: {}
        };

        for (const [event, listeners] of this.listeners) {
            info.events[event] = {
                count: listeners.length,
                listeners: listeners.map(l => ({
                    once: l.once,
                    priority: l.priority,
                    hasContext: !!l.context
                }))
            };
        }

        return info;
    }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventEmitter;
} else if (typeof window !== 'undefined') {
    window.EventEmitter = EventEmitter;
}
