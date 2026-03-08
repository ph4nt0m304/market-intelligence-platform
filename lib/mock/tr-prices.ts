export type MockTRPrice = { price: number; bid?: number; ask?: number; change24h?: number }

export const MOCK_TR_PRICES: Record<string, MockTRPrice> = {
  'DE000A0S9GB0': { price: 71.50, bid: 71.45, ask: 71.55, change24h: 0.85 },
  'DE000EWG0LD1': { price: 71.48, bid: 71.43, ask: 71.53, change24h: 0.72 },
  'IE00B4ND3602': { price: 77.25, bid: 77.20, ask: 77.30, change24h: 0.95 },
  'GB00B00FHZ82': { price: 225.80, bid: 225.70, ask: 225.90, change24h: 1.20 },
  'JE00B1VS3770': { price: 242.15, bid: 242.05, ask: 242.25, change24h: 0.68 },
  'CH0104136285': { price: 72.10, bid: 72.05, ask: 72.15, change24h: 0.55 },
  'DE000A0N62F2': { price: 29.80, bid: 29.75, ask: 29.85, change24h: -0.42 },
  'IE00B4NCWG09': { price: 32.45, bid: 32.40, ask: 32.50, change24h: 0.18 },
  'GB00B00FHT20': { price: 32.20, bid: 32.15, ask: 32.25, change24h: -0.65 },
  'JE00B1VS3333': { price: 32.35, bid: 32.30, ask: 32.40, change24h: 0.33 },
  'CH0183136024': { price: 2850.00, bid: 2845.00, ask: 2855.00, change24h: -0.22 },
}
