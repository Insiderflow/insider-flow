import { NextRequest, NextResponse } from "next/server";
import { getAlertsSyncState, runAlertsSyncJob } from "@/lib/alertsSyncJob";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.ALERTS_SYNC_SECRET;
  if (!expectedSecret) return false;
  const providedSecret = request.headers.get("x-alerts-sync-secret");
  return providedSecret === expectedSecret;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runAlertsSyncJob();
    if (result.skipped) {
      return NextResponse.json(
        { ok: true, skipped: true, reason: result.reason },
        { status: 202 },
      );
    }

    const state = getAlertsSyncState();
    const lastResult = state.lastResult;

    return NextResponse.json({
      ok: true,
      syncedUsers: lastResult?.syncedUsers ?? 0,
      deletedOldReadAlerts: lastResult?.deletedOldReadAlerts ?? 0,
      retentionCutoff: lastResult?.retentionCutoff ?? null,
      elapsedMs: lastResult?.elapsedMs ?? 0,
      lastRunAt: state.lastRunAt,
    });
  } catch (error) {
    console.error("alerts sync error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
