import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  RotateCcw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { mobileApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { portalErrorMessage, subscriptionReturnUrl } from "@/lib/billingPortal";
import { isPaidUser } from "@/lib/membership";

function formatRenewalDate(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(locale === "zh-Hant" ? "zh-TW" : "zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function MobileManageSubscription() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const isPaid = isPaidUser(user);

  const [portalBusy, setPortalBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [banner, setBanner] = useState<"success" | "canceled" | null>(null);

  const portalErrors = {
    noSubscription: t.subscription.portalNoSubscription,
    invalidCustomer: t.subscription.portalInvalidCustomer,
    paymentConfig: t.subscription.portalPaymentConfig,
    portalFailed: t.subscription.portalFailed,
    signInRequired: t.settings.signInRequired,
    generic: t.subscription.portalFailed,
  };

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setBanner("success");
      (async () => {
        try {
          await mobileApi.billingSync();
          await refreshUser();
        } catch {
          /* ignore */
        }
        setSearchParams({}, { replace: true });
      })();
    } else if (searchParams.get("canceled") === "true") {
      setBanner("canceled");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, refreshUser, setSearchParams]);

  const renewal = formatRenewalDate(user?.membership_expires_at, locale);
  const statusLabel = (user?.subscription_status || "").toLowerCase();

  const openStripePortal = async () => {
    if (!isAuthenticated) {
      window.alert(t.settings.signInRequired);
      return;
    }
    setPortalBusy(true);
    try {
      const { url } = await mobileApi.billingPortal(
        subscriptionReturnUrl("/settings/subscription")
      );
      if (url) window.location.href = url;
    } catch (err) {
      window.alert(portalErrorMessage(err, portalErrors));
    } finally {
      setPortalBusy(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await mobileApi.billingSync();
      await refreshUser();
    } catch {
      window.alert(t.paywall.restoreFailed);
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
        <h1 className="text-base font-semibold">{t.subscription.title}</h1>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {banner === "success" && (
          <div className="flex items-start gap-2 rounded-xl bg-accent-green/15 px-3 py-2.5 text-sm text-accent-green">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t.subscription.successMessage}</p>
            <button type="button" onClick={() => setBanner(null)} className="ml-auto shrink-0">
              <X className="h-4 w-4 opacity-70" />
            </button>
          </div>
        )}
        {banner === "canceled" && (
          <div className="flex items-start gap-2 rounded-xl bg-[#1C1C1E] px-3 py-2.5 text-sm text-muted">
            <p>{t.subscription.canceledMessage}</p>
            <button type="button" onClick={() => setBanner(null)} className="ml-auto shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-[#1C1C1E] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">{t.subscription.membershipStatus}</p>
              {isPaid ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-accent-purple/30 px-2 py-0.5 text-[11px] font-semibold text-accent-purple">
                  <Sparkles className="h-3 w-3" />
                  {t.subscription.tierPaid}
                </span>
              ) : (
                <p className="mt-1 text-lg font-bold">{t.subscription.tierFree}</p>
              )}
            </div>
            {user?.email && (
              <p className="max-w-[45%] truncate text-right text-xs text-muted">{user.email}</p>
            )}
          </div>
          {isPaid && renewal && (
            <p className="mt-3 text-sm text-muted">{t.subscription.renewsOn(renewal)}</p>
          )}
          {isPaid && statusLabel && statusLabel !== "active" && (
            <p className="mt-1 text-xs text-amber-400/90">
              {t.subscription.statusLabel(statusLabel)}
            </p>
          )}
          {user?.billing_provider && (
            <p className="mt-2 text-[11px] text-muted/80">
              {t.subscription.billingVia(user.billing_provider)}
            </p>
          )}
        </div>

        {isPaid ? (
          <div className="rounded-2xl bg-[#1C1C1E]">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="font-semibold">{t.subscription.manageTitle}</p>
              <p className="mt-1 text-sm text-muted">{t.subscription.manageSubtitle}</p>
            </div>
            <button
              type="button"
              disabled={portalBusy}
              onClick={openStripePortal}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:opacity-50"
            >
              <CreditCard className="h-5 w-5 text-accent-blue" />
              <span className="flex-1 text-sm font-medium">
                {portalBusy ? t.subscription.openingPortal : t.subscription.openPortal}
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#1C1C1E] p-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-purple/20">
                <Zap className="h-6 w-6 text-accent-purple" />
              </div>
              <p className="font-semibold">{t.subscription.upgradeTitle}</p>
              <p className="mt-1 text-sm text-muted">{t.subscription.upgradeSubtitle}</p>
              <p className="mt-3 text-sm text-muted">
                {t.paywall.priceMonthly}
                {t.paywall.perMonth} · {t.paywall.priceYearly}
                {t.paywall.perYear}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/paywall")}
              className="w-full rounded-xl bg-accent-purple py-3.5 text-sm font-semibold text-white"
            >
              {t.subscription.startSubscription}
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={restoring}
          onClick={handleRestore}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1C1C1E] py-3 text-sm text-muted disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 ${restoring ? "animate-spin" : ""}`} />
          {restoring ? t.paywall.restoring : t.settings.restorePurchases}
        </button>

        <p className="pb-4 text-center text-[11px] leading-relaxed text-muted/70">
          {t.subscription.stripeHint}
        </p>
      </div>
    </div>
  );
}