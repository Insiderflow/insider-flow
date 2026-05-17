import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { fetchIssuerProfileFromApi } from "@/api/services/profiles";
import { useDataMode } from "@/context/DataModeContext";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import PoliticianMarketTrendChart from "@/components/politician/PoliticianMarketTrendChart";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import { companyPathFromTicker } from "@/data/insiderEntities";
import type { IssuerProfile, IssuerTradeRow } from "@/data/issuerProfile";
import type { Messages } from "@/i18n/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrency } from "@/lib/utils";

function looksLikeTicker(segment: string): boolean {
  return /^[A-Z]{1,6}([.-][A-Z0-9]+)?$/i.test(segment.trim());
}

function looksLikeDbId(segment: string): boolean {
  return segment.length >= 18 && /^[a-z0-9_-]+$/i.test(segment);
}

function sideLabel(side: IssuerTradeRow["side"], t: Messages) {
  if (side === "buy") return t.trade.buy;
  if (side === "sell") return t.trade.sell;
  return t.trade.proposedSale;
}

export default function IssuerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isInsider } = useDataMode();
  const [profile, setProfile] = useState<IssuerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInsider || !id) return;
    const raw = id.trim();
    if (looksLikeTicker(raw) && !looksLikeDbId(raw)) {
      navigate(companyPathFromTicker(raw), {
        replace: true,
        state: { tab: "trades" },
      });
    }
  }, [id, isInsider, navigate]);

  useEffect(() => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (isInsider && looksLikeTicker(id.trim()) && !looksLikeDbId(id.trim())) {
      return;
    }
    setLoading(true);
    fetchIssuerProfileFromApi(id).then((p) => {
      if (p?.ticker && isInsider) {
        navigate(companyPathFromTicker(p.ticker), {
          replace: true,
          state: { tab: "trades" },
        });
        return;
      }
      setProfile(p);
      setLoading(false);
    });
  }, [id, isInsider, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-tab-safe pt-safe">
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-tab-safe pt-safe">
        <p className="text-muted">{t.live.empty}</p>
      </div>
    );
  }

  const { stats } = profile;
  const statCells = [
    { label: t.politicianProfile.tradeCount, value: stats.trades.toLocaleString() },
    { label: t.issuerProfile.politicians, value: stats.politicians.toLocaleString() },
    {
      label: t.politicianProfile.totalVolume,
      value: formatCurrency(stats.totalVolume),
    },
    { label: t.politicianProfile.maxTrade, value: formatCurrency(stats.maxTrade) },
    {
      label: t.politicianProfile.lastTrade,
      value: stats.lastTraded || "—",
    },
  ];

  return (
    <div className="min-h-screen pb-tab-safe">
      <header className="px-4 pt-safe">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 py-2 text-sm font-medium text-accent-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.insiderProfile.back}
        </button>
      </header>

      <div className="px-4 pb-6">
        <div className="mt-1">
          <h1 className="text-xl font-bold leading-tight">{profile.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {profile.ticker ? (
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {profile.ticker}
              </span>
            ) : null}
            {profile.sector ? (
              <span className="rounded-md bg-accent-blue/15 px-2 py-0.5 text-xs text-accent-blue">
                {profile.sector}
              </span>
            ) : null}
            {profile.country ? (
              <span className="rounded-md bg-white/8 px-2 py-0.5 text-xs text-muted-foreground">
                {profile.country}
              </span>
            ) : null}
          </div>
        </div>

        {profile.ticker ? (
          <WatchlistButton
            className="mt-4 w-full"
            target={{ type: "stock", ticker: profile.ticker }}
          />
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {statCells.map(({ label, value }) => (
            <div key={label} className="glass-card rounded-xl p-3">
              <p className="text-[10px] text-muted">{label}</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">
            {t.politicianProfile.trendTitle(profile.name)}
          </h2>
          <div className="glass-card rounded-xl p-3">
            <PoliticianMarketTrendChart
              name={profile.name}
              points={profile.chartPoints}
            />
          </div>
        </section>

        {profile.topPoliticians.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">
              {t.issuerProfile.topPoliticians}
            </h2>
            <div className="glass-card divide-y divide-border">
              {profile.topPoliticians.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() => navigate(`/insider/person/${p.id}`)}
                >
                  <PoliticianAvatar politicianId={p.id} name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted">
                      {t.issuerProfile.politicianTrades(p.trades)} ·{" "}
                      {formatCurrency(p.totalVolume)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">{t.issuerProfile.recentTrades}</h2>
          {profile.recentTrades.length === 0 ? (
            <p className="text-sm text-muted">{t.live.empty}</p>
          ) : (
            <div className="glass-card divide-y divide-border">
              {profile.recentTrades.map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() => navigate(`/insider/person/${tr.politicianId}`)}
                >
                  <PoliticianAvatar
                    politicianId={tr.politicianId}
                    name={tr.politicianName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tr.politicianName}</p>
                    <p className="text-xs text-muted">{tr.tradeDate}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        tr.side === "buy" && "text-buy",
                        tr.side === "sell" && "text-sell",
                        tr.side === "proposed_sale" && "text-orange-400"
                      )}
                    >
                      {sideLabel(tr.side, t)}
                    </p>
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(tr.amount)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
