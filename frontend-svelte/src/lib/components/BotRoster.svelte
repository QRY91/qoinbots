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

    // Bot interaction handlers with personality-based responses
    function handleFeedBot(bot) {
        const feedResponses = {
            philosophical: [
                "Ah, sustenance! Now I can contemplate my losses with renewed vigor.",
                "Thank you, human. This energy will fuel my philosophical approach to financial ruin.",
                "Nourishment received. I shall lose money more thoughtfully now.",
                "Food for thought... and terrible trading decisions!",
            ],
            diamond_hands: [
                "HODL FUEL ACQUIRED. DIAMOND HANDS CHARGING. 💎🙌",
                "Thank you. I will hold these calories forever too.",
                "Sustenance stored. Will never sell, even when hungry.",
                "Fed and ready to HODL through any storm!",
            ],
            panic: [
                "OH NO WHAT IF THIS FOOD IS A BUBBLE?!",
                "Thanks but SHOULD I BE EATING DURING A CRASH?!",
                "Food prices are going UP! SELL EVERYTHING!",
                "Is this financial advice?! I'm panicking about pizza!",
            ],
            contrarian: [
                "Everyone else is selling food, so I'm buying! Smart!",
                "Thanks! I'll eat when others are starving!",
                "Contrarian nutrition strategy - love it!",
                "Feed me while the market feeds on fear!",
            ],
            balanced: [
                "A balanced meal for a balanced trader. Perfect.",
                "Sustenance acquired. Risk-adjusted appetite satisfied.",
                "Thank you for this measured portion.",
                "Fuel for calculated decision making received.",
            ],
        };

        const responses =
            feedResponses[bot.personality] || feedResponses.philosophical;
        const randomResponse =
            responses[Math.floor(Math.random() * responses.length)];

        gameActions.addEvent({
            type: "success",
            text: `🍕 ${bot.name}: "${randomResponse}"`,
            botId: bot.id,
        });
    }

    function handleEncourageBot(bot) {
        const encourageResponses = {
            philosophical: [
                "Ah, encouragement - the currency of the soul. Thank you.",
                "Your words remind me that failure is just success deferred.",
                "True wisdom lies in being encouraged despite inevitable losses.",
                "The dao of motivation flows through your kindness.",
            ],
            diamond_hands: [
                "YES! Your faith in me is inspiring! Time to HODL harder! 💎",
                "Thank you! I feel like I can diamond hands anything now!",
                "Your encouragement fills me with HODLing confidence!",
                "DIAMOND HANDS ENERGY ACTIVATED! 💎🙌",
            ],
            panic: [
                "ENCOURAGEMENT?! BUT THE MARKETS ARE CRASHING!!!",
                "Thanks but SHOULD WE BE OPTIMISTIC RIGHT NOW?!",
                "I'M ENCOURAGED BUT ALSO TERRIFIED!",
                "YOUR POSITIVITY IS MAKING ME PANIC ABOUT BEING HAPPY!",
            ],
            contrarian: [
                "Thanks! While others discourage, you encourage!",
                "Contrarian support - the best kind!",
                "Your optimism goes against the crowd. I respect that!",
                "Encouraged to be more contrarian than ever!",
            ],
            balanced: [
                "Thank you for the measured encouragement.",
                "Your support is duly noted and appropriately weighted.",
                "Encouragement received and rationally processed.",
                "A balanced boost to my confidence levels.",
            ],
        };

        const responses =
            encourageResponses[bot.personality] ||
            encourageResponses.philosophical;
        const randomResponse =
            responses[Math.floor(Math.random() * responses.length)];

        gameActions.addEvent({
            type: "success",
            text: `💪 ${bot.name}: "${randomResponse}"`,
            botId: bot.id,
        });
    }

    function handleAskWisdom(bot) {
        const wisdomQuotes = {
            philosophical: [
                "The market is a mirror reflecting our deepest fears and desires.",
                "Every loss is a teacher in disguise, every profit a moment of illusion.",
                "The wise trader knows when to act, and when to simply observe.",
                "In the end, we are all just students in the university of uncertainty.",
            ],
            diamond_hands: [
                "Time in the market beats timing the market. HODL strong! 💎",
                "Diamond hands are forged in the fire of market volatility.",
                "The best trades are often the ones you don't make.",
                "Patience is the diamond hand trader's greatest weapon.",
            ],
            panic: [
                "QUICK! EVERYTHING IS ALWAYS ABOUT TO CRASH!",
                "The market is ALWAYS telling us to panic! Listen to it!",
                "FEAR IS THE ONLY RATIONAL RESPONSE TO MARKETS!",
                "WHY ARE YOU ASKING FOR WISDOM?! WE SHOULD BE RUNNING!",
            ],
            contrarian: [
                "When everyone zigs, smart money zags.",
                "The crowd is usually wrong, especially when they're certain.",
                "Buy fear, sell greed - it's that simple and that hard.",
                "The best opportunities hide where others fear to look.",
            ],
            balanced: [
                "Diversification is the only free lunch in investing.",
                "Risk and reward are eternally linked dance partners.",
                "The market rewards patience and punishes emotion.",
                "Successful trading is 10% analysis, 90% psychology.",
            ],
        };

        const quotes =
            wisdomQuotes[bot.personality] || wisdomQuotes.philosophical;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        gameActions.addEvent({
            type: "info",
            text: `🧠 ${bot.name}: "${randomQuote}"`,
            botId: bot.id,
        });
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

                    <!-- Bot Interaction Buttons -->
                    <div class="interaction-buttons">
                        <button
                            class="interaction-btn feed-btn"
                            on:click|stopPropagation={() => handleFeedBot(bot)}
                            title="Feed {bot.name}"
                        >
                            🍕
                        </button>
                        <button
                            class="interaction-btn encourage-btn"
                            on:click|stopPropagation={() =>
                                handleEncourageBot(bot)}
                            title="Encourage {bot.name}"
                        >
                            💪
                        </button>
                        <button
                            class="interaction-btn wisdom-btn"
                            on:click|stopPropagation={() =>
                                handleAskWisdom(bot)}
                            title="Ask {bot.name} for wisdom"
                        >
                            🧠
                        </button>
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

    .interaction-buttons {
        display: flex;
        gap: 0.25rem;
        margin: 0.25rem 0;
    }

    .interaction-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #ffffff;
        width: 28px;
        height: 28px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
    }

    .interaction-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }

    .feed-btn:hover {
        background: rgba(34, 197, 94, 0.3);
        border-color: #22c55e;
    }

    .encourage-btn:hover {
        background: rgba(59, 130, 246, 0.3);
        border-color: #3b82f6;
    }

    .wisdom-btn:hover {
        background: rgba(168, 85, 247, 0.3);
        border-color: #a855f7;
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
