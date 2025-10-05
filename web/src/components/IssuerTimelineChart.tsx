"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface TradeData {
  id: string;
  traded_at: string;
  type: 'buy' | 'sell' | 'exchange';
  politician: {
    id: string;
    name: string;
    party: string | null;
    chamber: string | null;
  };
  size_min?: number;
  size_max?: number;
  price?: number;
}

interface IssuerTimelineChartProps {
  trades: TradeData[];
  issuerName: string;
}

interface ChartPoint {
  date: Date;
  trades: TradeData[];
  x: number;
  y: number;
  totalVolume: number;
  buyCount: number;
  sellCount: number;
}

interface DailyData {
  date: string;
  trades: TradeData[];
  totalVolume: number;
  buyCount: number;
  sellCount: number;
}

export default function IssuerTimelineChart({ trades, issuerName }: IssuerTimelineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);

  // Add error handling for invalid data
  if (!trades || !Array.isArray(trades)) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <p className="text-gray-400">無法載入交易數據</p>
      </div>
    );
  }

  // Process data to create daily aggregates
  const processData = () => {
    const tradesByDate = trades.reduce((acc, trade) => {
      try {
        const date = new Date(trade.traded_at);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date for trade:', trade.traded_at);
          return acc;
        }
        const dateKey = date.toISOString().split('T')[0];
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(trade);
      } catch (error) {
        console.warn('Error processing trade date:', error);
      }
      
      return acc;
    }, {} as Record<string, TradeData[]>);

    // Create daily data with volume calculations
    const dailyData: DailyData[] = Object.entries(tradesByDate)
      .map(([dateStr, dateTrades]) => {
        const totalVolume = dateTrades.reduce((sum, trade) => {
          const avgSize = trade.size_min && trade.size_max ? 
            (Number(trade.size_min) + Number(trade.size_max)) / 2 : 0;
          return sum + avgSize;
        }, 0);

        const buyCount = dateTrades.filter(t => t.type === 'buy').length;
        const sellCount = dateTrades.filter(t => t.type === 'sell').length;

        return {
          date: dateStr,
          trades: dateTrades,
          totalVolume,
          buyCount,
          sellCount
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return dailyData;
  };

  const dailyData = processData();

  // Calculate chart dimensions and positions
  useEffect(() => {
    if (!chartRef.current || dailyData.length === 0) return;

    const chartWidth = chartRef.current.offsetWidth;
    const chartHeight = 200;
    const padding = 60;
    const availableWidth = chartWidth - (padding * 2);
    const availableHeight = chartHeight - (padding * 2);

    // Find min/max values for scaling
    const maxVolume = Math.max(...dailyData.map(d => d.totalVolume));
    const minVolume = Math.min(...dailyData.map(d => d.totalVolume));
    const volumeRange = maxVolume - minVolume || 1;

    // Create chart points
    const points: ChartPoint[] = dailyData.map((data, index) => {
      const x = padding + (index / Math.max(1, dailyData.length - 1)) * availableWidth;
      const normalizedVolume = (data.totalVolume - minVolume) / volumeRange;
      const y = chartHeight - padding - (normalizedVolume * availableHeight);

      return {
        date: new Date(data.date),
        trades: data.trades,
        x,
        y,
        totalVolume: data.totalVolume,
        buyCount: data.buyCount,
        sellCount: data.sellCount
      };
    });

    setChartPoints(points);
  }, [dailyData]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartRef.current || chartPoints.length === 0) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Find closest point
    const closestPoint = chartPoints.reduce((closest, point) => {
      const distance = Math.abs(point.x - x);
      const closestDistance = Math.abs(closest.x - x);
      return distance < closestDistance ? point : closest;
    });
    
    if (Math.abs(closestPoint.x - x) < 50) {
      setHoveredPoint(closestPoint);
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (chartPoints.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <p className="text-gray-400">此發行商暫無交易記錄</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">交易量時間軸</h2>
      
      <div 
        ref={chartRef}
        className="relative w-full h-64 bg-gray-700 rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Chart grid lines */}
        <div className="absolute inset-0">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-gray-600 opacity-30"
              style={{ top: `${60 + ratio * 140}px` }}
            ></div>
          ))}
        </div>
        
        {/* Volume line chart */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Line connecting points */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}
          />
          
          {/* Data points */}
          {chartPoints.map((point, index) => {
            const hasMultipleTrades = point.trades.length > 1;
            const tradeType = point.trades[0]?.type;
            const isHighVolume = point.totalVolume > 0;
            
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={isHighVolume ? 6 : 4}
                fill={
                  hasMultipleTrades 
                    ? '#FBBF24' 
                    : tradeType === 'buy' 
                      ? '#10B981' 
                      : tradeType === 'sell' 
                        ? '#EF4444' 
                        : '#3B82F6'
                }
                stroke="#1F2937"
                strokeWidth="2"
                className="cursor-pointer hover:r-8 transition-all"
              />
            );
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400">
          {dailyData.length > 0 && (() => {
            const maxVolume = Math.max(...dailyData.map(d => d.totalVolume));
            const minVolume = Math.min(...dailyData.map(d => d.totalVolume));
            return [
              { value: maxVolume, label: `$${maxVolume.toLocaleString()}` },
              { value: (maxVolume + minVolume) / 2, label: `$${Math.round((maxVolume + minVolume) / 2).toLocaleString()}` },
              { value: minVolume, label: `$${minVolume.toLocaleString()}` }
            ];
          })().map((item, i) => (
            <div key={i} className="text-right">
              {item.label}
            </div>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-between text-xs text-gray-400">
          {chartPoints.length > 0 && (
            <>
              <div>{chartPoints[0].date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}</div>
              {chartPoints.length > 1 && (
                <div>{chartPoints[Math.floor(chartPoints.length / 2)].date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}</div>
              )}
              <div>{chartPoints[chartPoints.length - 1].date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}</div>
            </>
          )}
        </div>
        
        {/* Hover tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-gray-700 border border-gray-600 rounded-lg shadow-xl p-4 text-sm text-white pointer-events-none"
            style={{ 
              left: Math.min(hoveredPoint.x + 20, (chartRef.current?.offsetWidth || 0) - 250), 
              top: Math.max(10, hoveredPoint.y - 100)
            }}
          >
            <p className="font-bold mb-2">{issuerName}</p>
            <p className="text-gray-300 mb-1">
              {hoveredPoint.date.toLocaleDateString('zh-TW', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-blue-400 mb-2">
              總交易量: ${hoveredPoint.totalVolume.toLocaleString()}
            </p>
            <p className="text-gray-400 text-xs mb-2">
              買入: {hoveredPoint.buyCount} | 賣出: {hoveredPoint.sellCount}
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {hoveredPoint.trades.slice(0, 5).map((trade, tradeIndex) => (
                <div key={tradeIndex} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    trade.type === 'buy' ? 'bg-green-500' : 
                    trade.type === 'sell' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></span>
                  <Link 
                    href={`/politicians/${trade.politician.id}`} 
                    className="text-blue-400 hover:underline"
                  >
                    {trade.politician.name}
                  </Link>
                  <span className="text-gray-300 text-xs">
                    {trade.type === 'buy' ? '買入' : trade.type === 'sell' ? '賣出' : '交換'}
                  </span>
                </div>
              ))}
              {hoveredPoint.trades.length > 5 && (
                <div className="text-gray-400 text-xs">
                  ... 還有 {hoveredPoint.trades.length - 5} 筆交易
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}