import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const { id } = await context.params;

    await prisma.alert.updateMany({
      where: { id, user_id: user.id },
      data: { read: true, read_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking alert as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

