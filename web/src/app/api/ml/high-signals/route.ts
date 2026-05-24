import { NextResponse } from 'next/server';
import {
  getLatestMlSignalSnapshot,
  pickHomeHighSignals,
  pickPublicHighSignals,
} from '@/lib/ml/mlSnapshotRepo';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const snap = await getLatestMlSignalSnapshot();
    if (!snap) {
      return NextResponse.json({
        generatedAt: null,
        executiveBuys: [],
        highSignals: [],
      });
    }

    const executiveBuys = pickHomeHighSignals(snap.payload);
    const highSignals = pickPublicHighSignals(snap.payload);

    return NextResponse.json(
      {
        generatedAt: snap.generatedAt.toISOString(),
        sourceLabel: snap.sourceLabel,
        summary: snap.payload.summary ?? null,
        executiveBuys,
        highSignals,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    console.error('ml/high-signals error', error);
    return NextResponse.json(
      { error: 'Failed to load ML signals' },
      { status: 500 },
    );
  }
}
