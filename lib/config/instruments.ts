/**
 * Gold & Silver Instrument Universe Configuration
 * 
 * This file defines all tradeable instruments across Binance and Trade Republic
 * for the arbitrage detection platform.
 */

import type { TRInstrument, BinanceInstrument, AlertThreshold } from '@/lib/types/arbitrage';

/**
 * Trade Republic Gold Instruments
 * All gold-backed ETCs and ETFs available on TR
 */
export const TR_GOLD_INSTRUMENTS: TRInstrument[] = [
  {
    isin: 'DE000A0S9GB0',
    name: 'Xetra-Gold',
    shortName: 'Xetra-Gold',
    assetType: 'GOLD',
    currency: 'EUR',
    exchange: 'XETRA',
    gramPerUnit: 1, // 1 gram per unit
    expenseRatio: 0.0036, // 0.36% p.a.
    issuer: 'Deutsche Börse Commodities',
    active: true,
  },
  {
    isin: 'DE000EWG0LD1',
    name: 'EUWAX Gold',
    shortName: 'EUWAX Gold',
    assetType: 'GOLD',
    currency: 'EUR',
    exchange: 'STUTTGART',
    gramPerUnit: 1,
    expenseRatio: 0,
    issuer: 'Boerse Stuttgart Securities',
    active: true,
  },
  {
    isin: 'IE00B4ND3602',
    name: 'iShares Physical Gold ETC',
    shortName: 'iShares Gold',
    assetType: 'GOLD',
    currency: 'USD',
    exchange: 'LSE',
    gramPerUnit: 1,
    expenseRatio: 0.0012, // 0.12% p.a.
    issuer: 'BlackRock',
    active: true,
  },
  {
    isin: 'GB00B00FHZ82',
    name: 'Invesco Physical Gold ETC',
    shortName: 'Invesco Gold',
    assetType: 'GOLD',
    currency: 'USD',
    exchange: 'LSE',
    gramPerUnit: 0.1, // 0.1 oz per unit (approx 2.835 grams)
    expenseRatio: 0.0012,
    issuer: 'Invesco',
    active: true,
  },
  {
    isin: 'JE00B1VS3770',
    name: 'WisdomTree Physical Gold',
    shortName: 'WT Gold',
    assetType: 'GOLD',
    currency: 'USD',
    exchange: 'LSE',
    gramPerUnit: 0.0321507, // 1/31.1035 oz
    expenseRatio: 0.0039,
    issuer: 'WisdomTree',
    active: true,
  },
  {
    isin: 'CH0104136285',
    name: 'ZKB Gold ETF EUR',
    shortName: 'ZKB Gold',
    assetType: 'GOLD',
    currency: 'EUR',
    exchange: 'SIX',
    gramPerUnit: 1,
    expenseRatio: 0.004,
    issuer: 'Zürcher Kantonalbank',
    active: true,
  },
];

/**
 * Trade Republic Silver Instruments
 * All silver-backed ETCs and ETFs available on TR
 */
export const TR_SILVER_INSTRUMENTS: TRInstrument[] = [
  {
    isin: 'DE000A0N62F2',
    name: 'WisdomTree Physical Silver',
    shortName: 'WT Silver',
    assetType: 'SILVER',
    currency: 'EUR',
    exchange: 'XETRA',
    gramPerUnit: 1,
    expenseRatio: 0.0049,
    issuer: 'WisdomTree',
    active: true,
  },
  {
    isin: 'IE00B4NCWG09',
    name: 'iShares Physical Silver ETC',
    shortName: 'iShares Silver',
    assetType: 'SILVER',
    currency: 'USD',
    exchange: 'LSE',
    gramPerUnit: 1,
    expenseRatio: 0.002,
    issuer: 'BlackRock',
    active: true,
  },
  {
    isin: 'GB00B00FHT20',
    name: 'Invesco Physical Silver ETC',
    shortName: 'Invesco Silver',
    assetType: 'SILVER',
    currency: 'USD',
    exchange: 'LSE',
    gramPerUnit: 1,
    expenseRatio: 0.0019,
    issuer: 'Invesco',
    active: true,
  },
  {
    isin: 'JE00B1VS3333',
    name: 'WisdomTree Physical Silver USD',
    shortName: 'WT Silver USD',
    assetType: 'SILVER',
    currency: 'USD',
    exchange: 'LSE',
    gramPerUnit: 1,
    expenseRatio: 0.0049,
    issuer: 'WisdomTree',
    active: true,
  },
  {
    isin: 'CH0183136024',
    name: 'ZKB Silver ETF EUR',
    shortName: 'ZKB Silver',
    assetType: 'SILVER',
    currency: 'EUR',
    exchange: 'SIX',
    gramPerUnit: 100, // 100g per unit
    expenseRatio: 0.006,
    issuer: 'Zürcher Kantonalbank',
    active: true,
  },
];

/**
 * All Trade Republic Instruments (combined)
 */
export const TR_ALL_INSTRUMENTS: TRInstrument[] = [
  ...TR_GOLD_INSTRUMENTS,
  ...TR_SILVER_INSTRUMENTS,
];

/**
 * Binance Reference Instruments
 * Tokenized gold and related pairs
 */
