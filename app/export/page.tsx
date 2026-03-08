'use client';

import { useState } from 'react';
import { TerminalLayout } from '@/components/terminal/terminal-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Table2,
  BarChart3,
  Activity,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportConfig {
  includeMarkets: boolean;
  includeArbitrage: boolean;
  includeSignals: boolean;
  includeHistory: boolean;
  format: 'csv' | 'xlsx';
  dateRange: '24h' | '7d' | '30d' | 'custom';
  customStartDate: string;
  customEndDate: string;
}

interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  size?: string;
  error?: string;
}

export default function ExportPage() {
  const [config, setConfig] = useState<ExportConfig>({
    includeMarkets: true,
    includeArbitrage: true,
    includeSignals: true,
    includeHistory: false,
    format: 'csv',
    dateRange: '7d',
    customStartDate: '',
    customEndDate: '',
  });

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Export complet - 2024-01-15',
      status: 'completed',
      progress: 100,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
      downloadUrl: '#',
      size: '2.4 MB',
    },
    {
      id: '2',
      name: 'Export signaux - 2024-01-14',
      status: 'completed',
      progress: 100,
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 26 * 60 * 60 * 1000 + 12000).toISOString(),
      downloadUrl: '#',
      size: '156 KB',
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: `Export - ${new Date().toLocaleDateString('fr-FR')}`,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportJobs(prev => 
        prev.map(job => 
          job.id === newJob.id ? { ...job, progress: i } : job
        )
      );
    }

    // Complete the export
    setExportJobs(prev =>
      prev.map(job =>
        job.id === newJob.id
          ? {
              ...job,
              status: 'completed',
              progress: 100,
              completedAt: new Date().toISOString(),
              downloadUrl: '#',
              size: '1.2 MB',
            }
          : job
      )
    );

    setIsExporting(false);
  };

  const dataCategories = [
    { key: 'includeMarkets', label: 'Données de marché', icon: <Table2 className="h-5 w-5" />, description: 'Prix actuels et écarts bid/ask de tous les instruments' },
    { key: 'includeArbitrage', label: 'Données d’arbitrage', icon: <BarChart3 className="h-5 w-5" />, description: 'Calculs d’écarts, z-scores et opportunités' },
    { key: 'includeSignals', label: 'Signaux de trading', icon: <Activity className="h-5 w-5" />, description: 'Signaux BUY/SELL/WATCH actifs et récents' },
    { key: 'includeHistory', label: 'Données historiques', icon: <History className="h-5 w-5" />, description: 'Historique des signaux et des prix' },
  ] as const;

  return (
    <TerminalLayout title="Export">
      <div className="p-4 space-y-6">
        {/* Export Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Selection */}
          <div className="terminal-panel p-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Données à exporter
            </h3>
            <div className="space-y-3">
              {dataCategories.map((category) => (
                <label
                  key={category.key}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    config[category.key]
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <Checkbox
                    checked={config[category.key]}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, [category.key]: !!checked }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{category.icon}</span>
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="terminal-panel p-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Options d’export
            </h3>
            
            <div className="space-y-4">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Format d’export</Label>
                <div className="flex gap-2">
                  <Button
                    variant={config.format === 'csv' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, format: 'csv' }))}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant={config.format === 'xlsx' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, format: 'xlsx' }))}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel (XLSX)
                  </Button>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm">Période</Label>
                <Select
                  value={config.dateRange}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, dateRange: v as ExportConfig['dateRange'] }))}
                >
                  <SelectTrigger className="bg-surface-2">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Dernières 24 heures</SelectItem>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="custom">Plage personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {config.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Date de début</Label>
                    <Input
                      type="date"
                      value={config.customStartDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="bg-surface-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Date de fin</Label>
                    <Input
                      type="date"
                      value={config.customEndDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="bg-surface-2"
                    />
                  </div>
                </div>
              )}

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={isExporting || (!config.includeMarkets && !config.includeArbitrage && !config.includeSignals && !config.includeHistory)}
                className="w-full mt-4"
              >
                {isExporting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Lancer l’export
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Export History */}
        <div className="terminal-panel">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Historique des exports
            </h3>
          </div>
          
          <div className="divide-y divide-border/50">
            {exportJobs.map((job) => (
              <div 
                key={job.id}
                className="p-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    job.status === 'completed' && 'bg-[var(--positive)]/10 text-[var(--positive)]',
                    job.status === 'processing' && 'bg-[var(--warning)]/10 text-[var(--warning)]',
                    job.status === 'failed' && 'bg-[var(--negative)]/10 text-[var(--negative)]',
                    job.status === 'pending' && 'bg-muted/10 text-muted-foreground'
                  )}>
                    {job.status === 'completed' && <CheckCircle2 className="h-5 w-5" />}
                    {job.status === 'processing' && <Clock className="h-5 w-5 animate-spin" />}
                    {job.status === 'failed' && <AlertCircle className="h-5 w-5" />}
                    {job.status === 'pending' && <Clock className="h-5 w-5" />}
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm">{job.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Créé le {new Date(job.createdAt).toLocaleString('fr-FR')}</span>
                      {job.size && (
                        <>
                          <span>•</span>
                          <span>{job.size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {job.status === 'processing' && (
                    <div className="w-32">
                      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        {job.progress}%
                      </div>
                    </div>
                  )}
                  
                  <Badge variant="outline" className={cn(
                    'text-xs',
                    job.status === 'completed' && 'border-[var(--positive)]/50 text-[var(--positive)]',
                    job.status === 'processing' && 'border-[var(--warning)]/50 text-[var(--warning)]',
                    job.status === 'failed' && 'border-[var(--negative)]/50 text-[var(--negative)]'
                  )}>
                    {job.status === 'completed' && 'Terminé'}
                    {job.status === 'processing' && 'En cours'}
                    {job.status === 'failed' && 'Échec'}
                    {job.status === 'pending' && 'En attente'}
                  </Badge>
                  
                  {job.status === 'completed' && job.downloadUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={job.downloadUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {exportJobs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucun export pour l’instant. Configurez les options ci-dessus puis cliquez sur « Lancer l’export ».
              </div>
            )}
          </div>
        </div>

        {/* Quick Export Templates */}
        <div className="terminal-panel p-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Modèles d’export rapide
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: true,
                  includeArbitrage: false,
                  includeSignals: false,
                  includeHistory: false,
                  format: 'csv',
                  dateRange: '24h',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <Table2 className="h-5 w-5" />
              <span className="text-sm font-medium">Instantané marché</span>
              <span className="text-xs text-muted-foreground">Prix actuels uniquement</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: false,
                  includeArbitrage: true,
                  includeSignals: true,
                  includeHistory: false,
                  format: 'xlsx',
                  dateRange: '7d',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-medium">Analyse hebdo</span>
              <span className="text-xs text-muted-foreground">Arbitrage + signaux sur 7 jours</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: true,
                  includeArbitrage: true,
                  includeSignals: true,
                  includeHistory: true,
                  format: 'xlsx',
                  dateRange: '30d',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-sm font-medium">Rapport complet</span>
              <span className="text-xs text-muted-foreground">Toutes les données, 30 jours</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => {
                setConfig({
                  includeMarkets: false,
                  includeArbitrage: false,
                  includeSignals: true,
                  includeHistory: false,
                  format: 'csv',
                  dateRange: '24h',
                  customStartDate: '',
                  customEndDate: '',
                });
              }}
            >
              <Activity className="h-5 w-5" />
              <span className="text-sm font-medium">Signaux du jour</span>
              <span className="text-xs text-muted-foreground">Signaux des dernières 24 h</span>
            </Button>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
