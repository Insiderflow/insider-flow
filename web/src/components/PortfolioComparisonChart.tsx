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

interface PortfolioComparisonChartProps {
  politicianName: string;
  chinaFilter?: boolean;
}

export default function PortfolioComparisonChart({ 
  politicianName, 
  chinaFilter = false 
}: PortfolioComparisonChartProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chinaFilterEnabled, setChinaFilterEnabled] = useState(chinaFilter);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (chinaFilterEnabled) {
          params.set('china_filter', 'true');
        }
        
        const response = await fetch(
          `/api/portfolio_comparison/${encodeURIComponent(politicianName)}?${params.toString()}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
        
        const portfolioData = await response.json();
        setData(portfolioData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [politicianName, chinaFilterEnabled]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <span className="zh-Hant">載入圖表時發生錯誤：{error}</span>
        <span className="zh-Hans hidden">载入图表时发生错误：{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 p-4">
        <span className="zh-Hant">無可用的投資組合數據</span>
        <span className="zh-Hans hidden">无可用的投资组合数据</span>
      </div>
    );
  }

  const chartData = {
    labels: data.dates.map(date => new Date(date).toLocaleDateString('zh-TW')),
    datasets: [
      {
        label: `${politicianName} 投資組合`,
        data: data.politician_returns,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      },
      {
        label: 'S&P 500',
        data: data.sp500_returns,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: chinaFilter ? '中國股票投資組合比較' : '投資組合表現比較',
        color: 'white',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          title: function(context: { dataIndex: number }[]) {
            const date = new Date(data.dates[context[0].dataIndex]);
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
            
            if (value === null) return '';
            
            if (label && label.includes('投資組合')) {
              return `${label}: ${value.toFixed(2)}%`;
            } else {
              return `S&P 500: ${value.toFixed(2)}%`;
            }
          },
          afterBody: function(context: { dataIndex: number }[]) {
            const dataIndex = context[0].dataIndex;
            const monthTrades = data.trades.filter(trade => {
              const tradeDate = new Date(trade.filled_date);
              const chartDate = new Date(data.dates[dataIndex]);
              return tradeDate.getMonth() === chartDate.getMonth() && 
                     tradeDate.getFullYear() === chartDate.getFullYear();
            });

            if (monthTrades.length === 0) return [];

            const tradeDetails = monthTrades.map(trade => {
              const action = trade.buy_sell === 'buy' ? '買入' : '賣出';
              return `${action} ${trade.issuer_name} (${trade.ticker}) - ${trade.trade_amount}`;
            });

            return ['本月交易:', ...tradeDetails];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white',
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white',
          callback: function(this: unknown, tickValue: string | number) {
            return tickValue + '%';
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">
            <span className="zh-Hant">投資組合表現比較</span>
            <span className="zh-Hans hidden">投资组合表现比较</span>
          </h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={chinaFilterEnabled}
                onChange={(e) => setChinaFilterEnabled(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
              />
              <span className="zh-Hant">中國股票篩選</span>
              <span className="zh-Hans hidden">中国股票筛选</span>
            </label>
            {chinaFilterEnabled && (
              <span className="text-sm text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                <span className="zh-Hant">已啟用</span>
                <span className="zh-Hans hidden">已启用</span>
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-400">
          <span className="zh-Hant">比較政治家的投資組合回報率與 S&P 500 指數表現</span>
          <span className="zh-Hans hidden">比较政治家的投资组合回报率与 S&P 500 指数表现</span>
        </p>
      </div>
      
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
      
      {data.trades.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-white mb-2">
            <span className="zh-Hant">相關交易記錄</span>
            <span className="zh-Hans hidden">相关交易记录</span>
          </h4>
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {data.trades.slice(0, 5).map((trade, index) => (
                <div key={index} className="text-xs text-gray-300 flex justify-between">
                  <span>
                    {trade.buy_sell === 'buy' ? '買入' : '賣出'} {trade.issuer_name}
                  </span>
                  <span>{trade.trade_amount}</span>
                </div>
              ))}
              {data.trades.length > 5 && (
                <div className="text-xs text-gray-500">
                  <span className="zh-Hant">還有 {data.trades.length - 5} 筆交易...</span>
                  <span className="zh-Hans hidden">还有 {data.trades.length - 5} 笔交易...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
