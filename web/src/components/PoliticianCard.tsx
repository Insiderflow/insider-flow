'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import HomePoliticianImage from '@/components/HomePoliticianImage';
import WatchlistButton from '@/components/WatchlistButton';

const MiniPortfolioChart = dynamic(() => import('@/components/MiniPortfolioChart'), {
  ssr: false,
  loading: () => <div className="h-20 w-full animate-pulse rounded-lg bg-gray-900/80" aria-hidden />,
});

export type PoliticianCardPolitician = {
  id: string;
  name: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  trades: number;
  issuers: number;
  totalVolume: number;
  lastTraded: Date | null;
};

function partyLabelZh(party: string | null): string {
  if (!party) return '—';
  const u = party.toLowerCase();
  if (u.includes('democrat')) return '民主黨';
  if (u.includes('republican')) return '共和黨';
  if (u.includes('independent')) return '獨立';
  return party;
}

function chamberLabelZh(chamber: string | null): string {
  if (!chamber) return '';
  const u = chamber.toLowerCase();
  if (u === 'house' || u.includes('house')) return '眾議院';
  if (u === 'senate' || u.includes('senate')) return '參議院';
  return chamber;
}

interface PoliticianCardProps {
  politician: PoliticianCardPolitician;
  detailHref: string;
  userId?: string | null;
  initialInWatchlist?: boolean;
  showWatchlistButton?: boolean;
}

export default function PoliticianCard({
  politician,
  detailHref,
  userId,
  initialInWatchlist = false,
  showWatchlistButton = true,
}: PoliticianCardProps) {
  const metaLine = [partyLabelZh(politician.party), chamberLabelZh(politician.chamber), politician.state || '']
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-600 bg-gray-800 shadow-md transition-shadow duration-200 hover:border-amber-500/35 hover:shadow-lg">
      <div className={`h-1.5 ${politician.party === 'Republican' ? 'bg-red-500' : politician.party === 'Democrat' ? 'bg-blue-500' : 'bg-gray-500'}`} />

      <Link href={detailHref} className="block p-4 pb-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800">
        <div className="flex gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-600 bg-gray-700">
            <HomePoliticianImage politicianId={politician.id} politicianName={politician.name} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-white hover:text-blue-300">{politician.name}</h3>
            <p className="mt-0.5 truncate text-xs text-gray-400">{metaLine || '—'}</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-gray-900/90 px-2 py-2">
            <dt className="text-[11px] text-gray-500">
              <span className="zh-Hant">交易筆數</span>
              <span className="zh-Hans hidden">交易笔数</span>
            </dt>
            <dd className="font-semibold text-white">{politician.trades.toLocaleString('zh-TW')}</dd>
          </div>
          <div className="rounded-lg bg-gray-900/90 px-2 py-2">
            <dt className="text-[11px] text-gray-500">
              <span className="zh-Hant">涉及公司</span>
              <span className="zh-Hans hidden">涉及公司</span>
            </dt>
            <dd className="font-semibold text-white">{politician.issuers.toLocaleString('zh-TW')}</dd>
          </div>
          <div className="col-span-2 rounded-lg bg-gray-900/90 px-2 py-2">
            <dt className="text-[11px] text-gray-500">
              <span className="zh-Hant">成交量（估算）</span>
              <span className="zh-Hans hidden">成交量（估算）</span>
            </dt>
            <dd className="font-semibold text-emerald-200/95">
              US${Math.round(politician.totalVolume).toLocaleString('zh-TW')}
            </dd>
          </div>
        </dl>

        <div className="mt-3 border-t border-gray-700/80 pt-3">
          <p className="text-[11px] text-gray-500">
            <span className="zh-Hant">最後交易</span>
            <span className="zh-Hans hidden">最后交易</span>
          </p>
          <p className="text-sm font-medium text-white">
            {politician.lastTraded
              ? new Date(politician.lastTraded).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </Link>

      <div className="border-t border-gray-700/80 px-3 pb-2 pt-2">
        <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-500">
          <span className="zh-Hant">vs S&amp;P 500（近月）</span>
          <span className="zh-Hans hidden">vs S&amp;P 500（近月）</span>
        </p>
        <MiniPortfolioChart politician={politician.name} className="min-h-[5.5rem]" />
      </div>

      {showWatchlistButton ? (
        <div className="border-t border-gray-700/80 p-3 pt-2">
          <WatchlistButton
            type="politician"
            politicianId={politician.id}
            userId={userId ?? undefined}
            initialWatching={initialInWatchlist}
            variant="cta"
            registerNextPath={`/politicians/${politician.id}`}
            className="w-full justify-center"
          />
        </div>
      ) : null}
    </article>
  );
}
