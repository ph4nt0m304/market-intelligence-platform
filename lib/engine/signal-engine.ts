/**
 * Signal Engine
 * 
 * Generates trading signals based on spread calculations,
 * z-scores, and configurable thresholds.
 */

import type {
  AssetType,
  SpreadResult,
  TradingSignal,
  SignalType,
  ConfidenceLevel,
  AlertThreshold,
} from '@/lib/types/arbitrage';
import {
  DEFAULT_GOLD_THRESHOLDS,
  DEFAULT_SILVER_THRESHOLDS,
} from '@/lib/config/instruments';

/**
 * In-memory store for active signals
 * In production, this would be persisted to a database
 */
const activeSignals: Map<string, TradingSignal> = new Map();
const signalCooldowns: Map<string, number> = new Map(); // instrumentId -> timestamp

/**
 * Generate unique signal ID
 */
function generateSignalId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an instrument is in cooldown period
 */
function isInCooldown(instrumentId: string, cooldownMinutes: number): boolean {
  const lastSignalTime = signalCooldowns.get(instrumentId);
  if (!lastSignalTime) return false;
  
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return Date.now() - lastSignalTime < cooldownMs;
}

/**
 * Set cooldown for an instrument
 */
function setCooldown(instrumentId: string): void {
  signalCooldowns.set(instrumentId, Date.now());
}

/**
 * Get default thresholds for an asset type
 */
export function getDefaultThresholds(assetType: AssetType): Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'> {
  return assetType === 'GOLD' ? DEFAULT_GOLD_THRESHOLDS : DEFAULT_SILVER_THRESHOLDS;
}

/**
 * Determine signal type based on spread and thresholds
 */
export function determineSignalType(
  spreadPct: number,
  zScore: number,
  thresholds: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'>
): SignalType | null {
  // Z-score based alert (unusual conditions)
  if (Math.abs(zScore) >= thresholds.zScoreThreshold) {
    return 'ALERT';
  }
  
  // Buy signal: TR is significantly cheaper than Binance
  if (spreadPct <= thresholds.spreadPctBuy) {
    return 'BUY';
  }
  
  // Sell signal: TR is significantly more expensive than Binance
  if (spreadPct >= thresholds.spreadPctSell) {
    return 'SELL';
  }
  
  // Watch signal: Spread is approaching thresholds
  const buyThreshold70 = thresholds.spreadPctBuy * 0.7;
  const sellThreshold70 = thresholds.spreadPctSell * 0.7;
  
  if (spreadPct <= buyThreshold70 || spreadPct >= sellThreshold70) {
    return 'WATCH';
  }
  
  return null; // No signal
}

/**
 * Generate rationale text for a signal
 */
function generateRationale(
  signalType: SignalType,
  spreadPct: number,
  zScore: number,
  instrumentName: string,
  assetType: AssetType
): string {
  const direction = spreadPct < 0 ? 'cheaper' : 'more expensive';
  const absSpread = Math.abs(spreadPct).toFixed(2);
  
  switch (signalType) {
    case 'BUY':
      return `${instrumentName} is ${absSpread}% ${direction} than Binance ${assetType.toLowerCase()} reference. Potential buy opportunity on Trade Republic.`;
    case 'SELL':
      return `${instrumentName} is ${absSpread}% ${direction} than Binance ${assetType.toLowerCase()} reference. Consider selling on Trade Republic.`;
    case 'WATCH':
      return `${instrumentName} spread (${spreadPct > 0 ? '+' : ''}${spreadPct.toFixed(2)}%) is approaching signal thresholds. Monitor closely.`;
    case 'ALERT':
      return `Unusual market conditions detected. ${instrumentName} z-score of ${zScore.toFixed(2)} indicates ${Math.abs(zScore) > 2 ? 'extreme' : 'elevated'} deviation from historical mean.`;
    default:
      return '';
  }
}

/**
 * Determine signal priority
 */
function determinePriority(
  signalType: SignalType,
  spreadPct: number,
  zScore: number,
  confidence: ConfidenceLevel
): TradingSignal['priority'] {
  // Extreme z-scores are always critical
  if (Math.abs(zScore) > 3) {
    return 'CRITICAL';
  }
  
  // Strong signals with high confidence
  if ((signalType === 'BUY' || signalType === 'SELL') && confidence === 'HIGH') {
    if (Math.abs(spreadPct) > 1.5) {
      return 'CRITICAL';
    }
    return 'HIGH';
  }
  
  // Alerts
  if (signalType === 'ALERT') {
    return 'HIGH';
  }
  
  // Watch signals
  if (signalType === 'WATCH') {
    return 'NORMAL';
  }
  
  return 'LOW';
}

