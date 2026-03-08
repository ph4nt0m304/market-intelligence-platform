/**
 * Arbitrage Engine
 * 
 * Core spread calculation and arbitrage detection logic for
 * comparing Binance gold prices with Trade Republic ETCs.
 */

import type {
  AssetType,
  SpreadResult,
  TRInstrument,
  NormalizedPrice,
  ConfidenceLevel,
  SpreadHistoryPoint,
} from '@/lib/types/arbitrage';
import {
  TR_GOLD_INSTRUMENTS,
  TR_SILVER_INSTRUMENTS,
  FEE_ESTIMATES,
  TROY_OUNCE_GRAMS,
  GOLD_SILVER_RATIO,
} from '@/lib/config/instruments';
import { areMarketsComparable, getTRMarketState, getBinanceMarketState } from '@/lib/services/market-hours';

/**
 * Rolling history for z-score calculation
 * In production, this would be stored in a database
 */
const spreadHistory: Map<string, SpreadHistoryPoint[]> = new Map();
const HISTORY_WINDOW = 100; // Number of data points for rolling statistics

/**
 * Calculate basic spread between TR and Binance prices
 */
export function calculateSpread(
  trPrice: number,
  binancePrice: number,
  currency: 'EUR' | 'USD' = 'EUR'
): { spreadAbs: number; spreadPct: number; spreadBps: number } {
  const spreadAbs = trPrice - binancePrice;
  const spreadPct = (spreadAbs / binancePrice) * 100;
  const spreadBps = spreadPct * 100; // Basis points
  
  return { spreadAbs, spreadPct, spreadBps };
}

/**
 * Calculate z-score for a spread value
 * Uses rolling historical data for mean and standard deviation
 */
export function calculateZScore(
  instrumentId: string,
  currentSpreadPct: number
): { zScore: number; mean: number; stdDev: number } {
  const history = spreadHistory.get(instrumentId) || [];
  
  if (history.length < 10) {
    // Not enough data for meaningful z-score
    return { zScore: 0, mean: currentSpreadPct, stdDev: 0 };
  }
  
  const spreads = history.map(h => h.spreadPct);
  const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  const variance = spreads.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / spreads.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) {
    return { zScore: 0, mean, stdDev: 0 };
  }
  
  const zScore = (currentSpreadPct - mean) / stdDev;
  
  return { zScore, mean, stdDev };
}

/**
 * Add a spread data point to history
 */
export function addToSpreadHistory(
  instrumentId: string,
  dataPoint: SpreadHistoryPoint
): void {
  const history = spreadHistory.get(instrumentId) || [];
  history.push(dataPoint);
  
  // Keep only the most recent data points
  if (history.length > HISTORY_WINDOW) {
    history.shift();
  }
  
  spreadHistory.set(instrumentId, history);
}

/**
 * Get spread history for an instrument
 */
export function getSpreadHistory(instrumentId: string): SpreadHistoryPoint[] {
  return spreadHistory.get(instrumentId) || [];
}

/**
 * Determine confidence level based on various factors
 */
