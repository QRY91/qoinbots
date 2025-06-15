/**
 * Essential constants for QOINbots game
 * JavaScript version for Vite compatibility
 */

// Asset symbols
export const ASSET_SYMBOLS = ["QOIN", "HODL", "MOON"];

// Market cycles
export const MARKET_CYCLES = [
  "growth",
  "bubble",
  "peak",
  "crash",
  "recovery",
];

// Bot personalities
export const BOT_PERSONALITIES = [
  "philosophical",
  "diamond_hands",
  "contrarian",
  "pessimistic",
  "momentum",
  "panic",
  "balanced",
  "enlightened",
];

// Starting asset prices
export const STARTING_PRICES = {
  QOIN: 100.0,
  HODL: 2500.0,
  MOON: 25.0,
};

// Starting bot balance
export const STARTING_BALANCE = 1000.0;

// Default export
export default {
  STARTING_BALANCE,
  STARTING_PRICES,
  ASSET_SYMBOLS,
  MARKET_CYCLES,
  BOT_PERSONALITIES,
};
