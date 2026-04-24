import React from 'react';
import { Bookmark, BookmarkCheck, ArrowLeft, AlertTriangle } from 'lucide-react';

const PARTY_COLORS = {
  Democrat: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Republican: 'bg-red-500/15 text-red-400 border-red-500/20',
  Independent: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

export default function PoliticianProfileHeader({ politician, isWatched, onWatch, onBack }) {
  const partyStyle = PARTY_COLORS[politician?.party] || 'bg-secondary text-muted-foreground border-border';

  return (
    <div className="px-4 pt-4 pb-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
          {politician?.avatar_url ? (
            <img src={politician.avatar_url} alt={politician.politician_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {politician?.politician_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
            </span>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold leading-tight truncate">{politician?.politician_name}</h1>
            {politician?.notable && <AlertTriangle className="h-4 w-4 text-warning-color flex-shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {[politician?.chamber, politician?.state].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {politician?.party && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${partyStyle}`}>
                {politician.party}
              </span>
            )}
            {politician?.committees && (
              <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {politician.committees}
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