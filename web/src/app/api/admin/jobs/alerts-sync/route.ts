import { NextRequest, NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/admin";
import { getAlertsSyncState, runAlertsSyncJob } from "@/lib/alertsSyncJob";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const result = await runAlertsSyncJob();
    const state = getAlertsSyncState();
    if (result.skipped) {
      return NextResponse.json(
        { ok: true, skipped: true, reason: result.reason, ...state },
        { status: 202 },
      );
    }

    return NextResponse.json({
      ok: true,
      ...state,
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

  const state = getAlertsSyncState();
  const [totalAlerts, unreadAlerts, latestAlert] = await Promise.all([
    prisma.alert.count(),
    prisma.alert.count({ where: { read: false } }),
    prisma.alert.findFirst({ orderBy: { timestamp: "desc" }, select: { timestamp: true } }),
  ]);

  return NextResponse.json({
    ok: true,
    ...state,
    totals: {
      alerts: totalAlerts,
      unreadAlerts,
      latestAlertAt: latestAlert?.timestamp.toISOString() || null,
    },
  });
}

