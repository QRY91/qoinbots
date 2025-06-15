<script>
    import { fly, scale, fade } from "svelte/transition";
    import { bots, activeBots, gameActions } from "../stores/gameStores.js";

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    // Handle bot interactions
    function handleBotClick(bot) {
        gameActions.showModal("bot-details", { bot });
    }

    function toggleBot(bot) {
        gameActions.updateBot(bot.id, { active: !bot.active });
        gameActions.addEvent({
            type: "info",
            text: `${bot.name} ${bot.active ? "deactivated" : "activated"}`,
            botId: bot.id,
        });
    }

    // Get bot status display
    function getBotStatus(bot) {
        if (!bot.active) return { text: "Inactive", class: "inactive" };
        if (bot.isTrading) return { text: "Trading", class: "trading" };
        return { text: "Idle", class: "idle" };
    }

    // Get bot performance class
    function getPerformanceClass(profit) {
        if (profit > 0) return "positive";
        if (profit < 0) return "negative";
        return "neutral";
    }
</script>

<section class="bot-roster">
    <div class="roster-header">
        <h3>Bot Collective</h3>
        <div class="roster-stats">
            <span class="bot-count">{$bots.length} bots</span>
            <span class="active-count">{$activeBots.length} active</span>
        </div>
    </div>

    <div class="bot-list">
        {#each $bots as bot (bot.id)}
            <div
                class="bot-card"
                class:active={bot.active}
                transition:fly={{ y: 20, duration: 300 }}
                on:click={() => handleBotClick(bot)}
            >
                <div class="bot-avatar">
                    <span class="avatar-emoji">{bot.avatar || "🤖"}</span>
                    <div
                        class="status-indicator"
                        class:active={bot.active}
                    ></div>
                </div>

                <div class="bot-info">
                    <div class="bot-header">
                        <h4 class="bot-name">{bot.name}</h4>
                        <span class="bot-level">Lv.{bot.level || 1}</span>
                    </div>

                    <div class="bot-personality">
                        {bot.personality?.name || "Unknown"}
                    </div>

                    <div class="bot-stats">
                        <div class="stat">
                            <span class="stat-label">Balance</span>
                            <span class="stat-value"
                                >{formatCurrency(bot.balance || 0)}</span
                            >
                        </div>
                        <div class="stat">
                            <span class="stat-label">Trades</span>
                            <span class="stat-value"
                                >{bot.totalTrades || 0}</span
                            >
                        </div>
                        <div class="stat">
                            <span class="stat-label">Profit</span>
                            <span
                                class="stat-value {getPerformanceClass(
                                    bot.totalProfit || 0,
                                )}"
                            >
                                {formatCurrency(bot.totalProfit || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="bot-controls">
                    <div class="bot-status {getBotStatus(bot).class}">
                        {getBotStatus(bot).text}
                    </div>

                    <button
                        class="toggle-btn"
                        class:active={bot.active}
                        on:click|stopPropagation={() => toggleBot(bot)}
                        title={bot.active ? "Deactivate bot" : "Activate bot"}
                    >
                        {bot.active ? "⏸️" : "▶️"}
                    </button>
                </div>
            </div>
        {/each}

        {#if $bots.length === 0}
            <div class="empty-state" transition:fade>
                <div class="empty-icon">🤖</div>
                <h4>No bots yet</h4>
                <p>
                    Your trading bot collective will appear here as you
                    progress.
                </p>
            </div>
        {/if}

        <!-- Add Bot Button (for future phases) -->
        {#if $bots.length > 0 && $bots.length < 8}
            <button
                class="add-bot-btn"
                on:click={() => gameActions.showModal("add-bot")}
                transition:scale={{ duration: 200 }}
            >
                <span class="add-icon">+</span>
                <span>Add Bot</span>
            </button>
        {/if}
    </div>
</section>

<style>
    .bot-roster {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        min-height: 400px;
    }

    .roster-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .roster-header h3 {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
    }

    .roster-stats {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
    }

    .bot-count,
    .active-count {
        color: #9ca3af;
        font-weight: 500;
    }

    .active-count {
        color: #10b981;
    }

    .bot-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex: 1;
    }

    .bot-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .bot-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(59, 130, 246, 0.3);
        transform: translateY(-1px);
    }

    .bot-card.active {
        border-color: rgba(16, 185, 129, 0.3);
        background: rgba(16, 185, 129, 0.05);
    }

    .bot-avatar {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 50%;
        border: 2px solid rgba(59, 130, 246, 0.3);
    }

    .avatar-emoji {
        font-size: 1.5rem;
    }

    .status-indicator {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #6b7280;
        border: 2px solid #1a1a2e;
    }

    .status-indicator.active {
        background: #10b981;
    }

    .bot-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .bot-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .bot-name {
        color: #ffffff;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    }

    .bot-level {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
    }

    .bot-personality {
        color: #9ca3af;
        font-size: 0.85rem;
        font-style: italic;
    }

    .bot-stats {
        display: flex;
        gap: 1rem;
    }

    .stat {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .stat-label {
        color: #6b7280;
        font-size: 0.7rem;
        text-transform: uppercase;
        font-weight: 500;
    }

    .stat-value {
        color: #ffffff;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .stat-value.positive {
        color: #10b981;
    }

    .stat-value.negative {
        color: #ef4444;
    }

    .bot-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .bot-status {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 8px;
        text-transform: uppercase;
    }

    .bot-status.active {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }

    .bot-status.inactive {
        background: rgba(107, 114, 128, 0.2);
        color: #6b7280;
    }

    .bot-status.trading {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
        animation: pulse 2s ease-in-out infinite;
    }

    .bot-status.idle {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
    }

    .toggle-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #ffffff;
        width: 32px;
        height: 32px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
    }

    .toggle-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .toggle-btn.active {
        background: rgba(16, 185, 129, 0.2);
        border-color: #10b981;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
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
    }

    .add-bot-btn {
        background: rgba(59, 130, 246, 0.1);
        border: 2px dashed rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        color: #3b82f6;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: 600;
    }

    .add-bot-btn:hover {
        background: rgba(59, 130, 246, 0.2);
        border-color: rgba(59, 130, 246, 0.5);
    }

    .add-icon {
        font-size: 1.2rem;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }

    @media (max-width: 768px) {
        .bot-roster {
            margin: 0.5rem;
            padding: 1rem;
        }

        .bot-card {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
        }

        .bot-info {
            align-items: center;
        }

        .bot-stats {
            justify-content: center;
        }

        .bot-controls {
            flex-direction: row;
        }
    }
</style>
