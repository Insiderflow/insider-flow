"use client";
import ResponsiveTable from './ResponsiveTable';
import Link from 'next/link';
import { textLinkStyles } from './linkStyles';

interface IssuerRow {
  id: string;
  name: string;
  ticker: string;
  trades: number;
  politicians: number;
  volume: string;
}

interface IssuersTableProps {
  data: IssuerRow[];
}

export default function IssuersTable({ data }: IssuersTableProps) {
  return (
      <ResponsiveTable<IssuerRow>
      columns={[
        { 
          key: 'name', 
          label: 'Name',
          render: (value, row) => (
            <Link 
              href={`/issuers/${row.id}`}
              className={textLinkStyles('muted')}
            >
              {String(value)}
            </Link>
          )
        },
        { key: 'ticker', label: 'Ticker' },
        { key: 'trades', label: 'Trades' },
        { key: 'politicians', label: 'Politicians' },
        { key: 'volume', label: 'Volume (proxy)' },
      ]}
      data={data}
    />
  );
}
