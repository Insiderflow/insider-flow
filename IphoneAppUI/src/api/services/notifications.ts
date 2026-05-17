import { USE_FIXTURE_BUILDERS } from "@/api/config";
import { apiClient } from "@/api/client";

export interface NotificationSettings {
  newTrades: boolean;
  watchlistUpdates: boolean;
  weeklyDigest: boolean;
}

const DEFAULTS: NotificationSettings = {
  newTrades: true,
  watchlistUpdates: true,
  weeklyDigest: false,
};

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  if (USE_FIXTURE_BUILDERS) return { ...DEFAULTS };
  try {
    const res = await apiClient.get<{ settings: NotificationSettings }>(
      "/api/account/notification-settings"
    );
    return { ...DEFAULTS, ...res.settings };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  if (USE_FIXTURE_BUILDERS) return;
  await apiClient.post<{ message: string }>(
    "/api/account/notification-settings",
    settings
  );
}

export async function updateNotificationSetting(
  key: keyof NotificationSettings,
  value: boolean,
  current: NotificationSettings
): Promise<NotificationSettings> {
  const next = { ...current, [key]: value };
  await saveNotificationSettings(next);
  return next;
}
