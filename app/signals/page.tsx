'use client';

import { useState, useEffect } from 'react';
import { TerminalLayout, PanelGrid, StatCard } from '@/components/terminal/terminal-layout';
import { SignalBlotter } from '@/components/terminal/signal-blotter';
import { AssetToggle } from '@/components/terminal/asset-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Bell,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetType, TradingSignal, SignalType } from '@/lib/types/arbitrage';

function generateMockSignals(): TradingSignal[] {
  const instruments = [
    { id: 'DE000A0S9GB0', name: 'Xetra-Gold', type: 'GOLD' as AssetType },
    { id: 'IE00B4ND3602', name: 'iShares Physical Gold', type: 'GOLD' as AssetType },
    { id: 'JE00B1VS3770', name: 'WisdomTree Physical Gold', type: 'GOLD' as AssetType },
    { id: 'DE000EWG0LD1', name: 'EUWAX Gold II', type: 'GOLD' as AssetType },
    { id: 'DE000A0N62F2', name: 'WisdomTree Physical Silver', type: 'SILVER' as AssetType },
    { id: 'IE00B4NCWG09', name: 'iShares Physical Silver', type: 'SILVER' as AssetType },
  ];

  const signals: TradingSignal[] = [];
  const now = Date.now();

  for (let i = 0; i < 8; i++) {
    const instrument = instruments[Math.floor(Math.random() * instruments.length)];
    const signalType: SignalType = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'SELL' : 'WATCH';
    const spreadPct = signalType === 'BUY' ? -(Math.random() * 2 + 0.5) : signalType === 'SELL' ? (Math.random() * 2 + 0.5) : (Math.random() * 1 - 0.5);
    const minutesAgo = Math.floor(Math.random() * 120);

    signals.push({
      id: `sig-${i}`,
      assetType: instrument.type,
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      signalType,
      spreadPct,
      spreadBps: spreadPct * 100,
      zScore: spreadPct / 0.8,
      confidence: Math.abs(spreadPct) > 1.5 ? 'HIGH' : Math.abs(spreadPct) > 0.8 ? 'MEDIUM' : 'LOW',
      rationale: signalType === 'BUY'
        ? `Prix TR ${Math.abs(spreadPct).toFixed(1)} % sous la référence Binance. Forte opportunité d'achat.`
        : signalType === 'SELL'
        ? `Prix TR ${Math.abs(spreadPct).toFixed(1)} % au-dessus de Binance. Vente à envisager.`
        : `Écart proche du seuil. Surveillance d'un point d'entrée.`,
      suggestedAction: signalType === 'BUY' ? 'Acheter sur Trade Republic' : signalType === 'SELL' ? 'Vendre sur Trade Republic' : 'Surveiller de près',
      priceAtSignal: instrument.type === 'GOLD' ? 70 + Math.random() * 5 : 30 + Math.random() * 3,
      timestamp: new Date(now - minutesAgo * 60 * 1000).toISOString(),
      status: minutesAgo > 60 ? 'EXPIRED' : 'ACTIVE',
      priority: signalType === 'BUY' && Math.abs(spreadPct) > 1.5 ? 'CRITICAL' : signalType !== 'WATCH' ? 'HIGH' : 'NORMAL',
    });
  }

  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<'ALL' | AssetType>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | SignalType>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExpired, setShowExpired] = useState(false);

  const fetchSignals = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSignals(generateMockSignals());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = signals.filter(s => {
    if (selectedAsset !== 'ALL' && s.assetType !== selectedAsset) return false;
    if (selectedType !== 'ALL' && s.signalType !== selectedType) return false;
    if (!showExpired && s.status === 'EXPIRED') return false;
    return true;
  });

  const activeSignals = signals.filter(s => s.status === 'ACTIVE');
  const buySignals = activeSignals.filter(s => s.signalType === 'BUY');
  const sellSignals = activeSignals.filter(s => s.signalType === 'SELL');
  const watchSignals = activeSignals.filter(s => s.signalType === 'WATCH');
  const criticalSignals = activeSignals.filter(s => s.priority === 'CRITICAL');

  const acknowledgeSignal = (signalId: string) => {
    setSignals(prev => prev.map(s => (s.id === signalId ? { ...s, status: 'ACKNOWLEDGED' } : s)));
  };

  return (
    <TerminalLayout
      title="Signaux"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(!soundEnabled && 'text-muted-foreground')}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSignals}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        {criticalSignals.length > 0 && (
          <div className="terminal-panel p-4 border-[var(--negative)] bg-[var(--negative)]/5 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[var(--negative)]" />
              <div>
                <div className="font-medium text-[var(--negative)]">
                  {criticalSignals.length} signal{criticalSignals.length > 1 ? 's' : ''} critique{criticalSignals.length > 1 ? 's' : ''} détecté{criticalSignals.length > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-muted-foreground">
                  {criticalSignals.map(s => s.instrumentName).join(', ')}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-[var(--negative)] text-[var(--negative)]"
                onClick={() => criticalSignals.forEach(s => acknowledgeSignal(s.id))}
              >
                Tout acquitter
              </Button>
            </div>
          </div>
        )}

        <PanelGrid cols={4} gap="md">
          <StatCard
            label="Signaux actifs"
            value={activeSignals.length}
            icon={<Bell className="h-5 w-5" />}
            valueClassName={activeSignals.length > 0 ? 'text-[var(--warning)]' : ''}
          />
          <StatCard
            label="Signaux d'achat"
            value={buySignals.length}
            icon={<TrendingUp className="h-5 w-5" />}
            valueClassName="text-[var(--positive)]"
          />
          <StatCard
            label="Signaux de vente"
            value={sellSignals.length}
            icon={<TrendingDown className="h-5 w-5" />}
            valueClassName="text-[var(--negative)]"
          />
          <StatCard
            label="Signaux de veille"
            value={watchSignals.length}
            icon={<Eye className="h-5 w-5" />}
          />
        </PanelGrid>

        <div className="terminal-panel p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <AssetToggle
                value={selectedAsset === 'ALL' ? 'GOLD' : selectedAsset}
                onChange={(v) => setSelectedAsset(v)}
                size="sm"
              />
              <Button
                variant={selectedAsset === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAsset('ALL')}
              >
                Tous les actifs
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
                <SelectTrigger className="w-32 bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="BUY">Achat</SelectItem>
                  <SelectItem value="SELL">Vente</SelectItem>
                  <SelectItem value="WATCH">Veille</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showExpired ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowExpired(!showExpired)}
              >
                {showExpired ? 'Masquer' : 'Afficher'} expirés
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSignals.map((signal) => (
            <div
              key={signal.id}
              className={cn(
                'terminal-panel p-4 transition-all',
                signal.priority === 'CRITICAL' && signal.status === 'ACTIVE' && 'border-[var(--negative)] animate-pulse',
                signal.status === 'EXPIRED' && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'p-2 rounded-lg',
                    signal.signalType === 'BUY' && 'bg-[var(--positive)]/10 text-[var(--positive)]',
                    signal.signalType === 'SELL' && 'bg-[var(--negative)]/10 text-[var(--negative)]',
                    signal.signalType === 'WATCH' && 'bg-[var(--warning)]/10 text-[var(--warning)]'
                  )}>
                    {signal.signalType === 'BUY' && <TrendingUp className="h-5 w-5" />}
                    {signal.signalType === 'SELL' && <TrendingDown className="h-5 w-5" />}
                    {signal.signalType === 'WATCH' && <Eye className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-medium">{signal.instrumentName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{signal.instrumentId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    'text-xs',
                    signal.assetType === 'GOLD' ? 'border-gold/50 text-gold' : 'border-silver/50 text-silver'
                  )}>
                    {signal.assetType === 'GOLD' ? 'OR' : 'ARGENT'}
                  </Badge>
                  <Badge className={cn(
                    'text-xs',
                    signal.signalType === 'BUY' && 'bg-[var(--positive)]/20 text-[var(--positive)]',
                    signal.signalType === 'SELL' && 'bg-[var(--negative)]/20 text-[var(--negative)]',
                    signal.signalType === 'WATCH' && 'bg-[var(--warning)]/20 text-[var(--warning)]'
                  )}>
                    {signal.signalType === 'BUY' ? 'ACHAT' : signal.signalType === 'SELL' ? 'VENTE' : 'VEILLE'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">Écart</div>
                  <div className={cn(
                    'font-mono text-lg',
                    signal.spreadPct < 0 && 'text-[var(--positive)]',
                    signal.spreadPct > 0 && 'text-[var(--negative)]'
                  )}>
                    {signal.spreadPct > 0 ? '+' : ''}{signal.spreadPct.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Z-Score</div>
                  <div className="font-mono text-lg">{signal.zScore.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Confiance</div>
                  <Badge variant="outline" className={cn(
                    'text-xs mt-1',
                    signal.confidence === 'HIGH' && 'border-[var(--positive)]/50 text-[var(--positive)]',
                    signal.confidence === 'MEDIUM' && 'border-[var(--warning)]/50 text-[var(--warning)]',
                    signal.confidence === 'LOW' && 'border-muted-foreground/50'
                  )}>
                    {signal.confidence}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{signal.rationale}</p>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  {new Date(signal.timestamp).toLocaleTimeString()} - €{signal.priceAtSignal.toFixed(2)}
                </div>
                {signal.status === 'ACTIVE' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => acknowledgeSignal(signal.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Acquitter
                  </Button>
                )}
                {signal.status === 'EXPIRED' && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Expiré
                  </Badge>
                )}
                {signal.status === 'ACKNOWLEDGED' && (
                  <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                    Acquitté
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredSignals.length === 0 && (
          <div className="terminal-panel p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Aucun signal ne correspond à vos filtres actuels.</p>
          </div>
        )}

        <SignalBlotter
          signals={filteredSignals}
          maxHeight="300px"
          showHeader
        />
      </div>
    </TerminalLayout>
  );
}
