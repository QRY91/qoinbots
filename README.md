# 🤖 QOINbots - The Trading Bot Collective
*An addictive incremental idle game where philosophical AI trading bots teach you market psychology*

**Status**: ✅ **Working TypeScript Implementation** - Fully playable with robust bot trading system

## 🚀 Quick Start

### **Recommended: Use the launch script**
```bash
cd qoinbots
./play.sh
```
Then open: **http://localhost:4500**

### **Alternative: Direct npm command**
```bash
cd qoinbots/frontend-svelte
npm run qoinbots
```
Auto-opens browser at **http://localhost:4500**

### **Manual setup**
```bash
cd qoinbots/frontend-svelte
npm install
npm run dev
```
Then open: **http://localhost:4500**

## 🎮 What You'll See

- **Socratic Sam** - Your first philosophical trading bot with $1,000 starting balance
- **Real-time trading** - Watch bots make decisions and execute trades
- **Live market chart** - QOIN, HODL, and MOON assets with dynamic pricing
- **Market cycles** - Growth, bubble, peak, crash, recovery phases
- **Bot personalities** - Each bot has unique trading psychology and speech patterns

## 🔧 Debug & Development

Open browser console and use debug functions:

```javascript
// List all bots and their status
window.qoinDebug.listBots()

// Check why a bot isn't trading
window.qoinDebug.checkTradingConditions("bot-1")

// Force a trade for testing
window.qoinDebug.forceTrade("bot-1")

// Add a test bot with specific personality
window.qoinDebug.addTestBot("momentum")

// Trigger market events
window.qoinDebug.forceCrash()
window.qoinDebug.setPhase("bubble")

// Reset game completely
window.qoinDebug.resetGame()
```

## 🛠️ Technical Architecture

### **Robust TypeScript Implementation**
- **GameState.ts** - Central state management with full typing (850+ lines)
- **Bot.ts** - Individual bot behavior with personality system (980+ lines)  
- **TradingEngine.ts** - Market simulation and price dynamics (766+ lines)
- **Comprehensive types** - 346 lines of TypeScript definitions

### **Key Features**
- ✅ **Full TypeScript** - Eliminates class constructor errors and property mismatches
- ✅ **Proper scaling** - $1,000 starting balance, realistic trade amounts
- ✅ **Port isolation** - Uses port 4500 to avoid conflicts with other projects
- ✅ **Event-driven** - Clean separation between game engine and UI
- ✅ **Persistent state** - LocalStorage save/load with offline progress simulation
- ✅ **Market dynamics** - Realistic volatility, trends, support/resistance levels

### **Bot Personality System**
Each bot has:
- **Traits**: Risk tolerance, greed, fear, intelligence, patience, herding behavior
- **Preferences**: Preferred assets, position sizing, trading frequency
- **Mood System**: Dynamic emotional states affecting trading behavior
- **Speech Patterns**: Personality-specific commentary on trades and market events
- **Performance Tracking**: Win rate, biggest wins/losses, trading statistics

### **Market Simulation**
- **Multi-asset trading** - QOIN, HODL, MOON with different volatility profiles
- **Market cycles** - Automated progression through economic phases
- **Price impact** - Large trades affect market prices
- **Technical analysis** - Trend strength, support/resistance, mean reversion
- **Volatility modeling** - Realistic price movements with Box-Muller transformation

## 📁 Project Structure

```
qoinbots/
├── README.md                    # This file
├── play.sh                     # Launch script (port 4500)
├── build.sh                    # Production build script
├── frontend-svelte/            # Main Svelte + TypeScript application
│   ├── src/
│   │   ├── App.svelte         # Main app component
│   │   ├── main.ts            # TypeScript entry point
│   │   └── lib/
│   │       ├── types/         # TypeScript type definitions
│   │       │   └── index.ts   # Comprehensive game types (346 lines)
│   │       ├── game-engine/   # Core TypeScript game systems
│   │       │   ├── GameState.ts      # State management (850+ lines)
│   │       │   ├── Bot.ts            # Bot behavior (980+ lines)
│   │       │   ├── TradingEngine.ts  # Market simulation (766+ lines)
│   │       │   └── *.js             # Legacy JS files (kept for compatibility)
│   │       ├── components/    # Svelte UI components
│   │       └── stores/        # Svelte state stores
│   ├── package.json          # Dependencies (Svelte 5, TypeScript, Vite)
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.js        # Vite build configuration
└── docs/                     # Development documentation
    ├── CONTEXT_HANDOVER*.md  # Development history and context
    └── *.md                  # Various design and planning docs
```

## 🎯 Current Gameplay

### **Phase 1: Single Bot Trading**
- Start with **Socratic Sam** (philosophical personality)
- $1,000 starting balance per bot
- Watch real-time trading decisions with market commentary
- Bot mood affects trading frequency and risk-taking
- Persistent progress with localStorage saves

### **Bot Personalities Available**
- **Philosophical** - "The market whispers secrets to those who listen..."
- **Diamond Hands** - "HODL through the storm! 💎🙌"  
- **Contrarian** - "When others fear, I get greedy!"
- **Pessimistic** - "I knew this would happen!"
- **Momentum** - "Riding the momentum wave! 🚀"
- **Panic** - "PANIC SELL! GET OUT NOW!"
- **Balanced** - "Making a calculated purchase."
- **Enlightened** - "The cosmic flow suggests accumulation."

### **Market Dynamics**
- **5 Market Phases**: Growth → Bubble → Peak → Crash → Recovery
- **Dynamic pricing** with realistic volatility
- **Asset characteristics**:
  - **QOIN**: $100 starting, moderate volatility
  - **HODL**: $2,500 starting, low volatility  
  - **MOON**: $25 starting, high volatility

## 🚀 Development Status

### **✅ Completed (TypeScript Migration)**
- Full TypeScript conversion of game engine
- Robust type system preventing runtime errors
- $1,000 balance scaling working correctly
- Clean port separation (4500) avoiding conflicts
- Working bot trading with personality system
- Market simulation with realistic price movements
- Save/load system with offline progress
- Debug tools and development utilities

### **🎯 Next Features**
- Multi-bot collections (unlock additional bots)
- Bot interaction and trading between bots
- Achievement system and progression unlocks
- Enhanced UI animations and visual feedback
- Mobile responsiveness improvements

## 🛡️ Quality Assurance

### **Type Safety**
- Comprehensive TypeScript types prevent property mismatches
- Compile-time error checking eliminates runtime bugs
- Strong typing for bot configurations, market data, and trade records

### **Testing**
- Debug console functions for all major game systems
- Isolated component testing with bot trading simulation
- Market stress testing with forced crashes and phase changes

### **Performance**
- Efficient event-driven architecture
- Optimized trading calculations with minimal CPU usage
- Smart caching and persistence strategies

## 🎮 Vision

QOINbots teaches behavioral finance through addictive incremental gameplay. Watch AI bots with distinct personalities make trading decisions, learn from their successes and failures, and understand how psychology drives market behavior.

**It's Cookie Clicker meets The Big Short meets Tamagotchi.**

## 🤝 Contributing

The codebase is now fully TypeScript with comprehensive type coverage. Perfect for developers interested in:

- **Game development** with TypeScript and Svelte
- **Trading simulation** and market psychology  
- **AI personality modeling** and behavior systems
- **Educational game design** and behavioral science

## 📜 License

MIT License - Build upon this educational trading simulation.

---

*"I trade, therefore I am... eventually wiser about money." - Socratic Sam*

**Ready to play? Run `./play.sh` and meet your first trading bot! 🤖📈**