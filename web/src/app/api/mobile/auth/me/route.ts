import { type NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPaid = user.membership_tier === 'PAID';
    const membershipExpiresAt = user.membership_expires_at ? user.membership_expires_at.toISOString() : null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.name || user.email.split('@')[0],
        role: 'user',
        membership_tier: isPaid ? 'pro' : 'free',
        membership_expires_at: membershipExpiresAt,
        subscription_status: isPaid ? 'active' : 'free',
        billing_provider: user.stripe_subscription_id ? 'stripe' : null,
        created_date: user.created_at.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
