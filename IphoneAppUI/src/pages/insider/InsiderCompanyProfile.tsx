import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Shield } from "lucide-react";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import InsiderActivityPanel from "@/components/insider/InsiderActivityPanel";
import InsiderProfileHero from "@/components/insider/InsiderProfileHero";
import TradeTypeDonut from "@/components/insider/TradeTypeDonut";
import { fetchCompanyProfileFromApi } from "@/api/services/profiles";
import {
  formatInsiderShares,
  personPathFromOwnerId,
} from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrency } from "@/lib/utils";

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
        <div className="h-8 w-8 animate-pulse rounded-full bg-flow/20 ring-2 ring-flow/40" />
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
  const periodLabel = profile.period || "30D";

  const tradeTypeSegments = [
    { label: t.trade.buy, pct: tt.buy, color: "#22C55E" },
    { label: t.trade.sell, pct: tt.sell, color: "#EF4444" },
    { label: t.kpi.options, pct: tt.option, color: "#A855F7" },
    { label: t.kpi.plan10b5, pct: tt.plan10b5 ?? 0, color: "#14B8A6" },
  ].filter((s) => s.pct > 0);

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
          className="flex items-center gap-1 py-2 text-sm font-medium text-flow"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.insiderProfile.back}
        </button>
      </header>

      <div className="px-4 pb-6">
        <InsiderProfileHero
          logoLabel={profile.logoLabel}
          logoColor={profile.logoColor}
          displayName={profile.displayName}
          ticker={profile.ticker}
          className="mt-1"
        />

        {profile.ticker ? (
          <WatchlistButton
            className="mt-3 w-full"
            target={{ type: "stock", ticker: profile.ticker }}
          />
        ) : null}

        <div className="tab-rail mt-5">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn("tab-rail-item", tab === key && "tab-rail-item-active")}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-5 space-y-6">
            <InsiderActivityPanel activity={a} periodLabel={periodLabel} />

            {tradeTypeSegments.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold">{t.insiderProfile.tradeTypes}</h2>
                <div className="glass-card p-4">
                  <TradeTypeDonut segments={tradeTypeSegments} />
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold">{t.insiderProfile.recentTrades}</h2>
              <ul className="space-y-2">
                {profile.companyTrades.slice(0, 3).map((tr) => (
                  <li key={tr.id}>
                    <button
                      type="button"
                      className="trade-row-card w-full text-left"
                      onClick={() => {
                        if (tr.personId) navigate(`/insider/person/${tr.personId}`);
                        else setTab("trades");
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{tr.insiderName}</p>
                          <p
                            className={cn(
                              "mt-0.5 text-xs font-semibold capitalize",
                              tr.side === "buy" ? "text-buy" : "text-sell"
                            )}
                          >
                            {tr.side === "buy" ? t.trade.buy : t.trade.sell}
                            {"under10b51" in tr && tr.under10b51 ? (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-plan-muted px-1 py-0.5 text-[9px] font-bold uppercase text-plan">
                                <Shield className="h-2.5 w-2.5" />
                                10b5-1
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold tabular-nums">{formatCurrency(tr.amount)}</p>
                          <p className="text-[10px] text-muted">{tr.filedAt}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setTab("trades")}
                className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-sm text-flow"
              >
                {t.insiderProfile.viewAllTrades(profile.allTradesCount)}
                <ChevronRight className="h-4 w-4" />
              </button>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold">{t.insiderProfile.companyInfo}</h2>
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
                  {descExpanded ? t.insiderProfile.readLess : t.insiderProfile.readMore}
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
                  className="trade-row-card w-full p-4 text-left"
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
                      <p className="font-semibold tabular-nums">{formatCurrency(tr.amount)}</p>
                      <p className="text-xs text-muted">{formatInsiderShares(tr.shares)}</p>
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
                      className="trade-row-card flex w-full items-center gap-3 p-4 text-left"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-flow/15 text-xs font-bold text-flow">
                        {ins.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{ins.name}</p>
                        <p className="text-xs text-muted">
                          {ins.role} · {ins.tradesCount} {t.insiderProfile.transactions}
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
