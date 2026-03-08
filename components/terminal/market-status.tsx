'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, CheckCircle, Moon, Sun } from 'lucide-react';
import type { MarketState } from '@/lib/types/arbitrage';
import {
  getTRMarketState,
  getMarketStatusText,
  getTimeUntilTROpen,
  getTimeUntilTRClose,
  areMarketsComparable,
  isWeekendGapPeriod,
} from '@/lib/services/market-hours';

interface MarketStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

function getStateIcon(state: MarketState) {
  switch (state) {
    case 'OPEN':
      return <CheckCircle className="h-4 w-4 text-[var(--positive)]" />;
    case 'CLOSED':
      return <Moon className="h-4 w-4 text-muted-foreground" />;
    case 'PRE_MARKET':
    case 'AFTER_HOURS':
      return <Sun className="h-4 w-4 text-[var(--warning)]" />;
  }
}

function getStateColor(state: MarketState): string {
  switch (state) {
    case 'OPEN':
      return 'text-[var(--positive)]';
    case 'CLOSED':
      return 'text-muted-foreground';
    case 'PRE_MARKET':
    case 'AFTER_HOURS':
      return 'text-[var(--warning)]';
  }
}

export function MarketStatus({ className, showDetails = false, compact = false }: MarketStatusProps) {
  const [trState, setTrState] = useState<MarketState>('CLOSED');
  const [statusText, setStatusText] = useState('');
  const [isComparable, setIsComparable] = useState(false);
  const [isWeekendGap, setIsWeekendGap] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      setCurrentTime(now);
      setTrState(getTRMarketState(now));
      setStatusText(getMarketStatusText(now));
      setIsComparable(areMarketsComparable(now).comparable);
      setIsWeekendGap(isWeekendGapPeriod(now));
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const trStateLabel = trState === 'OPEN'
    ? 'OUVERT'
    : trState === 'CLOSED'
    ? 'FERMÉ'
    : trState === 'PRE_MARKET'
    ? 'PRÉ-OUVERTURE'
    : 'HORS SÉANCE';
  
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {getStateIcon(trState)}
        <span className={cn('text-xs font-medium', getStateColor(trState))}>
          {trStateLabel}
        </span>
      </div>
    );
  }
  
  return (
    <div className={cn('terminal-panel', className)}>
      <div className="terminal-panel-header">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="terminal-panel-title">État du marché</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {currentTime.toLocaleTimeString()}
        </span>
      </div>
      
      <div className="terminal-panel-content space-y-3">
        {/* Trade Republic Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Trade Republic</span>
          <div className="flex items-center gap-2">
            {getStateIcon(trState)}
            <span className={cn('text-sm font-medium', getStateColor(trState))}>
              {trStateLabel}
            </span>
          </div>
        </div>
        
        {/* Binance Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Binance</span>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[var(--positive)]" />
            <span className="text-sm font-medium text-[var(--positive)]">24/7</span>
          </div>
        </div>
        
        {/* Comparability */}
        <div className="pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
          <span className="text-sm">Prix comparables</span>
            {isComparable ? (
              <span className="text-sm font-medium text-[var(--positive)]">OUI</span>
            ) : (
              <span className="text-sm font-medium text-[var(--negative)]">NON</span>
            )}
          </div>
        </div>
        
        {showDetails && (
          <>
            <div className="text-xs text-muted-foreground pt-2 border-t border-border-subtle">
              {statusText}
            </div>
            
            {isWeekendGap && (
              <div className="flex items-center gap-2 p-2 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Période de gap week-end - surveiller les trades de gap</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface MarketStatusBadgeProps {
  className?: string;
}

export function MarketStatusBadge({ className }: MarketStatusBadgeProps) {
  const [trState, setTrState] = useState<MarketState>('CLOSED');
  
  useEffect(() => {
    const updateStatus = () => {
      setTrState(getTRMarketState());
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 10000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
        trState === 'OPEN' && 'bg-[var(--positive)]/20 text-[var(--positive)]',
        trState === 'CLOSED' && 'bg-muted text-muted-foreground',
        (trState === 'PRE_MARKET' || trState === 'AFTER_HOURS') && 'bg-[var(--warning)]/20 text-[var(--warning)]',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          trState === 'OPEN' && 'bg-[var(--positive)]',
          trState === 'CLOSED' && 'bg-muted-foreground',
          (trState === 'PRE_MARKET' || trState === 'AFTER_HOURS') && 'bg-[var(--warning)] animate-pulse'
        )}
      />
      {trState === 'OPEN' && 'Marché ouvert'}
      {trState === 'CLOSED' && 'Marché fermé'}
      {trState === 'PRE_MARKET' && 'Pré-ouverture'}
      {trState === 'AFTER_HOURS' && 'Hors séance'}
    </div>
  );
}
