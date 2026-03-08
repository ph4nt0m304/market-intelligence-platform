import { NextRequest, NextResponse } from 'next/server';
import { getLegacyLiveSnapshot, resolveLegacyPair } from '@/lib/live-market-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: NextRequest, context: { params: Promise<{ pair: string }> }) {
  try {
    const { pair } = await context.params;
    const snapshot = await getLegacyLiveSnapshot();
    const quote = resolveLegacyPair(snapshot, pair);

    if (!quote) {
      return NextResponse.json(
        { error: 'Not Found', message: `Unknown pair "${pair}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(quote, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[API /price/:pair] failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to resolve pair',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