export function determineConfidence(
  marketComparable: boolean,
  confidencePenalty: number,
  zScoreAbs: number,
  dataAge: number // milliseconds since last update
): ConfidenceLevel {
  let score = 100;
  
  // Market comparability penalty
  if (!marketComparable) {
    score -= 50;
  }
  score -= confidencePenalty * 30;
  
  // Extreme z-score indicates unusual conditions
  if (zScoreAbs > 3) {
    score -= 20;
  } else if (zScoreAbs > 2) {
    score -= 10;
  }
  
  // Data freshness penalty
  const ageMinutes = dataAge / (1000 * 60);
  if (ageMinutes > 5) {
    score -= 30;
  } else if (ageMinutes > 2) {
    score -= 15;
  } else if (ageMinutes > 1) {
    score -= 5;
  }
  
  if (score >= 80) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Calculate net edge after estimated fees
 */
export function calculateNetEdge(spreadPct: number): number {
  const trFees = FEE_ESTIMATES.TRADE_REPUBLIC.spreadCost * 100; // Convert to percentage
  const binanceFees = (FEE_ESTIMATES.BINANCE.takerFee * 2) * 100; // Buy + sell
  const totalFees = trFees + binanceFees;
  
  // Net edge is the absolute spread minus fees
  return Math.abs(spreadPct) - totalFees;
}

/**
 * Normalize Binance gold price (PAXG) to comparable unit
 * PAXG is 1 troy ounce of gold
 */
export function normalizeBinanceGoldPrice(
  paxgPrice: number,
  targetGramPerUnit: number,
  targetCurrency: 'EUR' | 'USD',
  eurUsdRate: number
): number {
  // PAXG is 1 troy ounce = 31.1035 grams
  const pricePerGram = paxgPrice / TROY_OUNCE_GRAMS;
  let normalizedPrice = pricePerGram * targetGramPerUnit;
  
  // Convert currency if needed
  if (targetCurrency === 'EUR') {
    normalizedPrice = normalizedPrice / eurUsdRate;
  }
  
  return normalizedPrice;
}

/**
 * Calculate silver reference price from gold (proxy calculation)
 * Used when direct silver data is not available
 */
export function calculateSilverProxy(
  goldPriceUsd: number,
  goldSilverRatio: number = GOLD_SILVER_RATIO.default
): number {
  return goldPriceUsd / goldSilverRatio;
}

/**
 * Calculate comprehensive spread result for a TR instrument
 */
export function calculateInstrumentSpread(
  instrument: TRInstrument,
  trPrice: number,
  trBid: number | undefined,
  trAsk: number | undefined,
  binancePriceUsd: number,
  eurUsdRate: number,
  timestamp: string = new Date().toISOString()
): SpreadResult {
  const now = new Date();
  const marketStatus = areMarketsComparable(now);
  
  // Normalize Binance price to match TR instrument
  const normalizedBinancePrice = normalizeBinanceGoldPrice(
    binancePriceUsd,
    instrument.gramPerUnit || 1,
    instrument.currency,
    eurUsdRate
  );
  
  // Calculate spread
  const { spreadAbs, spreadPct, spreadBps } = calculateSpread(
    trPrice,
    normalizedBinancePrice,
    instrument.currency
  );
  
  // Calculate z-score
  const { zScore, mean, stdDev } = calculateZScore(instrument.isin, spreadPct);
  
  // Determine confidence
  const confidence = determineConfidence(
    marketStatus.comparable,
    marketStatus.confidencePenalty,
    Math.abs(zScore),
    0 // Assuming fresh data for now
  );
  
  // Add to history
  addToSpreadHistory(instrument.isin, {
    timestamp,
    spreadPct,
    spreadBps,
    trPrice,
    binancePrice: normalizedBinancePrice,
  });
  
  // Calculate net edge after fees
  const netEdgeAfterFees = calculateNetEdge(spreadPct);
  
  return {
    id: `${instrument.isin}-${Date.now()}`,
    assetType: instrument.assetType,
    trInstrument: instrument,
    binanceSymbol: instrument.assetType === 'GOLD' ? 'PAXGUSDT' : 'SILVER_PROXY',
    trPrice,
    trBid,
    trAsk,
    binancePrice: normalizedBinancePrice,
    spreadAbs,
    spreadPct,
    spreadBps,
    zScore,
    historicalMean: mean,
    historicalStdDev: stdDev,
    confidence,
    currency: instrument.currency,
    fxRate: eurUsdRate,
    timestamp,
    marketHoursComparable: marketStatus.comparable,
    trMarketState: getTRMarketState(now),
    binanceMarketState: getBinanceMarketState(),
    isStale: false,
    netEdgeAfterFees,
  };
}

/**
 * Calculate spreads for all gold instruments
 */
export function calculateAllGoldSpreads(
  trPrices: Map<string, { price: number; bid?: number; ask?: number }>,
  binanceGoldPriceUsd: number,
  eurUsdRate: number
): SpreadResult[] {
  const results: SpreadResult[] = [];
  const timestamp = new Date().toISOString();
  
  for (const instrument of TR_GOLD_INSTRUMENTS) {
    const trData = trPrices.get(instrument.isin);
    if (!trData) continue;
    
    const result = calculateInstrumentSpread(
      instrument,
      trData.price,
      trData.bid,
      trData.ask,
      binanceGoldPriceUsd,
      eurUsdRate,
      timestamp
    );
    
    results.push(result);
  }
  
  // Sort by absolute spread percentage (largest opportunities first)
  return results.sort((a, b) => Math.abs(b.spreadPct) - Math.abs(a.spreadPct));
}

/**
 * Calculate spreads for all silver instruments
 */
export function calculateAllSilverSpreads(
  trPrices: Map<string, { price: number; bid?: number; ask?: number }>,
  binanceGoldPriceUsd: number, // We'll derive silver from gold ratio
  eurUsdRate: number,
  goldSilverRatio: number = GOLD_SILVER_RATIO.default
): SpreadResult[] {
  const results: SpreadResult[] = [];
  const timestamp = new Date().toISOString();
  
  // Calculate silver reference price
  const silverPriceUsd = calculateSilverProxy(binanceGoldPriceUsd, goldSilverRatio);
  
  for (const instrument of TR_SILVER_INSTRUMENTS) {
    const trData = trPrices.get(instrument.isin);
    if (!trData) continue;
    
    // For silver, we need to normalize differently since the reference is in grams
    const pricePerGram = silverPriceUsd / TROY_OUNCE_GRAMS;
    let normalizedPrice = pricePerGram * (instrument.gramPerUnit || 1);
    
    if (instrument.currency === 'EUR') {
      normalizedPrice = normalizedPrice / eurUsdRate;
    }
    
    const { spreadAbs, spreadPct, spreadBps } = calculateSpread(
      trData.price,
      normalizedPrice,
      instrument.currency
    );
    
    const { zScore, mean, stdDev } = calculateZScore(instrument.isin, spreadPct);
    const marketStatus = areMarketsComparable();
    const confidence = determineConfidence(
      marketStatus.comparable,
      marketStatus.confidencePenalty,
      Math.abs(zScore),
      0
    );
    
    addToSpreadHistory(instrument.isin, {
      timestamp,
      spreadPct,
      spreadBps,
      trPrice: trData.price,
      binancePrice: normalizedPrice,
    });
    
    results.push({
      id: `${instrument.isin}-${Date.now()}`,
      assetType: 'SILVER',
      trInstrument: instrument,
      binanceSymbol: 'SILVER_PROXY',
      trPrice: trData.price,
      trBid: trData.bid,
      trAsk: trData.ask,
      binancePrice: normalizedPrice,
      spreadAbs,
      spreadPct,
      spreadBps,
      zScore,
      historicalMean: mean,
      historicalStdDev: stdDev,
      confidence,
      currency: instrument.currency,
      fxRate: eurUsdRate,
      timestamp,
      marketHoursComparable: marketStatus.comparable,
      trMarketState: getTRMarketState(),
      binanceMarketState: getBinanceMarketState(),
      isStale: false,
      netEdgeAfterFees: calculateNetEdge(spreadPct),
    });
  }
  
  return results.sort((a, b) => Math.abs(b.spreadPct) - Math.abs(a.spreadPct));
}

/**
 * Find top arbitrage opportunities across all instruments
 */
export function findTopOpportunities(
  spreads: SpreadResult[],
  minSpreadPct: number = 0.5,
  maxResults: number = 5
): SpreadResult[] {
  return spreads
    .filter(s => Math.abs(s.spreadPct) >= minSpreadPct && s.marketHoursComparable)
    .sort((a, b) => Math.abs(b.spreadPct) - Math.abs(a.spreadPct))
    .slice(0, maxResults);
}

/**
 * Classify spread direction for trading signal
 */
export function classifySpread(spreadPct: number): 'BUY_TR' | 'SELL_TR' | 'NEUTRAL' {
  if (spreadPct < -0.5) {
    return 'BUY_TR'; // TR is cheaper than Binance
  }
  if (spreadPct > 0.5) {
    return 'SELL_TR'; // TR is more expensive than Binance
  }
  return 'NEUTRAL';
}

/**
 * Generate a summary of current market conditions
 */
export function generateMarketSummary(
  goldSpreads: SpreadResult[],
  silverSpreads: SpreadResult[]
): {
  goldAvgSpread: number;
  silverAvgSpread: number;
  goldBestOpportunity: SpreadResult | null;
  silverBestOpportunity: SpreadResult | null;
  marketState: string;
  totalOpportunities: number;
} {
  const goldAvgSpread = goldSpreads.length > 0
    ? goldSpreads.reduce((sum, s) => sum + s.spreadPct, 0) / goldSpreads.length
    : 0;
    
  const silverAvgSpread = silverSpreads.length > 0
    ? silverSpreads.reduce((sum, s) => sum + s.spreadPct, 0) / silverSpreads.length
    : 0;
  
  const goldOpportunities = findTopOpportunities(goldSpreads, 0.5, 1);
  const silverOpportunities = findTopOpportunities(silverSpreads, 0.5, 1);
  
  const marketStatus = areMarketsComparable();
  
  return {
    goldAvgSpread,
    silverAvgSpread,
    goldBestOpportunity: goldOpportunities[0] || null,
    silverBestOpportunity: silverOpportunities[0] || null,
    marketState: marketStatus.comparable ? 'OPEN' : 'LIMITED',
    totalOpportunities: goldOpportunities.length + silverOpportunities.length,
  };
}
