import { NextRequest, NextResponse } from 'next/server';
import { getETFSnapshot } from '@/lib/etf-data';

/**
 * GET /api/etf/snapshot
 * Returns current ETF price snapshot with Bid/Ask/Last
 */
export async function GET(request: NextRequest) {
  try {
    const snapshot = getETFSnapshot();

    return NextResponse.json(
      {
        data: snapshot.etfs,
        meta: {
          timestamp: snapshot.timestamp,
          source: snapshot.source,
          count: snapshot.etfs.length,
          lastUpdate: snapshot.lastTRUpdate,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[ETF API] Error fetching snapshot:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ETF snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
