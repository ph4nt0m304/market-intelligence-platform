import { NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/binance-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/export/markets
 * Export market prices from Binance (XAU, XAG, EUR/USD)
 */
export async function GET() {
  try {
    const snapshot = await getMarketSnapshot();
    
    const data = {
      timestamp: new Date().toISOString(),
      source: 'Binance',
      pairs: [
        {
          symbol: 'XAU/USD',
          binanceSymbol: snapshot.xauUsd.binanceSymbol,
          price: snapshot.xauUsd.price,
          currency: 'USD',
          lastUpdate: snapshot.xauUsd.lastUpdate,
        },
        {
          symbol: 'XAG/USD',
          binanceSymbol: snapshot.xagUsd.binanceSymbol,
          price: snapshot.xagUsd.price,
          currency: 'USD',
          lastUpdate: snapshot.xagUsd.lastUpdate,
        },
        {
          symbol: 'EUR/USD',
          binanceSymbol: snapshot.eurUsd.binanceSymbol,
          price: snapshot.eurUsd.price,
          currency: 'USD',
          lastUpdate: snapshot.eurUsd.lastUpdate,
        },
        {
          symbol: 'XAU/EUR',
          binanceSymbol: snapshot.xauEur.binanceSymbol,
          price: snapshot.xauEur.price,
          currency: 'EUR',
          lastUpdate: snapshot.xauEur.lastUpdate,
        },
        {
          symbol: 'XAG/EUR',
          binanceSymbol: snapshot.xagEur.binanceSymbol,
          price: snapshot.xagEur.price,
          currency: 'EUR',
          lastUpdate: snapshot.xagEur.lastUpdate,
        },
      ],
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[API Markets] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
