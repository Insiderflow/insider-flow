import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import { hasMobilePremiumAccess } from '@/lib/mobile/premiumAccess';

type PaidAuthResult =
  | { user: User }
  | { error: NextResponse };

export async function requirePaidMobileUser(
  request: Request,
): Promise<PaidAuthResult> {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasMobilePremiumAccess(user)) {
    return {
      error: NextResponse.json(
        { error: 'Insider+ required', code: 'payment_required' },
        { status: 402 },
      ),
    };
  }

  return { user };
}
