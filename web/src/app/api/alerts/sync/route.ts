import { NextRequest, NextResponse } from "next/server";
import { pruneOldReadAlerts, syncAllUserAlerts } from "@/lib/alerts";
import { releaseAlertsSyncLock, tryAcquireAlertsSyncLock } from "@/lib/alertsSyncLock";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.ALERTS_SYNC_SECRET;
  if (!expectedSecret) return false;
  const providedSecret = request.headers.get("x-alerts-sync-secret");
  return providedSecret === expectedSecret;
}

export async function POST(request: NextRequest) {
  let lockAcquired = false;
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    lockAcquired = await tryAcquireAlertsSyncLock();
    if (!lockAcquired) {
      return NextResponse.json(
        { ok: true, skipped: true, reason: "alerts sync already in progress" },
        { status: 202 },
      );
    }

    const startedAt = Date.now();
    const result = await syncAllUserAlerts();
    const pruned = await pruneOldReadAlerts();
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      syncedUsers: result.syncedUsers,
      deletedOldReadAlerts: pruned.deletedAlerts,
      retentionCutoff: pruned.cutoff.toISOString(),
      elapsedMs,
    });
  } catch (error) {
    console.error("alerts sync error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    if (lockAcquired) {
      try {
        await releaseAlertsSyncLock();
      } catch (unlockError) {
        console.error("alerts sync unlock error", unlockError);
      }
    }
  }
}
