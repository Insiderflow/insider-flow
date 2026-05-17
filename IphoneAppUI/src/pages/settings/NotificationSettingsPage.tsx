import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsToggle from "@/components/settings/SettingsToggle";
import {
  fetchNotificationSettings,
  updateNotificationSetting,
  type NotificationSettings,
} from "@/api/services/notifications";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError } from "@/api/client";

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof NotificationSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchNotificationSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleToggle = async (key: keyof NotificationSettings, next: boolean) => {
    if (!settings) return;
    setSavingKey(key);
    setMessage(null);
    const prev = settings;
    setSettings({ ...settings, [key]: next });
    try {
      const saved = await updateNotificationSetting(key, next, prev);
      setSettings(saved);
      setMessage(t.notificationSettingsPage.saved);
      setTimeout(() => setMessage(null), 2500);
    } catch (e) {
      setSettings(prev);
      const msg = e instanceof ApiError ? e.message : t.notificationSettingsPage.saveFailed;
      setMessage(msg);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-tab-safe">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-canvas/95 px-3 pb-3 pt-safe backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 py-1 text-xs font-medium text-accent-blue"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.notificationSettingsPage.back}
        </button>
        <h1 className="text-base font-bold tracking-tight">
          {t.notificationSettingsPage.title}
        </h1>
        <p className="text-[10px] text-muted">{t.notificationSettingsPage.subtitle}</p>
      </header>

      <div className="px-4 py-4">
        {!isAuthenticated ? (
          <div className="glass-card space-y-3 p-4 text-center">
            <p className="text-sm text-muted">{t.settings.signInRequired}</p>
            <button
              type="button"
              onClick={() => navigate("/paywall")}
              className="rounded-xl bg-accent-blue px-4 py-2 text-sm font-semibold text-white"
            >
              {t.settings.upgradeToPro}
            </button>
          </div>
        ) : loading || !settings ? (
          <div className="h-40 rounded-2xl shimmer-loading" />
        ) : (
          <>
            {message ? (
              <p
                className={`mb-3 rounded-lg px-3 py-2 text-center text-xs ${
                  message === t.notificationSettingsPage.saved
                    ? "bg-buy/15 text-buy"
                    : "bg-sell/15 text-sell"
                }`}
              >
                {message}
              </p>
            ) : null}
            <SettingsSection title={t.settings.notifications}>
              <SettingsToggle
                title={t.notificationSettingsPage.newTrades.title}
                description={t.notificationSettingsPage.newTrades.description}
                checked={settings.newTrades}
                disabled={savingKey !== null}
                onChange={(v) => void handleToggle("newTrades", v)}
              />
              <SettingsToggle
                title={t.notificationSettingsPage.watchlistUpdates.title}
                description={t.notificationSettingsPage.watchlistUpdates.description}
                checked={settings.watchlistUpdates}
                disabled={savingKey !== null}
                onChange={(v) => void handleToggle("watchlistUpdates", v)}
              />
              <SettingsToggle
                title={t.notificationSettingsPage.weeklyDigest.title}
                description={t.notificationSettingsPage.weeklyDigest.description}
                checked={settings.weeklyDigest}
                disabled={savingKey !== null}
                onChange={(v) => void handleToggle("weeklyDigest", v)}
              />
            </SettingsSection>
            <p className="mt-4 px-1 text-[10px] leading-relaxed text-muted">
              {t.notificationSettingsPage.emailNote}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
