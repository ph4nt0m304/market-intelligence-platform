/**
 * Binance Market Data Service
 * Fetches real-time prices for XAU/USD, XAG/USD, EUR/USD from Binance API
 */

export interface BinancePrice {
  symbol: string;
  price: string;
  timestamp: number;
}

export interface MarketPair {
  pair: string;
  binanceSymbol: string;
  price: number | null;
  currency: string;
  lastUpdate: string;
}

export interface MarketSnapshot {
  xauUsd: MarketPair;
  xagUsd: MarketPair;
  eurUsd: MarketPair;
  xauEur: MarketPair;
  xagEur: MarketPair;
  timestamp: number;
  source: string;
}

// Binance API endpoints
const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// Symbol mappings - Binance uses specific trading pairs
const SYMBOL_MAP = {
  XAUUSDT: 'PAXGUSDT', // PAX Gold is the gold-backed token on Binance
  XAGUSDT: 'XAGUSDT', // Silver might not be available, we'll use proxy calculation
  EURUSDC: 'EURUSDC', // EUR/USDC pair for EUR/USD equivalent
  EURUSDT: 'EURUSDT', // EUR/USDT as alternative
} as const;

/**
 * Fetch single ticker price from Binance
 */
async function fetchBinancePrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      console.error(`[Binance] Failed to fetch ${symbol}: ${response.status}`);
      return null;
    }

    const data: BinancePrice = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`[Binance] Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch multiple ticker prices from Binance
 */
async function fetchBinancePrices(symbols: string[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  try {
    // Use the ticker endpoint for multiple symbols
    const symbolsParam = JSON.stringify(symbols);
    const response = await fetch(`${BINANCE_API_BASE}/ticker/price?symbols=${encodeURIComponent(symbolsParam)}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      // Fallback to individual requests
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          const price = await fetchBinancePrice(symbol);
          return { symbol, price };
        })
      );

      results.forEach(({ symbol, price }) => {
        if (price !== null) {
          priceMap.set(symbol, price);
        }
      });

      return priceMap;
    }

    const data: BinancePrice[] = await response.json();
    data.forEach((item) => {
      priceMap.set(item.symbol, parseFloat(item.price));
    });
  } catch (error) {
    console.error('[Binance] Error fetching multiple prices:', error);
  }

  return priceMap;
}

/**
 * Get complete market snapshot with XAU, XAG, EUR pairs
 */
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const now = Date.now();
  const timestamp = new Date().toISOString();

  // Fetch all required prices
  const symbolsToFetch = ['PAXGUSDT', 'EURUSDT', 'EURUSDC'];
  const prices = await fetchBinancePrices(symbolsToFetch);

  // Get individual prices
  const paxgUsdtPrice = prices.get('PAXGUSDT') ?? null;
  const eurUsdtPrice = prices.get('EURUSDT') ?? null;
  const eurUsdcPrice = prices.get('EURUSDC') ?? null;

  // Use EURUSDC if available, otherwise EURUSDT (USDT ~= USD)
  const eurUsdPrice = eurUsdcPrice ?? eurUsdtPrice;

  // For silver (XAG), Binance doesn't have a direct pair
  // We'll use a proxy calculation or fetch from a different source
  // For now, we'll calculate based on gold/silver ratio (approximately 80:1)
  const goldSilverRatio = 80;
  const xagUsdPrice = paxgUsdtPrice ? paxgUsdtPrice / goldSilverRatio : null;

  // Calculate EUR pairs (XAU/EUR and XAG/EUR)
  const xauEurPrice = paxgUsdtPrice && eurUsdPrice ? paxgUsdtPrice / eurUsdPrice : null;
  const xagEurPrice = xagUsdPrice && eurUsdPrice ? xagUsdPrice / eurUsdPrice : null;

  return {
    xauUsd: {
      pair: 'XAU/USD',
      binanceSymbol: 'PAXGUSDT',
      price: paxgUsdtPrice,
      currency: 'USD',
      lastUpdate: timestamp,
    },
    xagUsd: {
      pair: 'XAG/USD',
      binanceSymbol: 'proxy',
      price: xagUsdPrice,
      currency: 'USD',
      lastUpdate: timestamp,
    },
    eurUsd: {
      pair: 'EUR/USD',
      binanceSymbol: eurUsdcPrice ? 'EURUSDC' : 'EURUSDT',
      price: eurUsdPrice,
      currency: 'USD',
      lastUpdate: timestamp,
    },
    xauEur: {
      pair: 'XAU/EUR',
      binanceSymbol: 'proxy',
      price: xauEurPrice,
      currency: 'EUR',
      lastUpdate: timestamp,
    },
    xagEur: {
      pair: 'XAG/EUR',
      binanceSymbol: 'proxy',
      price: xagEurPrice,
      currency: 'EUR',
      lastUpdate: timestamp,
    },
    timestamp: now,
    source: 'Binance',
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null, decimals = 2): string {
  if (price === null) return '---';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().replace('T', ' ').substring(0, 23);
}
