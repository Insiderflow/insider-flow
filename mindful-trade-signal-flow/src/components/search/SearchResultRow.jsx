import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import TradeBadge from '@/components/insider/TradeBadge';

const TYPE_CONFIG = {
  politician: {
    badge: 'bg-purple-500/10 text-purple-400',
    label: 'Politician',
    emoji: '🏛',
  },
  issuer: {
    badge: 'bg-primary/10 text-primary',
    label: 'Stock',
    emoji: '📈',
  },
  trade: {
    badge: 'bg-secondary text-muted-foreground',
    label: 'Trade',
    emoji: '🔁',
  },
};

export default function SearchResultRow({ result, onClick }) {
  const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.trade;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 active:bg-secondary/60 transition-colors text-left"
    >
      {/* Icon / avatar */}
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-lg">
        {result.avatar_url
          ? <img src={result.avatar_url} alt={result.title} className="w-full h-full rounded-xl object-cover" />
          : <span>{config.emoji}</span>
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{result.title}</span>
          {result.notable && <AlertTriangle className="h-3 w-3 text-warning-color flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {result.trade_type
          ? <TradeBadge type={result.trade_type} />
          : <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>{config.label}</span>
        }
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}