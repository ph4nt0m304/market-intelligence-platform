import { NextRequest, NextResponse } from 'next/server';
import { getMarketSnapshot } from '@/lib/binance-service';
import { getETFSnapshot } from '@/lib/etf-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/export
 * Export all market data in JSON or CSV format
 * 
 * Query params:
 * - format: 'json' | 'csv' (default: json)
 * - include: comma-separated list of 'markets,etfs,arbitrage,signals' (default: all)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';
  const includeParam = searchParams.get('include') || 'markets,etfs,arbitrage,signals';
  const includes = includeParam.split(',').map(s => s.trim().toLowerCase());

  try {
    const timestamp = new Date().toISOString();
    const data: Record<string, unknown> = {
      exportTimestamp: timestamp,
      source: 'Market Intelligence Platform',
      version: '1.0.0',
    };

    // Fetch market data from Binance
    if (includes.includes('markets')) {
      const marketSnapshot = await getMarketSnapshot();
      data.markets = {
        binance: {
          xauUsd: marketSnapshot.xauUsd,
          xagUsd: marketSnapshot.xagUsd,
          eurUsd: marketSnapshot.eurUsd,
          xauEur: marketSnapshot.xauEur,
          xagEur: marketSnapshot.xagEur,
        },
        timestamp: marketSnapshot.timestamp,
        source: marketSnapshot.source,
      };
    }

    // Fetch ETF data from Trade Republic (mock for now)
    if (includes.includes('etfs')) {
      const etfSnapshot = getETFSnapshot();
      data.etfs = {
        instruments: etfSnapshot.etfs.map(etf => ({
          isin: etf.isin,
          name: etf.name,
          symbol: etf.symbol,
          bid: etf.bid,
          ask: etf.ask,
          last: etf.last,
          spread: etf.spread,
          spreadPercent: etf.spreadPercent,
          currency: etf.currency,
        })),
        timestamp: etfSnapshot.timestamp,
        source: etfSnapshot.source,
      };
    }

    // Calculate arbitrage opportunities
    if (includes.includes('arbitrage')) {
      const marketSnapshot = await getMarketSnapshot();
      const etfSnapshot = getETFSnapshot();
      
      // Find gold ETFs and calculate spreads
      const goldETFs = etfSnapshot.etfs.filter(e => 
        e.name.toLowerCase().includes('gold') || e.symbol.includes('PHAU')
      );
      const silverETFs = etfSnapshot.etfs.filter(e => 
        e.name.toLowerCase().includes('silv') || e.symbol.includes('XSLV')
      );

      data.arbitrage = {
        gold: goldETFs.map(etf => {
          const binancePrice = marketSnapshot.xauUsd.price;
          const spread = binancePrice && etf.last 
            ? ((etf.last - binancePrice) / binancePrice) * 100 
            : null;
          return {
            etf: {
              isin: etf.isin,
              name: etf.name,
              price: etf.last,
              bid: etf.bid,
              ask: etf.ask,
            },
            binance: {
              symbol: 'PAXGUSDT',
              price: binancePrice,
            },
            spreadPct: spread,
            spreadBps: spread ? spread * 100 : null,
            direction: spread && spread > 0 ? 'TR_EXPENSIVE' : 'TR_CHEAP',
          };
        }),
        silver: silverETFs.map(etf => {
          const binancePrice = marketSnapshot.xagUsd.price;
          const spread = binancePrice && etf.last 
            ? ((etf.last - binancePrice) / binancePrice) * 100 
            : null;
          return {
            etf: {
              isin: etf.isin,
              name: etf.name,
              price: etf.last,
              bid: etf.bid,
              ask: etf.ask,
            },
            binance: {
              symbol: 'XAG/USD (proxy)',
              price: binancePrice,
            },
            spreadPct: spread,
            spreadBps: spread ? spread * 100 : null,
            direction: spread && spread > 0 ? 'TR_EXPENSIVE' : 'TR_CHEAP',
          };
        }),
        eurUsdRate: marketSnapshot.eurUsd.price,
        timestamp,
      };
    }

    // Mock trading signals
    if (includes.includes('signals')) {
      data.signals = {
        active: [
          {
            id: 'sig-001',
            asset: 'GOLD',
            type: 'WATCH',
            instrument: 'PHAU.L (GB00BS840F36)',
            spreadPct: -0.15,
            zScore: 0.8,
            confidence: 'MEDIUM',
            rationale: 'Spread approaching historical mean',
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
          {
            id: 'sig-002',
            asset: 'SILVER',
            type: 'ALERT',
            instrument: 'XSLV.L (IE00B4NCMG89)',
            spreadPct: 1.2,
            zScore: 1.5,
            confidence: 'HIGH',
            rationale: 'TR premium above threshold',
            createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
        ],
        timestamp,
      };
    }

    // Return JSON
    if (format === 'json') {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Return CSV
    if (format === 'csv') {
      const csvLines: string[] = [];
      
      // Header
      csvLines.push('# Market Intelligence Platform Export');
      csvLines.push(`# Generated: ${timestamp}`);
      csvLines.push('');

      // Markets section
      if (data.markets && typeof data.markets === 'object') {
        const markets = data.markets as { binance: Record<string, { pair: string; price: number | null; lastUpdate: string }> };
        csvLines.push('## MARKETS (Binance)');
        csvLines.push('pair,price,currency,lastUpdate');
        Object.values(markets.binance).forEach((m) => {
          csvLines.push(`${m.pair},${m.price ?? ''},USD,${m.lastUpdate}`);
        });
        csvLines.push('');
      }

      // ETFs section
      if (data.etfs && typeof data.etfs === 'object') {
        const etfs = data.etfs as { instruments: Array<{ isin: string; name: string; symbol: string; bid: number; ask: number; last: number; spread: number; spreadPercent: number; currency: string }> };
        csvLines.push('## ETFs (Trade Republic)');
        csvLines.push('isin,name,symbol,bid,ask,last,spread,spreadPercent,currency');
        etfs.instruments.forEach((e) => {
          csvLines.push(`${e.isin},${e.name},${e.symbol},${e.bid},${e.ask},${e.last},${e.spread},${e.spreadPercent},${e.currency}`);
        });
        csvLines.push('');
      }

      // Signals section
      if (data.signals && typeof data.signals === 'object') {
        const signals = data.signals as { active: Array<{ id: string; asset: string; type: string; instrument: string; spreadPct: number; zScore: number; confidence: string; rationale: string; createdAt: string }> };
        csvLines.push('## SIGNALS');
        csvLines.push('id,asset,type,instrument,spreadPct,zScore,confidence,rationale,createdAt');
        signals.active.forEach((s) => {
          csvLines.push(`${s.id},${s.asset},${s.type},"${s.instrument}",${s.spreadPct},${s.zScore},${s.confidence},"${s.rationale}",${s.createdAt}`);
        });
      }

      const csvContent = csvLines.join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="market-export-${new Date().toISOString().split('T')[0]}.csv"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use json or csv.' }, { status: 400 });

  } catch (error) {
    console.error('[API Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
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
