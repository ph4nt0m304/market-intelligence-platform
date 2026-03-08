'use client';

import { useState, useEffect } from 'react';
import { TerminalLayout, PanelGrid, StatCard } from '@/components/terminal/terminal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, TrendingUp, TrendingDown, ArrowUpDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMarketSnapshot } from '@/lib/binance-service';
import {
  TR_GOLD_INSTRUMENTS,
  TR_SILVER_INSTRUMENTS,
  BINANCE_INSTRUMENTS,
} from '@/lib/config/instruments';
import type { TRInstrument, AssetType } from '@/lib/types/arbitrage';
import { MOCK_TR_PRICES } from '@/lib/mock/tr-prices';

interface MarketData {
  goldPriceUsd: number;
  silverPriceUsd: number;
  eurUsdRate: number;
  btcPrice: number;
}

type MarketPriceData = {
  price: number;
  bid: number;
  ask: number;
  change24h: number;
};

type SortField = 'name' | 'price' | 'change' | 'spread';
type SortDir = 'asc' | 'desc';

export default function MarketsPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | AssetType>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getMarketSnapshot();
      setMarketData({
        goldPriceUsd: snapshot.xauUsd.price || 2650,
        silverPriceUsd: (snapshot.xauUsd.price || 2650) / 85,
        eurUsdRate: snapshot.eurUsd.price || 1.08,
        btcPrice: 95000,
      });
    } catch (error) {
      console.error('Échec du chargement des données de marché :', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const allInstruments: (TRInstrument & { source: 'TR' | 'BINANCE'; priceData?: MarketPriceData })[] = [
    ...TR_GOLD_INSTRUMENTS.map(i => ({ ...i, source: 'TR' as const, priceData: MOCK_TR_PRICES[i.isin] as MarketPriceData | undefined })),
    ...TR_SILVER_INSTRUMENTS.map(i => ({ ...i, source: 'TR' as const, priceData: MOCK_TR_PRICES[i.isin] as MarketPriceData | undefined })),
  ];

  const filteredInstruments = allInstruments
    .filter(i => {
      if (selectedType !== 'ALL' && i.assetType !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return i.name.toLowerCase().includes(q) ||
               i.shortName.toLowerCase().includes(q) ||
               i.isin.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'price') cmp = (a.priceData?.price || 0) - (b.priceData?.price || 0);
      else if (sortField === 'change') cmp = (a.priceData?.change24h || 0) - (b.priceData?.change24h || 0);
      else if (sortField === 'spread') {
        const spreadA = a.priceData ? ((a.priceData.ask - a.priceData.bid) / a.priceData.price) * 100 : 0;
        const spreadB = b.priceData ? ((b.priceData.ask - b.priceData.bid) / b.priceData.price) * 100 : 0;
        cmp = spreadA - spreadB;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const goldInstruments = allInstruments.filter(i => i.assetType === 'GOLD');
  const silverInstruments = allInstruments.filter(i => i.assetType === 'SILVER');

  return (
    <TerminalLayout
      title="Marchés"
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
        <PanelGrid cols={4} gap="md">
          <StatCard
            label="Or (XAU/USD)"
            value={`$${marketData?.goldPriceUsd.toFixed(2) || '--'}`}
            change={1.25}
            icon={<TrendingUp className="h-5 w-5" />}
            valueClassName="text-gold"
          />
          <StatCard
            label="Argent (XAG/USD)"
            value={`$${marketData?.silverPriceUsd.toFixed(2) || '--'}`}
            change={-0.42}
            icon={<TrendingDown className="h-5 w-5" />}
            valueClassName="text-silver"
          />
          <StatCard
            label="EUR/USD"
            value={marketData?.eurUsdRate.toFixed(4) || '--'}
            change={0.15}
          />
          <StatCard
            label="BTC/USDT"
            value={`$${marketData?.btcPrice.toLocaleString() || '--'}`}
            change={2.35}
            valueClassName="text-[var(--warning)]"
          />
        </PanelGrid>

        <div className="terminal-panel p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedType === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('ALL')}
              >
                Tous ({allInstruments.length})
              </Button>
              <Button
                variant={selectedType === 'GOLD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('GOLD')}
                className={selectedType === 'GOLD' ? 'bg-gold/20 text-gold border-gold/50' : ''}
              >
                Or ({goldInstruments.length})
              </Button>
              <Button
                variant={selectedType === 'SILVER' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('SILVER')}
                className={selectedType === 'SILVER' ? 'bg-silver/20 text-silver border-silver/50' : ''}
              >
                Argent ({silverInstruments.length})
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un instrument..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-surface-2 border-border"
              />
            </div>
          </div>
        </div>

        <div className="terminal-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('name')}
                    >
                      Instrument
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ISIN</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                      onClick={() => handleSort('price')}
                    >
                      Prix
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Achat</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vente</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                      onClick={() => handleSort('spread')}
                    >
                      Écart
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      className="flex items-center gap-1 hover:text-foreground ml-auto"
                      onClick={() => handleSort('change')}
                    >
                      24h %
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">g/Unité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredInstruments.map((instrument) => {
                  const priceData = instrument.priceData;
                  const spread = priceData ? ((priceData.ask - priceData.bid) / priceData.price) * 100 : 0;

                  return (
                    <tr
                      key={instrument.isin}
                      className="hover:bg-surface-2/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            instrument.assetType === 'GOLD' ? 'bg-gold' : 'bg-silver'
                          )} />
                          <div>
                            <div className="font-medium text-sm">{instrument.shortName}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-48">{instrument.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs text-muted-foreground">{instrument.isin}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          instrument.assetType === 'GOLD' ? 'border-gold/50 text-gold' : 'border-silver/50 text-silver'
                        )}>
                          {instrument.assetType === 'GOLD' ? 'OR' : 'ARGENT'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono text-sm">
                          {priceData ? `${instrument.currency === 'EUR' ? '€' : '$'}${priceData.price.toFixed(2)}` : '--'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono text-xs text-muted-foreground">{priceData?.bid.toFixed(2) || '--'}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono text-xs text-muted-foreground">{priceData?.ask.toFixed(2) || '--'}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono text-xs">{spread.toFixed(3)}%</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={cn(
                          'font-mono text-sm',
                          priceData && priceData.change24h > 0 && 'text-[var(--positive)]',
                          priceData && priceData.change24h < 0 && 'text-[var(--negative)]'
                        )}>
                          {priceData ? `${priceData.change24h > 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%` : '--'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono text-xs text-muted-foreground">{instrument.gramPerUnit?.toFixed(3) || '--'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInstruments.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Aucun instrument ne correspond à vos critères.
            </div>
          )}
        </div>

        <div className="terminal-panel p-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Prix de référence Binance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BINANCE_INSTRUMENTS.filter(i => i.active).map((instrument) => (
              <div
                key={instrument.symbol}
                className="bg-surface-2 rounded-lg p-3 border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{instrument.displayName}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {instrument.symbol}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'font-mono text-lg',
                    instrument.assetType === 'GOLD' ? 'text-gold' : 'text-silver'
                  )}>
                    ${instrument.symbol === 'PAXGUSDT' ? marketData?.goldPriceUsd.toFixed(2) :
                      instrument.symbol === 'XAUTUSDT' ? marketData?.goldPriceUsd.toFixed(2) : '--'}
                  </span>
                  <a
                    href={`https://www.binance.com/en/trade/${instrument.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}

