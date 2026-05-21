"use client";

import { useState, useEffect } from 'react';

interface LastUpdatedProps {
  timestamp: Date | string;
  className?: string;
  showRelative?: boolean;
}

function isKoLocale(): boolean {
  if (typeof document === 'undefined') return false;
  return document.body.classList.contains('language-ko');
}

export default function LastUpdated({ 
  timestamp, 
  className = "text-xs text-gray-400",
  showRelative = true 
}: LastUpdatedProps) {
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const updateRelativeTime = () => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      const ko = isKoLocale();
      
      if (diffInSeconds < 60) {
        setRelativeTime(ko ? '방금 업데이트' : '剛剛更新');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setRelativeTime(ko ? `${minutes}분 전 업데이트` : `${minutes} 分鐘前更新`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setRelativeTime(ko ? `${hours}시간 전 업데이트` : `${hours} 小時前更新`);
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        setRelativeTime(ko ? `${days}일 전 업데이트` : `${days} 天前更新`);
      } else {
        setRelativeTime(date.toLocaleDateString(ko ? 'ko-KR' : 'zh-TW'));
      }
    };

    updateRelativeTime();
    
    const interval = setInterval(updateRelativeTime, 60000);
    
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!isClient) {
    return (
      <div className={className}>
        <span className="zh-Hant">載入中...</span>
        <span className="zh-Hans hidden">加载中...</span>
        <span className="ko hidden">로딩 중...</span>
      </div>
    );
  }

  const absTime = new Date(timestamp).toLocaleString(
    isKoLocale() ? 'ko-KR' : document.body.classList.contains('language-zh-Hans') ? 'zh-CN' : 'zh-TW',
  );

  return (
    <div className={className}>
      <span className="zh-Hant">
        <span className="text-gray-500">最後更新：</span>
        {showRelative ? relativeTime : new Date(timestamp).toLocaleString('zh-TW')}
      </span>
      <span className="zh-Hans hidden">
        <span className="text-gray-500">最后更新：</span>
        {showRelative ? relativeTime : new Date(timestamp).toLocaleString('zh-CN')}
      </span>
      <span className="ko hidden">
        <span className="text-gray-500">최종 업데이트:</span>
        {showRelative ? relativeTime : absTime}
      </span>
    </div>
  );
}

// Component for showing data freshness with color coding
export function DataFreshnessIndicator({ timestamp, className = "" }: { timestamp: Date | string; className?: string }) {
  const [freshness, setFreshness] = useState<'fresh' | 'stale' | 'old'>('fresh');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const updateFreshness = () => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

      if (diffInDays < 7) {
        setFreshness('fresh');
      } else if (diffInDays < 21) {
        setFreshness('stale');
      } else {
        setFreshness('old');
      }
    };

    updateFreshness();
    
    const interval = setInterval(updateFreshness, 3600000);
    
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!isClient) return null;

  const getColor = () => {
    switch (freshness) {
      case 'fresh': return 'text-green-400';
      case 'stale': return 'text-yellow-400';
      case 'old': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getText = (locale: 'hant' | 'hans' | 'ko') => {
    const map = {
      fresh: { hant: '數據新鮮', hans: '数据新鲜', ko: '데이터 최신' },
      stale: { hant: '數據較舊', hans: '数据较旧', ko: '데이터 다소 오래됨' },
      old: { hant: '數據過時', hans: '数据过时', ko: '데이터 오래됨' },
    } as const;
    const row = map[freshness] ?? { hant: '未知', hans: '未知', ko: '알 수 없음' };
    return row[locale];
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getColor().replace('text-', 'bg-')}`}></div>
      <span className={`text-xs ${getColor()}`}>
        <span className="zh-Hant">{getText('hant')}</span>
        <span className="zh-Hans hidden">{getText('hans')}</span>
        <span className="ko hidden">{getText('ko')}</span>
      </span>
    </div>
  );
}
