import { NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/binance-service';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/market/snapshot
 * Returns current market prices from Binance (XAU, XAG, EUR pairs)
 */
export async function GET() {
  try {
    const snapshot = await getMarketSnapshot();

    return NextResponse.json(
      {
        success: true,
        data: snapshot,
        meta: {
          timestamp: snapshot.timestamp,
          source: snapshot.source,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Market API] Error fetching snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
