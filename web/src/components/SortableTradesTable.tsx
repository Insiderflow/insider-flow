'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileOptimizedTable from './MobileOptimizedTable';

interface Trade {
  id: string;
  politician: React.ReactNode;
  issuer: React.ReactNode;
  publishedAt: string;
  tradedAt: string;
  filedAfterDays: string | number;
  owner: string;
  type: React.ReactNode;
  size: string;
  price: string;
}

interface SortableTradesTableProps {
  trades: Trade[];
}

export default function SortableTradesTable({ trades }: SortableTradesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState(searchParams.get('sort') || 'tradedAt');
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
    
    router.push(`/trades?${params.toString()}`);
  };

  const columns = [
    { key: 'politician', label: '政治家', sortable: false, priority: 'high' as const },
    { key: 'issuer', label: '發行商', sortable: false, priority: 'high' as const },
    { key: 'tradedAt', label: '交易日期', sortable: true, priority: 'high' as const },
    { key: 'type', label: '類型', sortable: false, priority: 'medium' as const },
    { key: 'size', label: '金額', sortable: true, priority: 'medium' as const },
    { key: 'publishedAt', label: '發布日期', sortable: true, priority: 'low' as const },
    { key: 'filedAfterDays', label: '申報延遲', sortable: true, priority: 'low' as const },
    { key: 'owner', label: '持有人', sortable: false, priority: 'low' as const },
    { key: 'price', label: '價格', sortable: true, priority: 'low' as const },
  ];

  return (
    <MobileOptimizedTable
      columns={columns}
      data={trades}
      onSort={handleSort}
      sortKey={sortKey}
      sortOrder={sortOrder}
      mobileCardTitle={(row) => `${row.politician} → ${row.issuer}`}
      mobileCardSubtitle={(row) => `${row.tradedAt} • ${row.type}`}
    />
  );
}

