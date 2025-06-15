/**
 * Core type definitions for QOINbots trading system
 * Prevents property mismatches and ensures data flow consistency
 */

// ============================================================================
// ASSET & MARKET TYPES
// ============================================================================

export type AssetSymbol = "QOIN" | "HODL" | "MOON";

export type TradeAction = "buy" | "sell";

export type MarketCycle = "growth" | "bubble" | "peak" | "crash" | "recovery";

export interface AssetData {
  price: number;
  volume: number;
  volatility: number;
  trend: number;
  support: number;
  resistance: number;
  change?: number; // Percentage change
}

export interface MarketData {
  cycle: MarketCycle;
  cycleProgress: number;
  totalCycles: number;
  assets: Record<AssetSymbol, AssetData>;
  botAssets: Record<string, AssetData>; // Bot-created assets
  timestamp: number;
}

export interface PricePoint {
  time: number;
  price: number;
  label: string;
}

// ============================================================================
// TRADING TYPES
// ============================================================================

export interface Trade {
  timestamp: number;
  asset: AssetSymbol;
  action: TradeAction;
  size: number;
  price: number;
  pnl: number; // Profit and Loss
  mood: BotMood;
  confidence: number;
}

export interface TradeEvent {
  botId: string;
  trade: Trade;
}

// ============================================================================
// BOT TYPES
// ============================================================================

export type BotPersonality =
  | "philosophical"
  | "diamond_hands"
  | "contrarian"
  | "pessimistic"
  | "momentum"
  | "panic"
  | "balanced"
  | "enlightened";

export type BotMood =
  | "euphoric"
  | "optimistic"
  | "neutral"
  | "pessimistic"
  | "depressed"
  | "confused"
  | "confident"
  | "anxious";

export interface BotTraits {
  riskTolerance: number; // 0-1
  greed: number; // 0-1
  fear: number; // 0-1
  intelligence: number; // 0-1
  patience: number; // 0-1
  herding: number; // 0-1 (tendency to follow others)
  contrarian: number; // 0-1 (tendency to go against the crowd)
}

export interface BotPreferences {
  preferredAssets: AssetSymbol[];
  maxPositionSize: number; // Fraction of balance (0-1)
  minTradeSize: number; // Minimum dollar amount
  tradingFrequency: number; // Milliseconds between trades
}

export interface BotStats {
  balance: number;
  startingBalance: number;
  totalPnL: number;
  trades: number;
  wins: number;
  losses: number;
  daysAlive: number;
  winRate: number;
  biggestWin?: number;
  biggestLoss?: number;
}

export interface BotMoodData {
  tradeFrequency: number;
  riskMultiplier: number;
  optimismBias: number;
}

export interface BotConfig {
  id: string;
  name: string;
  personality: BotPersonality;
  avatar: string;
  level?: number;
  experience?: number;
  mood?: BotMood;
  isActive?: boolean;
  traits?: Partial<BotTraits>;
  preferences?: Partial<BotPreferences>;
  stats?: Partial<BotStats>;
}

export interface BotInstance {
  id: string;
  name: string;
  personality: BotPersonality;
  avatar: string;
  level: number;
  experience: number;
  mood: BotMood;
  isActive: boolean;
  unlocked: boolean;
  traits: BotTraits;
  preferences: BotPreferences;
  stats: BotStats;
  lastTradeTime: number;
  lastSpeech: number;
  tradeHistory: Trade[];
}

// ============================================================================
// GAME STATE TYPES
// ============================================================================

