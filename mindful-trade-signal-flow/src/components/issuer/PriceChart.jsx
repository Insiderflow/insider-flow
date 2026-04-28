import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Info } from 'lucide-react';
import { subMonths, format } from 'date-fns';

const PERIODS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
];

// Generate mock price data seeded from ticker string
function generatePriceData(ticker, months) {
  const seed = ticker ? ticker.charCodeAt(0) + (ticker.charCodeAt(1) || 0) : 65;
  const basePrice = 50 + (seed % 200);
  const now = new Date();
  const start = subMonths(now, months);
  const points = Math.min(months * 20, 200);
  const data = [];
  let price = basePrice;

  for (let i = 0; i <= points; i++) {
    const date = new Date(start.getTime() + (i / points) * (now - start));
    price = Math.max(1, price + (Math.random() - 0.48) * (basePrice * 0.03));
    data.push({
      date: format(date, 'MMM d'),
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold tabular-nums">${payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
};

export default function PriceChart({ ticker, isLoading, error, isFallback, onRetry }) {
  const [activePeriod, setActivePeriod] = useState('3M');
  const months = PERIODS.find(p => p.label === activePeriod)?.months || 3;
  const data = useMemo(() => generatePriceData(ticker, months), [ticker, months]);

  const startPrice = data[0]?.price || 0;
  const endPrice = data[data.length - 1]?.price || 0;
  const change = endPrice - startPrice;
  const changePct = startPrice ? (change / startPrice) * 100 : 0;
  const isPositive = change >= 0;

  if (isLoading) {
    return (
      <div className="px-4 pb-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-[160px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pb-4">
        <div className="bg-card rounded-2xl border border-border/50 p-5 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Price data unavailable</p>
            <p className="text-xs text-muted-foreground mt-0.5">Could not load price history for {ticker}.</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        {/* Price header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-2xl font-bold tabular-nums">${endPrice.toFixed(2)}</p>
            <p className={`text-xs font-semibold mt-0.5 ${isPositive ? 'text-buy' : 'text-sell'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePct.toFixed(2)}%) · {activePeriod}
            </p>
          </div>
          {/* Period selector */}
          <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
            {PERIODS.map(p => (
              <button
                key={p.label}
                onClick={() => setActivePeriod(p.label)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  activePeriod === p.label
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fallback source notice */}
        {isFallback && (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-warning/10 rounded-lg">
            <Info className="h-3.5 w-3.5 text-warning-color flex-shrink-0" />
            <p className="text-[11px] text-warning-color font-medium">
              Showing Yahoo Finance data · Internal source unavailable
            </p>
          </div>
        )}

        {/* Area chart */}
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? 'hsl(var(--buy))' : 'hsl(var(--sell))'}
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? 'hsl(var(--buy))' : 'hsl(var(--sell))'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(data.length / 4)}
            />
            <YAxis
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v}`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(var(--buy))' : 'hsl(var(--sell))'}
              strokeWidth={2}
              fill="url(#priceGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}