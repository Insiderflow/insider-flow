import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { politicianEndpoints } from '@/lib/api/endpoints';

const RANGES = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
];

function mapApiToChartData(apiData) {
  const dates = apiData?.dates || [];
  const p = apiData?.politician_returns || [];
  const s = apiData?.sp500_returns || [];
  const n = apiData?.nq_returns || [];
  return dates.map((d, i) => ({
    date: format(new Date(d), 'MMM d'),
    politician: Number(p[i] || 0),
    sp500: Number(s[i] || 0),
    nq: Number(n[i] || 0),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className={`font-semibold ${p.value >= 0 ? 'text-buy' : 'text-sell'}`}>
            {p.value >= 0 ? '+' : ''}{p.value}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PerformanceChart({ trades, politicianName, isLoading, error, onRetry }) {
  const [activeRange, setActiveRange] = useState('3M');
  const months = RANGES.find(r => r.label === activeRange)?.months || 3;
  const [apiData, setApiData] = useState(null);
  const [chartError, setChartError] = useState(null);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const resolvedPolitician = politicianName || trades?.[0]?.politician_name || null;

  const loadChart = async () => {
    if (!resolvedPolitician) return;
    setIsChartLoading(true);
    setChartError(null);
    try {
      const now = new Date();
      const start = subMonths(now, months);
      const startDate = start.toISOString().slice(0, 10);
      const res = await politicianEndpoints.getPortfolioComparison(resolvedPolitician, { start_date: startDate });
      setApiData(res || null);
    } catch (e) {
      setChartError(e?.message || 'Failed to load chart');
    } finally {
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    loadChart();
  }, [resolvedPolitician, months]);

  const data = useMemo(() => mapApiToChartData(apiData), [apiData]);

  if (isLoading || isChartLoading) {
    return (
      <div className="px-4 pb-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[180px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || chartError || !data.length) {
    return (
      <div className="px-4 pb-4">
        <div className="bg-card rounded-2xl border border-border/50 p-5 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Chart unavailable</p>
            <p className="text-xs text-muted-foreground mt-0.5">Analytics request timed out. Data may be stale.</p>
          </div>
          {(onRetry || resolvedPolitician) && (
            <button
              onClick={() => {
                onRetry?.();
                loadChart();
              }}
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
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Portfolio vs S&P 500 / NQ</p>
            {apiData?.cached && apiData?.cached_at && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Cached {new Date(apiData.cached_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          {/* Range selector */}
          <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
            {RANGES.map(r => (
              <button
                key={r.label}
                onClick={() => setActiveRange(r.label)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  activeRange === r.label
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-primary inline-block" />
            <span className="text-[11px] text-muted-foreground">Politician</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-muted-foreground inline-block" />
            <span className="text-[11px] text-muted-foreground">S&P 500</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-violet-400 inline-block" />
            <span className="text-[11px] text-muted-foreground">NQ</span>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="politician"
              name="Politician"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="sp500"
              name="S&P 500"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="nq"
              name="NQ"
              stroke="#a78bfa"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}