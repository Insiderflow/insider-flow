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

interface TimelinePoint {
  date: Date;
  trades: TradeData[];
  x: number;
}

export default function IssuerTimelineChart({ trades, issuerName }: IssuerTimelineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  // Add error handling for invalid data
  if (!trades || !Array.isArray(trades)) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <p className="text-gray-400">無法載入交易數據</p>
      </div>
    );
  }

  // Group trades by date
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

  // Create timeline points
  const timelinePoints: TimelinePoint[] = Object.entries(tradesByDate)
    .map(([dateStr, dateTrades]) => ({
      date: new Date(dateStr),
      trades: dateTrades,
      x: 0 // Will be calculated in useEffect
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate positions
  useEffect(() => {
    if (!chartRef.current || timelinePoints.length === 0) return;

    const chartWidth = chartRef.current.offsetWidth;
    const padding = 40;
    const availableWidth = chartWidth - (padding * 2);
    
    if (timelinePoints.length === 1) {
      timelinePoints[0].x = chartWidth / 2;
    } else {
      timelinePoints.forEach((point, index) => {
        point.x = padding + (index / (timelinePoints.length - 1)) * availableWidth;
      });
    }
  }, [timelinePoints]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const getTradeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return '#10b981'; // green
      case 'sell':
        return '#ef4444'; // red
      case 'exchange':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  const getTradeTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return '↗';
      case 'sell':
        return '↘';
      case 'exchange':
        return '⇄';
      default:
        return '•';
    }
  };

  if (timelinePoints.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <p className="text-gray-400">暫無交易數據</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-4">
        {issuerName} 交易時間線
      </h3>
      
      <div 
        ref={chartRef}
        className="relative h-32 w-full bg-gray-900 rounded border border-gray-700 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600 transform -translate-y-1/2"></div>
        
        {/* Timeline points */}
        {timelinePoints.map((point, index) => (
          <div
            key={index}
            className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
            style={{ left: `${point.x}px` }}
            onMouseEnter={() => setHoveredPoint(point)}
          >
            {/* Point */}
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{ 
                backgroundColor: point.trades.length > 1 ? '#f59e0b' : getTradeTypeColor(point.trades[0].type),
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-full h-full rounded-full bg-white opacity-20"></div>
            </div>
            
            {/* Date label */}
            <div 
              className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap"
              style={{ transform: 'translate(-50%, 0)' }}
            >
              {point.date.toLocaleDateString('zh-TW', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        ))}
        
        {/* Hover card */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-gray-700 border border-gray-600 rounded-lg shadow-xl p-4 max-w-sm"
            style={{
              left: `${Math.min(hoveredPoint.x, chartRef.current?.offsetWidth || 0 - 200)}px`,
              top: `${mousePosition.y - 100}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="text-sm text-white font-medium mb-2">
              {hoveredPoint.date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            
            <div className="space-y-2">
              {hoveredPoint.trades.map((trade, tradeIndex) => (
                <div key={tradeIndex} className="flex items-center gap-2 text-sm">
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTradeTypeColor(trade.type) }}
                  ></span>
                  <span className="text-gray-300">
                    {getTradeTypeIcon(trade.type)} {trade.type.toUpperCase()}
                  </span>
                  <Link 
                    href={`/politicians/${trade.politician.id}`}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    {trade.politician.name}
                  </Link>
                  {trade.size_min && trade.size_max && (
                    <span className="text-gray-400">
                      ${trade.size_min}K-${trade.size_max}K
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {hoveredPoint.trades.length > 1 && (
              <div className="mt-2 text-xs text-gray-400">
                共 {hoveredPoint.trades.length} 筆交易
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-300">買入</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-300">賣出</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-300">交換</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-300">多筆交易</span>
        </div>
      </div>
    </div>
  );
}
