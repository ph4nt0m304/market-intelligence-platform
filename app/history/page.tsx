'use client';

import { useState, useMemo } from 'react';
import { TerminalLayout, PanelGrid, StatCard } from '@/components/terminal/terminal-layout';
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
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Download,
  BarChart3,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetType, TradingSignal } from '@/lib/types/arbitrage';

// Generate mock historical data
function generateHistoricalSignals(count: number): TradingSignal[] {
  const signals: TradingSignal[] = [];
  const instruments = [
    { id: 'DE000A0S9GB0', name: 'Xetra-Gold', type: 'GOLD' as AssetType },
    { id: 'IE00B4ND3602', name: 'iShares Physical Gold', type: 'GOLD' as AssetType },
    { id: 'JE00B1VS3770', name: 'WisdomTree Physical Gold', type: 'GOLD' as AssetType },
    { id: 'DE000A0N62F2', name: 'WisdomTree Physical Silver', type: 'SILVER' as AssetType },
    { id: 'IE00B4NCWG09', name: 'iShares Physical Silver', type: 'SILVER' as AssetType },
  ];
  const signalTypes: ('BUY' | 'SELL' | 'WATCH')[] = ['BUY', 'SELL', 'WATCH'];
  const statuses: ('TRIGGERED' | 'EXPIRED' | 'ACKNOWLEDGED')[] = ['TRIGGERED', 'EXPIRED', 'ACKNOWLEDGED'];

  for (let i = 0; i < count; i++) {
    const instrument = instruments[Math.floor(Math.random() * instruments.length)];
    const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 10) + 8);
    date.setMinutes(Math.floor(Math.random() * 60));

    signals.push({
      id: `sig-hist-${i}`,
      assetType: instrument.type,
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      signalType,
      spreadPct: (Math.random() * 4 - 2),
      spreadBps: (Math.random() * 400 - 200),
      zScore: (Math.random() * 4 - 2),
      confidence: Math.random() > 0.5 ? 'HIGH' : Math.random() > 0.3 ? 'MEDIUM' : 'LOW',
      rationale: signalType === 'BUY' 
        ? 'Prix TR nettement sous la référence Binance'
        : signalType === 'SELL'
        ? 'Prix TR au-dessus de la référence Binance avec z-score élevé'
        : 'Écart proche du seuil, surveillance',
      priceAtSignal: instrument.type === 'GOLD' ? 70 + Math.random() * 5 : 30 + Math.random() * 3,
      timestamp: date.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: signalType === 'BUY' ? 'HIGH' : signalType === 'SELL' ? 'HIGH' : 'NORMAL',
    });
  }

  return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

