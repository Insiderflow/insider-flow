import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function getCurrentUserWithTier() {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, membership_tier: true, membership_expires_at: true },
  });
  return db;
}

export function isPaid(user: { membership_tier: 'FREE' | 'PAID'; membership_expires_at: Date | null } | null) {
  if (!user) return false;
  if (user.membership_tier !== 'PAID') return false;
  if (user.membership_expires_at && user.membership_expires_at < new Date()) return false;
  return true;
}





