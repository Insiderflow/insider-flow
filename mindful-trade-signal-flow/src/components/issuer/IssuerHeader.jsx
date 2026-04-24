import React from 'react';
import { Bookmark, BookmarkCheck, ArrowLeft, Globe } from 'lucide-react';

const SECTOR_COLORS = {
  Technology: 'bg-blue-500/10 text-blue-400',
  Healthcare: 'bg-green-500/10 text-green-400',
  Finance: 'bg-yellow-500/10 text-yellow-400',
  Energy: 'bg-orange-500/10 text-orange-400',
  Defense: 'bg-red-500/10 text-red-400',
  Consumer: 'bg-purple-500/10 text-purple-400',
};

export default function IssuerHeader({ ticker, companyName, sector, country, isWatched, onWatch, onBack }) {
  const sectorStyle = SECTOR_COLORS[sector] || 'bg-secondary text-muted-foreground';

  return (
    <div className="px-4 pt-4 pb-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="flex items-start gap-4">
        {/* Ticker avatar */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="font-mono font-bold text-primary text-lg">{ticker?.slice(0, 4)}</span>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate mb-0.5">{companyName || ticker}</h1>
          <p className="font-mono text-sm text-muted-foreground mb-2">{ticker}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {sector && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sectorStyle}`}>
                {sector}
              </span>
            )}
            {country && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                <Globe className="h-2.5 w-2.5" />
                {country}
              </span>
            )}
          </div>
        </div>

        {/* Watch toggle */}
        <button
          onClick={onWatch}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
            isWatched
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'bg-secondary text-muted-foreground border-border/50 hover:border-border'
          }`}
        >
          {isWatched
            ? <><BookmarkCheck className="h-3.5 w-3.5" /> Watching</>
            : <><Bookmark className="h-3.5 w-3.5" /> Watch</>
          }
        </button>
      </div>
    </div>
  );
}