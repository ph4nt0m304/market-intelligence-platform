'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, AlertTriangle, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import type { TradingSignal, SignalType } from '@/lib/types/arbitrage';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SignalBlotterProps {
  signals: TradingSignal[];
  onAcknowledge?: (signalId: string) => void;
  onDismiss?: (signalId: string) => void;
  maxHeight?: string;
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

function getSignalIcon(signalType: SignalType) {
  switch (signalType) {
    case 'BUY':
      return <TrendingUp className="h-4 w-4" />;
    case 'SELL':
      return <TrendingDown className="h-4 w-4" />;
    case 'WATCH':
      return <Eye className="h-4 w-4" />;
    case 'ALERT':
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getSignalClass(signalType: SignalType): string {
  switch (signalType) {
    case 'BUY':
      return 'signal-buy';
    case 'SELL':
      return 'signal-sell';
    case 'WATCH':
      return 'signal-watch';
    case 'ALERT':
      return 'signal-alert';
  }
}

function getPriorityBadge(priority: TradingSignal['priority']) {
  const variants: Record<typeof priority, { class: string; label: string }> = {
    CRITICAL: { class: 'bg-[var(--negative)] text-white', label: 'CRITIQUE' },
    HIGH: { class: 'bg-[var(--warning)] text-black', label: 'ÉLEVÉ' },
    NORMAL: { class: 'bg-muted text-foreground', label: 'NORMAL' },
    LOW: { class: 'bg-surface-2 text-muted-foreground', label: 'FAIBLE' },
  };
  
  const variant = variants[priority];
  return (
    <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', variant.class)}>
      {variant.label}
    </span>
  );
}

function SignalItem({
  signal,
  onAcknowledge,
  onDismiss,
  compact = false,
}: {
  signal: TradingSignal;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}) {
  const assetColor = signal.assetType === 'GOLD' ? 'text-gold' : 'text-silver';
  const timeAgo = formatDistanceToNow(new Date(signal.timestamp), { addSuffix: true, locale: fr });
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border-subtle hover:bg-surface-2 transition-colors">
        <span className={cn('signal-badge', getSignalClass(signal.signalType))}>
          {getSignalIcon(signal.signalType)}
          {signal.signalType === 'BUY' ? 'ACHAT' : signal.signalType === 'SELL' ? 'VENTE' : signal.signalType === 'WATCH' ? 'VEILLE' : 'ALERTE'}
        </span>
        <span className={cn('text-xs font-medium', assetColor)}>
          {signal.instrumentName}
        </span>
        <span className="text-xs font-mono text-muted-foreground ml-auto">
          {signal.spreadPct > 0 ? '+' : ''}{signal.spreadPct.toFixed(2)}%
        </span>
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        'p-3 border-b border-border-subtle transition-colors',
        signal.status === 'NEW' && 'bg-surface-2',
        signal.status === 'ACKNOWLEDGED' && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('signal-badge', getSignalClass(signal.signalType))}>
            {getSignalIcon(signal.signalType)}
            {signal.signalType === 'BUY' ? 'ACHAT' : signal.signalType === 'SELL' ? 'VENTE' : signal.signalType === 'WATCH' ? 'VEILLE' : 'ALERTE'}
          </span>
          {getPriorityBadge(signal.priority)}
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
      
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', assetColor)}>
            {signal.instrumentName}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5">
            {signal.assetType}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {signal.rationale}
        </p>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs font-mono">
              <span>
            Écart : <span className="text-foreground">{signal.spreadPct > 0 ? '+' : ''}{signal.spreadPct.toFixed(2)}%</span>
          </span>
          <span>
            z: <span className="text-foreground">{signal.zScore.toFixed(2)}</span>
          </span>
        </div>
        
        {signal.status === 'NEW' && (onAcknowledge || onDismiss) && (
          <div className="flex items-center gap-1">
            {onAcknowledge && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => onAcknowledge(signal.id)}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 hover:text-[var(--negative)]"
                onClick={() => onDismiss(signal.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SignalBlotter({
  signals,
  onAcknowledge,
  onDismiss,
  maxHeight = '400px',
  className,
  showHeader = true,
  compact = false,
}: SignalBlotterProps) {
  const newSignals = signals.filter(s => s.status === 'NEW');
  
  return (
    <div className={cn('terminal-panel', className)}>
      {showHeader && (
        <div className="terminal-panel-header">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="terminal-panel-title">Signaux</span>
          </div>
          {newSignals.length > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
              {newSignals.length} NOUVEAU{newSignals.length > 1 ? 'X' : ''}
            </Badge>
          )}
        </div>
      )}
      
      <ScrollArea style={{ maxHeight }} className="terminal-scrollbar">
        {signals.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucun signal actif
          </div>
        ) : (
          <div>
            {signals.map((signal) => (
              <SignalItem
                key={signal.id}
                signal={signal}
                onAcknowledge={onAcknowledge}
                onDismiss={onDismiss}
                compact={compact}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface SignalSummaryProps {
  total: number;
  byType: Record<SignalType, number>;
  className?: string;
}

export function SignalSummary({ total, byType, className }: SignalSummaryProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-xs text-muted-foreground">
        {total} signal{total !== 1 ? 's' : ''} actif{total !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        {byType.BUY > 0 && (
          <span className="signal-badge signal-buy">{byType.BUY}</span>
        )}
        {byType.SELL > 0 && (
          <span className="signal-badge signal-sell">{byType.SELL}</span>
        )}
        {byType.WATCH > 0 && (
          <span className="signal-badge signal-watch">{byType.WATCH}</span>
        )}
        {byType.ALERT > 0 && (
          <span className="signal-badge signal-alert">{byType.ALERT}</span>
        )}
      </div>
    </div>
  );
}
