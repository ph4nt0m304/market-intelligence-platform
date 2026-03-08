'use client';

import { useState, useEffect, useCallback } from 'react';
import { TerminalLayout, PanelGrid, StatCard } from '@/components/terminal/terminal-layout';
import { SpreadGauge } from '@/components/terminal/spread-gauge';
import { PriceTable } from '@/components/terminal/price-table';
import { AssetToggle } from '@/components/terminal/asset-toggle';
import { SpreadChart } from '@/components/terminal/spread-chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, ArrowLeftRight, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMarketSnapshot } from '@/lib/binance-service';
import { 
  TR_GOLD_INSTRUMENTS, 
  TR_SILVER_INSTRUMENTS,
  TROY_OUNCE_GRAMS,
} from '@/lib/config/instruments';
import { calculateInstrumentSpread } from '@/lib/engine/arbitrage-engine';
import type { AssetType, SpreadResult, ArbitrageOpportunity, SpreadHistoryPoint } from '@/lib/types/arbitrage';
import { MOCK_TR_PRICES } from '@/lib/mock/tr-prices';

export default function ArbitragePage() {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('GOLD');
  const [isLoading, setIsLoading] = useState(true);
  const [goldPrice, setGoldPrice] = useState<number>(0);
  const [eurUsdRate, setEurUsdRate] = useState<number>(1.08);
  const [goldSpreads, setGoldSpreads] = useState<SpreadResult[]>([]);
  const [silverSpreads, setSilverSpreads] = useState<SpreadResult[]>([]);
  const [spreadHistory, setSpreadHistory] = useState<SpreadHistoryPoint[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getMarketSnapshot();
      
      const paxgPrice = snapshot.xauUsd.price || 2650;
      const eurUsd = snapshot.eurUsd.price || 1.08;
      const silverPriceUsd = paxgPrice / 85;
      
      setGoldPrice(paxgPrice);
      setEurUsdRate(eurUsd);
      
      // Calculate spreads for gold instruments
      const goldSpreadResults: SpreadResult[] = [];
      for (const instrument of TR_GOLD_INSTRUMENTS) {
        const trData = MOCK_TR_PRICES[instrument.isin];
        if (trData) {
          const spread = calculateInstrumentSpread(
            instrument,
            trData.price,
            trData.bid,
            trData.ask,
            paxgPrice,
            eurUsd
          );
          goldSpreadResults.push(spread);
        }
      }
      setGoldSpreads(goldSpreadResults);
      
      // Calculate spreads for silver instruments
      const silverSpreadResults: SpreadResult[] = [];
      for (const instrument of TR_SILVER_INSTRUMENTS) {
        const trData = MOCK_TR_PRICES[instrument.isin];
        if (trData) {
          const pricePerGram = silverPriceUsd / TROY_OUNCE_GRAMS;
          let normalizedPrice = pricePerGram * (instrument.gramPerUnit || 1);
          if (instrument.currency === 'EUR') {
            normalizedPrice = normalizedPrice / eurUsd;
          }
          
          const spread: SpreadResult = {
            id: `${instrument.isin}-${Date.now()}`,
            assetType: 'SILVER',
            trInstrument: instrument,
            binanceSymbol: 'SILVER_PROXY',
            trPrice: trData.price,
            trBid: trData.bid,
            trAsk: trData.ask,
            binancePrice: normalizedPrice,
            spreadAbs: trData.price - normalizedPrice,
            spreadPct: ((trData.price - normalizedPrice) / normalizedPrice) * 100,
            spreadBps: ((trData.price - normalizedPrice) / normalizedPrice) * 10000,
            zScore: Math.random() * 2 - 1,
            historicalMean: 0,
            historicalStdDev: 0.5,
            confidence: Math.abs(trData.price - normalizedPrice) < normalizedPrice * 0.01 ? 'HIGH' : 'MEDIUM',
            currency: instrument.currency,
            fxRate: eurUsd,
            timestamp: new Date().toISOString(),
            marketHoursComparable: true,
            trMarketState: 'OPEN',
            binanceMarketState: 'OPEN',
            isStale: false,
          };
          silverSpreadResults.push(spread);
        }
      }
      setSilverSpreads(silverSpreadResults);

      // Update spread history
      const allSpreads = selectedAsset === 'GOLD' ? goldSpreadResults : silverSpreadResults;
      const avgSpread = allSpreads.length > 0
        ? allSpreads.reduce((sum, s) => sum + s.spreadPct, 0) / allSpreads.length
        : 0;
      
      setSpreadHistory(prev => [
        ...prev.slice(-59),
        {
          timestamp: new Date().toISOString(),
          spreadPct: avgSpread,
          spreadBps: avgSpread * 100,
          trPrice: allSpreads[0]?.trPrice ?? 0,
          binancePrice: allSpreads[0]?.binancePrice ?? 0,
        }
      ]);

      // Generate opportunities
      const allSpreadResults = [...goldSpreadResults, ...silverSpreadResults];
      const opps: ArbitrageOpportunity[] = allSpreadResults
        .filter(s => Math.abs(s.spreadPct) > 0.5)
        .map(s => ({
          id: s.id,
          assetType: s.assetType,
          direction: s.spreadPct < 0 ? 'BUY_TR_SELL_BINANCE' as const : 'BUY_BINANCE_SELL_TR' as const,
          trInstrument: s.trInstrument,
          binanceSymbol: s.binanceSymbol,
          entrySpreadPct: s.spreadPct,
          currentSpreadPct: s.spreadPct,
          potentialProfitPct: Math.abs(s.spreadPct) * 0.7,
          potentialProfitAbs: Math.abs(s.spreadAbs) * 0.7,
          estimatedFees: Math.abs(s.spreadPct) * 0.3,
          netProfitPct: Math.abs(s.spreadPct) * 0.4,
          confidence: s.confidence,
          riskLevel: Math.abs(s.spreadPct) > 1.5 ? 'HIGH' as const : 'MEDIUM' as const,
          timestamp: s.timestamp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          status: 'OPEN' as const,
        }))
        .slice(0, 5);
      setOpportunities(opps);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAsset]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeSpreads = selectedAsset === 'GOLD' ? goldSpreads : silverSpreads;
  const avgSpread = activeSpreads.length > 0
    ? activeSpreads.reduce((sum, s) => sum + s.spreadPct, 0) / activeSpreads.length
    : 0;
  const minSpread = activeSpreads.length > 0
    ? Math.min(...activeSpreads.map(s => s.spreadPct))
    : 0;
  const maxSpread = activeSpreads.length > 0
    ? Math.max(...activeSpreads.map(s => s.spreadPct))
    : 0;
  const avgZScore = activeSpreads.length > 0
    ? activeSpreads.reduce((sum, s) => sum + s.zScore, 0) / activeSpreads.length
    : 0;
  const selectedAssetLabel = selectedAsset === 'GOLD' ? 'OR' : 'ARGENT';

  return (
    <TerminalLayout
      title="Arbitrage"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Actualiser
        </Button>
      }
    >
      <div className="p-4 space-y-4">
        {/* Asset Toggle & Reference Prices */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <AssetToggle value={selectedAsset} onChange={setSelectedAsset} size="md" />
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">PAXG:</span>
              <span className="font-mono text-gold">${goldPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">EUR/USD:</span>
              <span className="font-mono">{eurUsdRate.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <PanelGrid cols={4} gap="md">
          <StatCard
            label="Écart moyen"
            value={`${avgSpread > 0 ? '+' : ''}${avgSpread.toFixed(3)}%`}
            icon={<ArrowLeftRight className="h-5 w-5" />}
            valueClassName={cn(
              avgSpread < -0.5 && 'text-[var(--positive)]',
              avgSpread > 0.5 && 'text-[var(--negative)]'
            )}
          />
          <StatCard
            label="Écart min."
            value={`${minSpread > 0 ? '+' : ''}${minSpread.toFixed(3)}%`}
            icon={<TrendingDown className="h-5 w-5" />}
            valueClassName={minSpread < -0.5 ? 'text-[var(--positive)]' : ''}
          />
          <StatCard
            label="Écart max."
            value={`${maxSpread > 0 ? '+' : ''}${maxSpread.toFixed(3)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            valueClassName={maxSpread > 0.5 ? 'text-[var(--negative)]' : ''}
          />
          <StatCard
            label="Z-Score moyen"
            value={avgZScore.toFixed(2)}
            icon={<Zap className="h-5 w-5" />}
            valueClassName={cn(
              Math.abs(avgZScore) > 1.5 && 'text-[var(--warning)]'
            )}
          />
        </PanelGrid>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Spread Gauge & Chart */}
          <div className="space-y-4">
            <div className="terminal-panel p-4">
              <h3 className={cn(
                'text-sm font-medium uppercase tracking-wider mb-4',
                selectedAsset === 'GOLD' ? 'text-gold' : 'text-silver'
              )}>
                Écart actuel
              </h3>
              <SpreadGauge
                assetType={selectedAsset}
                spreadPct={avgSpread}
                zScore={avgZScore}
                confidence={Math.abs(avgSpread) < 0.5 ? 'HIGH' : 'MEDIUM'}
                size="lg"
              />
            </div>

            <SpreadChart
              data={spreadHistory}
              assetType={selectedAsset}
              height={200}
            />
          </div>

          {/* Price Table */}
          <div className="lg:col-span-2">
            <PriceTable
              spreads={activeSpreads}
              title={`${selectedAssetLabel} écarts vs Binance`}
              assetType={selectedAsset}
              maxHeight="450px"
            />
          </div>
        </div>

        {/* Opportunities */}
        <div className="terminal-panel">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Opportunités actives
            </h3>
            <Badge variant="outline" className="text-xs">
              {opportunities.length} ouvertes
            </Badge>
          </div>
          
          {opportunities.length > 0 ? (
            <div className="divide-y divide-border/50">
              {opportunities.map((opp) => (
                <div 
                  key={opp.id}
                  className="p-4 hover:bg-surface-2/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        opp.direction === 'BUY_TR_SELL_BINANCE' 
                          ? 'bg-[var(--positive)]/10 text-[var(--positive)]'
                          : 'bg-[var(--negative)]/10 text-[var(--negative)]'
                      )}>
                        {opp.direction === 'BUY_TR_SELL_BINANCE' 
                          ? <TrendingUp className="h-5 w-5" />
                          : <TrendingDown className="h-5 w-5" />
                        }
                      </div>
                      <div>
                        <div className="font-medium text-sm">{opp.trInstrument.shortName}</div>
                        <div className="text-xs text-muted-foreground">
                          {opp.direction === 'BUY_TR_SELL_BINANCE' 
                            ? 'Acheter TR, vendre Binance'
                            : 'Acheter Binance, vendre TR'
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Écart</div>
                        <div className={cn(
                          'font-mono text-sm',
                          opp.currentSpreadPct < 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
                        )}>
                          {opp.currentSpreadPct > 0 ? '+' : ''}{opp.currentSpreadPct.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Profit net</div>
                        <div className="font-mono text-sm text-[var(--positive)]">
                          +{opp.netProfitPct.toFixed(2)}%
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        opp.confidence === 'HIGH' && 'border-[var(--positive)]/50 text-[var(--positive)]',
                        opp.confidence === 'MEDIUM' && 'border-[var(--warning)]/50 text-[var(--warning)]'
                      )}>
                        {opp.confidence === 'HIGH' ? 'ÉLEVÉE' : 'MOYENNE'}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        opp.riskLevel === 'HIGH' && 'border-[var(--negative)]/50 text-[var(--negative)]',
                        opp.riskLevel === 'MEDIUM' && 'border-[var(--warning)]/50 text-[var(--warning)]'
                      )}>
                        Risque {opp.riskLevel === 'HIGH' ? 'ÉLEVÉ' : 'MOYEN'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Aucune opportunité d'arbitrage détectée.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Les opportunités apparaissent quand l'écart dépasse 0,5 %
              </p>
            </div>
          )}
        </div>
      </div>
    </TerminalLayout>
  );
}
