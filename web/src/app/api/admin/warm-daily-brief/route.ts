import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import {
  warmDailyBriefs,
  type BriefLocale,
} from '@/lib/mobile/dailyTradeBrief';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const LOCALES = new Set<BriefLocale>(['zh-Hant', 'zh-Hans', 'ko', 'en']);

export async function POST(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  if (!process.env.XAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: 'XAI_API_KEY is not configured on this server' },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    force?: boolean;
    locales?: string[];
  };

  const locales = Array.isArray(body.locales)
    ? body.locales.filter((l): l is BriefLocale => LOCALES.has(l as BriefLocale))
    : undefined;

  try {
    const result = await warmDailyBriefs({
      force: body.force !== false,
      locales: locales?.length ? locales : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('admin/warm-daily-brief error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Warm failed' },
      { status: 500 },
    );
  }
}
