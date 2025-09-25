"use client";
import ResponsiveTable from './ResponsiveTable';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface PoliticianTradeRow {
  issuer: string;
  issuerId: string;
  ticker: string;
  published: string;
  traded: string;
  type: string;
  size: string;
}

interface PoliticianTradesTableProps {
  data: PoliticianTradeRow[];
  politicianId: string;
  currentSort?: string;
  currentOrder?: string;
}

export default function PoliticianTradesTable({ data, politicianId, currentSort, currentOrder }: PoliticianTradesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (key: string) => {
    const params = new URLSearchParams(searchParams);
    
    // Map table column keys to database sort keys
    const sortKeyMap: Record<string, string> = {
      'traded': 'tradedAt',
      'published': 'publishedAt',
      'size': 'sizeMax',
      'issuer': 'issuer',
      'type': 'type'
    };
    
    const dbSortKey = sortKeyMap[key] || key;
    
    // Toggle order if clicking the same column, otherwise default to desc
    const newOrder = currentSort === dbSortKey && currentOrder === 'desc' ? 'asc' : 'desc';
    
    params.set('sort', dbSortKey);
    params.set('order', newOrder);
    params.set('page', '1'); // Reset to first page when sorting
    
    router.push(`/politicians/${politicianId}?${params.toString()}`);
  };

  return (
    <ResponsiveTable
      columns={[
        { 
          key: 'issuer', 
          label: '發行商',
          sortable: true,
          render: (value, row) => (
            <Link 
              href={`/issuers/${row.issuerId}`}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {String(value)}
            </Link>
          )
        },
        { key: 'ticker', label: '代碼', sortable: false },
        { key: 'published', label: '發布日期', sortable: true },
        { key: 'traded', label: '交易日期', sortable: true },
        { key: 'type', label: '類型', sortable: true },
        { key: 'size', label: '金額', sortable: true },
      ]}
      data={data}
      onSort={handleSort}
      sortKey={currentSort}
      sortOrder={currentOrder as 'asc' | 'desc'}
    />
  );
}
