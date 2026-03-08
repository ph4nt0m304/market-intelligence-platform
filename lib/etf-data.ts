/**
 * Trade Republic ETF Data Module
 * Handles ETF pricing with Bid/Ask spreads
 */

export interface ETFPrice {
  isin: string;
  name: string;
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  spread: number; // ask - bid
  spreadPercent: number; // (ask - bid) / last * 100
  currency: string;
  timestamp: number;
  source: string;
}

export interface ETFSnapshot {
  timestamp: number;
  etfs: ETFPrice[];
  source: string;
  lastTRUpdate: string;
}

/**
 * Mock ETF data matching Trade Republic prices
 * Real integration would pull from Trade Republic API
 */
export const MOCK_ETF_DATA: Record<string, ETFPrice> = {
  IE00B4NCMG89: {
    isin: 'IE00B4NCMG89',
    name: 'Phys Silver',
    symbol: 'XSLV.L',
    bid: 69.02,
    ask: 69.59,
    last: 69.02,
    spread: 0.57,
    spreadPercent: 0.826,
    currency: 'USD',
    timestamp: Date.now(),
    source: 'Trade Republic',
  },
  GB00BS840F36: {
    isin: 'GB00BS840F36',
    name: 'Phys Gold',
    symbol: 'PHAU.L',
    bid: 424.50,
    ask: 425.31,
    last: 424.50,
    spread: 0.81,
    spreadPercent: 0.191,
    currency: 'USD',
    timestamp: Date.now(),
    source: 'Trade Republic',
  },
  DE00BA1EHS6: {
    isin: 'DE00BA1EHS6',
    name: 'XL Phys Silv',
    symbol: 'XSLV.DE',
    bid: 679.80,
    ask: 623.25,
    last: 679.80,
    spread: -56.55,
    spreadPercent: -8.325,
    currency: 'EUR',
    timestamp: Date.now(),
    source: 'Trade Republic',
  },
  US0846707026: {
    isin: 'US0846707026',
    name: 'Berkshire Hathaway B',
    symbol: 'BRK.B',
    bid: 418.50,
    ask: 418.75,
    last: 418.62,
    spread: 0.25,
    spreadPercent: 0.060,
    currency: 'USD',
    timestamp: Date.now(),
    source: 'Trade Republic',
  },
  IE00B4L5Y983: {
    isin: 'IE00B4L5Y983',
    name: 'iShares Global Clean Energy',
    symbol: 'ICLN.L',
    bid: 52.30,
    ask: 52.55,
    last: 52.42,
    spread: 0.25,
    spreadPercent: 0.477,
    currency: 'USD',
    timestamp: Date.now(),
    source: 'Trade Republic',
  },
};

/**
 * Calculate spread metrics
 */
export function calculateSpread(bid: number, ask: number, last: number): {
  spread: number;
  spreadPercent: number;
} {
  return {
    spread: ask - bid,
    spreadPercent: ((ask - bid) / last) * 100,
  };
}

/**
 * Format ETF price for display
 */
export function formatETFPrice(etf: ETFPrice): string {
  return `${etf.name} (${etf.isin})\n  Bid: ${etf.bid.toFixed(2)}\tAsk: ${etf.ask.toFixed(2)}\tLast: ${etf.last.toFixed(2)}`;
}

/**
 * Get ETF snapshot (all current prices)
 */
export function getETFSnapshot(): ETFSnapshot {
  const etfs = Object.values(MOCK_ETF_DATA).map((etf) => ({
    ...etf,
    timestamp: Date.now(),
  }));

  return {
    timestamp: Date.now(),
    etfs,
    source: 'Trade Republic',
    lastTRUpdate: new Date().toISOString(),
  };
}

/**
 * Get specific ETF
 */
export function getETF(isin: string): ETFPrice | null {
  const etf = MOCK_ETF_DATA[isin];
  if (!etf) return null;

  return {
    ...etf,
    timestamp: Date.now(),
  };
}

/**
 * Get ETFs by currency
 */
export function getETFsByCurrency(currency: string): ETFPrice[] {
  return Object.values(MOCK_ETF_DATA)
    .filter((etf) => etf.currency === currency)
    .map((etf) => ({
      ...etf,
      timestamp: Date.now(),
    }));
}

/**
 * Search ETFs
 */
export function searchETFs(query: string): ETFPrice[] {
  const q = query.toLowerCase();
  return Object.values(MOCK_ETF_DATA)
    .filter(
      (etf) =>
        etf.name.toLowerCase().includes(q) ||
        etf.symbol.toLowerCase().includes(q) ||
        etf.isin.toLowerCase().includes(q)
    )
    .map((etf) => ({
      ...etf,
      timestamp: Date.now(),
    }));
}

/**
 * Calculate portfolio value with bid/ask
 */
export function calculatePortfolioValue(
  positions: Array<{ isin: string; quantity: number; bidPrice: boolean }>,
  etfData: Record<string, ETFPrice>
): { bidValue: number; askValue: number; midValue: number } {
  let bidValue = 0;
  let askValue = 0;

  positions.forEach(({ isin, quantity, bidPrice }) => {
    const etf = etfData[isin];
    if (etf) {
      bidValue += etf.bid * quantity;
      askValue += etf.ask * quantity;
    }
  });

  const midValue = (bidValue + askValue) / 2;

  return { bidValue, askValue, midValue };
}
