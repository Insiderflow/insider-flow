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

interface PortfolioChartProps {
  politician: string;
}

export default function PortfolioChart({ politician }: PortfolioChartProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chinaFilter, setChinaFilter] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (chinaFilter) {
          params.set('china_filter', 'true');
        }
        
        const response = await axios.get(
          `/api/portfolio_comparison/${encodeURIComponent(politician)}?${params.toString()}`
        );
        
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Portfolio chart error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [politician, chinaFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-400 text-sm">
            <span className="zh-Hant">載入投資組合數據...</span>
            <span className="zh-Hans hidden">载入投资组合数据...</span>
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-red-500 mb-2">
          <span className="zh-Hant">載入圖表時發生錯誤</span>
          <span className="zh-Hans hidden">载入图表时发生错误</span>
        </div>
        <div className="text-gray-400 text-sm">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-gray-500">
          <span className="zh-Hant">無可用的投資組合數據</span>
          <span className="zh-Hans hidden">无可用的投资组合数据</span>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.dates.map(date => new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short'
    })),
    datasets: [
      {
        label: `${politician} 投資組合`,
        data: data.politician_returns,
        borderColor: '#1E90FF',
        backgroundColor: 'rgba(30, 144, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1E90FF',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'S&P 500',
        data: data.sp500_returns,
        borderColor: '#32CD32',
        backgroundColor: 'rgba(50, 205, 50, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#32CD32',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
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
            size: 14,
            weight: 'bold' as const
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: chinaFilter ? '中國股票投資組合比較' : '投資組合表現比較',
        color: 'white',
        font: {
          size: 18,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
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

            const tradeDetails = monthTrades.slice(0, 3).map(trade => {
              const action = trade.buy_sell === 'buy' ? '買入' : '賣出';
              return `${action} ${trade.issuer_name} (${trade.ticker}) - ${trade.trade_amount}`;
            });

            const result = ['本月交易:', ...tradeDetails];
            if (monthTrades.length > 3) {
              result.push(`...還有 ${monthTrades.length - 3} 筆交易`);
            }
            return result;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'white',
          maxTicksLimit: 8,
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'white',
          callback: function(this: unknown, tickValue: string | number) {
            return tickValue + '%';
          },
          font: {
            size: 12
          }
        }
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

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      {/* Header with China Filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              <span className="zh-Hant">投資組合表現分析</span>
              <span className="zh-Hans hidden">投资组合表现分析</span>
            </h3>
            <p className="text-sm text-gray-400">
              <span className="zh-Hant">比較政治家的投資組合回報率與 S&P 500 指數表現</span>
              <span className="zh-Hans hidden">比较政治家的投资组合回报率与 S&P 500 指数表现</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={chinaFilter}
                onChange={(e) => setChinaFilter(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="zh-Hant">中國股票篩選</span>
              <span className="zh-Hans hidden">中国股票筛选</span>
            </label>
            {chinaFilter && (
              <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                <span className="zh-Hant">已啟用</span>
                <span className="zh-Hans hidden">已启用</span>
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="h-96 mb-6">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Trade Summary */}
      {data.trades.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">
            <span className="zh-Hant">相關交易記錄</span>
            <span className="zh-Hans hidden">相关交易记录</span>
            <span className="text-gray-400 ml-2">({data.trades.length} 筆)</span>
          </h4>
          <div className="max-h-32 overflow-y-auto">
            <div className="space-y-2">
              {data.trades.slice(0, 5).map((trade, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.buy_sell === 'buy' 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {trade.buy_sell === 'buy' ? '買入' : '賣出'}
                    </span>
                    <span className="text-white font-medium">{trade.issuer_name}</span>
                    {trade.ticker && (
                      <span className="text-gray-400">({trade.ticker})</span>
                    )}
                  </div>
                  <span className="text-gray-400">{trade.trade_amount}</span>
                </div>
              ))}
              {data.trades.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">
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
