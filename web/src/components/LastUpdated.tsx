"use client";

import { useState, useEffect } from 'react';

interface LastUpdatedProps {
  timestamp: Date | string;
  className?: string;
  showRelative?: boolean;
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
      
      if (diffInSeconds < 60) {
        setRelativeTime('剛剛更新');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setRelativeTime(`${minutes} 分鐘前更新`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setRelativeTime(`${hours} 小時前更新`);
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        setRelativeTime(`${days} 天前更新`);
      } else {
        setRelativeTime(date.toLocaleDateString('zh-TW'));
      }
    };

    updateRelativeTime();
    
    // Update every minute
    const interval = setInterval(updateRelativeTime, 60000);
    
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!isClient) {
    return (
      <div className={className}>
        <span className="zh-Hant">載入中...</span>
        <span className="zh-Hans hidden">加载中...</span>
      </div>
    );
  }

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
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        setFreshness('fresh');
      } else if (diffInHours < 168) { // 1 week
        setFreshness('stale');
      } else {
        setFreshness('old');
      }
    };

    updateFreshness();
    
    // Update every hour
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

  const getText = () => {
    switch (freshness) {
      case 'fresh': return '數據新鮮';
      case 'stale': return '數據較舊';
      case 'old': return '數據過時';
      default: return '未知';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getColor().replace('text-', 'bg-')}`}></div>
      <span className={`text-xs ${getColor()}`}>
        <span className="zh-Hant">{getText()}</span>
        <span className="zh-Hans hidden">{getText()}</span>
      </span>
    </div>
  );
}
