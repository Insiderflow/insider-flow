import { prisma } from '@/lib/prisma';
import {
  normalizeMlTrade,
  type MlTradePayload,
  type NormalizedMlTrade,
} from '@/lib/ml/flagCodes';

export type MlSnapshotPayload = {
  generated_at?: string;
  source_label?: string;
  summary?: Record<string, number>;
  cluster_events?: unknown[];
  high_signals?: MlTradePayload[];
  executive_buys_this_week?: MlTradePayload[];
  trades?: MlTradePayload[];
};

export async function saveMlSignalSnapshot(
  body: MlSnapshotPayload,
  sourceLabel?: string,
): Promise<{ id: string; generatedAt: Date }> {
  const generatedAt = body.generated_at
    ? new Date(body.generated_at)
    : new Date();

  const row = await prisma.mlSignalSnapshot.create({
    data: {
      source_label: sourceLabel ?? body.source_label ?? null,
      generated_at: generatedAt,
      payload: body as object,
    },
  });

  return { id: row.id, generatedAt: row.generated_at };
}

export async function getLatestMlSignalSnapshot(): Promise<{
  id: string;
  generatedAt: Date;
  sourceLabel: string | null;
  payload: MlSnapshotPayload;
} | null> {
  const row = await prisma.mlSignalSnapshot.findFirst({
    orderBy: { generated_at: 'desc' },
  });
  if (!row) return null;
  return {
    id: row.id,
    generatedAt: row.generated_at,
    sourceLabel: row.source_label,
    payload: row.payload as MlSnapshotPayload,
  };
}

export function pickHomeHighSignals(payload: MlSnapshotPayload): NormalizedMlTrade[] {
  const raw =
    payload.executive_buys_this_week?.length
      ? payload.executive_buys_this_week
      : payload.high_signals ?? [];
  return raw
    .map((t) => normalizeMlTrade(t))
    .filter((t) => t.side === 'buy')
    .sort((a, b) => b.signalScore - a.signalScore)
    .slice(0, 8);
}

export function pickPublicHighSignals(payload: MlSnapshotPayload): NormalizedMlTrade[] {
  const raw = payload.high_signals ?? payload.trades ?? [];
  return raw
    .map((t) => normalizeMlTrade(t))
    .sort((a, b) => b.signalScore - a.signalScore)
    .slice(0, 20);
}
