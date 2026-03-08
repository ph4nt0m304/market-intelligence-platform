import { NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/binance-service';
import { 
  TR_GOLD_INSTRUMENTS, 
  TR_SILVER_INSTRUMENTS,
  TROY_OUNCE_GRAMS,
  GOLD_SILVER_RATIO,
} from '@/lib/config/instruments';
import { calculateInstrumentSpread } from '@/lib/engine/arbitrage-engine';
import { processSpreadBatch, getActiveSignals } from '@/lib/engine/signal-engine';
import type { SpreadResult, NormalizedPrice } from '@/lib/types/arbitrage';
import { MOCK_TR_PRICES } from '@/lib/mock/tr-prices';

export async function GET() {
  try {
    // Fetch Binance prices
    const snapshot = await getMarketSnapshot();
    
    const paxgPrice = snapshot.xauUsd.price || 2650;
    const eurUsd = snapshot.eurUsd.price || 1.08;
    const silverPriceUsd = paxgPrice / GOLD_SILVER_RATIO.default;
    
    // Create normalized price objects
    const goldPrice: NormalizedPrice = {
      source: 'BINANCE',
      assetType: 'GOLD',
      symbol: 'PAXGUSDT',
      displayName: 'PAX Gold',
      price: paxgPrice,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      exchange: 'Binance',
      instrumentType: 'TOKEN',
      referenceUnit: 'OZ',
      marketState: 'OPEN',
      isStale: false,
    };
    
    const silverPrice: NormalizedPrice = {
      source: 'BINANCE',
      assetType: 'SILVER',
      symbol: 'XAG_PROXY',
      displayName: 'Silver (Proxy)',
      price: silverPriceUsd,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      exchange: 'Binance',
      instrumentType: 'SPOT',
      referenceUnit: 'OZ',
      marketState: 'OPEN',
      isStale: false,
    };
    
    // Calculate gold spreads
    const goldSpreads: SpreadResult[] = [];
    for (const instrument of TR_GOLD_INSTRUMENTS) {
      const trData = MOCK_TR_PRICES[instrument.isin];
      if (trData) {
        const spread = calculateInstrumentSpread(
          instrument,
          trData.price,
          trData.bid,
          trData.ask,
          paxgPrice,
          eurUsd
        );
        goldSpreads.push(spread);
      }
    }
    
    // Calculate silver spreads
    const silverSpreads: SpreadResult[] = [];
    for (const instrument of TR_SILVER_INSTRUMENTS) {
      const trData = MOCK_TR_PRICES[instrument.isin];
      if (trData) {
        const pricePerGram = silverPriceUsd / TROY_OUNCE_GRAMS;
        let normalizedPrice = pricePerGram * (instrument.gramPerUnit || 1);
        if (instrument.currency === 'EUR') {
          normalizedPrice = normalizedPrice / eurUsd;
        }
        
        const spread: SpreadResult = {
          id: `${instrument.isin}-${Date.now()}`,
          assetType: 'SILVER',
          trInstrument: instrument,
          binanceSymbol: 'SILVER_PROXY',
          trPrice: trData.price,
          trBid: trData.bid,
          trAsk: trData.ask,
          binancePrice: normalizedPrice,
          spreadAbs: trData.price - normalizedPrice,
          spreadPct: ((trData.price - normalizedPrice) / normalizedPrice) * 100,
          spreadBps: ((trData.price - normalizedPrice) / normalizedPrice) * 10000,
          zScore: 0,
          historicalMean: 0,
          historicalStdDev: 0.5,
          confidence: 'MEDIUM',
          currency: instrument.currency,
          fxRate: eurUsd,
          timestamp: new Date().toISOString(),
          marketHoursComparable: true,
          trMarketState: 'OPEN',
          binanceMarketState: 'OPEN',
          isStale: false,
        };
        silverSpreads.push(spread);
      }
    }
    
    // Process signals
    const allSpreads = [...goldSpreads, ...silverSpreads];
    processSpreadBatch(allSpreads);
    const signals = getActiveSignals();
    
    return NextResponse.json({
      success: true,
      goldPrice,
      silverPrice,
      eurUsdRate: eurUsd,
      goldSpreads,
      silverSpreads,
      signals,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching arbitrage data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch arbitrage data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
