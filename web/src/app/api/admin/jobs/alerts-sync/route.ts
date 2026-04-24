import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin";
import { pruneOldReadAlerts, syncAllUserAlerts } from "@/lib/alerts";
import { prisma } from "@/lib/prisma";

type AlertsSyncJobState = {
  lastRunAt: string | null;
  lastResult: {
    syncedUsers: number;
    deletedOldReadAlerts: number;
    elapsedMs: number;
  } | null;
};

const globalJobState = globalThis as unknown as { alertsSyncState?: AlertsSyncJobState };

function getState(): AlertsSyncJobState {
  if (!globalJobState.alertsSyncState) {
    globalJobState.alertsSyncState = { lastRunAt: null, lastResult: null };
  }
  return globalJobState.alertsSyncState;
}

export async function POST(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const startedAt = Date.now();
    const sync = await syncAllUserAlerts();
    const prune = await pruneOldReadAlerts();
    const elapsedMs = Date.now() - startedAt;

    const state = getState();
    state.lastRunAt = new Date().toISOString();
    state.lastResult = {
      syncedUsers: sync.syncedUsers,
      deletedOldReadAlerts: prune.deletedAlerts,
      elapsedMs,
    };

    return NextResponse.json({
      ok: true,
      ...state.lastResult,
      lastRunAt: state.lastRunAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "alerts sync failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const state = getState();
  const [totalAlerts, unreadAlerts, latestAlert] = await Promise.all([
    prisma.alert.count(),
    prisma.alert.count({ where: { read: false } }),
    prisma.alert.findFirst({ orderBy: { timestamp: "desc" }, select: { timestamp: true } }),
  ]);

  return NextResponse.json({
    ok: true,
    lastRunAt: state.lastRunAt,
    lastResult: state.lastResult,
    totals: {
      alerts: totalAlerts,
      unreadAlerts,
      latestAlertAt: latestAlert?.timestamp.toISOString() || null,
    },
  });
}

