import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

    await prisma.alert.updateMany({
      where: { user_id: user.id, read: false },
      data: { read: true, read_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all alerts as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

