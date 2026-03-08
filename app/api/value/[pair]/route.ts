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
      return new NextResponse('Not Found', { status: 404 });
    }

    if (quote.price == null) {
      return new NextResponse('waiting', { status: 503 });
    }

    return new NextResponse(String(quote.price), {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[API /value/:pair] failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
