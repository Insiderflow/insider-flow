import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(_request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    // Delete all sessions for this user
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Clear the current session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return NextResponse.json({ message: '已登出所有裝置' });
  } catch (error) {
    console.error('Logout all error:', error);
    return NextResponse.json({ error: '登出時發生錯誤' }, { status: 500 });
  }
}

