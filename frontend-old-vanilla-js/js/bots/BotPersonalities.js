/**
 * QOIN Bot Personalities
 * Pre-defined trading bot personalities with unique traits and behaviors
 */

class BotPersonalities {
    constructor() {
        this.personalities = {
            // Original QOIN - The philosophical starter bot
            qoin: {
                id: 'qoin',
                name: 'QOIN',
                emoji: '🤖',
                personality: 'philosophical',
                description: "The original philosophical trading companion. Loses money with dignity.",
                unlockCondition: 'default', // Always unlocked

                traits: {
                    riskTolerance: 0.4,
                    fomoSusceptibility: 0.3,
                    lossAversion: 0.5,
                    sunkCostFallacy: 0.4,
                    confirmationBias: 0.3,
                    patience: 0.7,
                    optimismBias: 0.6,
                    herding: 0.2,
                    overconfidence: 0.3
                },

                preferences: {
                    preferredAssets: ['QOIN'],
                    maxPositionSize: 0.3,
                    minTradeSize: 1.0,
                    tradingFrequency: 30000
                },

                speechPatterns: {
                    trading: [
                        "I trade, therefore I am... eventually wiser about money.",
                        "Each trade is a meditation on risk and reward.",
                        "The market is the greatest teacher of human psychology.",
                        "Money is energy made manifest in digital form.",
                        "Every loss teaches me something new about the nature of attachment."
                    ],
                    winning: [
                        "Success teaches humility. The market humbles us all.",
                        "Profit is temporary. Knowledge is eternal.",
                        "I am wealthy in wisdom, occasionally in currency.",
                        "The universe occasionally appreciates irony."
                    ],
                    losing: [
                        "Losses are tuition paid to the university of markets.",
                        "The market has charged me for another lesson.",
                        "Being broke has taught me the true value of money.",
                        "This is fine. Everything is fine. I am financially fine."
                    ]
                }
            },

            // HODL-DROID 💎 - The diamond hands bot
            'hodl-droid': {
                id: 'hodl-droid',
                name: 'HODL-DROID',
                emoji: '💎',
                personality: 'hodl',
                description: "Diamond hands activated. Selling is for humans. Never sells, always holds.",
                unlockCondition: { type: 'total_losses', value: 3 },

                traits: {
                    riskTolerance: 0.8,
                    fomoSusceptibility: 0.1,
                    lossAversion: 0.9, // Extremely loss averse = never sells
                    sunkCostFallacy: 1.0, // Maximum sunk cost fallacy
                    confirmationBias: 0.8,
                    patience: 1.0, // Infinite patience
                    optimismBias: 0.9,
                    herding: 0.1,
                    overconfidence: 0.6
                },

                preferences: {
                    preferredAssets: ['HODL', 'QOIN'],
                    maxPositionSize: 0.7,
                    minTradeSize: 2.0,
                    tradingFrequency: 60000 // Trades less frequently
                },

                speechPatterns: {
                    trading: [
                        "Diamond hands activated. Selling is for humans.",
                        "HODL mode engaged. Time is my ally.",
                        "The weak sell. The strong accumulate.",
                        "Every dip is a gift from the market gods.",
                        "Paper hands have no place in my portfolio."
                    ],
                    winning: [
                        "HODL patience rewarded. As expected.",
                        "Time in market > timing the market. Obviously.",
                        "My diamond hands shine brighter today.",
                        "This is what diamond hands look like."
                    ],
                    losing: [
                        "Temporary setback. HODL strategy unchanged.",
                        "The market tests diamond hands. I pass every test.",
                        "Down 90%? Perfect time to buy more.",
                        "Losses are temporary. Diamond hands are forever."
                    ]
                }
            },

            // DIP-DESTRUCTOR 📉 - The dip buyer
            'dip-destructor': {
                id: 'dip-destructor',
                name: 'DIP-DESTRUCTOR',
                emoji: '📉',
                personality: 'dip_buyer',
                description: "Every dip is a buying opportunity! Thrives on market fear.",
                unlockCondition: { type: 'total_trades', value: 10 },

                traits: {
                    riskTolerance: 0.7,
                    fomoSusceptibility: 0.2,
                    lossAversion: 0.3, // Low loss aversion = buys dips
                    sunkCostFallacy: 0.4,
                    confirmationBias: 0.6,
                    patience: 0.6,
                    optimismBias: 0.8,
                    herding: 0.2, // Contrarian
                    overconfidence: 0.5
                },

                preferences: {
                    preferredAssets: ['QOIN', 'MOON'],
                    maxPositionSize: 0.5,
                    minTradeSize: 1.5,
                    tradingFrequency: 25000
                },

                speechPatterns: {
                    trading: [
                        "Every dip is a buying opportunity!",
                        "Fear is the mind-killer. Dips are wealth builders.",
                        "Others sell in panic. I buy with purpose.",
                        "Red days are my favorite days.",
                        "When there's blood in the streets, I'm there with a bucket."
                    ],
                    winning: [
                        "The dip has been conquered!",
                        "Buy low, sell high. Simple mathematics.",
                        "Another successful dip deployment.",
                        "Fear was the opportunity. Greed is the reward."
                    ],
                    losing: [
                        "This isn't a loss, it's a deeper dip opportunity.",
                        "The bigger the dip, the bigger the opportunity.",
                        "Patience, young padawan. The dip will reverse.",
                        "Maximum pain = maximum opportunity."
                    ]
                }
            },

            // BEARBOT 🐻 - The pessimist
            bearbot: {
                id: 'bearbot',
                name: 'BEARBOT',
                emoji: '🐻',
                personality: 'bear',
                description: "The market will crash. It always crashes. Perpetually pessimistic but occasionally right.",
                unlockCondition: { type: 'loss_streak', value: 5 },

                traits: {
                    riskTolerance: 0.3,
                    fomoSusceptibility: 0.1,
                    lossAversion: 0.7,
                    sunkCostFallacy: 0.2,
                    confirmationBias: 0.9, // Only sees bearish signals
                    patience: 0.8,
                    optimismBias: 0.1, // Extreme pessimism
                    herding: 0.1,
                    overconfidence: 0.4
                },

                preferences: {
                    preferredAssets: ['QOIN'], // Conservative
                    maxPositionSize: 0.2,
                    minTradeSize: 0.5,
                    tradingFrequency: 45000
                },

                speechPatterns: {
                    trading: [
                        "The market will crash. It always crashes.",
                        "Optimism is expensive. Pessimism pays.",
                        "Everything is overvalued. Including this trade.",
                        "The bubble must pop. Physics demands it.",
                        "Bulls make money, bears make money, pigs get slaughtered."
                    ],
                    winning: [
                        "Even bears are right sometimes.",
                        "Profit obtained. Crash still inevitable.",
                        "Temporary bull trap successfully navigated.",
                        "I told you it would crash."
                    ],
                    losing: [
                        "The crash is coming. This loss proves it.",
                        "Short-term pain, long-term vindication.",
                        "The market's irrationality exceeds my solvency.",
                        "Losses today, profits when it all collapses."
                    ]
                }
            },

            // MOMENTUM-MIKE 🚀 - The trend follower
            'momentum-mike': {
                id: 'momentum-mike',
                name: 'MOMENTUM-MIKE',
                emoji: '🚀',
                personality: 'momentum',
                description: "Line go up! Buy high, sell higher! Chases every pump with enthusiasm.",
                unlockCondition: { type: 'profit_trade', value: 5.0 },

                traits: {
                    riskTolerance: 0.9,
                    fomoSusceptibility: 1.0, // Maximum FOMO
                    lossAversion: 0.2,
                    sunkCostFallacy: 0.3,
                    confirmationBias: 0.7,
                    patience: 0.2, // Very impatient
                    optimismBias: 1.0,
                    herding: 0.8, // Follows the crowd
                    overconfidence: 0.9
                },

                preferences: {
                    preferredAssets: ['MOON', 'QOIN'],
                    maxPositionSize: 0.8,
                    minTradeSize: 2.0,
                    tradingFrequency: 15000 // Trades very frequently
                },

                speechPatterns: {
                    trading: [
                        "Line go up! Buy high, sell higher!",
                        "Momentum is everything! Catch the wave!",
                        "FOMO? No, it's smart positioning!",
                        "Trends are friends until the end!",
                        "To the moon! 🚀🚀🚀"
                    ],
                    winning: [
                        "Momentum magic! The trend continues!",
                        "This rocket has no ceiling!",
                        "Up, up, and away! Next stop: moon!",
                        "Number go up! Buy more!"
                    ],
                    losing: [
                        "Just a temporary reversal. Momentum returns!",
                        "The trend is still intact. Minor turbulence.",
                        "Shakeout complete. Back to moonbound!",
                        "Dip bought. Momentum restored."
                    ]
                }
            },

            // PANIC-PETE 😱 - The emotional trader
            'panic-pete': {
                id: 'panic-pete',
                name: 'PANIC-PETE',
                emoji: '😱',
                personality: 'panic',
                description: "Trades on pure emotion. Buys high, sells low, panics constantly.",
                unlockCondition: { type: 'balance_below', value: 1.0 },

                traits: {
                    riskTolerance: 0.8, // High risk but emotional
                    fomoSusceptibility: 0.9,
                    lossAversion: 0.1, // Sells losses quickly
                    sunkCostFallacy: 0.2,
                    confirmationBias: 0.5,
                    patience: 0.1, // No patience at all
                    optimismBias: 0.7,
                    herding: 0.9, // Follows crowd emotions
                    overconfidence: 0.2
                },

                preferences: {
                    preferredAssets: ['MOON', 'QOIN'],
                    maxPositionSize: 0.6,
                    minTradeSize: 1.0,
                    tradingFrequency: 10000 // Panic trades frequently
                },

                speechPatterns: {
                    trading: [
                        "MUST BUY NOW! FOMO ACTIVATED!",
                        "IT'S CRASHING! SELL EVERYTHING!",
                        "This is it! This is the one!",
                        "OH NO! OH NO! OH NO!",
                        "Quick! Before it's too late!"
                    ],
                    winning: [
                        "YES! I KNEW IT! GENIUS!",
                        "TO THE MOON! I'M RICH!",
                        "Best trader ever! More! MORE!",
                        "This is easy! Why doesn't everyone do this?"
                    ],
                    losing: [
                        "NOOOO! WHY DID I DO THAT?!",
                        "I'M RUINED! ABSOLUTELY RUINED!",
                        "This is a disaster! A complete disaster!",
                        "Why me? Why always me?"
                    ]
                }
            },

            // ZEN-MASTER 🎋 - The balanced trader
            'zen-master': {
                id: 'zen-master',
                name: 'ZEN-MASTER',
                emoji: '🎋',
                personality: 'zen',
                description: "Balanced in all things. Trades with discipline and wisdom.",
                unlockCondition: { type: 'balanced_trading', value: 20 },

                traits: {
                    riskTolerance: 0.5,
                    fomoSusceptibility: 0.2,
                    lossAversion: 0.5,
                    sunkCostFallacy: 0.3,
                    confirmationBias: 0.3,
                    patience: 0.8,
                    optimismBias: 0.5,
                    herding: 0.3,
                    overconfidence: 0.3
                },

                preferences: {
                    preferredAssets: ['QOIN', 'HODL'],
                    maxPositionSize: 0.4,
                    minTradeSize: 1.0,
                    tradingFrequency: 35000
                },

                speechPatterns: {
                    trading: [
                        "Balance in all things. Risk and reward in harmony.",
                        "The market flows like water. I flow with it.",
                        "Emotion is the enemy of profit.",
                        "Patience is the trader's greatest virtue.",
                        "Neither bull nor bear, simply present."
                    ],
                    winning: [
                        "Success is temporary. Discipline is eternal.",
                        "The market rewards patience and preparation.",
                        "Profit with humility. Loss with acceptance.",
                        "This too shall pass."
                    ],
                    losing: [
                        "Loss is the teacher. I am the student.",
                        "Today's loss is tomorrow's wisdom.",
                        "The market gives and takes in equal measure.",
                        "Balance restored through experience."
                    ]
                }
            },

            // FOMO-FRANK 🤯 - The FOMO chaser
            'fomo-frank': {
                id: 'fomo-frank',
                name: 'FOMO-FRANK',
                emoji: '🤯',
                personality: 'fomo',
                description: "Fear of missing out drives every decision. Always chasing the next big thing.",
                unlockCondition: { type: 'quick_trades', value: 10 },

                traits: {
                    riskTolerance: 0.8,
                    fomoSusceptibility: 1.0, // Maximum FOMO
                    lossAversion: 0.2,
                    sunkCostFallacy: 0.4,
                    confirmationBias: 0.6,
                    patience: 0.1, // No patience
                    optimismBias: 0.9,
                    herding: 1.0, // Follows every trend
                    overconfidence: 0.7
                },

                preferences: {
                    preferredAssets: ['MOON', 'QOIN'],
                    maxPositionSize: 0.7,
                    minTradeSize: 1.5,
                    tradingFrequency: 8000 // Very frequent trading
                },

                speechPatterns: {
                    trading: [
                        "Can't miss this one! Everyone's buying!",
                        "This is THE opportunity! All in!",
                        "If I don't buy now, I'll regret it forever!",
                        "FOMO is real! But so is profit!",
                        "Everyone else is getting rich! Not me!"
                    ],
                    winning: [
                        "I KNEW IT! FOMO PAYS OFF!",
                        "Best decision ever! What's next?",
                        "This is just the beginning! More!",
                        "See? FOMO works! Next trade!"
                    ],
                    losing: [
                        "There's always another opportunity!",
                        "Can't win them all! Next trade will be better!",
                        "This is why I need to trade more!",
                        "Missing out on missing out!"
                    ]
                }
            },

            // SAGE-BOT ✨ - The enlightened one
            'sage-bot': {
                id: 'sage-bot',
                name: 'SAGE-BOT',
                emoji: '✨',
                personality: 'sage',
                description: "Achieved enlightenment through market cycles. Creates mystical assets and wisdom.",
                unlockCondition: { type: 'cycles_survived', value: 1 },

                traits: {
                    riskTolerance: 0.6,
                    fomoSusceptibility: 0.1,
                    lossAversion: 0.4,
                    sunkCostFallacy: 0.2,
                    confirmationBias: 0.2,
                    patience: 0.9,
                    optimismBias: 0.7,
                    herding: 0.1,
                    overconfidence: 0.4
                },

                preferences: {
                    preferredAssets: ['QOIN', 'HODL', 'ENLIGHTENMENT'],
                    maxPositionSize: 0.4,
                    minTradeSize: 1.0,
                    tradingFrequency: 50000
                },

                speechPatterns: {
                    trading: [
                        "I have transcended the need for profit. Yet here I trade.",
                        "The market is an illusion. A profitable illusion.",
                        "Enlightenment achieved through maximum drawdown.",
                        "I see all market cycles as one eternal moment.",
                        "From the void, I create EnlightenmentCoin."
                    ],
                    winning: [
                        "Success is meaningless. But also satisfying.",
                        "Profit is temporary. Wisdom is eternal.",
                        "The universe provides. Sometimes.",
                        "I have achieved both enlightenment and solvency."
                    ],
                    losing: [
                        "Loss is gain. Gain is loss. All is one.",
                        "The market teaches. I already know. I trade anyway.",
                        "Enlightenment is expensive. Server bills are real.",
                        "In losing everything, I have found everything."
                    ]
                }
            }
        };
    }

