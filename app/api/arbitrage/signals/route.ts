import { NextRequest, NextResponse } from 'next/server';
import { 
  getActiveSignals, 
  getSignalsByAssetType, 
  getSignalStats,
  getSignalHistory,
} from '@/lib/engine/signal-engine';
import type { AssetType } from '@/lib/types/arbitrage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assetType = searchParams.get('assetType') as AssetType | null;
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    let signals;
    if (assetType && (assetType === 'GOLD' || assetType === 'SILVER')) {
      signals = getSignalsByAssetType(assetType);
    } else {
      signals = getActiveSignals();
    }
    
    const stats = getSignalStats();
    
    const response: {
      success: boolean;
      signals: typeof signals;
      stats: typeof stats;
      timestamp: string;
      history?: ReturnType<typeof getSignalHistory>;
    } = {
      success: true,
      signals,
      stats,
      timestamp: new Date().toISOString(),
    };
    
    if (includeHistory) {
      response.history = getSignalHistory(limit);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch signals',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
