"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import WatchlistButton from './WatchlistButton';
import MiniPortfolioChart from './MiniPortfolioChart';

interface PoliticianCardProps {
  politician: {
    id: string;
    name: string;
    party: string | null;
    chamber: string | null;
    trades: number;
    issuers: number;
    volume: number;
    lastTraded?: Date | null;
  };
  showWatchlistButton?: boolean;
  initialInWatchlist?: boolean;
}

export default function PoliticianCard({ politician, showWatchlistButton = true, initialInWatchlist = false }: PoliticianCardProps) {
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageError = () => {
    setImageError(true);
  };

  // Function to get the correct image filename
  const getImageSrc = () => {
    return getPoliticianImageSrc(politician.id, politician.name);
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Header with party color */}
      <div className={`h-2 ${politician.party === 'Republican' ? 'bg-red-500' : politician.party === 'Democrat' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
      
      {/* Profile section */}
      <div className="p-4 text-center">
        {/* Profile picture */}
        <a href={`/politicians/${politician.id}`} className="block w-16 h-16 mx-auto mb-3 bg-gray-700 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <div className="w-16 h-16">
            {!imageError ? (
              <Image 
                src={getImageSrc()}
                alt={`${politician.name} profile`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {politician.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
          </div>
        </a>
        
        {/* Name */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <a href={`/politicians/${politician.id}`} className="text-white font-semibold text-lg hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
            {politician.name}
          </a>
        </div>
        <p className="text-gray-300 text-sm">
          {politician.party} {politician.chamber && `• ${politician.chamber}`}
        </p>
      </div>
      
      {/* Stats grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-white font-bold text-lg">{politician.trades.toLocaleString()}</div>
            <div className="text-gray-400 text-xs">
              <span className="zh-Hant">交易</span>
              <span className="zh-Hans hidden">交易</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-lg">{politician.issuers.toLocaleString()}</div>
            <div className="text-gray-400 text-xs">
              <span className="zh-Hant">發行商</span>
              <span className="zh-Hans hidden">发行商</span>
            </div>
          </div>
          <div className="text-center col-span-2">
            <div className="text-white font-bold text-lg">
              ${(politician.volume / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-400 text-xs">
              <span className="zh-Hant">交易金額</span>
              <span className="zh-Hans hidden">交易金额</span>
            </div>
          </div>
        </div>
        
        {/* Mini Portfolio Chart */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="mb-2">
            <div className="text-center text-gray-400 text-xs mb-2">
              <span className="zh-Hant">投資組合表現</span>
              <span className="zh-Hans hidden">投资组合表现</span>
            </div>
            <MiniPortfolioChart politician={politician.name} />
          </div>
        </div>
        
        {/* Last trade date */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-center">
            <div className="text-gray-400 text-xs">
              <span className="zh-Hant">最後交易</span>
              <span className="zh-Hans hidden">最后交易</span>
            </div>
            <div className="text-white text-sm font-medium">
              {politician.trades > 0 ? (
                politician.lastTraded ? (
                  mounted ? (
                    new Date(politician.lastTraded).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  ) : (
                    'Loading...'
                  )
                ) : (
                  'Recently'
                )
              ) : (
                'No trades'
              )}
            </div>
          </div>
          {showWatchlistButton && (
            <div className="mt-3 flex justify-center">
              <WatchlistButton politicianId={politician.id} initialInWatchlist={initialInWatchlist} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
