'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

interface TickerStripProps {
  items: TickerItem[];
  isConnected?: boolean;
  lastUpdate?: string;
  className?: string;
}

function PriceChange({ change, changePercent }: { change: number; changePercent: number }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-xs font-mono tabular-nums',
        isPositive && 'text-[var(--positive)]',
        isNegative && 'text-[var(--negative)]',
        !isPositive && !isNegative && 'text-muted-foreground'
      )}
    >
      {isPositive && <TrendingUp className="h-3 w-3" />}
      {isNegative && <TrendingDown className="h-3 w-3" />}
      {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
      <span>
        {isPositive && '+'}
        {changePercent.toFixed(2)}%
      </span>
    </span>
  );
}

function TickerItemDisplay({ item }: { item: TickerItem }) {
  const [flash, setFlash] = useState<'positive' | 'negative' | null>(null);
  const [prevPrice, setPrevPrice] = useState(item.price);
  
  useEffect(() => {
    if (item.price !== prevPrice) {
      setFlash(item.price > prevPrice ? 'positive' : 'negative');
      setPrevPrice(item.price);
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
  }, [item.price, prevPrice]);
  
  return (
    <div
      className={cn(
        'ticker-item flex items-center gap-3 px-4 py-1.5 border-r border-border-subtle',
        flash === 'positive' && 'flash-positive',
        flash === 'negative' && 'flash-negative'
      )}
    >
      <span className="ticker-symbol text-xs font-medium text-gold">{item.symbol}</span>
      <span className="ticker-price font-mono text-sm tabular-nums">
        {item.price.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        <span className="text-muted-foreground ml-1 text-xs">{item.currency}</span>
      </span>
      <PriceChange change={item.change} changePercent={item.changePercent} />
    </div>
  );
}

export function TickerStrip({ items, isConnected = true, lastUpdate, className }: TickerStripProps) {
  // Duplicate items for seamless scrolling animation
  const duplicatedItems = [...items, ...items];
  
  return (
    <div className={cn('bg-surface-1 border-b border-border overflow-hidden', className)}>
      <div className="flex items-center">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-border bg-surface-2">
          <div
            className={cn(
              'status-dot',
              isConnected ? 'status-connected' : 'status-disconnected'
            )}
          />
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-[var(--negative)]" />
          )}
          <span className="text-xs text-muted-foreground font-mono">
            {lastUpdate ? new Date(lastUpdate).toLocaleTimeString('fr-FR') : '--:--:--'}
          </span>
        </div>
        
        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-ticker">
            {duplicatedItems.map((item, index) => (
              <TickerItemDisplay key={`${item.symbol}-${index}`} item={item} />
            ))}
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="px-3 py-1.5 border-l border-border bg-surface-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--positive)] live-indicator">
            DIRECT
          </span>
        </div>
      </div>
    </div>
  );
}

export function StaticTickerStrip({ items, isConnected = true, lastUpdate, className }: TickerStripProps) {
  return (
    <div className={cn('bg-surface-1 border-b border-border', className)}>
      <div className="flex items-center justify-between">
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-border">
          <div
            className={cn(
              'status-dot',
              isConnected ? 'status-connected' : 'status-disconnected'
            )}
          />
          <span className="text-xs text-muted-foreground font-mono">
            {lastUpdate ? new Date(lastUpdate).toLocaleTimeString('fr-FR') : '--:--:--'}
          </span>
        </div>
        
        {/* Ticker items */}
        <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto terminal-scrollbar">
          {items.map((item) => (
            <TickerItemDisplay key={item.symbol} item={item} />
          ))}
        </div>
        
        {/* Live indicator */}
        <div className="px-3 py-1.5 border-l border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--positive)]">
            DIRECT
          </span>
        </div>
      </div>
    </div>
  );
}
