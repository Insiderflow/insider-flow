import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function PoliticianProfileHeader({ politician, sector, isWatched, onWatch, onBack }) {
  const { displaySector, t } = useTranslation();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="px-4 pt-4 pb-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t('back')}</span>
      </button>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
          {politician?.avatar_url && !imageError ? (
            <img
              src={politician.avatar_url}
              alt={politician.politician_name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {politician?.politician_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
            </span>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-ui-title font-bold leading-tight truncate">{politician?.politician_name}</h1>
            {politician?.notable && <AlertTriangle className="h-4 w-4 text-warning-color flex-shrink-0" />}
          </div>
          {sector ? (
            <p className="text-ui-meta mb-2">
              {t('sectorLabel')} {displaySector(sector)}
            </p>
          ) : null}
        </div>

        {/* Watch toggle */}
        <button
          onClick={onWatch}
          className={`flex-shrink-0 tap-button flex items-center gap-1.5 ${
            isWatched
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'bg-secondary text-muted-foreground border-border/50 hover:border-border'
          }`}
        >
          {isWatched
            ? <><BookmarkCheck className="h-3.5 w-3.5" /> {t('watching')}</>
            : <><Bookmark className="h-3.5 w-3.5" /> {t('watch')}</>
          }
        </button>
      </div>
    </div>
  );
}