export default function HistoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedAsset, setSelectedAsset] = useState<'ALL' | AssetType>('ALL');
  const [selectedSignalType, setSelectedSignalType] = useState<'ALL' | 'BUY' | 'SELL' | 'WATCH'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'spread' | 'instrument'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const allSignals = useMemo(() => generateHistoricalSignals(100), []);

  const filteredSignals = useMemo(() => {
    let filtered = [...allSignals];
    
    // Filter by time range
    const now = new Date();
    if (timeRange === '24h') {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.timestamp) > cutoff);
    } else if (timeRange === '7d') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.timestamp) > cutoff);
    } else if (timeRange === '30d') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.timestamp) > cutoff);
    }

    // Filter by asset type
    if (selectedAsset !== 'ALL') {
      filtered = filtered.filter(s => s.assetType === selectedAsset);
    }

    // Filter by signal type
    if (selectedSignalType !== 'ALL') {
      filtered = filtered.filter(s => s.signalType === selectedSignalType);
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'spread') {
        cmp = a.spreadPct - b.spreadPct;
      } else if (sortField === 'instrument') {
        cmp = a.instrumentName.localeCompare(b.instrumentName);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [allSignals, timeRange, selectedAsset, selectedSignalType, sortField, sortDir]);

  const stats = useMemo(() => {
    const buySignals = filteredSignals.filter(s => s.signalType === 'BUY').length;
    const sellSignals = filteredSignals.filter(s => s.signalType === 'SELL').length;
    const triggeredSignals = filteredSignals.filter(s => s.status === 'TRIGGERED').length;
    const avgSpread = filteredSignals.length > 0
      ? filteredSignals.reduce((sum, s) => sum + Math.abs(s.spreadPct), 0) / filteredSignals.length
      : 0;
    
    return { buySignals, sellSignals, triggeredSignals, avgSpread, total: filteredSignals.length };
  }, [filteredSignals]);

  const handleSort = (field: 'date' | 'spread' | 'instrument') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Heure', 'Actif', 'Instrument', 'Signal', 'Écart %', 'Z-Score', 'Statut', 'Raison'];
    const rows = filteredSignals.map(s => {
      const date = new Date(s.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        s.assetType,
        s.instrumentName,
        s.signalType,
        s.spreadPct.toFixed(2),
        s.zScore.toFixed(2),
        s.status,
        `"${s.rationale}"`,
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signal-history-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TerminalLayout
      title="Historique"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLoading(true)}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        {/* Stats Overview */}
        <PanelGrid cols={4} gap="md">
          <StatCard
            label="Signaux totaux"
            value={stats.total}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <StatCard
            label="Signaux d'achat"
            value={stats.buySignals}
            icon={<TrendingUp className="h-5 w-5" />}
            valueClassName="text-[var(--positive)]"
          />
          <StatCard
            label="Signaux de vente"
            value={stats.sellSignals}
            icon={<TrendingDown className="h-5 w-5" />}
            valueClassName="text-[var(--negative)]"
          />
          <StatCard
            label="Écart moyen"
            value={`${stats.avgSpread.toFixed(2)}%`}
            icon={<Calendar className="h-5 w-5" />}
          />
        </PanelGrid>

        {/* Filters */}
        <div className="terminal-panel p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-32 bg-surface-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Dernières 24 h</SelectItem>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="all">Toute la période</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedAsset} onValueChange={(v) => setSelectedAsset(v as 'ALL' | AssetType)}>
                <SelectTrigger className="w-28 bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les actifs</SelectItem>
                  <SelectItem value="GOLD">Or</SelectItem>
                  <SelectItem value="SILVER">Argent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSignalType} onValueChange={(v) => setSelectedSignalType(v as typeof selectedSignalType)}>
                <SelectTrigger className="w-28 bg-surface-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="BUY">Achat</SelectItem>
                  <SelectItem value="SELL">Vente</SelectItem>
                  <SelectItem value="WATCH">Veille</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredSignals.length} sur {allSignals.length} signaux affichés
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="terminal-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button 
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('date')}
                    >
                      Date/Heure
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actif
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button 
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('instrument')}
                    >
                      Instrument
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Signal
                  </th>
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
                    Z-Score
                  </th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Confiance
                  </th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prix
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredSignals.map((signal) => {
                  const date = new Date(signal.timestamp);
                  
                  return (
                    <tr 
                      key={signal.id}
                      className="hover:bg-surface-2/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-mono text-sm">
                          {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          signal.assetType === 'GOLD' ? 'border-gold/50 text-gold' : 'border-silver/50 text-silver'
                        )}>
                          {signal.assetType === 'GOLD' ? 'OR' : 'ARGENT'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">{signal.instrumentName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{signal.instrumentId}</div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={cn(
                          'text-xs',
                          signal.signalType === 'BUY' && 'bg-[var(--positive)]/20 text-[var(--positive)] border-[var(--positive)]/50',
                          signal.signalType === 'SELL' && 'bg-[var(--negative)]/20 text-[var(--negative)] border-[var(--negative)]/50',
                          signal.signalType === 'WATCH' && 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/50'
                        )}>
                          {signal.signalType === 'BUY' ? 'ACHAT' : signal.signalType === 'SELL' ? 'VENTE' : 'VEILLE'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className={cn(
                          'font-mono text-sm',
                          signal.spreadPct < 0 && 'text-[var(--positive)]',
                          signal.spreadPct > 0 && 'text-[var(--negative)]'
                        )}>
                          {signal.spreadPct > 0 ? '+' : ''}{signal.spreadPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono text-sm text-muted-foreground">
                          {signal.zScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          signal.confidence === 'HIGH' && 'border-[var(--positive)]/50 text-[var(--positive)]',
                          signal.confidence === 'MEDIUM' && 'border-[var(--warning)]/50 text-[var(--warning)]',
                          signal.confidence === 'LOW' && 'border-muted-foreground/50'
                        )}>
                          {signal.confidence === 'HIGH' ? 'ÉLEVÉE' : signal.confidence === 'MEDIUM' ? 'MOYENNE' : 'FAIBLE'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          signal.status === 'TRIGGERED' && 'border-[var(--positive)]/50 text-[var(--positive)]',
                          signal.status === 'EXPIRED' && 'border-muted-foreground/50 text-muted-foreground',
                          signal.status === 'ACKNOWLEDGED' && 'border-blue-500/50 text-blue-400'
                        )}>
                          {signal.status === 'TRIGGERED' ? 'DÉCLENCHÉ' : signal.status === 'EXPIRED' ? 'EXPIRÉ' : 'ACQUITTÉ'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm">
                          €{signal.priceAtSignal.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredSignals.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Aucun signal trouvé pour les critères sélectionnés.
            </div>
          )}
        </div>
      </div>
    </TerminalLayout>
  );
}
