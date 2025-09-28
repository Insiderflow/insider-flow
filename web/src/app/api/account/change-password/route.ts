import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: '新密碼至少需要8個字符' }, { status: 400 });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: '目前密碼不正確' }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash },
    });

    return NextResponse.json({ message: '密碼已成功更改' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: '更改密碼時發生錯誤' }, { status: 500 });
  }
}


