'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { toggleWatchlistAction } from '@/actions/watchlist';

interface WatchlistButtonProps {
  userId?: string;
  type: 'politician' | 'company' | 'owner' | 'stock';
  politicianId?: string;
  companyId?: string;
  ownerId?: string;
  ticker?: string;
  className?: string;
  initialWatching?: boolean;
  /** 醒目轉換用：全寬按鈕 + 註冊導向 */
  variant?: 'default' | 'cta';
  /** 未登入時 `/register?next=` 參數（應為已 encode 或可安全拼接的路徑） */
  registerNextPath?: string;
}

export default function WatchlistButton({
  userId,
  type,
  politicianId,
  companyId,
  ownerId,
  ticker,
  className = '',
  initialWatching = false,
  variant = 'default',
  registerNextPath = '/politicians',
}: WatchlistButtonProps) {
  const [isWatching, setIsWatching] = useState(initialWatching);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsWatching(initialWatching);
  }, [initialWatching]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const params = new URLSearchParams({ type });
        if (politicianId) params.set('politicianId', politicianId);
        if (companyId) params.set('companyId', companyId);
        if (ownerId) params.set('ownerId', ownerId);
        if (ticker) params.set('ticker', ticker);

        if (type === 'politician' && politicianId) {
          setIsLoggedIn(Boolean(userId));
          return;
        }
        const res = await fetch(`/api/watchlist?${params.toString()}`);
        if (res.status === 200) {
          setIsLoggedIn(true);
          const data = await res.json();
          setIsWatching(data.watchlist && data.watchlist.length > 0);
        } else if (res.status === 401) {
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(true);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [userId, companyId, ownerId, politicianId, ticker, type]);

  const registerHref = `/register?next=${encodeURIComponent(registerNextPath)}`;

  const handleToggleWatchlist = async () => {
    if (!isLoggedIn) {
      window.location.href = registerHref;
      return;
    }

    if (type === 'politician' && politicianId) {
      startTransition(async () => {
        const result = await toggleWatchlistAction({ politicianId });
        if (!result.ok) {
          alert(result.error || '操作失敗');
          return;
        }
        setIsWatching(result.watching);
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isWatching) {
        const params = new URLSearchParams({ type });
        if (politicianId) params.set('politicianId', politicianId);
        if (companyId) params.set('companyId', companyId);
        if (ownerId) params.set('ownerId', ownerId);
        if (ticker) params.set('ticker', ticker);

        await fetch(`/api/watchlist?${params}`, { method: 'DELETE' });
        setIsWatching(false);
      } else {
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
          alert(error.error || '加入失敗');
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      alert('發生錯誤，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const ctaBase =
    variant === 'cta'
      ? 'inline-flex min-h-[3rem] items-center justify-center rounded-xl px-4 py-3 text-base font-bold shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
      : 'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200';

  if (!isLoggedIn) {
    if (variant === 'cta' && type === 'politician') {
      return (
        <Link
          href={registerHref}
          className={`${ctaBase} bg-emerald-500 text-gray-950 hover:bg-emerald-400 ring-1 ring-emerald-300/40 ${className}`}
        >
          <span className="zh-Hant">追蹤此議員交易通知</span>
          <span className="zh-Hans hidden">追踪此议员交易通知</span>
        </Link>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          window.location.href = registerHref;
        }}
        className={`${ctaBase} bg-gray-600 hover:bg-gray-700 text-white ${className}`}
      >
        <svg className="mr-2 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="zh-Hant">加入關注（免費註冊）</span>
        <span className="zh-Hans hidden">加入关注（免费注册）</span>
      </button>
    );
  }

  const loggedInTone =
    variant === 'cta'
      ? isWatching
        ? 'bg-gray-700 text-white ring-1 ring-gray-500 hover:bg-gray-600'
        : 'bg-amber-500 text-gray-950 hover:bg-amber-400 ring-1 ring-amber-300/50'
      : isWatching
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white';

  const loggedInLayout =
    variant === 'cta'
      ? `${ctaBase} disabled:cursor-not-allowed disabled:opacity-50 ${loggedInTone}`
      : `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${loggedInTone}`;

  return (
    <button
      type="button"
      onClick={handleToggleWatchlist}
      disabled={isLoading || isPending}
      className={`${loggedInLayout} ${className}`}
    >
      {isLoading || isPending ? (
        <>
          <svg className="mr-2 h-4 w-4 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="zh-Hant">處理中…</span>
          <span className="zh-Hans hidden">处理中…</span>
        </>
      ) : isWatching ? (
        variant === 'cta' ? (
          <>
            <span className="zh-Hant">已開啟交易通知</span>
            <span className="zh-Hans hidden">已开启交易通知</span>
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="zh-Hant">已關注</span>
            <span className="zh-Hans hidden">已关注</span>
          </>
        )
      ) : variant === 'cta' ? (
        <>
          <span className="zh-Hant">追蹤此議員交易通知</span>
          <span className="zh-Hans hidden">追踪此议员交易通知</span>
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
