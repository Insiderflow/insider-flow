import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    // Get user's notification settings
    const settings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        notification_settings: true,
      },
    });

    const defaultSettings = {
      newTrades: true,
      watchlistUpdates: true,
      weeklyDigest: false,
    };

    return NextResponse.json({
      settings: settings?.notification_settings || defaultSettings,
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json({ error: '獲取設定時發生錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const settings = await request.json();

    // Validate settings
    const validKeys = ['newTrades', 'watchlistUpdates', 'weeklyDigest'];
    const hasValidKeys = Object.keys(settings).every(key => validKeys.includes(key));
    
    if (!hasValidKeys) {
      return NextResponse.json({ error: '無效的設定' }, { status: 400 });
    }

    // Update notification settings
    await prisma.user.update({
      where: { id: user.id },
      data: { notification_settings: settings },
    });

    return NextResponse.json({ message: '通知設定已儲存' });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json({ error: '儲存設定時發生錯誤' }, { status: 500 });
  }
}
