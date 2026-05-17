import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import TradeTypeDonut from "@/components/insider/TradeTypeDonut";
import { fetchCompanyProfileFromApi } from "@/api/services/profiles";
import {
  formatInsiderShares,
  personPathFromOwnerId,
} from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrency, formatCurrencyExact } from "@/lib/utils";

type CompanyTab = "overview" | "trades" | "insiders";

export default function InsiderCompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const initialTab =
    (location.state as { tab?: CompanyTab } | null)?.tab ?? "overview";
  const [tab, setTab] = useState<CompanyTab>(initialTab);
  const [descExpanded, setDescExpanded] = useState(false);

  const [profile, setProfile] = useState<Awaited<ReturnType<typeof fetchCompanyProfileFromApi>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const next = (location.state as { tab?: CompanyTab } | null)?.tab;
    if (next) setTab(next);
  }, [location.key, location.state]);

  useEffect(() => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCompanyProfileFromApi(id)
      .then((p) => setProfile(p))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

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

  const { activity: a, tradeTypes: tt } = profile;

  const tradeTypeSegments = [
    { label: t.trade.buy, pct: tt.buy, color: "#22C55E" },
    { label: t.trade.sell, pct: tt.sell, color: "#EF4444" },
    { label: t.kpi.options, pct: tt.option, color: "#A855F7" },
    { label: t.kpi.ppSale, pct: tt.proposed, color: "#F97316" },
  ].filter((s) => s.pct > 0);

  const buyRange =
    a.buyRangeMin != null && a.buyRangeMax != null
      ? `$${a.buyRangeMin.toFixed(2)} – $${a.buyRangeMax.toFixed(2)}`
      : "—";
  const sellRange =
    a.sellRangeMin != null && a.sellRangeMax != null
      ? `$${a.sellRangeMin.toFixed(2)} – $${a.sellRangeMax.toFixed(2)}`
      : "—";

  const tabs: { key: CompanyTab; label: string }[] = [
    { key: "overview", label: t.insiderProfile.overview },
    { key: "trades", label: t.insiderProfile.trades },
    { key: "insiders", label: t.insiderProfile.insiders },
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
        <div className="mt-1 flex gap-3">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold shadow-card"
            style={{ color: profile.logoColor }}
          >
            {profile.logoLabel}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-[15px] font-bold uppercase leading-tight tracking-tight">
              {profile.displayName}
            </h1>
            <span className="mt-2 inline-block rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {profile.ticker}
            </span>
          </div>
        </div>

        {profile.ticker ? (
          <WatchlistButton
            className="mt-4 w-full"
            target={{ type: "stock", ticker: profile.ticker }}
          />
        ) : null}

        <div className="mt-5 flex border-b border-border">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "relative flex-1 pb-3 text-sm font-medium",
                tab === key ? "text-white" : "text-muted"
              )}
            >
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-white" />
              )}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-4 space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold">
                {t.insiderProfile.recentTrades}
              </h2>
              <div className="glass-card divide-y divide-border">
                {profile.companyTrades.slice(0, 1).map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                    onClick={() => {
                      if (tr.personId) navigate(`/insider/person/${tr.personId}`);
                      else setTab("trades");
                    }}
                  >
                    <div>
                      <p className="font-semibold">{tr.insiderName}</p>
                      <p className="mt-0.5 text-xs capitalize text-muted">
                        {tr.side === "buy" ? t.trade.buy : t.trade.sell}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">{tr.filedAt}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {tr.tradeDate}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTab("trades")}
                className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-sm text-accent-blue"
              >
                {t.insiderProfile.viewAllTrades(profile.allTradesCount)}
                <ChevronRight className="h-4 w-4" />
              </button>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {t.insiderProfile.liveActivity}
                </h2>
                <span className="rounded-pill border border-border px-2 py-0.5 text-[10px] text-muted">
                  30D
                </span>
              </div>
              <p className="mb-3 text-[11px] text-muted">
                {t.insiderProfile.liveActivitySub}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label={t.insiderProfile.totalBuys}
                  value={formatCurrencyExact(a.totalBuys)}
                  sub={`${a.buyTxCount} ${t.insiderProfile.transactions}`}
                />
                <StatCard
                  label={t.insiderProfile.totalSells}
                  value={formatCurrencyExact(a.totalSells)}
                  sub={`${a.sellTxCount} ${t.insiderProfile.transactions}`}
                />
                <StatCard
                  label={t.insiderProfile.totalOptions}
                  value={formatCurrencyExact(a.totalOptions)}
                  sub={`${a.optionTxCount} ${t.insiderProfile.transactions}`}
                />
                <StatCard
                  label={t.insiderProfile.totalProposedSale}
                  value={formatCurrencyExact(a.totalProposedSale)}
                  sub={`${a.proposedTxCount} ${t.insiderProfile.transactions}`}
                />
                <StatCard
                  label={t.insiderProfile.avgBuy}
                  value={a.avgBuy > 0 ? `$${a.avgBuy.toFixed(2)}` : "$0.00"}
                />
                <StatCard
                  label={t.insiderProfile.avgSell}
                  value={a.avgSell > 0 ? `$${a.avgSell.toFixed(2)}` : "$0.00"}
                />
                <StatCard
                  label={t.insiderProfile.plan10b5}
                  value={`${a.plan10b5Pct}%`}
                />
                <StatCard
                  label={t.insiderProfile.ppSale}
                  value={`${a.ppSalePct}%`}
                />
                <StatCard label={t.insiderProfile.buyRange} value={buyRange} />
                <StatCard label={t.insiderProfile.sellRange} value={sellRange} />
              </div>
            </section>

            {tradeTypeSegments.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold">
                  {t.insiderProfile.tradeTypes}
                </h2>
                <div className="glass-card p-4">
                  <TradeTypeDonut segments={tradeTypeSegments} />
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold">
                {t.insiderProfile.companyInfo}
              </h2>
              <div className="glass-card p-4">
                <span className="inline-block rounded-pill bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90">
                  {profile.industry}
                </span>
                <p
                  className={cn(
                    "mt-3 text-xs leading-relaxed text-muted-foreground",
                    !descExpanded && "line-clamp-3"
                  )}
                >
                  {profile.description}
                </p>
                <button
                  type="button"
                  onClick={() => setDescExpanded((e) => !e)}
                  className="mt-3 flex items-center gap-1 rounded-pill bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
                >
                  {descExpanded
                    ? t.insiderProfile.readLess
                    : t.insiderProfile.readMore}
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      descExpanded && "rotate-90"
                    )}
                  />
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === "trades" && (
          <ul className="mt-5 space-y-2">
            {profile.companyTrades.map((tr) => (
              <li key={tr.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (tr.personId) navigate(`/insider/person/${tr.personId}`);
                  }}
                  className="glass-card w-full p-4 text-left"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">{tr.insiderName}</p>
                      <p
                        className={cn(
                          "text-xs font-semibold capitalize",
                          tr.side === "buy" && "text-buy",
                          tr.side === "sell" && "text-sell"
                        )}
                      >
                        {tr.side === "buy" ? t.trade.buy : t.trade.sell}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {formatCurrency(tr.amount)}
                      </p>
                      <p className="text-xs text-muted">
                        {formatInsiderShares(tr.shares)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-muted">
                    {tr.filedAt} · {tr.tradeDate}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {tab === "insiders" && (
          <ul className="mt-5 space-y-2">
            {profile.insiders.length === 0 ? (
              <p className="text-center text-sm text-muted">{t.live.empty}</p>
            ) : (
              profile.insiders.map((ins) => {
                const path = personPathFromOwnerId(ins.id);
                return (
                  <li key={ins.id}>
                    <button
                      type="button"
                      onClick={() => navigate(path)}
                      className="glass-card flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                        {ins.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{ins.name}</p>
                        <p className="text-xs text-muted">
                          {ins.role} · {ins.tradesCount}{" "}
                          {t.insiderProfile.transactions}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-card p-3">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
