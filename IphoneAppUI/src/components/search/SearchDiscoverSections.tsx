import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";
import { fetchDiscoverFromApi } from "@/api/services/discover";
import type { TradeFlagCode } from "@/types/tradeFlags";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrency } from "@/lib/utils";

const QUERY_KEY = "mobile-discover";

export default function SearchDiscoverSections() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEY, "7D"],
    queryFn: () => fetchDiscoverFromApi("7D"),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl shimmer-loading" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const hasContent =
    data.activePoliticians.length > 0 ||
    data.activeTickers.length > 0 ||
    data.recentFlagged.length > 0;

  if (!hasContent) {
    return (
      <p className="mt-8 text-center text-sm text-muted">{t.discover.empty}</p>
    );
  }

  return (
    <div className="mt-6 space-y-6 pb-4">
      {data.activePoliticians.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold text-white/90">
            {t.discover.activePoliticians}
          </h2>
          <ul className="space-y-2">
            {data.activePoliticians.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/insider/person/${p.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[#1C1C1E] px-4 py-3 text-left"
                >
                  <PoliticianAvatar
                    politicianId={p.id}
                    name={p.name}
                    imageUrl={p.imageUrl}
                    party={p.party}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted">
                      {t.discover.politicianMeta(p.tradeCount, p.volume)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      p.party === "R" && "text-red-400",
                      p.party === "D" && "text-blue-400",
                    )}
                  >
                    {p.party}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.activeTickers.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold text-white/90">
            {t.discover.activeTickers}
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.activeTickers.map((tk) => (
              <button
                key={tk.ticker}
                type="button"
                onClick={() =>
                  navigate(`/issuer/${encodeURIComponent(tk.ticker)}`)
                }
                className="rounded-xl border border-white/10 bg-[#1C1C1E] px-3 py-2 text-left"
              >
                <p className="text-sm font-bold">{tk.ticker}</p>
                <p className="text-[10px] text-muted">
                  {t.discover.tickerMeta(tk.tradeCount, tk.volume)}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {data.recentFlagged.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold text-white/90">
            {t.discover.recentFlagged}
          </h2>
          <ul className="space-y-2">
            {data.recentFlagged.map((tr) => (
              <li key={tr.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/insider/person/${tr.politicianId}`)}
                  className="w-full rounded-2xl bg-[#1C1C1E] px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{tr.ticker}</span>
                    <TradeFlagBadges flags={tr.flags as TradeFlagCode[]} max={2} />
                  </div>
                  <p className="mt-1 truncate text-sm">{tr.politicianName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatCurrency(tr.amount)} · {tr.filedAt}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
