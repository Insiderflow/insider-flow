import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { getSubscriptionEventMetrics } from '@/lib/subscriptionEventMetrics';
import {
  buildSubscriptionPipelineAlerts,
  dispatchSubscriptionPipelineAlerts,
} from '@/lib/subscriptionPipelineAlerts';

export async function GET(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const { provider, metrics } = await getSubscriptionEventMetrics(request.nextUrl.searchParams.get('provider'));
  const alerts = buildSubscriptionPipelineAlerts(metrics);
  return NextResponse.json({
    ok: true,
    provider,
    alert_count: alerts.length,
    alerts,
    metrics,
  });
}

export async function POST(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  let body: { provider?: 'stripe' | 'revenuecat'; notify?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const { provider, metrics } = await getSubscriptionEventMetrics(body.provider);
  const alerts = buildSubscriptionPipelineAlerts(metrics);
  const notify = body.notify !== false;
  const notification = notify
    ? await dispatchSubscriptionPipelineAlerts(alerts)
    : {
        dispatched: [],
        skippedCooldown: [],
        skippedNoWebhook: [],
        webhookConfigured: Boolean(process.env.SUBSCRIPTION_ALERT_WEBHOOK_URL),
      };

  return NextResponse.json({
    ok: true,
    provider,
    notify,
    alert_count: alerts.length,
    alerts,
    notification,
  });
}
