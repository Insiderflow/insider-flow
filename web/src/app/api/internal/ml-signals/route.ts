import { NextRequest, NextResponse } from 'next/server';
import { assertInternalJobRequest } from '@/lib/admin';
import { enforceRouteRateLimit } from '@/lib/rateLimit';
import { saveMlSignalSnapshot, type MlSnapshotPayload } from '@/lib/ml/mlSnapshotRepo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const rate = enforceRouteRateLimit(request, 'internal_ml_signals', 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const auth = assertInternalJobRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  let body: MlSnapshotPayload;
  try {
    body = (await request.json()) as MlSnapshotPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.trades?.length && !body.high_signals?.length) {
    return NextResponse.json(
      { error: 'Payload must include trades or high_signals' },
      { status: 400 },
    );
  }

  const sourceLabel =
    request.headers.get('x-ml-source') ??
    body.source_label ??
    undefined;

  try {
    const saved = await saveMlSignalSnapshot(body, sourceLabel);
    return NextResponse.json({
      ok: true,
      id: saved.id,
      generatedAt: saved.generatedAt.toISOString(),
      highSignalCount: body.high_signals?.length ?? 0,
      tradeCount: body.trades?.length ?? 0,
    });
  } catch (error) {
    console.error('ml-signals ingest error', error);
    return NextResponse.json(
      { error: 'Failed to persist ML snapshot' },
      { status: 500 },
    );
  }
}
