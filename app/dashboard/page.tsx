'use client';

import { useState, useEffect } from 'react';
import { TerminalLayout, PanelGrid, StatCard } from '@/components/terminal/terminal-layout';
import { StaticTickerStrip } from '@/components/terminal/ticker-strip';
import { SpreadGauge } from '@/components/terminal/spread-gauge';
import { SignalBlotter } from '@/components/terminal/signal-blotter';
import { PriceTable } from '@/components/terminal/price-table';
import { AssetToggle } from '@/components/terminal/asset-toggle';
import { MarketStatus } from '@/components/terminal/market-status';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetType, SpreadResult, TradingSignal } from '@/lib/types/arbitrage';
import { getMarketSnapshot } from '@/lib/binance-service';
import { 
  TR_GOLD_INSTRUMENTS, 
  TR_SILVER_INSTRUMENTS,
  TROY_OUNCE_GRAMS,
  GOLD_SILVER_RATIO,
} from '@/lib/config/instruments';
import { calculateInstrumentSpread } from '@/lib/engine/arbitrage-engine';
import { processSpreadBatch, getActiveSignals } from '@/lib/engine/signal-engine';
import { MOCK_TR_PRICES } from '@/lib/mock/tr-prices';

export default function DashboardPage() {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('GOLD');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [goldPrice, setGoldPrice] = useState<number>(0);
  const [silverPrice, setSilverPrice] = useState<number>(0);
  const [eurUsdRate, setEurUsdRate] = useState<number>(1.08);
  const [goldSpreads, setGoldSpreads] = useState<SpreadResult[]>([]);
  const [silverSpreads, setSilverSpreads] = useState<SpreadResult[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [tickerItems, setTickerItems] = useState<Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
  }>>([]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getMarketSnapshot();
      
      const paxgPrice = snapshot.xauUsd.price || 2650;
      const eurUsd = snapshot.eurUsd.price || 1.08;
      const silverPriceUsd = paxgPrice / GOLD_SILVER_RATIO.default;
      
      setGoldPrice(paxgPrice);
      setSilverPrice(silverPriceUsd);
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
      
      // Process signals
      const allSpreads = [...goldSpreadResults, ...silverSpreadResults];
      processSpreadBatch(allSpreads);
      const activeSignals = getActiveSignals();
      setSignals(activeSignals);
      
      // Mise à jour du ticker
      setTickerItems([
        {
          symbol: 'PAXG',
          name: 'PAX Gold',
          price: paxgPrice,
          change: Math.random() * 20 - 10,
          changePercent: Math.random() * 2 - 1,
          currency: 'USD',
        },
        {
          symbol: 'XAG',
          name: 'Silver',
          price: silverPriceUsd,
          change: Math.random() * 0.5 - 0.25,
          changePercent: Math.random() * 3 - 1.5,
          currency: 'USD',
        },
        {
          symbol: 'EUR/USD',
          name: 'Euro',
          price: eurUsd,
          change: Math.random() * 0.01 - 0.005,
          changePercent: Math.random() * 0.5 - 0.25,
          currency: 'USD',
        },
        {
          symbol: 'XAU/EUR',
          name: 'Gold EUR',
          price: paxgPrice / eurUsd,
          change: Math.random() * 15 - 7.5,
          changePercent: Math.random() * 1.5 - 0.75,
          currency: 'EUR',
        },
      ]);
      
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Échec du chargement des données de marché :', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const activeSpreads = selectedAsset === 'GOLD' ? goldSpreads : silverSpreads;
  const avgSpread = activeSpreads.length > 0
    ? activeSpreads.reduce((sum, s) => sum + s.spreadPct, 0) / activeSpreads.length
    : 0;
  const bestOpportunity = activeSpreads.length > 0
    ? activeSpreads.reduce((best, s) => Math.abs(s.spreadPct) > Math.abs(best.spreadPct) ? s : best, activeSpreads[0])
    : null;
  const selectedAssetLabel = selectedAsset === 'GOLD' ? 'OR' : 'ARGENT';
  
  return (
    <TerminalLayout
      title="Tableau de bord"
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
      {/* Ticker Strip */}
      <StaticTickerStrip
        items={tickerItems}
        isConnected={!isLoading}
        lastUpdate={lastUpdate || undefined}
      />
      
      <div className="p-4 space-y-4">
        {/* Asset Toggle & Summary Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <AssetToggle
            value={selectedAsset}
            onChange={setSelectedAsset}
            size="md"
          />
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">PAXG:</span>
              <span className="font-mono text-gold">${goldPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Argent :</span>
              <span className="font-mono text-silver">${silverPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">EUR/USD:</span>
              <span className="font-mono">{eurUsdRate.toFixed(4)}</span>
            </div>
          </div>
        </div>
        
        {/* Top Stats Row */}
        <PanelGrid cols={4} gap="md">
          <StatCard
            label="Prix de référence"
            value={`$${(selectedAsset === 'GOLD' ? goldPrice : silverPrice).toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            valueClassName={selectedAsset === 'GOLD' ? 'text-gold' : 'text-silver'}
          />
          <StatCard
            label="Écart moyen"
            value={`${avgSpread > 0 ? '+' : ''}${avgSpread.toFixed(2)}%`}
            icon={<Activity className="h-5 w-5" />}
            valueClassName={cn(
              avgSpread < -0.5 && 'text-[var(--positive)]',
              avgSpread > 0.5 && 'text-[var(--negative)]'
            )}
          />
          <StatCard
            label="Meilleure opportunité"
            value={bestOpportunity ? `${bestOpportunity.spreadPct > 0 ? '+' : ''}${bestOpportunity.spreadPct.toFixed(2)}%` : 'N/D'}
            icon={bestOpportunity && bestOpportunity.spreadPct < 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            valueClassName={cn(
              bestOpportunity?.spreadPct && bestOpportunity.spreadPct < -0.5 && 'text-[var(--positive)]',
              bestOpportunity?.spreadPct && bestOpportunity.spreadPct > 0.5 && 'text-[var(--negative)]'
            )}
          />
          <StatCard
            label="Signaux actifs"
            value={signals.length}
            icon={<Activity className="h-5 w-5" />}
            valueClassName={signals.length > 0 ? 'text-[var(--warning)]' : ''}
          />
        </PanelGrid>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Spread Gauge & Market Status - Left Column */}
          <div className="space-y-4">
            <div className="terminal-panel p-4">
              <h3 className={cn(
                'text-sm font-medium uppercase tracking-wider mb-4',
                selectedAsset === 'GOLD' ? 'text-gold' : 'text-silver'
              )}>
                Vue d'ensemble des écarts {selectedAssetLabel}
              </h3>
              <SpreadGauge
                assetType={selectedAsset}
                spreadPct={avgSpread}
                zScore={0}
                confidence={Math.abs(avgSpread) < 0.5 ? 'HIGH' : 'MEDIUM'}
                size="lg"
              />
            </div>
            
            <MarketStatus showDetails />
          </div>
          
          {/* Price Table - Center Column */}
          <div className="lg:col-span-2">
            <PriceTable
              spreads={activeSpreads}
              title={`Instruments ${selectedAssetLabel}`}
              assetType={selectedAsset}
              maxHeight="400px"
            />
          </div>
        </div>
        
        {/* Signal Blotter */}
        <SignalBlotter
          signals={signals}
          maxHeight="250px"
          showHeader
        />
      </div>
    </TerminalLayout>
  );
}
