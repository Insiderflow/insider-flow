"use client";

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Trade {
  issuer_name: string;
  ticker: string;
  buy_sell: string;
  trade_amount: string;
  filled_date: string;
}

interface PortfolioData {
  dates: string[];
  politician_returns: number[];
  sp500_returns: number[];
  trades: Trade[];
}

interface MiniPortfolioChartProps {
  politician: string;
  className?: string;
}

export default function MiniPortfolioChart({ politician, className = "" }: MiniPortfolioChartProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          `/api/portfolio_comparison/${encodeURIComponent(politician)}`
        );
        
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Mini portfolio chart error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [politician]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`text-center text-gray-500 text-xs ${className}`}>
        <span className="zh-Hant">無數據</span>
        <span className="zh-Hans hidden">无数据</span>
      </div>
    );
  }

  // Take only the last 6 months of data for the mini chart
  const recentData = {
    dates: data.dates.slice(-6),
    politician_returns: data.politician_returns.slice(-6),
    sp500_returns: data.sp500_returns.slice(-6),
    trades: data.trades
  };

  const chartData = {
    labels: recentData.dates.map(date => new Date(date).toLocaleDateString('zh-TW', {
      month: 'short'
    })),
    datasets: [
      {
        label: 'Portfolio',
        data: recentData.politician_returns,
        borderColor: '#1E90FF',
        backgroundColor: 'rgba(30, 144, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: '#1E90FF',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
      },
      {
        label: 'S&P 500',
        data: recentData.sp500_returns,
        borderColor: '#32CD32',
        backgroundColor: 'rgba(50, 205, 50, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: '#32CD32',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for mini chart
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 12,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 11
        },
        padding: 8,
        callbacks: {
          title: function(context: { dataIndex: number }[]) {
            const date = new Date(recentData.dates[context[0].dataIndex]);
            return date.toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label: function(context: { dataset: { label?: string }; parsed: { y: number | null } }) {
            const dataset = context.dataset;
            const value = context.parsed.y;
            const label = dataset.label;
            
            if (label === 'Portfolio') {
              return `投資組合: ${value.toFixed(1)}%`;
            } else {
              return `S&P 500: ${value.toFixed(1)}%`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: false, // Hide x-axis for mini chart
      },
      y: {
        display: false, // Hide y-axis for mini chart
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      point: {
        hoverBackgroundColor: 'white'
      }
    }
  };

  // Calculate performance vs S&P 500
  const latestPoliticianReturn = recentData.politician_returns[recentData.politician_returns.length - 1] || 0;
  const latestSp500Return = recentData.sp500_returns[recentData.sp500_returns.length - 1] || 0;
  const outperformance = latestPoliticianReturn - latestSp500Return;

  return (
    <div className={`${className}`}>
      {/* Mini Chart */}
      <div className="h-16 mb-2">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Performance Summary */}
      <div className="text-center">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-300">
              <span className="zh-Hant">投資組合</span>
              <span className="zh-Hans hidden">投资组合</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-300">S&P 500</span>
          </div>
        </div>
        
        {/* Performance indicator */}
        <div className="mt-1">
          {outperformance > 0 ? (
            <span className="text-green-400 text-xs font-medium">
              +{outperformance.toFixed(1)}%
              <span className="zh-Hant"> 超越大盤</span>
              <span className="zh-Hans hidden"> 超越大盘</span>
            </span>
          ) : (
            <span className="text-red-400 text-xs font-medium">
              {outperformance.toFixed(1)}%
              <span className="zh-Hant"> 落後大盤</span>
              <span className="zh-Hans hidden"> 落后大盘</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
