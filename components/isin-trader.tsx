'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { ETFPrice, getETFSnapshot, searchETFs } from '@/lib/etf-data';

export function ISINTrader() {
  const [etfs, setEtfs] = useState<ETFPrice[]>([]);
  const [selectedIsin, setSelectedIsin] = useState<ETFPrice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadETFs();
  }, []);

  const loadETFs = () => {
    setIsLoading(true);
    const snapshot = getETFSnapshot();
    setEtfs(snapshot.etfs);
    setIsLoading(false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      const results = searchETFs(value);
      setEtfs(results);
    } else {
      loadETFs();
    }
  };

  const handleSelectISIN = (etf: ETFPrice) => {
    setSelectedIsin(etf);
  };

  const handleBuy = () => {
    if (!selectedIsin) return;
    alert(`Achat de ${quantity} x ${selectedIsin.name} à ${selectedIsin.ask.toFixed(2)} ${selectedIsin.currency}`);
  };

  const handleSell = () => {
    if (!selectedIsin) return;
    alert(`Vente de ${quantity} x ${selectedIsin.name} à ${selectedIsin.bid.toFixed(2)} ${selectedIsin.currency}`);
  };

  return (
    <div className="space-y-6">
      {/* Recherche */}
      <Card className="p-6">
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher par ISIN, symbole ou nom..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={loadETFs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Liste des ISIN */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Prix des ISIN</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {etfs.map((etf) => (
                <button
                  key={etf.isin}
                  onClick={() => handleSelectISIN(etf)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedIsin?.isin === etf.isin
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">{etf.name}</p>
                      <p className="text-sm text-muted-foreground">{etf.isin}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                      {etf.currency}
                    </span>
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Achat (Bid):</span>
                      <span className="font-mono font-semibold">{etf.bid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vente (Ask):</span>
                      <span className="font-mono font-semibold">{etf.ask.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dernier (Last):</span>
                      <span className="font-mono font-semibold">{etf.last.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border">
                      <span className="text-muted-foreground text-xs">Écart:</span>
                      <span className="text-xs font-mono">{etf.spread.toFixed(2)} ({etf.spreadPercent.toFixed(3)}%)</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Détails et Trading */}
        {selectedIsin && (
          <Card className="p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Détails de l'ordre</h3>

            <div className="space-y-4">
              {/* Info ISIN */}
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Actif sélectionné</p>
                <p className="font-semibold text-foreground">{selectedIsin.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedIsin.isin}</p>
              </div>

              {/* Prix actuels */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Achat (Bid):</span>
                  <span className="font-mono font-semibold text-green-600">{selectedIsin.bid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vente (Ask):</span>
                  <span className="font-mono font-semibold text-red-600">{selectedIsin.ask.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dernier:</span>
                  <span className="font-mono font-semibold">{selectedIsin.last.toFixed(2)}</span>
                </div>
              </div>

              {/* Quantité */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Quantité</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Résumé */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Coût achat:</span>
                  <span className="font-semibold">{(parseFloat(quantity) * selectedIsin.ask).toFixed(2)} {selectedIsin.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coût vente:</span>
                  <span className="font-semibold">{(parseFloat(quantity) * selectedIsin.bid).toFixed(2)} {selectedIsin.currency}</span>
                </div>
              </div>

              {/* Boutons */}
              <div className="space-y-2 pt-4">
                <Button onClick={handleBuy} className="w-full bg-green-600 hover:bg-green-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Acheter à {selectedIsin.ask.toFixed(2)}
                </Button>
                <Button onClick={handleSell} variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-50">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Vendre à {selectedIsin.bid.toFixed(2)}
                </Button>
              </div>

              {/* Info source */}
              <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                Source: {selectedIsin.source}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
