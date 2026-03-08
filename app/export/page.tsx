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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Code,
  ExternalLink,
  Copy,
  Check,
  Terminal,
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
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const apiEndpoints = [
    {
      name: 'Export Complet',
      method: 'GET',
      path: '/api/export',
      description: 'Toutes les donnees (marches, ETFs, arbitrage, signaux)',
      params: 'format=json|csv, include=markets,etfs,arbitrage,signals',
    },
    {
      name: 'Marches (Binance)',
      method: 'GET',
      path: '/api/export/markets',
      description: 'Prix XAU/USD, XAG/USD, EUR/USD depuis Binance',
      params: '-',
    },
    {
      name: 'ETFs (Trade Republic)',
      method: 'GET',
      path: '/api/export/etfs',
      description: 'Instruments ETF avec bid/ask/spread',
      params: '-',
    },
  ];

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://v0-market-intelligence-platform-zeta.vercel.app';

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

  const pythonCode = `#!/usr/bin/env python3
"""
Market Intelligence Platform - Export to Excel
Fetches data from the API and pushes to Excel using xlwings
"""

import requests
import xlwings as xw
from datetime import datetime

# Configuration
API_BASE_URL = "${baseUrl}"

def fetch_all_data():
    """Fetch all market data from the API"""
    url = f"{API_BASE_URL}/api/export?format=json"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.json()

def export_to_excel(data, excel_path="market_data.xlsx"):
    """Export data to Excel using xlwings"""
    wb = xw.Book()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Markets sheet
    if "markets" in data:
        ws = wb.sheets.add("Markets")
        ws.range("A1").value = "Market Data - " + timestamp
        headers = ["Symbol", "Price", "Currency", "Last Update"]
        ws.range("A3").value = headers
        row = 4
        for key, market in data["markets"]["binance"].items():
            ws.range(f"A{row}").value = [
                market["pair"], market["price"],
                market["currency"], market["lastUpdate"]
            ]
            row += 1
    
    # ETFs sheet
    if "etfs" in data:
        ws = wb.sheets.add("ETFs")
        ws.range("A1").value = "ETF Data - " + timestamp
        headers = ["ISIN", "Name", "Bid", "Ask", "Last", "Spread %"]
        ws.range("A3").value = headers
        row = 4
        for etf in data["etfs"]["instruments"]:
            ws.range(f"A{row}").value = [
                etf["isin"], etf["name"], etf["bid"],
                etf["ask"], etf["last"], etf["spreadPercent"]
            ]
            row += 1
    
    wb.save(excel_path)
    print(f"Saved to {excel_path}")

if __name__ == "__main__":
    data = fetch_all_data()
    export_to_excel(data)
`;

  const curlExamples = `# Exporter toutes les donnees en JSON
curl "${baseUrl}/api/export"

# Exporter en CSV
curl "${baseUrl}/api/export?format=csv" -o export.csv

# Exporter uniquement les marches
curl "${baseUrl}/api/export/markets"

# Exporter uniquement les ETFs
curl "${baseUrl}/api/export/etfs"

# Exporter avec filtre (marches + signaux seulement)
curl "${baseUrl}/api/export?include=markets,signals"
`;

  return (
    <TerminalLayout title="Export">
      <div className="p-4 space-y-6">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Manuel
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="python" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Python
            </TabsTrigger>
          </TabsList>

          {/* Manual Export Tab */}
          <TabsContent value="manual" className="mt-6">
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
          </TabsContent>

          {/* API Endpoints Tab */}
          <TabsContent value="api" className="mt-6 space-y-6">
            <div className="terminal-panel p-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Code className="h-4 w-4" />
                Endpoints API REST
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Utilisez ces endpoints pour recuperer les donnees depuis votre serveur Debian ou tout autre client HTTP.
              </p>
              
              <div className="space-y-3">
                {apiEndpoints.map((endpoint) => (
                  <div 
                    key={endpoint.path}
                    className="p-4 rounded-lg border border-border bg-surface-2/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30">
                            {endpoint.method}
                          </Badge>
                          <span className="font-medium text-sm">{endpoint.name}</span>
                        </div>
                        <code className="text-xs text-muted-foreground font-mono block mb-2">
                          {baseUrl}{endpoint.path}
                        </code>
                        <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                        {endpoint.params !== '-' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-gold">Params:</span> {endpoint.params}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`, endpoint.path)}
                        >
                          {copiedEndpoint === endpoint.path ? (
                            <Check className="h-4 w-4 text-[var(--positive)]" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={`${endpoint.path}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* cURL Examples */}
            <div className="terminal-panel p-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Exemples cURL
              </h3>
              <div className="relative">
                <pre className="bg-surface-1 p-4 rounded-lg text-xs font-mono overflow-x-auto text-muted-foreground">
                  {curlExamples}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(curlExamples, 'curl')}
                >
                  {copiedEndpoint === 'curl' ? (
                    <Check className="h-4 w-4 text-[var(--positive)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Python Script Tab */}
          <TabsContent value="python" className="mt-6 space-y-6">
            <div className="terminal-panel p-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Script Python + xlwings
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ce script recupere les donnees de l'API et les exporte vers Excel avec xlwings.
                Compatible avec votre setup Debian -{'>'} Python -{'>'} Excel.
              </p>
              
              {/* Requirements */}
              <div className="bg-surface-1 p-3 rounded-lg mb-4">
                <p className="text-xs font-mono text-muted-foreground mb-2">
                  <span className="text-gold"># Installation des dependances</span>
                </p>
                <code className="text-xs font-mono text-foreground">
                  pip install requests xlwings pandas
                </code>
              </div>

              {/* Python Code */}
              <div className="relative">
                <pre className="bg-surface-1 p-4 rounded-lg text-xs font-mono overflow-x-auto text-muted-foreground max-h-[500px] overflow-y-auto">
                  {pythonCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(pythonCode, 'python')}
                >
                  {copiedEndpoint === 'python' ? (
                    <Check className="h-4 w-4 text-[var(--positive)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Usage */}
              <div className="mt-4 p-4 border border-border rounded-lg">
                <h4 className="text-sm font-medium mb-2">Utilisation</h4>
                <div className="space-y-2 text-xs text-muted-foreground font-mono">
                  <p><span className="text-gold">$</span> python export_to_excel.py</p>
                  <p className="text-muted-foreground/70"># Affiche les donnees JSON</p>
                  <p><span className="text-gold">$</span> python export_to_excel.py market_data.xlsx</p>
                  <p className="text-muted-foreground/70"># Exporte vers Excel</p>
                  <p><span className="text-gold">$</span> python export_to_excel.py --csv ./exports</p>
                  <p className="text-muted-foreground/70"># Exporte en CSV vers le dossier</p>
                </div>
              </div>

              {/* Automation tip */}
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="text-sm font-medium text-primary mb-2">Automatisation (cron)</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Pour executer automatiquement toutes les 5 minutes :
                </p>
                <code className="text-xs font-mono text-foreground block bg-surface-1 p-2 rounded">
                  */5 * * * * /usr/bin/python3 /path/to/export_to_excel.py /path/to/data.xlsx
                </code>
              </div>
            </div>

            {/* Download script */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const blob = new Blob([pythonCode], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'export_to_excel.py';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Telecharger le script Python
              </Button>
              <Button
                variant="outline"
                asChild
              >
                <a href="/api/export" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tester l'API
                </a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TerminalLayout>
  );
}
