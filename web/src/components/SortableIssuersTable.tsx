'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MobileOptimizedTable from './MobileOptimizedTable';
import { textLinkStyles } from './linkStyles';

interface Issuer {
  id: string;
  name: string;
  ticker: string;
  trades: number;
  politicians: number;
  volume: string;
  price: number | null;
  change30dPct: number | null;
  trend: 'up' | 'down' | 'flat' | 'na';
}

interface SortableIssuersTableProps {
  issuers: Issuer[];
}

export default function SortableIssuersTable({ issuers }: SortableIssuersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState(searchParams.get('sort') || 'trades');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  );

  const handleSort = (key: string) => {
    let newOrder: 'asc' | 'desc' = 'desc';
    
    if (sortKey === key) {
      // Same column clicked - toggle order
      newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      // Different column clicked - default to desc
      newOrder = 'desc';
    }

    setSortKey(key);
    setSortOrder(newOrder);

    // Update URL with new sort parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', key);
    params.set('order', newOrder);
    params.delete('page'); // Reset to first page when sorting
    
    router.push(`/issuers?${params.toString()}`);
  };

  const columns = [
    { 
      key: 'name', 
      label: '名稱', 
      sortable: true,
      priority: 'high' as const,
      render: (value: unknown, row: { id: string }) => (
        <Link 
          href={`/issuers/${row.id}`}
          className={textLinkStyles('muted')}
        >
          {String(value)}
        </Link>
      )
    },
    { key: 'ticker', label: '代碼', sortable: false, priority: 'high' as const },
    { key: 'trades', label: '交易次數', sortable: true, priority: 'high' as const },
    { key: 'politicians', label: '政治家', sortable: true, priority: 'medium' as const },
    {
      key: 'price',
      label: '價格',
      sortable: true,
      priority: 'high' as const,
      render: (value: unknown) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
        return `$${value.toFixed(2)}`;
      },
    },
    {
      key: 'change30dPct',
      label: '30天變化',
      sortable: true,
      priority: 'high' as const,
      render: (value: unknown) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
        const color = value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-300';
        const sign = value > 0 ? '+' : '';
        return <span className={color}>{`${sign}${value.toFixed(2)}%`}</span>;
      },
    },
    {
      key: 'trend',
      label: '走勢',
      sortable: false,
      priority: 'medium' as const,
      render: (value: unknown) => {
        if (value === 'up') return <span className="text-green-400">▲ Up</span>;
        if (value === 'down') return <span className="text-red-400">▼ Down</span>;
        if (value === 'flat') return <span className="text-gray-300">■ Flat</span>;
        return 'N/A';
      },
    },
    { key: 'volume', label: '交易金額', sortable: true, priority: 'low' as const },
  ];

  return (
    <MobileOptimizedTable
      columns={columns}
      data={issuers}
      onSort={handleSort}
      sortKey={sortKey}
      sortOrder={sortOrder}
      mobileCardTitle={(row) => row.name}
      mobileCardSubtitle={(row) => {
        const priceText = typeof row.price === 'number' ? `$${row.price.toFixed(2)}` : 'N/A';
        const changeText = typeof row.change30dPct === 'number'
          ? `${row.change30dPct > 0 ? '+' : ''}${row.change30dPct.toFixed(2)}%`
          : 'N/A';
        return `${row.ticker ? `$${row.ticker}` : '無代碼'} • ${priceText} • 30D ${changeText}`;
      }}
    />
  );
}

