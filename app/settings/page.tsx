'use client';

import { useState } from 'react';
import { TerminalLayout } from '@/components/terminal/terminal-layout';
import { 
  Save,
  RotateCcw,
  Clock,
  Sliders,
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DEFAULT_GOLD_THRESHOLDS, DEFAULT_SILVER_THRESHOLDS } from '@/lib/config/instruments';

interface AlertSettings {
  gold: {
    spreadPctBuy: number;
    spreadPctSell: number;
    zScoreThreshold: number;
    enabled: boolean;
    cooldownMinutes: number;
  };
  silver: {
    spreadPctBuy: number;
    spreadPctSell: number;
    zScoreThreshold: number;
    enabled: boolean;
    cooldownMinutes: number;
  };
}

interface DisplaySettings {
  refreshInterval: number;
  autoRefresh: boolean;
  showZScore: boolean;
  showNetEdge: boolean;
  theme: 'dark' | 'light';
}

export default function SettingsPage() {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    gold: {
      spreadPctBuy: DEFAULT_GOLD_THRESHOLDS.spreadPctBuy,
      spreadPctSell: DEFAULT_GOLD_THRESHOLDS.spreadPctSell,
      zScoreThreshold: DEFAULT_GOLD_THRESHOLDS.zScoreThreshold,
      enabled: DEFAULT_GOLD_THRESHOLDS.enabled,
      cooldownMinutes: DEFAULT_GOLD_THRESHOLDS.cooldownMinutes,
    },
    silver: {
      spreadPctBuy: DEFAULT_SILVER_THRESHOLDS.spreadPctBuy,
      spreadPctSell: DEFAULT_SILVER_THRESHOLDS.spreadPctSell,
      zScoreThreshold: DEFAULT_SILVER_THRESHOLDS.zScoreThreshold,
      enabled: DEFAULT_SILVER_THRESHOLDS.enabled,
      cooldownMinutes: DEFAULT_SILVER_THRESHOLDS.cooldownMinutes,
    },
  });

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    refreshInterval: 5000,
    autoRefresh: true,
    showZScore: true,
    showNetEdge: true,
    theme: 'dark',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setAlertSettings({
      gold: {
        spreadPctBuy: DEFAULT_GOLD_THRESHOLDS.spreadPctBuy,
        spreadPctSell: DEFAULT_GOLD_THRESHOLDS.spreadPctSell,
        zScoreThreshold: DEFAULT_GOLD_THRESHOLDS.zScoreThreshold,
        enabled: DEFAULT_GOLD_THRESHOLDS.enabled,
        cooldownMinutes: DEFAULT_GOLD_THRESHOLDS.cooldownMinutes,
      },
      silver: {
        spreadPctBuy: DEFAULT_SILVER_THRESHOLDS.spreadPctBuy,
        spreadPctSell: DEFAULT_SILVER_THRESHOLDS.spreadPctSell,
        zScoreThreshold: DEFAULT_SILVER_THRESHOLDS.zScoreThreshold,
        enabled: DEFAULT_SILVER_THRESHOLDS.enabled,
        cooldownMinutes: DEFAULT_SILVER_THRESHOLDS.cooldownMinutes,
      },
    });
    setDisplaySettings({
      refreshInterval: 5000,
      autoRefresh: true,
      showZScore: true,
      showNetEdge: true,
      theme: 'dark',
    });
  };

  return (
    <TerminalLayout 
      title="Paramètres"
      subtitle="Configurer les alertes, seuils et options d'affichage"
    >
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-2 text-signal-buy text-sm">
              <CheckCircle className="w-4 h-4" />
              Paramètres enregistrés
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border bg-muted/50 hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            RÉINITIALISER
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded border border-accent bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {saving ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Alert Thresholds */}
        <div className="space-y-6">
          {/* Gold Settings */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Seuils d'alerte Or</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Alertes activées</label>
                <button
                  onClick={() => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, enabled: !s.gold.enabled }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    alertSettings.gold.enabled ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    alertSettings.gold.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Seuil de signal d'achat (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.gold.spreadPctBuy}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, spreadPctBuy: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">TR moins cher que Binance de ce pourcentage</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Seuil de signal de vente (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.gold.spreadPctSell}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, spreadPctSell: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">TR plus cher que Binance de ce pourcentage</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Seuil Z-Score</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.gold.zScoreThreshold}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, zScoreThreshold: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Délai d'alerte (minutes)</label>
                <input
                  type="number"
                  value={alertSettings.gold.cooldownMinutes}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    gold: { ...s.gold, cooldownMinutes: parseInt(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Silver Settings */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-silver" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Seuils d'alerte Argent</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Alertes activées</label>
                <button
                  onClick={() => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, enabled: !s.silver.enabled }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    alertSettings.silver.enabled ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    alertSettings.silver.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Seuil de signal d'achat (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.silver.spreadPctBuy}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, spreadPctBuy: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Seuil de signal de vente (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.silver.spreadPctSell}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, spreadPctSell: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Seuil Z-Score</label>
                <input
                  type="number"
                  step="0.1"
                  value={alertSettings.silver.zScoreThreshold}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, zScoreThreshold: parseFloat(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Délai d'alerte (minutes)</label>
                <input
                  type="number"
                  value={alertSettings.silver.cooldownMinutes}
                  onChange={(e) => setAlertSettings(s => ({
                    ...s,
                    silver: { ...s.silver, cooldownMinutes: parseInt(e.target.value) }
                  }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-6">
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Paramètres d'affichage</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Actualisation automatique</label>
                <button
                  onClick={() => setDisplaySettings(s => ({ ...s, autoRefresh: !s.autoRefresh }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    displaySettings.autoRefresh ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    displaySettings.autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Intervalle d'actualisation (ms)</label>
                <select
                  value={displaySettings.refreshInterval}
                  onChange={(e) => setDisplaySettings(s => ({ ...s, refreshInterval: parseInt(e.target.value) }))}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm"
                >
                  <option value={1000}>1 seconde</option>
                  <option value={2000}>2 secondes</option>
                  <option value={5000}>5 secondes</option>
                  <option value={10000}>10 secondes</option>
                  <option value={30000}>30 secondes</option>
                  <option value={60000}>1 minute</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Afficher le Z-Score</label>
                <button
                  onClick={() => setDisplaySettings(s => ({ ...s, showZScore: !s.showZScore }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    displaySettings.showZScore ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    displaySettings.showZScore ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Afficher la marge nette</label>
                <button
                  onClick={() => setDisplaySettings(s => ({ ...s, showNetEdge: !s.showNetEdge }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    displaySettings.showNetEdge ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
                    displaySettings.showNetEdge ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Sources de données</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="text-sm font-medium">Binance</div>
                  <div className="text-xs text-muted-foreground">PAXG/USDT Spot</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-signal-buy">
                  <span className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                  Connecté
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="text-sm font-medium">Trade Republic</div>
                  <div className="text-xs text-muted-foreground">Lang & Schwarz</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-signal-buy">
                  <span className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                  Connecté
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <div className="text-sm font-medium">EUR/USD Rate</div>
                  <div className="text-xs text-muted-foreground">ECB Reference</div>
                </div>
                <span className="flex items-center gap-1 text-xs text-signal-buy">
                  <span className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                  Actif
                </span>
              </div>
            </div>
          </div>

          {/* Market Hours Info */}
          <div className="terminal-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Horaires de marché</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trade Republic (L&S)</span>
                <span className="font-mono">07:30 - 23:00 CET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XETRA</span>
                <span className="font-mono">09:00 - 17:30 CET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Binance</span>
                <span className="font-mono">24/7</span>
              </div>
            </div>

            <div className="mt-4 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              <strong>Note :</strong> Les comparaisons d'écart sont plus fiables pendant les heures de marché TR. 
              Les données de week-end et de jours fériés sont marquées avec une confiance réduite.
            </div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
