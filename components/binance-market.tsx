'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity } from 'lucide-react';
import { MarketSnapshot, formatPrice, formatTimestamp } from '@/lib/binance-service';

interface BinanceMarketProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function BinanceMarket({ 
  autoRefresh = true, 
  refreshInterval = 10000 
}: BinanceMarketProps) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/market/snapshot', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Echec de recuperation: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSnapshot(data.data);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('[BinanceMarket] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Echec de recuperation des donnees de marche');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMarketData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMarketData]);

  const renderPriceRow = (
    pair: string,
    binanceSymbol: string,
    price: number | null,
    currency: string,
    decimals = 4
  ) => {
    const isProxy = binanceSymbol === 'proxy';
    
    return (
      <div 
        key={pair} 
        className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold text-foreground w-20">{pair}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {isProxy ? '(proxy)' : `(${binanceSymbol})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg">
            {formatPrice(price, decimals)}
          </span>
          <span className="text-muted-foreground text-sm">{currency}</span>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-destructive" />
            Donnees de marche Binance
          </h2>
          <Button variant="outline" size="sm" onClick={fetchMarketData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reessayer
          </Button>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          <p className="font-medium">Erreur de chargement des donnees de marche</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Snapshot des donnees Binance
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchMarketData}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* USD Prices */}
      <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Paires USD</h3>
        {snapshot ? (
          <div className="space-y-1">
            {renderPriceRow(
              snapshot.xauUsd.pair,
              snapshot.xauUsd.binanceSymbol,
              snapshot.xauUsd.price,
              snapshot.xauUsd.currency,
              2
            )}
            {renderPriceRow(
              snapshot.xagUsd.pair,
              snapshot.xagUsd.binanceSymbol,
              snapshot.xagUsd.price,
              snapshot.xagUsd.currency,
              4
            )}
            {renderPriceRow(
              snapshot.eurUsd.pair,
              snapshot.eurUsd.binanceSymbol,
              snapshot.eurUsd.price,
              snapshot.eurUsd.currency,
              5
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* EUR Prices */}
      <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Paires EUR (calculees)</h3>
        {snapshot ? (
          <div className="space-y-1">
            {renderPriceRow(
              snapshot.xauEur.pair,
              snapshot.xauEur.binanceSymbol,
              snapshot.xauEur.price,
              snapshot.xauEur.currency,
              2
            )}
            {renderPriceRow(
              snapshot.xagEur.pair,
              snapshot.xagEur.binanceSymbol,
              snapshot.xagEur.price,
              snapshot.xagEur.currency,
              4
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border font-mono">
        <div className="flex justify-between">
          <span>Source EUR:</span>
          <span>{snapshot?.eurUsd.binanceSymbol || '---'}</span>
        </div>
        <div className="flex justify-between">
          <span>Dernier XAU:</span>
          <span>{snapshot?.xauUsd.lastUpdate ? formatTimestamp(snapshot.xauUsd.lastUpdate) : '---'}</span>
        </div>
        <div className="flex justify-between">
          <span>Dernier XAG:</span>
          <span>{snapshot?.xagUsd.lastUpdate ? formatTimestamp(snapshot.xagUsd.lastUpdate) : '---'}</span>
        </div>
        <div className="flex justify-between">
          <span>Dernier EUR:</span>
          <span>{snapshot?.eurUsd.lastUpdate ? formatTimestamp(snapshot.eurUsd.lastUpdate) : '---'}</span>
        </div>
      </div>
    </Card>
  );
}
