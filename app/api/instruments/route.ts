import { NextRequest, NextResponse } from 'next/server';
import { 
  TR_GOLD_INSTRUMENTS, 
  TR_SILVER_INSTRUMENTS,
  TR_ALL_INSTRUMENTS,
  BINANCE_INSTRUMENTS,
  getInstrumentByISIN,
} from '@/lib/config/instruments';
import type { AssetType } from '@/lib/types/arbitrage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assetType = searchParams.get('assetType') as AssetType | null;
    const isin = searchParams.get('isin');
    const source = searchParams.get('source'); // 'tr' or 'binance'
    
    // Get specific instrument by ISIN
    if (isin) {
      const instrument = getInstrumentByISIN(isin);
      if (!instrument) {
        return NextResponse.json(
          { success: false, error: 'Instrument not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        instrument,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Get Binance instruments
    if (source === 'binance') {
      let instruments = BINANCE_INSTRUMENTS;
      if (assetType) {
        instruments = instruments.filter(i => i.assetType === assetType);
      }
      return NextResponse.json({
        success: true,
        instruments,
        count: instruments.length,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Get TR instruments (default)
    let instruments;
    if (assetType === 'GOLD') {
      instruments = TR_GOLD_INSTRUMENTS;
    } else if (assetType === 'SILVER') {
      instruments = TR_SILVER_INSTRUMENTS;
    } else {
      instruments = TR_ALL_INSTRUMENTS;
    }
    
    // Filter to active only
    instruments = instruments.filter(i => i.active);
    
    return NextResponse.json({
      success: true,
      instruments,
      count: instruments.length,
      goldCount: instruments.filter(i => i.assetType === 'GOLD').length,
      silverCount: instruments.filter(i => i.assetType === 'SILVER').length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching instruments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch instruments',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
