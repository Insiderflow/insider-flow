import { NextRequest, NextResponse } from 'next/server';
import { assertInternalJobRequest } from '@/lib/admin';
import { warmDailyBriefs } from '@/lib/mobile/dailyTradeBrief';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Cron / internal job: regenerate mobile AI digests (xAI/Grok). */
export async function POST(request: NextRequest) {
  const auth = assertInternalJobRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  if (!process.env.XAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: 'XAI_API_KEY is not configured on this server' },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { force?: boolean };
  try {
    const result = await warmDailyBriefs({ force: body.force !== false });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('cron/warm-mobile-digest error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Warm failed' },
      { status: 500 },
    );
  }
}
