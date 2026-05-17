import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWatchlist } from "@/api/services/watchlist";
import { mobileApi } from "@/api/endpoints";
import {
  Bell,
  ChevronRight,
  FileText,
  Globe,
  Monitor,
  Info,
  LogIn,
  LogOut,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  UserMinus,
} from "lucide-react";
import LanguageSheet from "@/components/settings/LanguageSheet";
import SettingsRow from "@/components/settings/SettingsRow";
import SettingsSection from "@/components/settings/SettingsSection";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

const APP_VERSION = "0.1.0";
const APP_BUILD = "1";

export default function MobileSettings() {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const { user, isPaid, isAuthenticated, logout, refreshUser } = useAuth();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchWatchlist().then((items) => setWatchlistCount(items.length));
  }, []);

  const displayName = user?.full_name?.trim() || user?.email || "Insider Flow";
  const localeLabel =
    locale === "zh-Hant" ? t.lang.traditional : t.lang.simplified;

  const noop = () => {
    window.alert(t.settings.comingSoon);
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

  const handleSignOut = async () => {
    if (!window.confirm(t.settings.signOutConfirm)) return;
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas pb-tab-safe">
      <header className="px-4 pb-2 pt-safe">
        <h1 className="text-center text-[17px] font-semibold tracking-tight">
          {t.tabs.settings}
        </h1>
      </header>

      <div className="space-y-6 px-4 pb-8 pt-4">
        <div className="rounded-2xl bg-[#1C1C1E] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-pill bg-accent-purple/30 px-2 py-0.5 text-[10px] font-semibold text-accent-purple">
                  <Sparkles className="h-3 w-3" />
                  {t.settings.premium}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/paywall")}
                  className="inline-flex items-center gap-1 rounded-pill bg-accent-blue/20 px-2 py-0.5 text-[10px] font-semibold text-accent-blue"
                >
                  {t.settings.upgradeToPro}
                </button>
              )}
              <p className="mt-2 text-lg font-bold">{displayName}</p>
              {user?.email && user.email !== displayName && (
                <p className="text-xs text-muted">{user.email}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate("/settings/subscription")}
              className="flex shrink-0 items-center gap-0.5 pt-1 text-sm text-muted hover:text-white"
            >
              {t.settings.manageSubscription}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <SettingsSection title={t.settings.notifications}>
          <SettingsRow
            icon={Bell}
            label={t.settings.notificationPrefs}
            onClick={() => navigate("/settings/notifications")}
          />
          <SettingsRow
            icon={Bell}
            label={t.settings.followedCompanies}
            onClick={() => navigate("/settings/watchlist")}
            trailing={
              watchlistCount > 0 ? (
                <span className="text-sm text-muted">{watchlistCount}</span>
              ) : undefined
            }
          />
        </SettingsSection>

        {!isAuthenticated && (
          <SettingsSection title={t.settings.account}>
            <SettingsRow
              icon={LogIn}
              label={t.auth.signIn}
              onClick={() => navigate("/login", { state: { from: "/settings" } })}
            />
          </SettingsSection>
        )}

        <SettingsSection title={t.settings.subscription}>
          <SettingsRow
            icon={Sparkles}
            label={isPaid ? t.settings.manageSubscription : t.settings.upgradeToPro}
            onClick={() => navigate("/settings/subscription")}
          />
          <SettingsRow
            icon={RotateCcw}
            label={restoring ? t.paywall.restoring : t.settings.restorePurchases}
            onClick={handleRestore}
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title={t.settings.about}>
          <SettingsRow
            icon={FileText}
            label={t.settings.terms}
            onClick={() => navigate("/legal/terms")}
          />
          <SettingsRow
            icon={Shield}
            label={t.settings.privacy}
            onClick={() => navigate("/legal/privacy")}
          />
          <SettingsRow icon={Star} label={t.settings.rateApp} onClick={noop} />
          <SettingsRow
            icon={Monitor}
            label={t.settings.viewDesktopSite}
            onClick={() => {
              window.location.href = `${window.location.origin}/?desktop=1`;
            }}
          />
          <SettingsRow
            icon={Globe}
            label={t.settings.language}
            onClick={() => setLanguageOpen(true)}
            trailing={
              <span className="flex items-center gap-1 text-sm text-muted">
                {localeLabel}
                <ChevronRight className="h-4 w-4" />
              </span>
            }
          />
        </SettingsSection>

        {isAuthenticated && (
          <SettingsSection title={t.settings.account}>
            <SettingsRow
              icon={LogOut}
              label={t.settings.signOut}
              destructive
              showChevron={false}
              onClick={handleSignOut}
            />
            <SettingsRow
              icon={UserMinus}
              label={t.settings.deleteAccount}
              destructive
              showChevron={false}
              onClick={() => {
                if (window.confirm(t.settings.deleteConfirm)) noop();
              }}
            />
          </SettingsSection>
        )}

        <footer className="flex flex-col items-center gap-1.5 pt-2">
          <Info className="h-4 w-4 text-muted" strokeWidth={1.5} />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {t.settings.version(APP_VERSION, APP_BUILD)}
          </p>
        </footer>
      </div>

      <LanguageSheet open={languageOpen} onClose={() => setLanguageOpen(false)} />
    </div>
  );
}
