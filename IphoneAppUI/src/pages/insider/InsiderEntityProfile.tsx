import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { fetchPersonProfileFromApi } from "@/api/services/profiles";
import {
  formatInsiderMoney,
  formatInsiderShares,
} from "@/data/insiderEntities";
import type { InsiderEntityProfile as InsiderEntityProfileType } from "@/data/insiderEntities";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import PoliticianProfileChartsSection from "@/components/politician/PoliticianProfileCharts";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import { localizePoliticianSeatTitle } from "@/lib/politicianSectorLabel";
import { getPoliticianImagePath } from "@/lib/politicianImageUrl";
import { useLanguage } from "@/i18n/LanguageContext";
import { getMessages } from "@/i18n/messages";

type ProfileTab = "overview" | "trades" | "companies";

export default function InsiderEntityProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const m = getMessages(locale);
  const formatRole = (role: string) => localizePoliticianSeatTitle(m, role, role);
  const [tab, setTab] = useState<ProfileTab>("overview");

  const [profile, setProfile] = useState<InsiderEntityProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPersonProfileFromApi(id)
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

  const { activity: a } = profile;
  const isPoliticianProfile =
    profile.entityType === "person" && !profile.id.startsWith("person-");
  const avatarUrl =
    profile.imageUrl ||
    (isPoliticianProfile ? getPoliticianImagePath(profile.id, profile.name) : undefined);

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
        <div className="mt-2 flex gap-3">
          {isPoliticianProfile ? (
            <PoliticianAvatar
              politicianId={profile.id}
              name={profile.name}
              imageUrl={avatarUrl}
              size="md"
            />
          ) : (
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: profile.logoColor }}
            >
              {profile.logoLabel}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {profile.roles.map(formatRole).join(" · ")} · {profile.ticker}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {formatRole(role)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {isPoliticianProfile ? (
            <WatchlistButton
              target={{ type: "politician", politicianId: profile.id }}
              variant="cta"
            />
          ) : profile.id.startsWith("person-") ? (
            <WatchlistButton
              target={{ type: "owner", ownerId: profile.id.replace(/^person-/, "") }}
            />
          ) : null}
        </div>

        <div className="mt-5 flex border-b border-border">
          {(
            [
              ["overview", t.insiderProfile.overview],
              ["trades", t.insiderProfile.trades],
              ["companies", t.insiderProfile.companies],
            ] as const
          ).map(([key, label]) => (
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
          <div className="mt-5 space-y-6">
            {isPoliticianProfile && profile.politicianCharts && (
              <PoliticianProfileChartsSection
                name={profile.name}
                charts={profile.politicianCharts}
              />
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold">{t.insiderProfile.recentTrades}</h2>
              <div className="glass-card divide-y divide-border">
                {profile.recentTrades.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    onClick={() => setTab("trades")}
                  >
                    <div>
                      <p className="font-semibold">{tr.ticker}</p>
                      <p className="text-xs text-muted capitalize">{tr.side}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">{tr.filedAt}</p>
                      <p className="text-[11px] text-muted-foreground">{tr.tradeDate}</p>
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

            {profile.eventStudies.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold">{t.insiderProfile.eventStudies}</h2>
                {profile.eventStudies.map((es) => (
                  <button
                    key={es.id}
                    type="button"
                    className="glass-card flex w-full items-center gap-3 p-4 text-left"
                    onClick={() => navigate(`/insider/person/${profile.id}`)}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-buy/20">
                      <TrendingUp className="h-5 w-5 text-buy" />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{es.title}</p>
                      <p className="text-xs text-muted">{es.personName}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted" />
                  </button>
                ))}
              </section>
            )}

            {!isPoliticianProfile && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t.insiderProfile.liveActivity}</h2>
                <span className="rounded-pill border border-border px-2 py-0.5 text-[10px] text-muted">
                  30D
                </span>
              </div>
              <p className="mb-3 text-[11px] text-muted">{t.insiderProfile.liveActivitySub}</p>
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label={t.insiderProfile.totalBuys}
                  value={formatInsiderMoney(a.totalBuys)}
                  sub={`${a.buyTxCount} ${t.insiderProfile.transactions}`}
                />
                <StatCard
                  label={t.insiderProfile.totalSells}
                  value={formatInsiderMoney(a.totalSells)}
                  sub={`${a.sellTxCount} ${t.insiderProfile.transactions}`}
                />
                <StatCard
                  label={t.insiderProfile.totalOptions}
                  value={formatInsiderMoney(a.totalOptions)}
                  sub={`${a.optionTxCount} ${t.insiderProfile.transactions}`}
                />
                <StatCard
                  label={t.insiderProfile.totalProposedSale}
                  value={formatInsiderMoney(a.totalProposedSale)}
                  sub={`${a.proposedTxCount} ${t.insiderProfile.transactions}`}
                />
              </div>
            </section>
            )}
          </div>
        )}

        {tab === "trades" && (
          <ul className="mt-5 space-y-2">
            {profile.recentTrades.map((tr) => (
              <li key={tr.id} className="glass-card p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">{tr.ticker}</p>
                    <p
                      className={cn(
                        "text-xs font-semibold capitalize",
                        tr.side === "buy" && "text-buy",
                        tr.side === "sell" && "text-sell"
                      )}
                    >
                      {tr.side}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatCurrency(tr.amount)}</p>
                    <p className="text-xs text-muted">
                      {formatInsiderShares(
                        tr.shares,
                        isPoliticianProfile ? t.trade.approxAmount : undefined
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted">
                  {tr.filedAt} · {tr.tradeDate}
                </p>
              </li>
            ))}
          </ul>
        )}

        {tab === "companies" && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => navigate(`/insider/company/company-${profile.ticker.toLowerCase()}`)}
              className="glass-card flex w-full items-center gap-3 p-4 text-left"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: profile.logoColor }}
              >
                {profile.ticker}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{profile.companyName}</p>
                <p className="text-xs text-muted">{profile.ticker}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted" />
            </button>
          </div>
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
  sub: string;
}) {
  return (
    <div className="glass-card p-3">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
