import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PullToRefresh from "@/components/layout/PullToRefresh";
import {
  createReferencePortfolio,
  deleteReferencePortfolio,
  fetchReferencePortfolios,
} from "@/api/services/referencePortfolio";
import { useLanguage } from "@/i18n/LanguageContext";

const QUERY_KEY = "reference-portfolios";

export default function MobileReferencePortfolio() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const politicianId = params.get("politicianId") || undefined;
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchReferencePortfolios,
  });

  const rebuild = useMutation({
    mutationFn: createReferencePortfolio,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  const remove = useMutation({
    mutationFn: deleteReferencePortfolio,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  const portfolios = data?.portfolios ?? [];
  const atLimit = portfolios.length >= (data?.maxPortfolios ?? 3);

  return (
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
    >
      <div className="min-h-screen pb-tab-safe">
        <header className="flex items-center gap-3 border-b border-border/60 px-4 pb-3 pt-safe">
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg p-2 text-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{t.portfolioPage.title}</h1>
            <p className="text-xs text-muted-foreground">{t.portfolioPage.subtitle}</p>
          </div>
        </header>

        <p className="mx-4 mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          {t.portfolioPage.paperDisclaimer}
        </p>

        <div className="mx-4 mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={atLimit || rebuild.isPending}
            onClick={() =>
              rebuild.mutate({
                template: "flagged_buys",
                name: t.portfolioPage.presetFlagged7d,
                periodDays: 7,
                positionLimit: 8,
              })
            }
            className="rounded-xl bg-accent-blue px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {t.portfolioPage.createFlagged}
          </button>
          <button
            type="button"
            disabled={atLimit || rebuild.isPending || !politicianId}
            onClick={() =>
              politicianId &&
              rebuild.mutate({
                template: "politician_mirror",
                politicianId,
                name: t.portfolioPage.politicianMirror,
                periodDays: 90,
                positionLimit: 12,
              })
            }
            className="rounded-xl border border-border bg-white/5 px-4 py-3 text-sm font-medium disabled:opacity-40"
          >
            {politicianId
              ? t.portfolioPage.createPolitician
              : t.portfolioPage.pickPolitician}
          </button>
          {atLimit && (
            <p className="text-center text-xs text-muted-foreground">{t.portfolioPage.limitReached}</p>
          )}
        </div>

        <div className="mx-4 mt-6 space-y-4">
          {isLoading && <div className="h-32 shimmer-loading rounded-xl" />}
          {!isLoading && portfolios.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t.portfolioPage.empty}
            </p>
          )}
          {portfolios.map((p) => (
            <section key={p.id} className="glass-card-elevated p-4">
              <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{p.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {p.politicianName || p.template} · {p.positions.length} 檔
                </p>
                {p.lastBuiltAt && (
                  <p className="mt-1 text-[10px] text-muted">
                    {t.portfolioPage.lastBuilt(p.lastBuiltAt.slice(0, 10))}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label={t.portfolioPage.rebuild}
                  disabled={rebuild.isPending}
                  onClick={() =>
                    rebuild.mutate({
                      id: p.id,
                      template: p.template,
                      name: p.name,
                      politicianId: p.politicianId || undefined,
                      periodDays: p.periodDays,
                      positionLimit: p.positionLimit,
                    })
                  }
                  className="rounded-lg p-2 text-muted hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t.portfolioPage.delete}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(p.id)}
                  className="rounded-lg p-2 text-sell hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              </div>
              <ul className="mt-3 space-y-2 border-t border-border/50 pt-3">
                {p.positions.map((pos) => (
                  <li
                    key={pos.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <button
                      type="button"
                      className="font-medium text-accent-blue"
                      onClick={() =>
                        navigate(`/issuer/${encodeURIComponent(pos.ticker)}`)
                      }
                    >
                      {pos.ticker}
                    </button>
                    <span className="text-muted-foreground">
                      {t.portfolioPage.weight(pos.weightPct)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
