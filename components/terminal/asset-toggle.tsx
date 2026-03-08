'use client';

import { cn } from '@/lib/utils';
import type { AssetType } from '@/lib/types/arbitrage';

interface AssetToggleProps {
  value: AssetType;
  onChange: (value: AssetType) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function AssetToggle({
  value,
  onChange,
  className,
  size = 'md',
  showLabels = true,
}: AssetToggleProps) {
  const sizes = {
    sm: 'h-7 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-11 text-base',
  };
  
  return (
    <div
      className={cn(
        'inline-flex rounded-md bg-surface-2 p-0.5',
        className
      )}
    >
      <button
        className={cn(
          'relative flex items-center gap-2 px-4 rounded transition-all font-medium',
          sizes[size],
          value === 'GOLD'
            ? 'bg-card text-gold shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onChange('GOLD')}
      >
        <span className={cn('w-2 h-2 rounded-full', value === 'GOLD' ? 'bg-gold' : 'bg-gold/30')} />
        {showLabels && <span>OR</span>}
      </button>
      <button
        className={cn(
          'relative flex items-center gap-2 px-4 rounded transition-all font-medium',
          sizes[size],
          value === 'SILVER'
            ? 'bg-card text-silver shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onChange('SILVER')}
      >
        <span className={cn('w-2 h-2 rounded-full', value === 'SILVER' ? 'bg-silver' : 'bg-silver/30')} />
        {showLabels && <span>ARGENT</span>}
      </button>
    </div>
  );
}

interface AssetBadgeProps {
  assetType: AssetType;
  className?: string;
  size?: 'sm' | 'md';
}

export function AssetBadge({ assetType, className, size = 'sm' }: AssetBadgeProps) {
  const isGold = assetType === 'GOLD';
  
  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium uppercase tracking-wide',
        sizes[size],
        isGold
          ? 'bg-gold/20 text-gold'
          : 'bg-silver/20 text-silver',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', isGold ? 'bg-gold' : 'bg-silver')} />
      {assetType === 'GOLD' ? 'OR' : 'ARGENT'}
    </span>
  );
}
