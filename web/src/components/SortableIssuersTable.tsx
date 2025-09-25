'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MobileOptimizedTable from './MobileOptimizedTable';

interface Issuer {
  id: string;
  name: string;
  ticker: string;
  trades: number;
  politicians: number;
  volume: string;
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
      render: (value: any, row: any) => (
        <Link 
          href={`/issuers/${row.id}`}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          {String(value)}
        </Link>
      )
    },
    { key: 'ticker', label: '代碼', sortable: false, priority: 'high' as const },
    { key: 'trades', label: '交易次數', sortable: true, priority: 'medium' as const },
    { key: 'politicians', label: '政治家', sortable: true, priority: 'medium' as const },
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
      mobileCardSubtitle={(row) => `${row.ticker ? `$${row.ticker}` : '無代碼'} • ${row.trades} 筆交易`}
    />
  );
}

