import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const alerts = await prisma.alert.findMany({
      where: { user_id: user.id },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json(
      alerts.map((alert) => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        body: alert.body,
        ticker: alert.ticker,
        timestamp: alert.timestamp.toISOString(),
        read: alert.read,
      })),
    );
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

