/**
 * Trade Republic Data Types and Mock Data Generator
 */

export interface StockQuote {
  isin: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  timestamp: number;
}

export interface PortfolioPosition {
  isin: string;
  name: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  currency: string;
}

export interface PortfolioData {
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  positions: PortfolioPosition[];
  lastUpdated: string;
  currency: string;
}

/**
 * Generate mock portfolio data for demo purposes
 */
export function createMockPortfolioData(): PortfolioData {
  const positions: PortfolioPosition[] = [
    {
      isin: 'IE00B4NCMG89',
      name: 'Physical Silver ETC',
      symbol: 'XSLV',
      quantity: 10,
      averagePrice: 65.00,
      currentPrice: 69.02,
      totalValue: 690.20,
      profitLoss: 40.20,
      profitLossPercent: 6.18,
      currency: 'USD',
    },
    {
      isin: 'GB00BS840F36',
      name: 'Physical Gold ETC',
      symbol: 'PHAU',
      quantity: 5,
      averagePrice: 400.00,
      currentPrice: 424.50,
      totalValue: 2122.50,
      profitLoss: 122.50,
      profitLossPercent: 6.13,
      currency: 'USD',
    },
    {
      isin: 'US0846707026',
      name: 'Berkshire Hathaway B',
      symbol: 'BRK.B',
      quantity: 3,
      averagePrice: 410.00,
      currentPrice: 418.62,
      totalValue: 1255.86,
      profitLoss: 25.86,
      profitLossPercent: 2.10,
      currency: 'USD',
    },
  ];

  const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  const totalCost = positions.reduce((sum, p) => sum + (p.averagePrice * p.quantity), 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = (totalProfitLoss / totalCost) * 100;

  return {
    totalValue,
    totalProfitLoss,
    totalProfitLossPercent,
    positions,
    lastUpdated: new Date().toISOString(),
    currency: 'USD',
  };
}

/**
 * Generate performance data for charts
 */
export function generatePerformanceData(days = 30): Array<{ date: string; value: number }> {
  const data: Array<{ date: string; value: number }> = [];
  const startValue = 3500;
  const endValue = 4068.56; // Current total portfolio value
  const dailyChange = (endValue - startValue) / days;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    
    // Add some variance
    const variance = (Math.random() - 0.5) * 100;
    const value = startValue + (dailyChange * i) + variance;

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }

  return data;
}

/**
 * Generate allocation data for pie charts
 */
export function generateAllocationData(): Array<{ name: string; value: number; color: string }> {
  return [
    { name: 'Gold', value: 52.2, color: '#FFD700' },
    { name: 'Silver', value: 17.0, color: '#C0C0C0' },
    { name: 'Stocks', value: 30.8, color: '#22c55e' },
  ];
}
