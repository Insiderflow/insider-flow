import { NextRequest, NextResponse } from 'next/server';
import { assertInternalJobRequest } from '@/lib/admin';
import { getSubscriptionEventMetrics } from '@/lib/subscriptionEventMetrics';
import {
  buildSubscriptionPipelineAlerts,
  dispatchSubscriptionPipelineAlerts,
} from '@/lib/subscriptionPipelineAlerts';
import { enforceRouteRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const rate = enforceRouteRateLimit(request, 'internal_sub_alerts', 30, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const auth = assertInternalJobRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  let body: { provider?: 'stripe' | 'revenuecat' } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const { provider, metrics } = await getSubscriptionEventMetrics(body.provider);
    const alerts = buildSubscriptionPipelineAlerts(metrics);
    const notification = await dispatchSubscriptionPipelineAlerts(alerts);
    return NextResponse.json({
      ok: true,
      provider,
      alert_count: alerts.length,
      alerts,
      notification,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal subscription alert job failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const rate = enforceRouteRateLimit(request, 'internal_sub_alerts', 30, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const auth = assertInternalJobRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: 'internal subscription alert job endpoint is active',
  });
}
