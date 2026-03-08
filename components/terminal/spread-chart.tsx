'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import type { AssetType, SpreadHistoryPoint } from '@/lib/types/arbitrage';

interface SpreadChartProps {
  data: SpreadHistoryPoint[];
  assetType: AssetType;
  buyThreshold?: number;
  sellThreshold?: number;
  showThresholds?: boolean;
  height?: number;
  className?: string;
}

export function SpreadChart({
  data,
  assetType,
  buyThreshold = -0.75,
  sellThreshold = 0.75,
  showThresholds = true,
  height = 200,
  className,
}: SpreadChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      time: new Date(point.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }, [data]);
  
  const gradientId = `spread-gradient-${assetType}`;
  const accentColor = assetType === 'GOLD' ? '#d4af37' : '#c0c0c0';
  
  // Calculate domain
  const spreads = data.map(d => d.spreadPct);
  const minSpread = Math.min(...spreads, buyThreshold - 0.5);
  const maxSpread = Math.max(...spreads, sellThreshold + 0.5);
  
  return (
    <div className={cn('terminal-panel', className)}>
      <div className="terminal-panel-header">
        <span className={cn('terminal-panel-title', assetType === 'GOLD' ? 'text-gold' : 'text-silver')}>
          Historique des écarts
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {data.length} points
        </span>
      </div>
      
      <div className="p-2">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            
            <YAxis
              domain={[minSpread, maxSpread]}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
            />
            
            {showThresholds && (
              <>
                <ReferenceLine
                  y={0}
                  stroke="var(--border-strong)"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={buyThreshold}
                  stroke="var(--positive)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <ReferenceLine
                  y={sellThreshold}
                  stroke="var(--negative)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              </>
            )}
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
              formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(3)}%`, 'Écart']}
            />
            
            <Area
              type="monotone"
              dataKey="spreadPct"
              stroke={accentColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface MiniSpreadChartProps {
  data: SpreadHistoryPoint[];
  assetType: AssetType;
  width?: number;
  height?: number;
  className?: string;
}

export function MiniSpreadChart({
  data,
  assetType,
  width = 100,
  height = 30,
  className,
}: MiniSpreadChartProps) {
  const lastSpread = data[data.length - 1]?.spreadPct ?? 0;
  const isPositive = lastSpread < -0.5;
  const isNegative = lastSpread > 0.5;
  
  const strokeColor = isPositive
    ? 'var(--positive)'
    : isNegative
    ? 'var(--negative)'
    : assetType === 'GOLD'
    ? '#d4af37'
    : '#c0c0c0';
  
  return (
    <div className={cn('inline-block', className)}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="spreadPct"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill="none"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
