import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { getSubscriptionEventMetrics } from '@/lib/subscriptionEventMetrics';
import { enforceRouteRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const rate = enforceRouteRateLimit(request, 'admin_sub_metrics', 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const { provider, metrics } = await getSubscriptionEventMetrics(request.nextUrl.searchParams.get('provider'));

  return NextResponse.json({
    ok: true,
    provider,
    metrics,
  });
}
