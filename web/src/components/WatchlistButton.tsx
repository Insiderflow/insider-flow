'use client';

import { useState, useEffect } from 'react';

interface WatchlistButtonProps {
  userId?: string;
  type: 'politician' | 'company' | 'owner' | 'stock';
  politicianId?: string;
  companyId?: string;
  ownerId?: string;
  ticker?: string;
  className?: string;
}

export default function WatchlistButton({ 
  userId, 
  type, 
  politicianId, 
  companyId, 
  ownerId, 
  ticker,
  className = '' 
}: WatchlistButtonProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Detect login via session-based API (200 -> logged in, 401 -> not logged in)
    const checkAuth = async () => {
      try {
        const params = new URLSearchParams({ type });
        if (politicianId) params.set('politicianId', politicianId);
        if (companyId) params.set('companyId', companyId);
        if (ownerId) params.set('ownerId', ownerId);
        if (ticker) params.set('ticker', ticker);

        const res = await fetch(`/api/watchlist?${params.toString()}`);
        if (res.status === 200) {
          setIsLoggedIn(true);
          const data = await res.json();
          setIsWatching(data.watchlist && data.watchlist.length > 0);
        } else if (res.status === 401) {
          setIsLoggedIn(false);
        } else {
          // treat non-401 as logged in but no items
          setIsLoggedIn(true);
        }
      } catch (_e) {
        setIsLoggedIn(false);
      }
    };
    
    checkAuth();
  }, [userId]);

  const checkWatchlistStatus = async () => {
    try {
      const params = new URLSearchParams({ type });
      if (politicianId) params.set('politicianId', politicianId);
      if (companyId) params.set('companyId', companyId);
      if (ownerId) params.set('ownerId', ownerId);
      if (ticker) params.set('ticker', ticker);

      const response = await fetch(`/api/watchlist?${params.toString()}`);
      if (response.status !== 200) return;
      const data = await response.json();
      setIsWatching(data.watchlist && data.watchlist.length > 0);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!isLoggedIn) {
      alert('Please log in to add items to your watchlist');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isWatching) {
        // Remove from watchlist
        const params = new URLSearchParams({ type });
        if (politicianId) params.set('politicianId', politicianId);
        if (companyId) params.set('companyId', companyId);
        if (ownerId) params.set('ownerId', ownerId);
        if (ticker) params.set('ticker', ticker);

        await fetch(`/api/watchlist?${params}`, { method: 'DELETE' });
        setIsWatching(false);
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            politicianId,
            companyId,
            ownerId,
            ticker,
          }),
        });

        if (response.ok) {
          setIsWatching(true);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to add to watchlist');
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => alert('Please log in to add items to your watchlist')}
        className={`inline-flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors duration-200 ${className}`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="zh-Hant">加入關注</span>
        <span className="zh-Hans hidden">加入关注</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleWatchlist}
      disabled={isLoading}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isWatching
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="zh-Hant">處理中...</span>
          <span className="zh-Hans hidden">处理中...</span>
        </>
      ) : isWatching ? (
        <>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span className="zh-Hant">已關注</span>
          <span className="zh-Hans hidden">已关注</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="zh-Hant">加入關注</span>
          <span className="zh-Hans hidden">加入关注</span>
        </>
      )}
    </button>
  );
}