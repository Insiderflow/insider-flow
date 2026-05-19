import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import { getNormalizedSubscription } from '@/lib/subscriptionSnapshot';
import { isPaidSubscriptionStatus } from '@/lib/subscriptionStateMachine';

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

  const subscription = getNormalizedSubscription(user);
  if (!isPaidSubscriptionStatus(subscription.subscriptionStatus)) {
    return {
      error: NextResponse.json(
        { error: 'Insider+ required', code: 'payment_required' },
        { status: 402 },
      ),
    };
  }

  if (
    user.membership_expires_at &&
    user.membership_expires_at.getTime() < Date.now()
  ) {
    return {
      error: NextResponse.json(
        { error: 'Subscription expired', code: 'payment_required' },
        { status: 402 },
      ),
    };
  }

  return { user };
}
