import { prisma } from '@/lib/prisma';

export type SubscriptionEventMetricsSnapshot = {
  total_events: number;
  due_now_count: number;
  dead_lettered_count: number;
  dead_letter_rate: number;
  oldest_failed_at: string | null;
  latest_processed_at: string | null;
};

export type SubscriptionPipelineAlert = {
  key: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  message: string;
  threshold: number;
  actual: number;
};

function threshold(name: string, fallback: number) {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) ? raw : fallback;
}

export function buildSubscriptionPipelineAlerts(
  metrics: SubscriptionEventMetricsSnapshot,
  now = new Date(),
): SubscriptionPipelineAlert[] {
  const alerts: SubscriptionPipelineAlert[] = [];
  const dueNowWarn = threshold('SUBSCRIPTION_ALERT_DUE_NOW_WARN', 25);
  const deadLetterRateCritical = threshold('SUBSCRIPTION_ALERT_DEAD_LETTER_RATE_CRITICAL', 0.02);
  const oldestFailedMinutesWarn = threshold('SUBSCRIPTION_ALERT_OLDEST_FAILED_MINUTES_WARN', 30);
  const staleProcessingMinutesCritical = threshold('SUBSCRIPTION_ALERT_STALE_PROCESSED_MINUTES_CRITICAL', 120);

  if (metrics.due_now_count >= dueNowWarn) {
    alerts.push({
      key: 'subscription_due_now_backlog',
      severity: 'warning',
      metric: 'due_now_count',
      message: `Retry backlog is high: ${metrics.due_now_count} events due now (threshold ${dueNowWarn}).`,
      threshold: dueNowWarn,
      actual: metrics.due_now_count,
    });
  }

  if (metrics.dead_letter_rate >= deadLetterRateCritical) {
    alerts.push({
      key: 'subscription_dead_letter_rate',
      severity: 'critical',
      metric: 'dead_letter_rate',
      message: `Dead-letter rate is high: ${(metrics.dead_letter_rate * 100).toFixed(2)}% (threshold ${(deadLetterRateCritical * 100).toFixed(2)}%).`,
      threshold: deadLetterRateCritical,
      actual: metrics.dead_letter_rate,
    });
  }

  if (metrics.oldest_failed_at) {
    const ageMinutes = Math.max(0, Math.floor((now.getTime() - new Date(metrics.oldest_failed_at).getTime()) / 60000));
    if (ageMinutes >= oldestFailedMinutesWarn) {
      alerts.push({
        key: 'subscription_oldest_failed_age',
        severity: 'warning',
        metric: 'oldest_failed_minutes',
        message: `Oldest failed event age is ${ageMinutes}m (threshold ${oldestFailedMinutesWarn}m).`,
        threshold: oldestFailedMinutesWarn,
        actual: ageMinutes,
      });
    }
  }

  if (metrics.total_events > 0 && metrics.latest_processed_at) {
    const staleMinutes = Math.max(0, Math.floor((now.getTime() - new Date(metrics.latest_processed_at).getTime()) / 60000));
    if (staleMinutes >= staleProcessingMinutesCritical) {
      alerts.push({
        key: 'subscription_latest_processed_stale',
        severity: 'critical',
        metric: 'latest_processed_minutes',
        message: `No successful processing for ${staleMinutes}m (threshold ${staleProcessingMinutesCritical}m).`,
        threshold: staleProcessingMinutesCritical,
        actual: staleMinutes,
      });
    }
  }

  return alerts;
}

export function buildSubscriptionPipelineTestAlert(now = new Date()): SubscriptionPipelineAlert {
  return {
    key: 'subscription_test_alert',
    severity: 'info',
    metric: 'test',
    message: `Manual subscription pipeline test alert at ${now.toISOString()}.`,
    threshold: 1,
    actual: 1,
  };
}

export async function dispatchSubscriptionPipelineAlerts(
  alerts: SubscriptionPipelineAlert[],
  options: { force?: boolean } = {},
) {
  const forceDispatch = options.force === true;
  const webhookUrl = (process.env.SUBSCRIPTION_ALERT_WEBHOOK_URL || '').trim();
  const cooldownMinutesRaw = Number(process.env.SUBSCRIPTION_ALERT_COOLDOWN_MINUTES || 30);
  const cooldownMinutes = Number.isFinite(cooldownMinutesRaw) ? cooldownMinutesRaw : 30;
  const cooldownMs = Math.max(1, cooldownMinutes) * 60 * 1000;
  const now = new Date();
  const dispatched: string[] = [];
  const skippedCooldown: string[] = [];
  const skippedNoWebhook: string[] = [];

  if (alerts.length === 0) {
    return { dispatched, skippedCooldown, skippedNoWebhook, webhookConfigured: webhookUrl.length > 0 };
  }

  const existing = await prisma.opsAlertNotification.findMany({
    where: { alert_key: { in: alerts.map((alert) => alert.key) } },
  });
  const existingByKey = new Map(existing.map((row) => [row.alert_key, row]));

  for (const alert of alerts) {
    const previous = existingByKey.get(alert.key);
    const lastSentAt = previous?.last_sent_at ? new Date(previous.last_sent_at).getTime() : 0;
    if (!forceDispatch && lastSentAt > 0 && now.getTime() - lastSentAt < cooldownMs) {
      skippedCooldown.push(alert.key);
      continue;
    }

    if (!webhookUrl) {
      skippedNoWebhook.push(alert.key);
      continue;
    }

    const payload = {
      type: 'subscription_pipeline_alert',
      alert,
      at: now.toISOString(),
    };
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Alert webhook failed for ${alert.key} (${response.status})`);
    }

    await prisma.opsAlertNotification.upsert({
      where: { alert_key: alert.key },
      create: {
        alert_key: alert.key,
        severity: alert.severity,
        last_sent_at: now,
        send_count: 1,
        last_payload: payload,
      },
      update: {
        severity: alert.severity,
        last_sent_at: now,
        send_count: { increment: 1 },
        last_payload: payload,
      },
    });
    dispatched.push(alert.key);
  }

  return {
    dispatched,
    skippedCooldown,
    skippedNoWebhook,
    webhookConfigured: webhookUrl.length > 0,
  };
}
