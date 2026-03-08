import { NextResponse } from 'next/server';
import { getETFSnapshot } from '@/lib/etf-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/export/etfs
 * Export ETF data (Trade Republic instruments)
 */
export async function GET() {
  try {
    const snapshot = getETFSnapshot();
    
    const data = {
      timestamp: new Date().toISOString(),
      source: 'Trade Republic',
      lastTRUpdate: snapshot.lastTRUpdate,
      instruments: snapshot.etfs.map(etf => ({
        isin: etf.isin,
        name: etf.name,
        symbol: etf.symbol,
        bid: etf.bid,
        ask: etf.ask,
        last: etf.last,
        spread: etf.spread,
        spreadPercent: etf.spreadPercent,
        currency: etf.currency,
        source: etf.source,
      })),
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[API ETFs] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ETF data' },
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
