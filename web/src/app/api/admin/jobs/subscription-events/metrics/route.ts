import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { getSubscriptionEventMetrics } from '@/lib/subscriptionEventMetrics';

export async function GET(request: NextRequest) {
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
