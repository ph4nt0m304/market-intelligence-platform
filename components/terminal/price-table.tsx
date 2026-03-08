'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MiniSpreadGauge } from './spread-gauge';
import { ArrowUpDown, ArrowUp, ArrowDown, Star, StarOff } from 'lucide-react';
import type { SpreadResult, AssetType } from '@/lib/types/arbitrage';

interface PriceTableProps {
  spreads: SpreadResult[];
  title?: string;
  assetType?: AssetType;
  onSelect?: (spread: SpreadResult) => void;
  selectedId?: string;
  favorites?: string[];
  onToggleFavorite?: (isin: string) => void;
  maxHeight?: string;
  className?: string;
  compact?: boolean;
}

type SortField = 'name' | 'trPrice' | 'binancePrice' | 'spreadPct' | 'zScore' | 'confidence';
type SortDirection = 'asc' | 'desc';

export function PriceTable({
  spreads,
  title,
  assetType,
  onSelect,
  selectedId,
  favorites = [],
  onToggleFavorite,
  maxHeight = '400px',
  className,
  compact = false,
}: PriceTableProps) {
  const [sortField, setSortField] = useState<SortField>('spreadPct');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedSpreads = useMemo(() => {
    const sorted = [...spreads].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortField) {
        case 'name':
          aVal = a.trInstrument.shortName;
          bVal = b.trInstrument.shortName;
          break;
        case 'trPrice':
          aVal = a.trPrice;
          bVal = b.trPrice;
          break;
        case 'binancePrice':
          aVal = a.binancePrice;
          bVal = b.binancePrice;
          break;
        case 'spreadPct':
          aVal = Math.abs(a.spreadPct);
          bVal = Math.abs(b.spreadPct);
          break;
        case 'zScore':
          aVal = Math.abs(a.zScore);
          bVal = Math.abs(b.zScore);
          break;
        case 'confidence': {
          const confOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          aVal = confOrder[a.confidence];
          bVal = confOrder[b.confidence];
          break;
        }
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
    
    // Put favorites first
    if (favorites.length > 0) {
      sorted.sort((a, b) => {
        const aFav = favorites.includes(a.trInstrument.isin) ? 1 : 0;
        const bFav = favorites.includes(b.trInstrument.isin) ? 1 : 0;
        return bFav - aFav;
      });
    }
    
    return sorted;
  }, [spreads, sortField, sortDirection, favorites]);
  
  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
  
  const accentColor = assetType === 'GOLD' ? 'text-gold' : assetType === 'SILVER' ? 'text-silver' : 'text-primary';
  
  return (
    <div className={cn('terminal-panel', className)}>
      {title && (
        <div className="terminal-panel-header">
          <span className={cn('terminal-panel-title', accentColor)}>{title}</span>
          <span className="text-xs text-muted-foreground">{spreads.length} instruments</span>
        </div>
      )}
      
      <ScrollArea style={{ maxHeight }} className="terminal-scrollbar">
        <table className="terminal-table">
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              {onToggleFavorite && <th className="w-8"></th>}
              <th><SortButton field="name" label="Instrument" /></th>
              <th className="text-right"><SortButton field="trPrice" label="Prix TR" /></th>
              <th className="text-right"><SortButton field="binancePrice" label="Prix réf." /></th>
              <th className="text-right"><SortButton field="spreadPct" label="Écart" /></th>
              {!compact && (
                <>
                  <th className="text-right"><SortButton field="zScore" label="z-Score" /></th>
                  <th className="text-center"><SortButton field="confidence" label="Confiance" /></th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedSpreads.map((spread) => {
              const isFavorite = favorites.includes(spread.trInstrument.isin);
              const isSelected = selectedId === spread.id;
              
              return (
                <tr
                  key={spread.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'bg-primary/10',
                    !spread.marketHoursComparable && 'opacity-50'
                  )}
                  onClick={() => onSelect?.(spread)}
                >
                  {onToggleFavorite && (
                    <td className="w-8">
                      <button
                        className="p-1 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(spread.trInstrument.isin);
                        }}
                      >
                        {isFavorite ? (
                          <Star className="h-3 w-3 fill-primary text-primary" />
                        ) : (
                          <StarOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                  )}
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium">{spread.trInstrument.shortName}</span>
                      <span className="text-[10px] text-muted-foreground">{spread.trInstrument.isin}</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums">
                    <div className="flex flex-col items-end">
                      <span>{spread.trPrice.toFixed(2)}</span>
                      {spread.trBid && spread.trAsk && (
                        <span className="text-[10px] text-muted-foreground">
                          {spread.trBid.toFixed(2)} / {spread.trAsk.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right tabular-nums">
                    {spread.binancePrice.toFixed(2)}
                    <span className="text-muted-foreground ml-1">{spread.currency}</span>
                  </td>
                  <td className="text-right">
                    <MiniSpreadGauge spreadPct={spread.spreadPct} assetType={spread.assetType} />
                  </td>
                  {!compact && (
                    <>
                      <td
                        className={cn(
                          'text-right tabular-nums',
                          Math.abs(spread.zScore) > 2 && 'text-[var(--warning)]',
                          Math.abs(spread.zScore) > 3 && 'text-[var(--negative)]'
                        )}
                      >
                        {spread.zScore > 0 ? '+' : ''}{spread.zScore.toFixed(2)}
                      </td>
                      <td className="text-center">
                        <span
                          className={cn(
                            'text-xs font-medium uppercase',
                            spread.confidence === 'HIGH' && 'text-[var(--positive)]',
                            spread.confidence === 'MEDIUM' && 'text-[var(--warning)]',
                            spread.confidence === 'LOW' && 'text-muted-foreground'
                          )}
                        >
                          {spread.confidence === 'HIGH' ? 'ÉLEVÉE' : spread.confidence === 'MEDIUM' ? 'MOYENNE' : 'FAIBLE'}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
