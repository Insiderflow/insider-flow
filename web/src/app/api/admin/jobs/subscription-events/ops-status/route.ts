import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { getSubscriptionEventMetrics } from '@/lib/subscriptionEventMetrics';
import { enforceRouteRateLimit } from '@/lib/rateLimit';

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function GET(request: NextRequest) {
  const rate = enforceRouteRateLimit(request, 'admin_sub_ops_status', 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const provider = request.nextUrl.searchParams.get('provider');
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 50)) : 10;
  const staleMinutesRaw = Number(process.env.SUBSCRIPTION_OPS_STALE_MINUTES_WARN || 30);
  const staleMinutesWarn = Number.isFinite(staleMinutesRaw) ? Math.max(1, staleMinutesRaw) : 30;

  const [{ provider: resolvedProvider, metrics }, notificationRows] = await Promise.all([
    getSubscriptionEventMetrics(provider),
    prisma.opsAlertNotification.findMany({
      orderBy: [{ last_sent_at: 'desc' }, { updated_at: 'desc' }],
      take: limit,
      select: {
        alert_key: true,
        severity: true,
        last_sent_at: true,
        send_count: true,
        updated_at: true,
      },
    }),
  ]);

  const now = Date.now();
  const latestProcessedAt = metrics.latest_processed_at ? new Date(metrics.latest_processed_at).getTime() : null;
  const latestProcessedAgeMinutes = latestProcessedAt
    ? Math.max(0, Math.floor((now - latestProcessedAt) / 60000))
    : null;
  const latestAlertDispatchAt = notificationRows.find((row) => row.last_sent_at)?.last_sent_at || null;

  return NextResponse.json({
    ok: true,
    provider: resolvedProvider,
    ops_status: {
      latest_processed_at: metrics.latest_processed_at,
      latest_processed_age_minutes: latestProcessedAgeMinutes,
      stale_minutes_warn: staleMinutesWarn,
      latest_processed_is_stale:
        latestProcessedAgeMinutes === null ? true : latestProcessedAgeMinutes > staleMinutesWarn,
      latest_alert_dispatch_at: toIso(latestAlertDispatchAt),
      alert_notification_count: notificationRows.length,
    },
    notifications: notificationRows.map((row) => ({
      alert_key: row.alert_key,
      severity: row.severity,
      last_sent_at: toIso(row.last_sent_at),
      send_count: row.send_count,
      updated_at: toIso(row.updated_at),
    })),
  });
}