/**
 * Process a spread result and generate signal if warranted
 */
export function processSpreadForSignal(
  spread: SpreadResult,
  customThresholds?: Partial<AlertThreshold>
): TradingSignal | null {
  const thresholds = {
    ...getDefaultThresholds(spread.assetType),
    ...customThresholds,
  };
  
  // Check if signals are enabled
  if (!thresholds.enabled) {
    return null;
  }
  
  // Check cooldown
  if (isInCooldown(spread.trInstrument.isin, thresholds.cooldownMinutes)) {
    return null;
  }
  
  // Skip if markets aren't comparable
  if (!spread.marketHoursComparable) {
    return null;
  }
  
  // Determine signal type
  const signalType = determineSignalType(
    spread.spreadPct,
    spread.zScore,
    thresholds
  );
  
  if (!signalType) {
    return null;
  }
  
  // Generate signal
  const signal: TradingSignal = {
    id: generateSignalId(),
    assetType: spread.assetType,
    instrumentId: spread.trInstrument.isin,
    instrumentName: spread.trInstrument.shortName,
    signalType,
    spreadPct: spread.spreadPct,
    spreadBps: spread.spreadBps,
    zScore: spread.zScore,
    confidence: spread.confidence,
    rationale: generateRationale(
      signalType,
      spread.spreadPct,
      spread.zScore,
      spread.trInstrument.shortName,
      spread.assetType
    ),
    priceAtSignal: spread.trPrice,
    timestamp: spread.timestamp,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    status: 'NEW',
    priority: determinePriority(signalType, spread.spreadPct, spread.zScore, spread.confidence),
  };
  
  // Set cooldown
  setCooldown(spread.trInstrument.isin);
  
  // Store signal
  activeSignals.set(signal.id, signal);
  
  return signal;
}

/**
 * Process multiple spreads and generate signals
 */
export function processSpreadBatch(
  spreads: SpreadResult[],
  customThresholds?: Partial<AlertThreshold>
): TradingSignal[] {
  const signals: TradingSignal[] = [];
  
  for (const spread of spreads) {
    const signal = processSpreadForSignal(spread, customThresholds);
    if (signal) {
      signals.push(signal);
    }
  }
  
  // Sort by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
  return signals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get all active signals
 */
export function getActiveSignals(): TradingSignal[] {
  const now = Date.now();
  const signals: TradingSignal[] = [];
  
  for (const [id, signal] of activeSignals) {
    // Check if expired
    if (signal.expiresAt && new Date(signal.expiresAt).getTime() < now) {
      signal.status = 'EXPIRED';
    }
    
    // Only include non-expired, active signals
    if (signal.status === 'NEW' || signal.status === 'ACTIVE') {
      signals.push(signal);
    }
  }
  
  const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
  return signals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get signals by asset type
 */
export function getSignalsByAssetType(assetType: AssetType): TradingSignal[] {
  return getActiveSignals().filter(s => s.assetType === assetType);
}

/**
 * Acknowledge a signal
 */
export function acknowledgeSignal(signalId: string): boolean {
  const signal = activeSignals.get(signalId);
  if (!signal) return false;
  
  signal.status = 'ACKNOWLEDGED';
  return true;
}

/**
 * Dismiss/expire a signal
 */
export function dismissSignal(signalId: string): boolean {
  const signal = activeSignals.get(signalId);
  if (!signal) return false;
  
  signal.status = 'EXPIRED';
  return true;
}

/**
 * Clear all signals (for testing/reset)
 */
export function clearAllSignals(): void {
  activeSignals.clear();
  signalCooldowns.clear();
}

/**
 * Get signal statistics
 */
export function getSignalStats(): {
  total: number;
  byType: Record<SignalType, number>;
  byAsset: Record<AssetType, number>;
  byPriority: Record<TradingSignal['priority'], number>;
} {
  const signals = getActiveSignals();
  
  const byType: Record<SignalType, number> = { BUY: 0, SELL: 0, WATCH: 0, ALERT: 0 };
  const byAsset: Record<AssetType, number> = { GOLD: 0, SILVER: 0 };
  const byPriority: Record<TradingSignal['priority'], number> = { CRITICAL: 0, HIGH: 0, NORMAL: 0, LOW: 0 };
  
  for (const signal of signals) {
    byType[signal.signalType]++;
    byAsset[signal.assetType]++;
    byPriority[signal.priority]++;
  }
  
  return {
    total: signals.length,
    byType,
    byAsset,
    byPriority,
  };
}

/**
 * Get recent signal history (last N signals including expired)
 */
export function getSignalHistory(limit: number = 50): TradingSignal[] {
  const allSignals = Array.from(activeSignals.values());
  return allSignals
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
