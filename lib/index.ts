// Export all trade-republic utilities
export {
  createMockPortfolioData,
  generatePerformanceData,
  generateAllocationData,
} from './trade-republic';

export type {
  StockQuote,
  PortfolioData,
  PortfolioPosition,
} from './trade-republic';

// Export API service functions
export {
  initializeTradeRepublicAPI,
  fetchPortfolioData,
  subscribeToPrice,
  executeTrade,
  fetchPositions,
  disconnectAPI,
} from './api-service';

// Export utilities
export { cn } from './utils';

// Export Binance service
export {
  getMarketSnapshot,
  formatPrice,
  formatTimestamp,
} from './binance-service';

export type {
  MarketSnapshot,
  MarketPair,
  BinancePrice,
} from './binance-service';
