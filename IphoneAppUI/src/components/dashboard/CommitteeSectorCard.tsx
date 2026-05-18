import { useNavigate } from "react-router-dom";
import type { CommitteeSectorSummary, Period } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";
import { localizePoliticianSeatTitle } from "@/lib/politicianSectorLabel";
import { formatCurrency } from "@/lib/utils";

interface CommitteeSectorCardProps {
  data: CommitteeSectorSummary;
  period: Period;
}

export default function CommitteeSectorCard({ data, period }: CommitteeSectorCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!data.rows.length) return null;

  const maxBar = Math.max(
    ...data.rows.map((r) => r.buyAmount + r.sellAmount),
    1,
  );

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2 px-1">
        <div>
          <h2 className="section-title">{t.committeeSector.title}</h2>
          <p className="mt-1 text-xs text-muted">{t.committeeSector.subtitle(period)}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-200">
          {t.committeeSector.alignedPct(data.alignedPct)}
        </span>
      </div>

      <div className="glass-card space-y-3 p-4">
        <p className="text-xs leading-relaxed text-muted">{t.committeeSector.explainer}</p>
        <ul className="space-y-3">
          {data.rows.map((row) => {
            const total = row.buyAmount + row.sellAmount;
            const widthPct = Math.max(8, Math.round((total / maxBar) * 100));
            const label = localizePoliticianSeatTitle(t, row.sectorKey, row.sectorKey);
            const buyW = total > 0 ? (row.buyAmount / total) * widthPct : 0;
            const sellW = total > 0 ? (row.sellAmount / total) * widthPct : 0;
            return (
              <li key={row.sectorKey}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() =>
                    navigate(
                      `/industry-compare?sector=${encodeURIComponent(row.sectorKey)}&side=buy&period=${period}`,
                    )
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs tabular-nums text-muted">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full bg-buy" style={{ width: `${buyW}%` }} />
                    <div className="h-full bg-sell" style={{ width: `${sellW}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    {t.committeeSector.rowMeta(row.tradeCount, row.buyAmount, row.sellAmount)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
