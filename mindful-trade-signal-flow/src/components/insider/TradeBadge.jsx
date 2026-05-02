import React from 'react';
import { useTranslation } from '@/lib/useTranslation';

export default function TradeBadge({ type, size = 'sm' }) {
  const { t } = useTranslation();
  const isBuy = type === 'Buy';
  const sizeClasses = size === 'lg'
    ? 'px-3 py-1 text-xs'
    : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses} ${
        isBuy
          ? 'bg-buy/10 text-buy'
          : 'bg-sell/10 text-sell'
      }`}
    >
      {isBuy ? `↑ ${t('buy')}` : `↓ ${t('sell')}`}
    </span>
  );
}