import { NextRequest, NextResponse } from "next/server";
import { pruneOldReadAlerts, syncAllUserAlerts } from "@/lib/alerts";

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
  }
}
