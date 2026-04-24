"use client";
import ResponsiveTable from './ResponsiveTable';
import Link from 'next/link';
import { textLinkStyles } from './linkStyles';

interface IssuerTradeRow {
  politician: string;
  politicianId: string;
  party: string;
  published: string;
  traded: string;
  type: string;
  size: string;
}

interface IssuerTradesTableProps {
  data: IssuerTradeRow[];
}

export default function IssuerTradesTable({ data }: IssuerTradesTableProps) {
  return (
    <ResponsiveTable
      columns={[
        { 
          key: 'politician', 
          label: '政治家',
          render: (value, row) => (
            <Link 
              href={`/politicians/${row.politicianId}`}
              className={textLinkStyles('muted')}
            >
              {String(value)}
            </Link>
          )
        },
        { key: 'party', label: '黨派' },
        { key: 'published', label: '發布日期' },
        { key: 'traded', label: '交易日期' },
        { key: 'type', label: '類型' },
        { key: 'size', label: '金額' },
      ]}
      data={data}
    />
  );
}