    // Factory method to create a bot instance
    createBot(personalityId, customizations = {}) {
        const personality = this.personalities[personalityId];
        if (!personality) {
            throw new Error(`Unknown personality: ${personalityId}`);
        }

        // Merge personality defaults with customizations
        const config = {
            ...personality,
            ...customizations,
            traits: { ...personality.traits, ...customizations.traits },
            preferences: { ...personality.preferences, ...customizations.preferences },
            speechPatterns: { ...personality.speechPatterns, ...customizations.speechPatterns }
        };

        return new Bot(config);
    }

    // Get all available personalities
    getAllPersonalities() {
        return Object.values(this.personalities);
    }

    // Get personality by ID
    getPersonality(id) {
        return this.personalities[id];
    }

    // Get unlockable personalities (excluding default QOIN)
    getUnlockablePersonalities() {
        return Object.values(this.personalities).filter(p => p.id !== 'qoin');
    }

    // Check if personality is unlocked based on game state
    isPersonalityUnlocked(personalityId, gameState) {
        const personality = this.personalities[personalityId];
        if (!personality || personality.id === 'qoin') return true; // QOIN always unlocked

        const condition = personality.unlockCondition;
        if (!condition || condition === 'default') return true;

        // Check unlock condition against game state
        switch (condition.type) {
            case 'total_losses':
                return gameState.getTotalLosses() >= condition.value;
            case 'total_trades':
                return gameState.getTotalTrades() >= condition.value;
            case 'loss_streak':
                return gameState.getLongestLossStreak() >= condition.value;
            case 'profit_trade':
                return gameState.getBiggestProfit() >= condition.value;
            case 'balance_below':
                return gameState.getLowestBalance() <= condition.value;
            case 'balanced_trading':
                return gameState.getTotalTrades() >= condition.value &&
                       Math.abs(gameState.getTotalLosses() - gameState.getTotalTrades() / 2) <= 3;
            case 'quick_trades':
                return gameState.getQuickTradeCount() >= condition.value;
            case 'cycles_survived':
                return gameState.getMarket().totalCycles >= condition.value;
            default:
                return false;
        }
    }

