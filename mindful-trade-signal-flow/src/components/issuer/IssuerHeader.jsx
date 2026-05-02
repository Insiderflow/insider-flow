import React from 'react';
import { Bookmark, BookmarkCheck, ArrowLeft, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { toEnglishSectorLabel } from '@/lib/i18n';

const SECTOR_COLORS = {
  Technology: 'bg-blue-500/10 text-blue-400',
  Healthcare: 'bg-green-500/10 text-green-400',
  Finance: 'bg-yellow-500/10 text-yellow-400',
  Energy: 'bg-orange-500/10 text-orange-400',
  Defense: 'bg-red-500/10 text-red-400',
  Consumer: 'bg-purple-500/10 text-purple-400',
};

function chipClassForEnglishSector(en) {
  const u = en.toLowerCase();
  if (u.includes('technology') || u.includes('communication')) return SECTOR_COLORS.Technology;
  if (u.includes('health')) return SECTOR_COLORS.Healthcare;
  if (u.includes('financial')) return SECTOR_COLORS.Finance;
  if (u.includes('energy') || u.includes('material')) return SECTOR_COLORS.Energy;
  if (u.includes('industrial')) return SECTOR_COLORS.Defense;
  if (u.includes('consumer') || u.includes('staple') || u.includes('discretionary')) return SECTOR_COLORS.Consumer;
  if (u.includes('real estate') || u.includes('utilities')) return SECTOR_COLORS.Finance;
  return 'bg-secondary text-muted-foreground';
}

export default function IssuerHeader({ ticker, companyName, sector, country, isWatched, onWatch, onBack }) {
  const { t, displaySector } = useTranslation();
  const sectorLabel = sector ? displaySector(sector) : '';
  const sectorStyle = sector
    ? SECTOR_COLORS[sector] || chipClassForEnglishSector(toEnglishSectorLabel(sector))
    : 'bg-secondary text-muted-foreground';

  return (
    <div className="px-4 pt-4 pb-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t('back')}</span>
      </button>

      <div className="flex items-start gap-4">
        {/* Ticker avatar */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="font-mono font-bold text-primary text-lg">{ticker?.slice(0, 4)}</span>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <h1 className="text-ui-title font-bold leading-tight truncate mb-0.5">{companyName || ticker}</h1>
          <p className="font-mono text-sm text-muted-foreground mb-2">{ticker}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {sector && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sectorStyle}`}>
                {sectorLabel}
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