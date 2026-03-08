'use client';

import { cn } from '@/lib/utils';
import type { AssetType, ConfidenceLevel } from '@/lib/types/arbitrage';

interface SpreadGaugeProps {
  assetType: AssetType;
  spreadPct: number;
  zScore?: number;
  confidence?: ConfidenceLevel;
  minRange?: number;
  maxRange?: number;
  buyThreshold?: number;
  sellThreshold?: number;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SpreadGauge({
  assetType,
  spreadPct,
  zScore,
  confidence,
  minRange = -2,
  maxRange = 2,
  buyThreshold = -0.75,
  sellThreshold = 0.75,
  className,
  showLabels = true,
  size = 'md',
}: SpreadGaugeProps) {
  // Clamp spread to display range
  const clampedSpread = Math.max(minRange, Math.min(maxRange, spreadPct));
  
  // Calculate position (0-100%)
  const range = maxRange - minRange;
  const position = ((clampedSpread - minRange) / range) * 100;
  
  // Calculate threshold positions
  const buyPosition = ((buyThreshold - minRange) / range) * 100;
  const sellPosition = ((sellThreshold - minRange) / range) * 100;
  const centerPosition = 50;
  
  // Determine color based on spread
  const getColor = () => {
    if (spreadPct <= buyThreshold) return 'var(--positive)';
    if (spreadPct >= sellThreshold) return 'var(--negative)';
    return 'var(--muted-foreground)';
  };
  
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };
  
  const accentColor = assetType === 'GOLD' ? 'var(--gold)' : 'var(--silver)';
  
  return (
    <div className={cn('w-full', className)}>
      {showLabels && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--positive)]">ACHAT</span>
          <span className="text-xs text-muted-foreground font-mono">
            {spreadPct > 0 ? '+' : ''}{spreadPct.toFixed(2)}%
          </span>
          <span className="text-xs font-medium text-[var(--negative)]">VENTE</span>
        </div>
      )}
      
      {/* Gauge track */}
      <div className={cn('relative bg-surface-2 rounded-full overflow-hidden', heights[size])}>
        {/* Buy zone (green) */}
        <div
          className="absolute inset-y-0 left-0 bg-[var(--positive)]/20"
          style={{ width: `${buyPosition}%` }}
        />
        
        {/* Sell zone (red) */}
        <div
          className="absolute inset-y-0 right-0 bg-[var(--negative)]/20"
          style={{ width: `${100 - sellPosition}%` }}
        />
        
        {/* Center line */}
        <div
          className="absolute inset-y-0 w-px bg-border-strong"
          style={{ left: `${centerPosition}%` }}
        />
        
        {/* Threshold markers */}
        <div
          className="absolute inset-y-0 w-0.5 bg-[var(--positive)]/50"
          style={{ left: `${buyPosition}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-[var(--negative)]/50"
          style={{ left: `${sellPosition}%` }}
        />
        
        {/* Current spread indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
          style={{ left: `${position}%` }}
        >
          <div
            className={cn(
              'rounded-full border-2 border-background shadow-lg',
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-4 h-4',
              size === 'lg' && 'w-5 h-5'
            )}
            style={{ backgroundColor: getColor() }}
          />
        </div>
      </div>
      
      {/* Additional info */}
      {(zScore !== undefined || confidence) && (
        <div className="flex items-center justify-between mt-1.5 text-xs">
          {zScore !== undefined && (
            <span className="text-muted-foreground font-mono">
              z: {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}
            </span>
          )}
          {confidence && (
            <span
              className={cn(
                'font-medium uppercase',
                confidence === 'HIGH' && 'text-[var(--positive)]',
                confidence === 'MEDIUM' && 'text-[var(--warning)]',
                confidence === 'LOW' && 'text-muted-foreground'
              )}
            >
              {confidence === 'HIGH' ? 'ÉLEVÉE' : confidence === 'MEDIUM' ? 'MOYENNE' : 'FAIBLE'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface MiniSpreadGaugeProps {
  spreadPct: number;
  assetType: AssetType;
  className?: string;
}

export function MiniSpreadGauge({ spreadPct, assetType, className }: MiniSpreadGaugeProps) {
  const isPositive = spreadPct < -0.5;
  const isNegative = spreadPct > 0.5;
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-16 h-1 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isPositive && 'bg-[var(--positive)]',
            isNegative && 'bg-[var(--negative)]',
            !isPositive && !isNegative && 'bg-muted-foreground'
          )}
          style={{
            width: `${Math.min(100, Math.abs(spreadPct) * 50)}%`,
            marginLeft: spreadPct < 0 ? `${50 - Math.abs(spreadPct) * 25}%` : '50%',
          }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-mono tabular-nums',
          isPositive && 'text-[var(--positive)]',
          isNegative && 'text-[var(--negative)]',
          !isPositive && !isNegative && 'text-muted-foreground'
        )}
      >
        {spreadPct > 0 ? '+' : ''}{spreadPct.toFixed(2)}%
      </span>
    </div>
  );
}
