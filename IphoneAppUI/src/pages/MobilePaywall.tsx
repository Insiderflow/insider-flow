import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, RotateCcw, X, Zap } from "lucide-react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { mobileApi } from "@/api/endpoints";
import { useLanguage } from "@/i18n/LanguageContext";
import { subscriptionReturnUrl } from "@/lib/billingPortal";
import { checkoutErrorMessage } from "@/lib/checkoutError";
import { cn } from "@/lib/utils";

type BillingPlan = "monthly" | "yearly";

export default function MobilePaywall() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isPaid, isAuthenticated, refreshUser } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPaid) navigate("/", { replace: true });
  }, [isPaid, navigate]);

  const handleUpgrade = async (plan: BillingPlan) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/paywall" } });
      return;
    }

    setLoadingPlan(plan);
    setError(null);
    try {
      const { url } = await mobileApi.billingCheckout(
        subscriptionReturnUrl("/settings/subscription"),
        plan
      );
      if (!url) {
        setError(t.paywall.checkoutFailed);
        return;
      }
      window.location.href = url;
    } catch (err) {
      setError(
        checkoutErrorMessage(err, {
          signInRequired: t.settings.signInRequired,
          paymentNotConfigured: t.paywall.priceNotConfigured,
          checkoutFailed: t.paywall.checkoutFailed,
        })
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRestore = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/paywall" } });
      return;
    }
    setRestoring(true);
    setError(null);
    try {
      await mobileApi.billingSync();
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? t.settings.signInRequired
          : t.paywall.restoreFailed
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-tab-safe">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 pt-safe">
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="p-1 text-accent-blue"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">{t.paywall.title}</h1>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-purple/20">
            <Zap className="h-7 w-7 text-accent-purple" />
          </div>
          <h2 className="text-xl font-bold">{t.paywall.headline}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{t.paywall.subtitle}</p>
        </div>

        <div className="grid gap-3">
          <PlanCard
            title={t.paywall.monthlyPlan}
            price={t.paywall.priceMonthly}
            period={t.paywall.perMonth}
            cta={t.paywall.ctaMonthly}
            loading={loadingPlan === "monthly"}
            disabled={loadingPlan !== null && loadingPlan !== "monthly"}
            onSelect={() => handleUpgrade("monthly")}
          />
          <PlanCard
            title={t.paywall.yearlyPlan}
            price={t.paywall.priceYearly}
            period={t.paywall.perYear}
            badge={t.paywall.yearlyBadge}
            savings={t.paywall.yearlySavings}
            highlighted
            cta={t.paywall.ctaYearly}
            loading={loadingPlan === "yearly"}
            disabled={loadingPlan !== null && loadingPlan !== "yearly"}
            onSelect={() => handleUpgrade("yearly")}
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">
          <div className="flex border-b border-white/10 px-4 py-3 text-[10px] font-semibold uppercase text-muted">
            <span className="flex-1">{t.paywall.featureCol}</span>
            <span className="w-12 text-center">{t.paywall.freeCol}</span>
            <span className="w-14 text-center text-buy">{t.paywall.paidCol}</span>
          </div>
          <ul className="divide-y divide-white/[0.06] px-4">
            {t.paywall.features.map((row) => (
              <li key={row.label} className="flex items-center gap-2 py-2.5 text-xs">
                <span className="flex-1">{row.label}</span>
                <span className="flex w-12 justify-center">
                  {row.free ? (
                    <Check className="h-3.5 w-3.5 text-muted" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted" />
                  )}
                </span>
                <span className="flex w-14 justify-center">
                  <Check className="h-3.5 w-3.5 text-buy" />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-center text-sm text-sell">{error}</p>}
      </div>

      <div className="space-y-2 border-t border-border px-4 py-4">
        <button
          type="button"
          disabled={restoring || loadingPlan !== null}
          onClick={handleRestore}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted disabled:opacity-50"
        >
          <RotateCcw className={cn("h-3.5 w-3.5", restoring && "animate-spin")} />
          {restoring ? t.paywall.restoring : t.settings.restorePurchases}
        </button>
        <p className="text-center text-[11px] text-muted/80">{t.paywall.stripeNote}</p>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  period,
  badge,
  savings,
  highlighted,
  cta,
  loading,
  disabled,
  onSelect,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  savings?: string;
  highlighted?: boolean;
  cta: string;
  loading: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-4",
        highlighted ? "border-accent-purple/50 bg-accent-purple/10" : "border-border bg-[#1C1C1E]"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {badge && (
          <span className="shrink-0 rounded-pill bg-accent-purple/30 px-2 py-0.5 text-[10px] font-semibold text-accent-purple">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">
        {price}
        <span className="text-sm font-normal text-muted"> {period}</span>
      </p>
      {savings && <p className="mt-1 text-xs text-muted">{savings}</p>}
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          "mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50",
          highlighted ? "bg-accent-purple" : "bg-accent-blue"
        )}
      >
        {loading ? "…" : cta}
      </button>
    </div>
  );
}
