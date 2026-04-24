import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import TradeCard from '@/components/insider/TradeCard';
import SkeletonTradeCard from '@/components/insider/SkeletonTradeCard';
import SegmentedControl from '@/components/insider/SegmentedControl';

const SEGMENTS = [
  { label: 'Politicians', value: 'politician' },
  { label: 'Corporate', value: 'corporate' },
];

export default function RecentActivityFeed({ politicianTrades, corporateTrades, isLoading }) {
  const [activeSegment, setActiveSegment] = React.useState('politician');

  const trades = activeSegment === 'politician' ? politicianTrades : corporateTrades;
  const linkTo = activeSegment === 'politician' ? '/politicians' : '/corporate';

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent Trades</h2>
        <Link to={linkTo} className="flex items-center gap-0.5 text-xs text-primary font-medium">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <SegmentedControl
        options={SEGMENTS}
        value={activeSegment}
        onChange={setActiveSegment}
      />
      <div className="space-y-2">
        {isLoading ? (
          <>
            <SkeletonTradeCard />
            <SkeletonTradeCard />
            <SkeletonTradeCard />
          </>
        ) : (trades || []).slice(0, 5).map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            type={activeSegment}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}