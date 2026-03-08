'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SpreadResult, TradingSignal, AssetType, NormalizedPrice } from '@/lib/types/arbitrage';
import { getMarketSnapshot } from '@/lib/binance-service';

interface MarketData {
  goldPrice: NormalizedPrice | null;
  silverPrice: NormalizedPrice | null;
  eurUsdRate: number;
  goldSpreads: SpreadResult[];
  silverSpreads: SpreadResult[];
  signals: TradingSignal[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: string | null;
  isConnected: boolean;
}

const DEFAULT_REFRESH_INTERVAL = 5000; // 5 seconds

export function useMarketData(refreshInterval: number = DEFAULT_REFRESH_INTERVAL) {
  const [data, setData] = useState<MarketData>({
    goldPrice: null,
    silverPrice: null,
    eurUsdRate: 1.08, // Default EUR/USD
    goldSpreads: [],
    silverSpreads: [],
    signals: [],
    isLoading: true,
    error: null,
    lastUpdate: null,
    isConnected: false,
  });
  
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/arbitrage/data');
      if (!response.ok) throw new Error('Failed to fetch market data');
      
      const result = await response.json();
      
      setData({
        goldPrice: result.goldPrice,
        silverPrice: result.silverPrice,
        eurUsdRate: result.eurUsdRate,
        goldSpreads: result.goldSpreads || [],
        silverSpreads: result.silverSpreads || [],
        signals: result.signals || [],
        isLoading: false,
        error: null,
        lastUpdate: new Date().toISOString(),
        isConnected: true,
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isConnected: false,
      }));
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);
  
  return {
    ...data,
    refetch: fetchData,
  };
}

export function useBinancePrices(refreshInterval: number = DEFAULT_REFRESH_INTERVAL) {
  const [prices, setPrices] = useState<{
    xauUsd: number | null;
    xagUsd: number | null;
    eurUsd: number | null;
    isLoading: boolean;
    error: string | null;
    lastUpdate: string | null;
  }>({
    xauUsd: null,
    xagUsd: null,
    eurUsd: null,
    isLoading: true,
    error: null,
    lastUpdate: null,
  });
  
  const fetchPrices = useCallback(async () => {
    try {
      const snapshot = await getMarketSnapshot();
      
      setPrices({
        xauUsd: snapshot.xauUsd.price,
        xagUsd: snapshot.xagUsd.price,
        eurUsd: snapshot.eurUsd.price,
        isLoading: false,
        error: null,
        lastUpdate: snapshot.xauUsd.lastUpdate,
      });
    } catch (error) {
      setPrices(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);
  
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);
  
  return { ...prices, refetch: fetchPrices };
}

export function useTickerData(refreshInterval: number = DEFAULT_REFRESH_INTERVAL) {
  const [ticker, setTicker] = useState<{
    items: Array<{
      symbol: string;
      name: string;
      price: number;
      change: number;
      changePercent: number;
      currency: string;
    }>;
    isConnected: boolean;
    lastUpdate: string | null;
  }>({
    items: [],
    isConnected: false,
    lastUpdate: null,
  });
  
  const fetchTicker = useCallback(async () => {
    try {
      const snapshot = await getMarketSnapshot();
      
      const items = [
        {
          symbol: 'XAU',
          name: 'Gold',
          price: snapshot.xauUsd.price || 0,
          change: 0, // Would need historical data
          changePercent: 0,
          currency: 'USD',
        },
        {
          symbol: 'XAG',
          name: 'Silver',
          price: snapshot.xagUsd.price || 0,
          change: 0,
          changePercent: 0,
          currency: 'USD',
        },
        {
          symbol: 'EUR/USD',
          name: 'Euro',
          price: snapshot.eurUsd.price || 0,
          change: 0,
          changePercent: 0,
          currency: 'USD',
        },
        {
          symbol: 'XAU/EUR',
          name: 'Gold EUR',
          price: snapshot.xauEur.price || 0,
          change: 0,
          changePercent: 0,
          currency: 'EUR',
        },
      ];
      
      setTicker({
        items,
        isConnected: true,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      setTicker(prev => ({
        ...prev,
        isConnected: false,
      }));
    }
  }, []);
  
  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchTicker, refreshInterval]);
  
  return ticker;
}

export function useSignals(assetType?: AssetType) {
  const [signals, setSignals] = useState<{
    items: TradingSignal[];
    isLoading: boolean;
    error: string | null;
  }>({
    items: [],
    isLoading: true,
    error: null,
  });
  
  const fetchSignals = useCallback(async () => {
    try {
      const url = assetType
        ? `/api/arbitrage/signals?assetType=${assetType}`
        : '/api/arbitrage/signals';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch signals');
      
      const result = await response.json();
      
      setSignals({
        items: result.signals || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setSignals(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [assetType]);
  
  const acknowledgeSignal = useCallback(async (signalId: string) => {
    try {
      await fetch(`/api/arbitrage/signals/${signalId}/acknowledge`, {
        method: 'POST',
      });
      fetchSignals();
    } catch (error) {
      console.error('Failed to acknowledge signal:', error);
    }
  }, [fetchSignals]);
  
  const dismissSignal = useCallback(async (signalId: string) => {
    try {
      await fetch(`/api/arbitrage/signals/${signalId}/dismiss`, {
        method: 'POST',
      });
      fetchSignals();
    } catch (error) {
      console.error('Failed to dismiss signal:', error);
    }
  }, [fetchSignals]);
  
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [fetchSignals]);
  
  return {
    ...signals,
    refetch: fetchSignals,
    acknowledgeSignal,
    dismissSignal,
  };
}