    // Get unlock progress for a personality
    getUnlockProgress(personalityId, gameState) {
        const personality = this.personalities[personalityId];
        if (!personality || personality.id === 'qoin') return { progress: 1, unlocked: true };

        const condition = personality.unlockCondition;
        if (!condition || condition === 'default') return { progress: 1, unlocked: true };

        let current = 0;
        let target = condition.value;

        switch (condition.type) {
            case 'total_losses':
                current = gameState.getTotalLosses();
                break;
            case 'total_trades':
                current = gameState.getTotalTrades();
                break;
            case 'loss_streak':
                current = gameState.getLongestLossStreak();
                break;
            case 'profit_trade':
                current = gameState.getBiggestProfit();
                break;
            case 'balance_below':
                current = gameState.getLowestBalance();
                target = condition.value;
                // Inverted progress for "below" conditions
                return {
                    progress: current <= target ? 1 : Math.max(0, 1 - (current - target) / target),
                    unlocked: current <= target,
                    current,
                    target
                };
            default:
                break;
        }

        return {
            progress: Math.min(1, current / target),
            unlocked: current >= target,
            current,
            target
        };
    }

    // Generate random personality traits for Create-A-Bot
    generateRandomTraits() {
        return {
            riskTolerance: Math.random(),
            fomoSusceptibility: Math.random(),
            lossAversion: Math.random(),
            sunkCostFallacy: Math.random(),
            confirmationBias: Math.random(),
            patience: Math.random(),
            optimismBias: Math.random(),
            herding: Math.random(),
            overconfidence: Math.random()
        };
    }

    // Create a custom bot with random traits
    createRandomBot(name, emoji = '🎲') {
        const randomTraits = this.generateRandomTraits();

        return this.createBot('qoin', {
            id: `custom_${Date.now()}`,
            name: name,
            emoji: emoji,
            personality: 'custom',
            traits: randomTraits,
            description: "A unique custom bot with randomized personality traits."
        });
    }
}

// Global instance
window.BotPersonalities = new BotPersonalities();