export interface PlayerStats {
  totalBots: number;
  totalBalance: number;
  totalTrades: number;
  totalProfit: number;
  daysPlayed: number;
  cyclesSurvived: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface UnlockCondition {
  type: "trades" | "losses" | "streak" | "profit" | "balance" | "cycles";
  value: number;
  comparison: "gte" | "lte" | "eq";
}

export interface BotUnlock {
  botId: string;
  conditions: UnlockCondition[];
  unlocked: boolean;
}

export interface CycleState {
  phase: MarketCycle;
  progress: number; // 0-1 within current phase
  intensity: number; // How intense the current phase is
  duration: number; // Ticks in current phase
  phaseDurations: Record<MarketCycle, number>;
}

export interface GameStateData {
  player: PlayerStats;
  bots: Record<string, BotInstance>;
  market: MarketData;
  unlocks: BotUnlock[];
  achievements: Achievement[];
  cycle: CycleState;
  phase: string; // Current game phase
  lastSave: number;
  version: string;
}

// ============================================================================
// EVENT & UI TYPES
// ============================================================================

export type EventType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "profit"
  | "loss"
  | "system";

export interface GameEvent {
  id: number;
  type: EventType;
  text: string;
  botId?: string;
  timestamp: Date;
}

export interface Notification {
  id: number;
  type: EventType;
  message: string;
  botName?: string;
  duration: number;
  timestamp: Date;
}

export interface ModalData {
  type: string;
  data?: Record<string, any>;
}

// ============================================================================
// STORE TYPES (for Svelte stores)
// ============================================================================

export interface GameSettings {
  sound: boolean;
  animations: boolean;
  theme: "dark" | "light";
  autoSave: boolean;
  notificationDuration: number;
}

export interface BotStoreData {
  id: string;
  name: string;
  personality: BotPersonality;
  balance: number;
  active: boolean; // Note: maps to isActive in BotInstance
  totalTrades: number;
  totalProfit: number;
  avatar: string;
  level: number;
  experience: number;
}

// ============================================================================
// ENGINE TYPES
// ============================================================================

export interface MarketUpdateEvent {
  prices: Record<AssetSymbol, AssetData>;
  cycle: CycleState;
  timestamp: number;
}

export interface BotLevelUpEvent {
  id: string;
  name: string;
  level: number;
  experience: number;
}

export interface EngineConfig {
  tickRate: number; // Milliseconds between ticks
  maxDataPoints: number;
  animationDuration: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TimeRange {
  start: number;
  end: number;
}

export interface PriceHistory {
  asset: AssetSymbol;
  data: PricePoint[];
  maxLength: number;
}

export interface TradingSignal {
  strength: number; // -1 to 1 (negative = sell, positive = buy)
  source: string;
  confidence: number; // 0-1
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isAssetSymbol(value: string): value is AssetSymbol {
  return ["QOIN", "HODL", "MOON"].includes(value);
}

export function isTradeAction(value: string): value is TradeAction {
  return ["buy", "sell"].includes(value);
}

export function isMarketCycle(value: string): value is MarketCycle {
  return ["growth", "bubble", "peak", "crash", "recovery"].includes(value);
}

export function isBotMood(value: string): value is BotMood {
  return [
    "euphoric",
    "optimistic",
    "neutral",
    "pessimistic",
    "depressed",
    "confused",
    "confident",
    "anxious",
  ].includes(value);
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ASSET_SYMBOLS: AssetSymbol[] = ["QOIN", "HODL", "MOON"];

export const MARKET_CYCLES: MarketCycle[] = [
  "growth",
  "bubble",
  "peak",
  "crash",
  "recovery",
];

export const BOT_PERSONALITIES: BotPersonality[] = [
  "philosophical",
  "diamond_hands",
  "contrarian",
  "pessimistic",
  "momentum",
  "panic",
  "balanced",
  "enlightened",
];

export const STARTING_PRICES: Record<AssetSymbol, number> = {
  QOIN: 100.0,
  HODL: 2500.0,
  MOON: 25.0,
};

export const STARTING_BALANCE = 1000.0;

// Make sure default export is available
export default {
  STARTING_BALANCE,
  STARTING_PRICES,
  ASSET_SYMBOLS,
  MARKET_CYCLES,
  BOT_PERSONALITIES,
};
