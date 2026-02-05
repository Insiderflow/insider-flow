"use client";

import { useState, useEffect, useRef } from 'react';
import PoliticianProfileImage from './PoliticianProfileImage';

interface PriceData {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

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
  published_at?: string | null;
}

interface PoliticianTradeCandlestickChartProps {
  ticker: string;
  trades: TradeData[];
  issuerName: string;
}

interface TradeMarker {
  trade: TradeData;
  date: string;
  x: number;
  y: number;
}

interface SelectedTrade {
  trade: TradeData;
  x: number;
  y: number;
}

export default function PoliticianTradeCandlestickChart({
  ticker,
  trades,
  issuerName,
}: PoliticianTradeCandlestickChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Debug: Log props on mount
  useEffect(() => {
    console.log('PoliticianTradeCandlestickChart mounted with:', {
      ticker,
      tradesCount: trades?.length || 0,
      issuerName,
    });
  }, []);
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade | null>(null);
  const [tradeMarkers, setTradeMarkers] = useState<TradeMarker[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [chartPadding, setChartPadding] = useState({ top: 40, right: 40, bottom: 80, left: 60 });

  // Fetch price history
  useEffect(() => {
    if (!ticker) {
      console.log('PoliticianTradeCandlestickChart: No ticker provided');
      setLoading(false);
      return;
    }

    if (!trades || trades.length === 0) {
      console.log('PoliticianTradeCandlestickChart: No trades provided');
      setLoading(false);
      return;
    }

    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        // Clean ticker - remove slashes and extra spaces, take first part if multiple
        const cleanTicker = ticker.split('/')[0].trim().split(' ')[0].trim();
        console.log('PoliticianTradeCandlestickChart: Fetching for ticker:', cleanTicker, 'original:', ticker);
        
        // Get date range from trades
        const tradeDates = trades.map(t => new Date(t.traded_at));
        if (tradeDates.length === 0) {
          console.log('PoliticianTradeCandlestickChart: No valid trade dates');
          setLoading(false);
          return;
        }
        
        const minDate = new Date(Math.min(...tradeDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...tradeDates.map(d => d.getTime())));
        
        // Extend range by 30 days on each side
        minDate.setDate(minDate.getDate() - 30);
        maxDate.setDate(maxDate.getDate() + 30);

        const startDate = minDate.toISOString().split('T')[0];
        const endDate = maxDate.toISOString().split('T')[0];

        // Try database first (but don't fail if DB is unavailable)
        console.log('PoliticianTradeCandlestickChart: Fetching from database...');
        try {
          const response = await fetch(
            `/api/price-history/${encodeURIComponent(cleanTicker)}?startDate=${startDate}&endDate=${endDate}`
          );
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.data && result.data.length > 0) {
              console.log('PoliticianTradeCandlestickChart: Found', result.data.length, 'records in database');
              setPriceData(result.data);
              setLoading(false);
              return;
            }
          } else {
            console.log('PoliticianTradeCandlestickChart: Database API returned error, will try Yahoo Finance');
          }
        } catch (dbError) {
          console.log('PoliticianTradeCandlestickChart: Database error (will try Yahoo Finance):', dbError);
        }
        
        console.log('PoliticianTradeCandlestickChart: No database data, trying Yahoo Finance...');
        
        // Fallback: Fetch from Yahoo Finance API via proxy if no database data
        try {
          const period1 = Math.floor(minDate.getTime() / 1000);
          const period2 = Math.floor(maxDate.getTime() / 1000);
          console.log('PoliticianTradeCandlestickChart: Fetching from Yahoo Finance:', {
            ticker: cleanTicker,
            period1,
            period2,
            dateRange: `${startDate} to ${endDate}`
          });
          
          const yahooResponse = await fetch(
            `/api/yahoo-price/${encodeURIComponent(cleanTicker)}?period1=${period1}&period2=${period2}`
          ).catch(fetchError => {
            console.error('PoliticianTradeCandlestickChart: Fetch error:', fetchError);
            throw fetchError;
          });
          
          console.log('PoliticianTradeCandlestickChart: Yahoo Finance response status:', yahooResponse.status);
          
          if (!yahooResponse.ok) {
            let errorText = '';
            try {
              errorText = await yahooResponse.text();
            } catch (e) {
              errorText = 'Could not read error response';
            }
            console.error('PoliticianTradeCandlestickChart: Yahoo Finance API failed:', {
              status: yahooResponse.status,
              statusText: yahooResponse.statusText,
              body: errorText
            });
            setLoading(false);
            return; // Don't throw, just stop loading
          }
          
          const yahooData = await yahooResponse.json();
          console.log('PoliticianTradeCandlestickChart: Yahoo Finance data received:', {
            hasChart: !!yahooData.chart,
            hasResult: !!yahooData.chart?.result,
            resultCount: yahooData.chart?.result?.length || 0
          });
          
          if (yahooData.chart?.result?.[0]) {
            const chartResult = yahooData.chart.result[0];
            const timestamps = chartResult.timestamp || [];
            const quotes = chartResult.indicators?.quote?.[0] || {};
            
            console.log('PoliticianTradeCandlestickChart: Processing Yahoo data:', {
              timestampCount: timestamps.length,
              hasQuotes: !!quotes,
              hasClose: !!quotes.close
            });
            
            const formatted: PriceData[] = timestamps
              .map((ts: number, i: number) => {
                const close = quotes.close?.[i];
                const open = quotes.open?.[i] || close;
                const high = quotes.high?.[i] || close;
                const low = quotes.low?.[i] || close;
                
                if (!close || close === 0) return null;
                
                return {
                  date: new Date(ts * 1000).toISOString().split('T')[0],
                  open: open || null,
                  high: high || null,
                  low: low || null,
                  close: close,
                  volume: quotes.volume?.[i] || null,
                };
              })
              .filter((d: PriceData | null): d is PriceData => d !== null);
            
            if (formatted.length > 0) {
              console.log('PoliticianTradeCandlestickChart: Found', formatted.length, 'records from Yahoo Finance');
              setPriceData(formatted);
            } else {
              console.log('PoliticianTradeCandlestickChart: No valid data from Yahoo Finance after filtering');
            }
          } else {
            console.log('PoliticianTradeCandlestickChart: Yahoo Finance returned no chart data:', yahooData);
          }
        } catch (yahooError) {
          console.error('PoliticianTradeCandlestickChart: Error fetching from Yahoo Finance:', yahooError);
          if (yahooError instanceof Error) {
            console.error('PoliticianTradeCandlestickChart: Error details:', yahooError.message, yahooError.stack);
          }
          // Set loading to false even on error so UI shows error state
          setLoading(false);
        }
      } catch (error) {
        console.error('PoliticianTradeCandlestickChart: Error in fetchPriceHistory:', error);
        setLoading(false);
      }
    };

    fetchPriceHistory();

    fetchPriceHistory();
  }, [ticker, trades]);

  // Calculate chart dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = 500;
        setChartDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || priceData.length === 0 || chartDimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = chartDimensions.width;
    canvas.height = chartDimensions.height;

    const padding = { top: 40, right: 40, bottom: 80, left: 60 };
    setChartPadding(padding);
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find price range
    const prices = priceData.flatMap(d => [
      d.high || d.close,
      d.low || d.close,
      d.open || d.close,
      d.close,
    ]).filter((p): p is number => p !== null);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.1;

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, chartWidth / priceData.length * 0.6);
    const spacing = chartWidth / priceData.length;

    const markers: TradeMarker[] = [];

    priceData.forEach((data, index) => {
      const x = padding.left + index * spacing + spacing / 2;
      const open = data.open ?? data.close;
      const high = data.high ?? data.close;
      const low = data.low ?? data.close;
      const close = data.close;

      // Calculate Y positions
      const openY = padding.top + chartHeight - ((open - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
      const highY = padding.top + chartHeight - ((high - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
      const lowY = padding.top + chartHeight - ((low - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
      const closeY = padding.top + chartHeight - ((close - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;

      // Draw wick
      ctx.strokeStyle = close >= open ? '#10B981' : '#EF4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      ctx.fillStyle = close >= open ? '#10B981' : '#EF4444';
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Check for trades on this date
      const dateStr = data.date;
      const dayTrades = trades.filter(t => {
        const tradeDate = new Date(t.traded_at).toISOString().split('T')[0];
        return tradeDate === dateStr;
      });

      if (dayTrades.length > 0) {
        // Store marker positions with offset for multiple trades on same day
        dayTrades.forEach((trade, tradeIndex) => {
          const offsetX = dayTrades.length > 1 
            ? (tradeIndex - (dayTrades.length - 1) / 2) * 15 // Spread markers horizontally
            : 0;
          markers.push({
            trade,
            date: dateStr,
            x: x + offsetX,
            y: lowY, // Position at bottom of candle
          });
        });
      }
    });

    setTradeMarkers(markers);

    // Draw Y-axis labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding.top + (chartHeight / 5) * i;
      ctx.fillText(`$${price.toFixed(2)}`, padding.left - 10, y + 4);
    }

    // Draw X-axis labels (dates)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9CA3AF';
    const dateStep = Math.max(1, Math.floor(priceData.length / 5));
    for (let i = 0; i < priceData.length; i += dateStep) {
      const x = padding.left + i * spacing + spacing / 2;
      const date = new Date(priceData[i].date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.fillText(dateStr, x, canvas.height - padding.bottom + 20);
    }
    // Last date
    if (priceData.length > 0) {
      const lastIndex = priceData.length - 1;
      const x = padding.left + lastIndex * spacing + spacing / 2;
      const date = new Date(priceData[lastIndex].date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.fillText(dateStr, x, canvas.height - padding.bottom + 20);
    }
  }, [priceData, chartDimensions, trades]);

  const handleMarkerClick = (marker: TradeMarker, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTrade({
      trade: marker.trade,
      x: marker.x,
      y: marker.y,
    });
  };

  const handleCloseModal = () => {
    setSelectedTrade(null);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading chart...</p>
        <p className="text-gray-500 text-sm mt-2">Ticker: {ticker} | Trades: {trades?.length || 0}</p>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <p className="text-gray-400">No trades available for this issuer</p>
        <p className="text-gray-500 text-sm mt-2">Ticker: {ticker} | Trades count: {trades?.length || 0}</p>
      </div>
    );
  }

  if (priceData.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
        <p className="text-gray-400">No price data available for {ticker}</p>
        <p className="text-gray-500 text-sm mt-2">Tried to fetch from database and Yahoo Finance</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Price Chart - {issuerName} ({ticker})
      </h2>
      
      <div ref={containerRef} className="relative w-full" style={{ height: '500px' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: 'crosshair' }}
        />
        
        {/* Trade markers with profile images */}
        {tradeMarkers.map((marker, index) => {
          // Calculate bottom position (where date labels are)
          const bottomY = chartDimensions.height - chartPadding.bottom;
          const lineHeight = bottomY - marker.y;

          return (
            <div
              key={`${marker.trade.id}-${index}`}
              className="absolute cursor-pointer z-10 group"
              style={{
                left: `${marker.x}px`,
                top: `${marker.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={(e) => handleMarkerClick(marker, e)}
            >
              {/* Line connecting to bottom */}
              <div
                className="absolute w-px bg-blue-400 opacity-50"
                style={{
                  height: `${lineHeight}px`,
                  top: '50%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              />
              
              {/* Profile image */}
              <div className="relative w-10 h-10 rounded-full border-2 border-blue-400 bg-gray-800 overflow-hidden shadow-lg hover:scale-110 transition-transform z-10">
                <PoliticianProfileImage
                  politicianId={marker.trade.politician.id}
                  politicianName={marker.trade.politician.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {marker.trade.politician.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trade details modal */}
      {selectedTrade && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Trade Details</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Politician info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-blue-400 bg-gray-700 overflow-hidden flex-shrink-0">
                  <PoliticianProfileImage
                    politicianId={selectedTrade.trade.politician.id}
                    politicianName={selectedTrade.trade.politician.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {selectedTrade.trade.politician.name}
                  </p>
                  {selectedTrade.trade.politician.party && (
                    <p className="text-gray-400 text-sm">
                      {selectedTrade.trade.politician.party}
                      {selectedTrade.trade.politician.chamber && ` • ${selectedTrade.trade.politician.chamber}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Trade details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Filled Date:</span>
                  <span className="text-white">
                    {new Date(selectedTrade.trade.traded_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span
                    className={`font-semibold ${
                      selectedTrade.trade.type === 'buy'
                        ? 'text-green-400'
                        : selectedTrade.trade.type === 'sell'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {selectedTrade.trade.type === 'buy'
                      ? 'Buy'
                      : selectedTrade.trade.type === 'sell'
                      ? 'Sell'
                      : 'Exchange'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">
                    {selectedTrade.trade.size_min && selectedTrade.trade.size_max
                      ? `$${selectedTrade.trade.size_min}K - $${selectedTrade.trade.size_max}K`
                      : selectedTrade.trade.size_max
                      ? `$${selectedTrade.trade.size_max}K`
                      : selectedTrade.trade.price
                      ? `$${selectedTrade.trade.price.toLocaleString()}`
                      : 'N/A'}
                  </span>
                </div>

                {selectedTrade.trade.published_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Published:</span>
                    <span className="text-white">
                      {new Date(selectedTrade.trade.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