export const BINANCE_INSTRUMENTS: BinanceInstrument[] = [
  {
    symbol: 'PAXGUSDT',
    displayName: 'PAX Gold',
    assetType: 'GOLD',
    baseAsset: 'PAXG',
    quoteAsset: 'USDT',
    pricePrecision: 2,
    quantityPrecision: 4,
    active: true,
  },
  {
    symbol: 'PAXGBUSD',
    displayName: 'PAX Gold (BUSD)',
    assetType: 'GOLD',
    baseAsset: 'PAXG',
    quoteAsset: 'BUSD',
    pricePrecision: 2,
    quantityPrecision: 4,
    active: false, // BUSD deprecated
  },
];

/**
 * Currency pairs for conversion
 */
export const CURRENCY_PAIRS = {
  EURUSDT: {
    symbol: 'EURUSDT',
    displayName: 'EUR/USD',
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
  },
  EURUSDC: {
    symbol: 'EURUSDC',
    displayName: 'EUR/USDC',
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
  },
} as const;

/**
 * Default alert thresholds
 */
export const DEFAULT_GOLD_THRESHOLDS: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'> = {
  assetType: 'GOLD',
  spreadPctBuy: -0.75, // TR is 0.75% cheaper - potential buy signal
  spreadPctSell: 0.75, // TR is 0.75% more expensive - potential sell signal
  zScoreThreshold: 2.0,
  enabled: true,
  notifyInApp: true,
  cooldownMinutes: 15,
};

export const DEFAULT_SILVER_THRESHOLDS: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'> = {
  assetType: 'SILVER',
  spreadPctBuy: -1.0, // Silver has higher volatility
  spreadPctSell: 1.0,
  zScoreThreshold: 2.0,
  enabled: true,
  notifyInApp: true,
  cooldownMinutes: 15,
};

/**
 * Market hours configuration
 */
export const MARKET_HOURS_CONFIG = {
  TRADE_REPUBLIC: {
    exchange: 'Lang & Schwarz',
    timezone: 'Europe/Berlin',
    regularOpen: '07:30',
    regularClose: '23:00',
    tradingDays: [1, 2, 3, 4, 5], // Monday to Friday
    holidays: [], // Add German holidays
  },
  XETRA: {
    exchange: 'XETRA',
    timezone: 'Europe/Berlin',
    regularOpen: '09:00',
    regularClose: '17:30',
    tradingDays: [1, 2, 3, 4, 5],
    holidays: [],
  },
  BINANCE: {
    exchange: 'Binance',
    timezone: 'UTC',
    regularOpen: '00:00',
    regularClose: '23:59',
    tradingDays: [0, 1, 2, 3, 4, 5, 6], // 24/7
    holidays: [],
  },
} as const;

/**
 * Gold/Silver ratio for proxy calculations
 * Historical average is around 60-80
 */
export const GOLD_SILVER_RATIO = {
  default: 80,
  historicalLow: 30,
  historicalHigh: 120,
  lastUpdate: '2024-01-01',
};

/**
 * Fee estimates for net edge calculation
 */
export const FEE_ESTIMATES = {
  TRADE_REPUBLIC: {
    commission: 0, // No commission
    spreadCost: 0.003, // Estimated 0.3% spread cost
    foreignExchange: 0.001, // 0.1% FX markup if applicable
  },
  BINANCE: {
    makerFee: 0.001, // 0.1% maker
    takerFee: 0.001, // 0.1% taker
    withdrawalFee: 0.0001, // Varies by asset
  },
} as const;

/**
 * Get instrument by ISIN
 */
export function getInstrumentByISIN(isin: string): TRInstrument | undefined {
  return TR_ALL_INSTRUMENTS.find(i => i.isin === isin);
}

/**
 * Get instruments by asset type
 */
export function getInstrumentsByAssetType(assetType: 'GOLD' | 'SILVER'): TRInstrument[] {
  return TR_ALL_INSTRUMENTS.filter(i => i.assetType === assetType && i.active);
}

/**
 * Get Binance instrument by symbol
 */
export function getBinanceInstrument(symbol: string): BinanceInstrument | undefined {
  return BINANCE_INSTRUMENTS.find(i => i.symbol === symbol);
}

/**
 * Get primary Binance reference for asset type
 */
export function getPrimaryBinanceReference(assetType: 'GOLD' | 'SILVER'): BinanceInstrument | undefined {
  return BINANCE_INSTRUMENTS.find(i => i.assetType === assetType && i.active);
}

/**
 * Convert price between units
 * @param price Price in source unit
 * @param fromGramPerUnit Grams per unit of source instrument
 * @param toGramPerUnit Grams per unit of target instrument
 */
export function convertPricePerGram(
  price: number,
  fromGramPerUnit: number,
  toGramPerUnit: number
): number {
  const pricePerGram = price / fromGramPerUnit;
  return pricePerGram * toGramPerUnit;
}

/**
 * Troy ounce to gram conversion
 */
export const TROY_OUNCE_GRAMS = 31.1035;

/**
 * Convert troy ounce price to gram price
 */
export function ozToGramPrice(ozPrice: number): number {
  return ozPrice / TROY_OUNCE_GRAMS;
}

/**
 * Convert gram price to troy ounce price
 */
export function gramToOzPrice(gramPrice: number): number {
  return gramPrice * TROY_OUNCE_GRAMS;
}
