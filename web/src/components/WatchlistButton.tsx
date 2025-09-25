'use client';

import { useState } from 'react';

interface WatchlistButtonProps {
  politicianId: string;
  initialInWatchlist?: boolean;
}

export default function WatchlistButton({ politicianId, initialInWatchlist = false }: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState<boolean>(initialInWatchlist);
  const [loading, setLoading] = useState<boolean>(false);

  async function toggleWatchlist() {
    if (loading) return;
    setLoading(true);
    try {
      const method = inWatchlist ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ politicianId })
      });
      if (!res.ok) throw new Error('Failed');
      setInWatchlist(!inWatchlist);
    } catch {
      // no-op for now
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      aria-label={inWatchlist ? '移除觀察名單' : '加入觀察名單'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm border transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 ${inWatchlist ? 'bg-green-600 hover:bg-green-500 text-white border-green-500' : 'bg-white hover:bg-purple-50 text-purple-700 border-gray-200'}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2"><span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> 處理中…</span>
      ) : inWatchlist ? (
        <span className="inline-flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.034a1 1 0 00-1.176 0l-2.802 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z"/></svg>
          已在觀察名單
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6.32 2.577A49.255 49.255 0 0112 2c1.928 0 3.83.12 5.68.577a3.75 3.75 0 012.743 2.743C20.88 7.17 21 9.072 21 11c0 1.928-.12 3.83-.577 5.68a3.75 3.75 0 01-2.743 2.743A49.255 49.255 0 0112 20a49.255 49.255 0 01-5.68-.577 3.75 3.75 0 01-2.743-2.743A49.255 49.255 0 013 11c0-1.928.12-3.83.577-5.68a3.75 3.75 0 012.743-2.743z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          加入觀察名單
        </span>
      )}
    </button>
  );
}


