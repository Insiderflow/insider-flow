import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    const unreadCount = await prisma.alert.count({
      where: {
        user_id: user.id,
        read: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread alerts count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
