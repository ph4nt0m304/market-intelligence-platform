import { NextResponse } from 'next/server';
import { getLegacyLiveSnapshot } from '@/lib/live-market-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await getLegacyLiveSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API /data] failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to build live snapshot',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
